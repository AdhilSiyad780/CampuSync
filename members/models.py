# students/models.py
from django.db import models
from core.models import User, Tenant   # adjust import if Tenant is elsewhere
from django.db import models


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
    
    school_class = models.ForeignKey(
        'class_announcement_attendence.SchoolClass',  # Use 'school.SchoolClass' or whatever your app is called
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
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

# core/models.py

class TeacherProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="teacher_profile",
    )
    department_id = models.IntegerField(null=True, blank=True)
    employee_id = models.IntegerField()
    joining_date = models.DateTimeField()
    qualification = models.CharField(max_length=255)
    salary = models.IntegerField(null=True, blank=True)
    specialization = models.CharField(max_length=255, blank=True)
    id_proof_url = models.CharField(max_length=255)
    years_of_experience = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.fullname} ({self.employee_id})"

# core/models.py

class ParentProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="parent_profile",
    )
    contact_number = models.CharField(max_length=255)
    whatsapp_number = models.CharField(max_length=255)
    occupation = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Parent: {self.user.fullname} ({self.user.email})"


class ParentStudentRelation(models.Model):
    RELATION_CHOICES = [
        ("mother", "Mother"),
        ("father", "Father"),
        ("guardian", "Guardian"),
        ("other", "Other"),
    ]

    parent = models.ForeignKey(
        ParentProfile,
        on_delete=models.CASCADE,
        related_name="relations",
    )
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="parent_relations",
    )
    relation_type = models.CharField(max_length=20, choices=RELATION_CHOICES)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("parent", "student")  # a parent–student pair should not repeat

    def __str__(self):
        return f"{self.parent.user.fullname} -> {self.student.user.fullname} ({self.relation_type})"
