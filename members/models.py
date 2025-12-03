# students/models.py
from django.db import models
from core.models import User, Tenant   # adjust import if Tenant is elsewhere

class StudentProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="student_profiles",
    )

    admission_number = models.CharField(max_length=255, unique=True)
    admission_date = models.DateTimeField()
    blood_group = models.CharField(max_length=10, blank=True)

    # Ideally this should be a FK to a Class/Section model, but for now keep simple:
    class_id = models.IntegerField()                      # placeholder
    section = models.CharField(max_length=50, blank=True)

    guardian_name = models.CharField(max_length=255)
    guardian_number = models.CharField(max_length=20, blank=True)

    roll_number = models.PositiveIntegerField()           # you can add unique per class later
    student_contact = models.CharField(max_length=255, blank=True)

    id_proof_url = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Example: roll_number unique per tenant+class_id if you want:
        # unique_together = ("tenant", "class_id", "roll_number")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.fullname} ({self.admission_number})"
