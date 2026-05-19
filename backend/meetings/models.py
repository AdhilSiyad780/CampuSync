# meetings/models.py
import uuid
from django.db import models
from django.conf import settings

class Meeting(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        
        ('ongoing', 'Ongoing'),
        ('ended', 'Ended'),
    ]

    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    room_name = models.CharField(max_length=100, default=uuid.uuid4, unique=True)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hosted_meetings')
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='meetings', blank=True)
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title