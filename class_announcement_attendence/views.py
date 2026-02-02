
from django.utils import timezone
from rest_framework import generics, status,viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Announcement, SchoolClass, Subject,TimeSlot,TimetableEntry
from .serializers import (AnnouncementSerializer, SchoolClassSerializer,SubjectSerializer,
                          TimeSlotSerializer,TimeTableEntrySerializers)
from core.models import User
from django.db.models import Q  
from members.views import PaginationProperties


class SchoolClassListCreateView(generics.ListCreateAPIView):
    serializer_class = SchoolClassSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PaginationProperties
    def get_queryset(self):
        user = self.request.user
        tenant = getattr(user, 'tenant', None)
        if not tenant:
            return SchoolClass.objects.none()
        return SchoolClass.objects.filter(tenant=tenant).select_related(
            'class_teacher'
        ).order_by('-created_at')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class SchoolClassRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SchoolClassSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        tenant = getattr(user, 'tenant', None)
        if not tenant:
            return SchoolClass.objects.none()
        return SchoolClass.objects.filter(tenant=tenant).select_related('class_teacher')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AvailableTeachersView(APIView):
    """Get list of teachers available to be assigned as class teachers"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        tenant = getattr(request.user, 'tenant', None)
        if not tenant:
            return Response({'detail': 'Tenant not found'}, status=404)
        
        teachers = User.objects.filter(
            tenant=tenant,
            user_type='teacher',
            status='active'
        ).values('id', 'fullname', 'email')
        
        return Response(list(teachers))
# class_announcement_attendence/views.py

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone

class AnnouncementListCreateView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        tenant = getattr(user, 'tenant', None)
        
        if not tenant:
            return Announcement.objects.none()

        queryset = Announcement.objects.filter(
            tenant=tenant,
            expiry_date__gt=timezone.now()
        )

        if user.user_type == 'student':
            return queryset.filter(Q(target_audience='students') | Q(target_audience='all'))
        elif user.user_type == 'parent':
            return queryset.filter(Q(target_audience='parents') | Q(target_audience='all'))
        elif user.user_type == 'teacher':
            return queryset.filter(Q(target_audience='teachers') | Q(target_audience='all'))

        return queryset

    def perform_create(self, serializer):
        announcement = serializer.save(
            author=self.request.user, 
            tenant=self.request.user.tenant
        )
        
        # Broadcast the new announcement via WebSocket
        self.broadcast_announcement(announcement, 'created')
    
    def broadcast_announcement(self, announcement, action='created'):
        """Broadcast announcement to all connected clients in the tenant"""
        channel_layer = get_channel_layer()
        tenant_id = str(announcement.tenant.id)
        
        # Serialize the announcement
        serializer = AnnouncementSerializer(announcement)
        
        async_to_sync(channel_layer.group_send)(
            f'announcements_{tenant_id}',
            {
                'type': 'announcement_created',
                'action': action,
                'announcement': serializer.data
            }
        )


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Announcement.objects.filter(tenant=self.request.user.tenant)
    
    def perform_update(self, serializer):
        announcement = serializer.save()
        self.broadcast_announcement(announcement, 'updated')
    
    def perform_destroy(self, instance):
        announcement_id = instance.id
        tenant_id = str(instance.tenant.id)
        instance.delete()
        
        # Broadcast deletion
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'announcements_{tenant_id}',
            {
                'type': 'announcement_deleted',
                'announcement_id': announcement_id
            }
        )
    
    def broadcast_announcement(self, announcement, action):
        """Broadcast announcement update"""
        channel_layer = get_channel_layer()
        tenant_id = str(announcement.tenant.id)
        
        serializer = AnnouncementSerializer(announcement)
        
        async_to_sync(channel_layer.group_send)(
            f'announcements_{tenant_id}',
            {
                'type': 'announcement_updated',
                'announcement': serializer.data
            }
        )

class SubjectView(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Subject.objects.filter(tenant=self.request.user.tenant).all()
    def perform_create(self,serilizer):
        serilizer.save(tenant = self.request.user.tenant)


class TimeSlotViewSet(viewsets.ModelViewSet):
    serializer_class = TimeSlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TimeSlot.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class TableEntryView(viewsets.ModelViewSet):
    serializer_class = TimeTableEntrySerializers
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        queryset = TimetableEntry.objects.filter(tenant=self.request.user.tenant)
        class_id = self.request.query_params.get('class_id')
        if  class_id:
            queryset = queryset.filter(schootclass_id = class_id)
        return queryset
    def perform_create(self,serializer):
        serializer.save(tenant=self.request.user.tenant)

class TimetableGridView(APIView):
    serializer_class = TimeTableEntrySerializers
    permission_classes = [IsAuthenticated]
    def get(self,request,class_id):
        target_class = SchoolClass.objects.get(id=class_id,tenant=request.user.tenant)
        entries = TimetableEntry.objects.filter(school_class=target_class)
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        grid_data = {day: [] for day in days}
        for entry in entries:
            grid_data[entry.day_of_week].append({
                "id": entry.id,
                "time_slot": entry.time_slot.id,
                "subject_name": entry.subject.name,
                "teacher_name": entry.teacher.fullname,
                "room_number": entry.room_number,
                "subject": entry.subject.id, # for the edit form
                "teacher": entry.teacher.id    # for the edit form
            })
            
        return Response({
            "class_name": f"{target_class.class_name} - {target_class.division}",
            "grid": grid_data
        })
    
    
class SchoolClassAllView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        tenant = getattr(user, 'tenant', None)
        if not tenant:
            return Response([], status=status.HTTP_200_OK)
            
        # 1. Get the raw QuerySet
        queryset = SchoolClass.objects.filter(tenant=tenant).order_by('-created_at')
        
        # 2. Pass it through the Serializer (many=True is required for lists)
        serializer = SchoolClassSerializer(queryset, many=True)
        
        # 3. Return the Response object containing serialized data
        return Response(serializer.data)

class SubjectAllView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Subject.objects.filter(tenant=request.user.tenant).all()
        
        # Serialize and wrap in Response
        serializer = SubjectSerializer(queryset, many=True)
        return Response(serializer.data)