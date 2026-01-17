from datetime import timezone
from django.db import models
from django.conf import settings # Assuming Tenant and User are in other apps

class SchoolClass(models.Model):
    # Foreign Keys - Assuming you have Tenant and Teacher (User) models
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE)
    # department = models.ForeignKey('core.Department', on_delete=models.CASCADE, null=True, blank=True)
    class_teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='managed_classes'
    )

    # Fields from your SQL
    class_name = models.CharField(max_length=255)
    division = models.CharField(max_length=255)
    academic_year = models.CharField(max_length=255)
    capacity = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'classes'
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'
        # Ensures a school doesn't have two 'Class 10-A' in the same year
        unique_together = ('tenant', 'class_name', 'division', 'academic_year')

    def __str__(self):
        return f"{self.class_name} - {self.division} ({self.academic_year})"
    
from django.db import models
from django.conf import settings

class Announcement(models.Model):
    AUDIENCE_CHOICES = [
        ('all', 'All'),
        ('teachers', 'Teachers Only'),
        ('students', 'Students Only'),
        ('parents', 'Parents Only'),
    ]

    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    attachment = models.FileField(upload_to='announcements/%Y/%m/', null=True, blank=True)
    
    # NEW FIELD
    target_audience = models.CharField(
        max_length=20, 
        choices=AUDIENCE_CHOICES, 
        default='all'
    )
    
    expiry_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.target_audience}] {self.title}"
    


# class_announcement_attendence/models.py
from django.db import models
from core.models import Tenant

class Subject(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=100)  # e.g., Mathematics
    code = models.CharField(max_length=20)   # e.g., MATH101
    description = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevents two subjects in the same school from having the same code
        unique_together = ('tenant', 'code')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"
    
# models.py
class TimeSlot(models.Model):
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE)
    name = models.CharField(max_length=50) # e.g., "Period 1" or "Lunch"
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_break = models.BooleanField(default=False)
    order = models.PositiveIntegerField() # To keep P1 before P2

    class Meta:
        ordering = ['order']
        # One school shouldn't have two "Period 1"s
        unique_together = ('tenant', 'order') 

    def __str__(self):
        return f"{self.name}: {self.start_time} - {self.end_time}"
    

    