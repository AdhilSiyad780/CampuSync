
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
from members.views import IsAdminUserType


class SchoolClassListCreateView(generics.ListCreateAPIView):
    serializer_class = SchoolClassSerializer
    permission_classes = [IsAuthenticated,IsAdminUserType]
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
        
        self.broadcast_announcement(announcement, 'created')
    
    def broadcast_announcement(self, announcement, action='created'):
        """Broadcast announcement via WebSocket"""
        channel_layer = get_channel_layer()
        tenant_id = announcement.tenant.id
        group_name = f'announcements_tenant_{tenant_id}'  # ✅ CORRECT FORMAT
        
        serializer = AnnouncementSerializer(announcement)
        
        print(f"📢 Broadcasting {action} to group: {group_name}")
        print(f"📢 Data: {serializer.data}")
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'announcement_message',
                'action': action,
                'data': serializer.data,
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
        tenant_id = instance.tenant.id
        
        # Delete the announcement
        instance.delete()
        
        # Broadcast deletion
        channel_layer = get_channel_layer()
        group_name = f'announcements_tenant_{tenant_id}'  # ✅ FIXED
        
        print(f"📢 Broadcasting deleted to group: {group_name}")
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'announcement_message',  # ✅ USE SAME TYPE
                'action': 'deleted',
                'announcement_id': announcement_id,
            }
        )
    
    def broadcast_announcement(self, announcement, action):
        """Broadcast announcement update"""
        channel_layer = get_channel_layer()
        tenant_id = announcement.tenant.id
        group_name = f'announcements_tenant_{tenant_id}'  # ✅ CORRECT FORMAT
        
        serializer = AnnouncementSerializer(announcement)
        
        print(f"📢 Broadcasting {action} to group: {group_name}")
        print(f"📢 Data: {serializer.data}")
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'announcement_message',
                'action': action,
                'data': serializer.data,
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
    
# class_announcement_attendence/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import TimetableEntry, SchoolClass
from .serializers import TimeTableEntrySerializers
from members.models import StudentProfile, ParentProfile, ParentStudentRelation

class StudentTimetableView(APIView):
    """
    Get timetable for the logged-in student
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Verify user is a student
        if user.user_type != 'student':
            return Response(
                {'error': 'Only students can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            student_profile = user.student_profile
        except StudentProfile.DoesNotExist:
            return Response(
                {'error': 'Student profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get student's class
        if not student_profile.school_class:
            return Response(
                {'error': 'You are not assigned to any class yet'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        school_class = student_profile.school_class
        
        # Get timetable entries
        entries = TimetableEntry.objects.filter(
            school_class=school_class,
            tenant=request.user.tenant
        ).select_related('subject', 'teacher', 'time_slot')
        
        # Organize by days
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        grid_data = {day: [] for day in days}
        
        for entry in entries:
            grid_data[entry.day_of_week].append({
                "id": entry.id,
                "time_slot": entry.time_slot.id,
                "time_slot_name": entry.time_slot.name,
                "start_time": entry.time_slot.start_time,
                "end_time": entry.time_slot.end_time,
                "is_break": entry.time_slot.is_break,
                "subject_name": entry.subject.name,
                "subject_code": entry.subject.code,
                "teacher_name": entry.teacher.fullname,
                "room_number": entry.room_number,
            })
        
        # Sort each day's entries by time slot order
        for day in days:
            grid_data[day] = sorted(
                grid_data[day], 
                key=lambda x: x['time_slot']
            )
        
        return Response({
            "student": {
                "name": user.fullname,
                "admission_number": student_profile.admission_number,
                "roll_number": student_profile.roll_number,
            },
            "class": {
                "id": school_class.id,
                "name": f"{school_class.class_name} - {school_class.division}",
                "class_name": school_class.class_name,
                "division": school_class.division,
                "academic_year": school_class.academic_year,
            },
            "timetable": grid_data
        })


class ParentTimetableView(APIView):
    """
    Get timetables for all children of the logged-in parent
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Verify user is a parent
        if user.user_type != 'parent':
            return Response(
                {'error': 'Only parents can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            parent_profile = user.parent_profile
        except ParentProfile.DoesNotExist:
            return Response(
                {'error': 'Parent profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all children
        relations = ParentStudentRelation.objects.filter(
            parent=parent_profile
        ).select_related('student', 'student__user', 'student__school_class')
        
        if not relations.exists():
            return Response(
                {'error': 'No children found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        children_timetables = []
        
        for relation in relations:
            student_profile = relation.student
            school_class = student_profile.school_class
            
            if not school_class:
                # Skip students not assigned to a class
                children_timetables.append({
                    "student": {
                        "id": student_profile.id,
                        "name": student_profile.user.fullname,
                        "admission_number": student_profile.admission_number,
                        "roll_number": student_profile.roll_number,
                        "relation": relation.get_relation_type_display(),
                    },
                    "class": None,
                    "timetable": None,
                    "message": "Not assigned to any class"
                })
                continue
            
            # Get timetable entries
            entries = TimetableEntry.objects.filter(
                school_class=school_class,
                tenant=request.user.tenant
            ).select_related('subject', 'teacher', 'time_slot')
            
            # Organize by days
            days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
            grid_data = {day: [] for day in days}
            
            for entry in entries:
                grid_data[entry.day_of_week].append({
                    "id": entry.id,
                    "time_slot": entry.time_slot.id,
                    "time_slot_name": entry.time_slot.name,
                    "start_time": entry.time_slot.start_time,
                    "end_time": entry.time_slot.end_time,
                    "is_break": entry.time_slot.is_break,
                    "subject_name": entry.subject.name,
                    "subject_code": entry.subject.code,
                    "teacher_name": entry.teacher.fullname,
                    "room_number": entry.room_number,
                })
            
            # Sort each day's entries
            for day in days:
                grid_data[day] = sorted(
                    grid_data[day],
                    key=lambda x: x['time_slot']
                )
            
            children_timetables.append({
                "student": {
                    "id": student_profile.id,
                    "name": student_profile.user.fullname,
                    "admission_number": student_profile.admission_number,
                    "roll_number": student_profile.roll_number,
                    "relation": relation.get_relation_type_display(),
                    "is_primary": relation.is_primary,
                },
                "class": {
                    "id": school_class.id,
                    "name": f"{school_class.class_name} - {school_class.division}",
                    "class_name": school_class.class_name,
                    "division": school_class.division,
                    "academic_year": school_class.academic_year,
                },
                "timetable": grid_data
            })
        
        return Response({
            "parent": {
                "name": user.fullname,
                "email": user.email,
            },
            "children_count": len(children_timetables),
            "children": children_timetables
        })