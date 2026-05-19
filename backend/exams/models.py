from django.db import models
from django.conf import settings
from class_announcement_attendence.models import SchoolClass,Subject
from django.core.validators import MinValueValidator, MaxValueValidator



class Exam(models.Model):
    """
    Teacher creates exams for specific classes
    """
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_exams',
        limit_choices_to={'user_type': 'teacher'}
    )
    
    # Exam details
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exams')
    
    # Multiple classes can be assigned to same exam
    classes = models.ManyToManyField(SchoolClass, related_name='exams')
    
    # Scheduling
    exam_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Location (optional)
    room = models.CharField(max_length=100, blank=True, null=True)
    
    # Marks
    max_marks = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(1000)],
        default=100
    )
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'exams'
        ordering = ['-exam_date', '-start_time']
        indexes = [
            models.Index(fields=['tenant', 'exam_date']),
            models.Index(fields=['teacher', 'status']),
        ]
    
    
    
    @property
    def is_past(self):
        from django.utils import timezone
        from datetime import datetime
        exam_datetime = datetime.combine(self.exam_date, self.end_time)
        return timezone.make_aware(exam_datetime) < timezone.now()
    
    @property
    def result_count(self):
        return self.results.count()
    
    @property
    def graded_count(self):
        return self.results.filter(marks_obtained__isnull=False).count()


class ExamResult(models.Model):
    """
    Student's exam result
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Grading'),
        ('graded', 'Graded'),
        ('absent', 'Absent'),
    ]
    
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exam_results',
        limit_choices_to={'user_type': 'student'}
    )
    
    # Marks
    marks_obtained = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        blank=True,
        null=True
    )
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Teacher's remarks
    remarks = models.TextField(blank=True)
    
    # Timestamps
    graded_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'exam_results'
        ordering = ['-exam__exam_date']
        unique_together = ('exam', 'student')
        indexes = [
            models.Index(fields=['exam', 'status']),
            models.Index(fields=['student', 'status']),
        ]
    
    def __str__(self):
        return f"{self.student.fullname} - {self.exam.title}"
    
    @property
    def percentage(self):
        if self.marks_obtained is not None and self.exam.max_marks > 0:
            return round((float(self.marks_obtained) / self.exam.max_marks) * 100, 2)
        return None
    
    @property
    def grade(self):
        """Calculate grade based on percentage"""
        pct = self.percentage
        if pct is None:
            return None
        if pct >= 90: return 'A+'
        if pct >= 80: return 'A'
        if pct >= 70: return 'B+'
        if pct >= 60: return 'B'
        if pct >= 50: return 'C'
        if pct >= 40: return 'D'
        return 'F'




class ExamConcern(models.Model):
    """
    Student raises concern about their exam result
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    ]
    
    result = models.ForeignKey(ExamResult, on_delete=models.CASCADE, related_name='concerns')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exam_concerns'
    )
    
    # Concern details
    concern_text = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Teacher's response
    response = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_concerns'
    )
    
    # Mark changes (if any)
    previous_marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    revised_marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'exam_concerns'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['result', 'status']),
            models.Index(fields=['student', 'created_at']),
        ]
    
    def __str__(self):
        return f"Concern by {self.student.fullname} - {self.result.exam.title}"

