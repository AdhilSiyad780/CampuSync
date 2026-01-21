# school/models.py - Add these to your existing models

from django.db import models
from django.conf import settings

class AttendanceSession(models.Model):
    """
    Represents daily attendance for a class
    One session per class per day
    """
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE)
    school_class = models.ForeignKey(
        'class_announcement_attendence.SchoolClass',
        on_delete=models.CASCADE,
        related_name='attendance_sessions'
    )
    date = models.DateField()
    
    # Teacher who marked attendance (should be class teacher)
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='attendance_sessions_marked'
    )
    
    # Status
    is_completed = models.BooleanField(default=False)
    marked_at = models.DateTimeField(null=True, blank=True)
    
    # Stats (computed)
    total_students = models.IntegerField(default=0)
    present_count = models.IntegerField(default=0)
    absent_count = models.IntegerField(default=0)
    late_count = models.IntegerField(default=0)
    excused_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance_sessions'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['tenant', 'date']),
            models.Index(fields=['school_class', 'date']),
        ]
        unique_together = [('school_class', 'date')]
    
    def __str__(self):
        return f"{self.school_class} - {self.date}"
    
    def calculate_stats(self):
        """Calculate attendance statistics"""
        records = self.attendance_records.all()
        self.total_students = records.count()
        self.present_count = records.filter(status='present').count()
        self.absent_count = records.filter(status='absent').count()
        self.late_count = records.filter(status='late').count()
        self.excused_count = records.filter(status='excused').count()
        self.save()


class AttendanceRecord(models.Model):
    """
    Individual student attendance record for a day
    """
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused/Leave'),
    ]
    
    session = models.ForeignKey(
        AttendanceSession,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendance_records',
        limit_choices_to={'user_type': 'student'}
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='absent'
    )
    remarks = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance_records'
        ordering = ['student__fullname']
        unique_together = ('session', 'student')
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['session', 'status']),
        ]
    
    def __str__(self):
        return f"{self.student.fullname} - {self.session.date} - {self.get_status_display()}"


class AttendanceSummary(models.Model):
    """
    Monthly summary of student attendance
    """
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE)
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendance_summaries'
    )
    school_class = models.ForeignKey('class_announcement_attendence.SchoolClass', on_delete=models.CASCADE)
    
    month = models.IntegerField()
    year = models.IntegerField()
    
    total_days = models.IntegerField(default=0)
    present_days = models.IntegerField(default=0)
    absent_days = models.IntegerField(default=0)
    late_days = models.IntegerField(default=0)
    excused_days = models.IntegerField(default=0)
    
    attendance_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00
    )
    
    last_calculated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance_summaries'
        unique_together = ('student', 'month', 'year')
        ordering = ['-year', '-month']
    
    def __str__(self):
        return f"{self.student.fullname} - {self.month}/{self.year} - {self.attendance_percentage}%"
    
    def calculate_percentage(self):
        if self.total_days > 0:
            self.attendance_percentage = round(
                (self.present_days / self.total_days) * 100,
                2
            )
        else:
            self.attendance_percentage = 0.00
        self.save()