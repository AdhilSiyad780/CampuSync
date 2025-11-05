from django.db import models
from django.contrib.auth.models import BaseUserManager,AbstractBaseUser,PermissionsMixin
# Create your models here.
class Tenant(models.Model):
    tenent_id = models.CharField(max_length=255,unique=True)
    isinstance_name = models.CharField(max_length=255)
    email = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    address  = models.TextField(null=True,blank=True)
    status = models.CharField(max_length=20,choices=[
          ("active", "Active"),
            ("inactive", "Inactive"),
            ("suspended", "Suspended"),
            ("trial", "Trial"),
    ]
    ,default='trial')
    reated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.institute_name

class UserManager(BaseUserManager):
    def create_user(self,email,password=None,**extar_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email,**extar_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_staff", True)

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser,PermissionsMixin):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    fullname = models.CharField(max_length=255)
    username = models.CharField(max_length=255, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    profile_picture = models.CharField(max_length=255, null=True, blank=True)
    DOB = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=10,
        choices=[
            ('male', 'Male'),
            ('female', 'Female'),
            ('other', 'Other'),
        ]
    )
    user_type = models.CharField(
        max_length=20,
        choices=[
            ('superadmin', 'Super Admin'),
            ('admin', 'Admin'),
            ('teacher', 'Teacher'),
            ('student', 'Student'),
            ('parent', 'Parent'),
        ]
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('inactive', 'Inactive'),
            ('suspended', 'Suspended'),
        ],
        default='active'
    )
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['fullname']
    def __str__(self):
        return self.email 
