
from django.utils import timezone
from rest_framework import generics, status,viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Announcement, SchoolClass, Subject,TimeSlot
from .serializers import AnnouncementSerializer, SchoolClassSerializer,SubjectSerializer,TimeSlotSerializer
from core.models import User
from django.db.models import Q  

class SchoolClassListCreateView(generics.ListCreateAPIView):
    serializer_class = SchoolClassSerializer
    permission_classes = [IsAuthenticated]
    
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

class AnnouncementListCreateView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filters announcements so users only see what is relevant to them.
        """
        user = self.request.user
        tenant = getattr(user, 'tenant', None)
        
        if not tenant:
            return Announcement.objects.none()

        # 1. Start with base filter: Only current tenant and not expired
        queryset = Announcement.objects.filter(
            tenant=tenant,
            expiry_date__gt=timezone.now()
        )

        # 2. Targeted Filtering based on user type
        if user.user_type == 'student':
            # Students see 'all' + 'students'
            return queryset.filter(Q(target_audience='students') | Q(target_audience='all'))
        
        elif user.user_type == 'parent':
            # Parents see 'all' + 'parents'
            return queryset.filter(Q(target_audience='parents') | Q(target_audience='all'))
            
        elif user.user_type == 'teacher':
            # Teachers see 'all' + 'teachers'
            return queryset.filter(Q(target_audience='teachers') | Q(target_audience='all'))

        # Admins (school staff) can see all announcements for their tenant
        return queryset

    def perform_create(self, serializer):
        # The serializer.create method already handles this, 
        # but perform_create is the standard way in DRF Views to pass extra data.
        serializer.save(author=self.request.user, tenant=self.request.user.tenant)


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles Viewing, Editing, and Deleting a single announcement.
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure users can only interact with announcements from their own school
        return Announcement.objects.filter(tenant=self.request.user.tenant)




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