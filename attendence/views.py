from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from datetime import datetime, timedelta
from django.utils import timezone
from .models import AttendanceSession, AttendanceRecord, AttendanceSummary
from .serializers import (
    AttendanceSessionSerializer,
    MarkAttendanceSerializer,
)


class TeacherClassesForAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        tenant = user.tenant
        
        if user.user_type not in ['teacher', 'admin']:
            return Response(
                {"error": "Only teachers and admins can access this"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from class_announcement_attendence.models import SchoolClass
        
        if user.user_type == 'admin':
            classes = SchoolClass.objects.filter(tenant=tenant)
        else:
            classes = SchoolClass.objects.filter(
                tenant=tenant,
                class_teacher=user
            )
        
        classes_data = classes.values(
            'id', 'class_name', 'division', 'academic_year'
        )
        
        return Response({"classes": list(classes_data)})
    

class GetStudentsForAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, class_id):
        from members.models import StudentProfile
        from class_announcement_attendence.models import SchoolClass
        
        try:
            school_class = SchoolClass.objects.get(
                id=class_id,
                tenant=request.user.tenant
            )
        except SchoolClass.DoesNotExist:
            return Response(
                {"error": "Class not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        date_str = request.query_params.get('date', timezone.now().date().isoformat())
        if request.user.user_type == 'teacher':
            if school_class.class_teacher != request.user:
                return Response(
                    {"error": "You are not the class teacher of this class"},
                    status=status.HTTP_403_FORBIDDEN
                )
        session = AttendanceSession.objects.filter(
            school_class=school_class,
            date=date_str,
            tenant=request.user.tenant
        ).first()
        attendance_map = {}
        if session:
            records = AttendanceRecord.objects.filter(session=session)
            attendance_map = {r.student_id: r.status for r in records}

        # 5. Build the student list with status
        students = StudentProfile.objects.filter(
            tenant=request.user.tenant,
            school_class=school_class
        ).select_related('user').order_by('roll_number')
        
        students = StudentProfile.objects.filter(
            tenant=request.user.tenant,
            school_class=school_class
        ).select_related('user').order_by('roll_number')
        
        student_list = []
        for s in students:
            student_list.append({
                'id': s.user.id,
                'name': s.user.fullname,
                'roll_number': s.roll_number,
                'admission_number': s.admission_number,
                # If record exists in map, use it, else default to 'not_marked'
                'status': attendance_map.get(s.user.id, 'not_marked') 
            })
        
        return Response({
            "class_name": f"{school_class.class_name} - {school_class.division}",
            "date": date_str,
            "is_completed": session.is_completed if session else False,
            "total_students": len(student_list),
            "students": student_list
        })


class MarkAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.user_type not in ['teacher', 'admin']:
            return Response(
                {"error": "Only teachers and admins can mark attendance"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = MarkAttendanceSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            session = serializer.save()
            response_serializer = AttendanceSessionSerializer(session)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AttendanceSessionDetailView(generics.RetrieveAPIView):
    serializer_class = AttendanceSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = AttendanceSession.objects.filter(
            tenant=user.tenant
        ).prefetch_related('attendance_records__student')
        
        if user.user_type == 'teacher':
            queryset = queryset.filter(school_class__class_teacher=user)
        
        return queryset
    

class StudentAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if request.user.user_type != 'student':
            return Response(
                {"error": "Only students can access this"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        month = int(request.query_params.get('month', datetime.now().month))
        year = int(request.query_params.get('year', datetime.now().year))
        
        records = AttendanceRecord.objects.filter(
            student=request.user,
            session__date__month=month,
            session__date__year=year
        ).select_related('session').order_by('-session__date')
        
        attendance_data = []
        for record in records:
            attendance_data.append({
                'date': record.session.date,
                'status': record.status,
                'status_display': record.get_status_display(),
                'remarks': record.remarks
            })
        
        try:
            summary = AttendanceSummary.objects.get(
                student=request.user,
                month=month,
                year=year
            )
            
            if summary.last_calculated < datetime.now() - timedelta(hours=1):
                summary.total_days = records.count()
                summary.present_days = records.filter(status='present').count()
                summary.absent_days = records.filter(status='absent').count()
                summary.late_days = records.filter(status='late').count()
                summary.excused_days = records.filter(status='excused').count()
                summary.calculate_percentage()
            
            summary_data = {
                'total_days': summary.total_days,
                'present_days': summary.present_days,
                'absent_days': summary.absent_days,
                'late_days': summary.late_days,
                'excused_days': summary.excused_days,
                'attendance_percentage': float(summary.attendance_percentage)
            }
        except AttendanceSummary.DoesNotExist:
            total = records.count()
            present = records.filter(status='present').count()
            absent = records.filter(status='absent').count()
            late = records.filter(status='late').count()
            excused = records.filter(status='excused').count()
            percentage = round((present / total * 100), 2) if total > 0 else 0
            
            summary_data = {
                'total_days': total,
                'present_days': present,
                'absent_days': absent,
                'late_days': late,
                'excused_days': excused,
                'attendance_percentage': percentage
            }
        
        return Response({
            "month": month,
            "year": year,
            "attendance": attendance_data,
            "summary": summary_data
        })

