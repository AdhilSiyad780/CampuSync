from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from class_announcement_attendence.models import SchoolClass,Subject

class Assignment(models.Model):
    """
    Teacher creates assignments for multiple classes
    """
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_assignments',
        limit_choices_to={'user_type': 'teacher'}
    )
    subject = models.ForeignKey('class_announcement_attendence.Subject', on_delete=models.CASCADE, related_name='assignments')
    
    # Assignment details
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Multiple classes can be assigned
    classes = models.ManyToManyField('class_announcement_attendence.SchoolClass', related_name='assignments')
    
    # Dates and marks
    due_date = models.DateTimeField()
    total_marks = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(1000)],
        default=100
    )
    
    # Optional attachment from teacher
    attachment = models.FileField(
        upload_to='assignments/teacher/%Y/%m/',
        blank=True,
        null=True
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assignments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'due_date']),
            models.Index(fields=['teacher', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.subject.name}"
    
    @property
    def is_overdue(self):
        from django.utils import timezone
        return timezone.now() > self.due_date
    
    @property
    def submission_count(self):
        return self.submissions.count()




class AssignmentSubmission(models.Model):
    """
    Student submits assignment
    """
    STATUS_CHOICES = [
        ('submitted', 'Submitted'), # Ensure this exists
        ('pending', 'Pending Review'),
        ('graded', 'Graded'),
        ('late', 'Late Submission'),
    ]
    
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='submissions'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assignment_submissions',
        limit_choices_to={'user_type': 'student'}
    )
    
    # Submission details
    submission_text = models.TextField(blank=True)
    attachment = models.FileField(
        upload_to='assignments/submissions/%Y/%m/',
        blank=True,
        null=True
    )
    
    # Grading
    marks_obtained = models.IntegerField(
        validators=[MinValueValidator(0)],
        blank=True,
        null=True
    )
    feedback = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    graded_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assignment_submissions'
        ordering = ['-submitted_at']
        unique_together = ('assignment', 'student')  # One submission per student per assignment
        indexes = [
            models.Index(fields=['assignment', 'status']),
            models.Index(fields=['student', 'submitted_at']),
        ]
    
    def __str__(self):
        return f"{self.student.fullname} - {self.assignment.title}"
    
    @property
    def is_late(self):
        return self.submitted_at > self.assignment.due_date
    
    @property
    def percentage(self):
        if self.marks_obtained is not None and self.assignment.total_marks > 0:
            return round((self.marks_obtained / self.assignment.total_marks) * 100, 2)
        return None