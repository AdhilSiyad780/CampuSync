# school/serializers.py - Add these to your existing serializers

from rest_framework import serializers
from .models import AttendanceSession, AttendanceRecord, AttendanceSummary
from django.utils import timezone
from datetime import timedelta


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    student_roll = serializers.IntegerField(
        source='student.student_profile.roll_number',
        read_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = [
            'id',
            'student',
            'student_name',
            'student_roll',
            'status',
            'status_display',
            'remarks',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AttendanceSessionSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.class_name', read_only=True)
    division = serializers.CharField(source='school_class.division', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.fullname', read_only=True)
    attendance_records = AttendanceRecordSerializer(many=True, read_only=True)
    attendance_percentage = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = AttendanceSession
        fields = [
            'id',
            'school_class',
            'class_name',
            'division',
            'date',
            'marked_by',
            'marked_by_name',
            'is_completed',
            'marked_at',
            'total_students',
            'present_count',
            'absent_count',
            'late_count',
            'excused_count',
            'attendance_percentage',
            'attendance_records',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id', 'marked_by', 'marked_at', 'total_students',
            'present_count', 'absent_count', 'late_count', 'excused_count',
            'created_at', 'updated_at'
        ]
    
    def get_attendance_percentage(self, obj):
        if obj.total_students > 0:
            return round((obj.present_count / obj.total_students) * 100, 2)
        return 0


class MarkAttendanceSerializer(serializers.Serializer):
    school_class = serializers.IntegerField()
    date = serializers.DateField()
    attendance_data = serializers.ListField(
        child=serializers.DictField()
    )
    
    def validate(self, data):
        request = self.context.get('request')
        tenant = request.user.tenant
        
        if data['date'] > timezone.now().date():
            raise serializers.ValidationError("Cannot mark attendance for future dates")
        
        max_past_date = timezone.now().date() - timedelta(days=7)
        if data['date'] < max_past_date:
            raise serializers.ValidationError("Cannot mark attendance older than 7 days")
        
        from class_announcement_attendence.models import SchoolClass
        try:
            school_class = SchoolClass.objects.get(id=data['school_class'], tenant=tenant)
        except SchoolClass.DoesNotExist:
            raise serializers.ValidationError("Invalid class")
        
        user = request.user
        if user.user_type == 'teacher':
            if school_class.class_teacher != user:
                raise serializers.ValidationError(
                    "Only the class teacher can mark attendance for this class"
                )
        elif user.user_type != 'admin':
            raise serializers.ValidationError("Only teachers and admins can mark attendance")
        
        if not data['attendance_data']:
            raise serializers.ValidationError("Attendance data cannot be empty")
        
        return data
    
    def save(self):
        request = self.context.get('request')
        tenant = request.user.tenant
        data = self.validated_data
        
        session, created = AttendanceSession.objects.get_or_create(
            tenant=tenant,
            school_class_id=data['school_class'],
            date=data['date'],
            defaults={'marked_by': request.user}
        )
        
        for record_data in data['attendance_data']:
            AttendanceRecord.objects.update_or_create(
                session=session,
                student_id=record_data['student_id'],
                defaults={
                    'status': record_data['status'],
                    'remarks': record_data.get('remarks', '')
                }
            )
        
        session.is_completed = True
        session.marked_at = timezone.now()
        session.marked_by = request.user
        session.calculate_stats()
        
        return session