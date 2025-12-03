# students/serializers.py
from rest_framework import serializers
from core.models import User, Tenant
from .models import StudentProfile
from django.utils.crypto import get_random_string
from django.utils import timezone
from .models import User, TeacherProfile

class StudentProfileSerializer(serializers.ModelSerializer):
    # User fields
    fullname = serializers.CharField(source="user.fullname")
    email = serializers.EmailField(source="user.email")
    phone = serializers.CharField(source="user.phone", allow_blank=True, required=False)
    DOB = serializers.DateField(source="user.DOB", allow_null=True, required=False)
    gender = serializers.CharField(source="user.gender", allow_blank=True, required=False)

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            # user-related:
            "fullname",
            "email",
            "phone",
            "DOB",
            "gender",
            # profile:
            "admission_number",
            "admission_date",
            "blood_group",
            "class_id",
            "section",
            "guardian_name",
            "guardian_number",
            "roll_number",
            "student_contact",
            "id_proof_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        # extract nested user data
        user_data = validated_data.pop("user")
        request = self.context.get("request")
        user_admin = getattr(request, "user", None)
        tenant = getattr(user_admin, "tenant", None)

        if not tenant:
            raise serializers.ValidationError("Tenant not found for current admin user.")

        email = user_data["email"].lower().strip()
        fullname = user_data["fullname"].strip()
        phone = user_data.get("phone", "").strip()
        dob = user_data.get("DOB")
        gender = user_data.get("gender", "")

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "User with this email already exists."})

        # create student User
        temp_password = get_random_string(12)
        student_user = User.objects.create_user(
            email=email,
            fullname=fullname,
            password=temp_password,
        )
        student_user.tenant = tenant
        student_user.phone = phone
        student_user.DOB = dob
        student_user.gender = gender
        student_user.user_type = "student"
        student_user.status = "active"
        student_user.is_staff = False
        student_user.is_setup_complete = False  # up to you
        student_user.save()

        # create StudentProfile
        profile = StudentProfile.objects.create(
            user=student_user,
            tenant=tenant,
            **validated_data,
        )
        return profile

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", None)
        if user_data:
            user = instance.user
            user.fullname = user_data.get("fullname", user.fullname).strip()
            user.email = user_data.get("email", user.email).lower().strip()
            user.phone = user_data.get("phone", user.phone)
            user.DOB = user_data.get("DOB", user.DOB)
            user.gender = user_data.get("gender", user.gender)
            user.save()

        # update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance



class TeacherSerializer(serializers.ModelSerializer):
    # Flatten user fields
    fullname = serializers.CharField(source="user.fullname")
    email = serializers.EmailField(source="user.email")
    phone = serializers.CharField(
        source="user.phone", allow_blank=True, allow_null=True, required=False
    )
    DOB = serializers.DateField(
        source="user.DOB", allow_null=True, required=False
    )
    gender = serializers.CharField(
        source="user.gender", allow_blank=True, required=False
    )

    class Meta:
        model = TeacherProfile
        fields = [
            "id",

            # user fields
            "fullname",
            "email",
            "phone",
            "DOB",
            "gender",

            # profile fields
            "department_id",
            "employee_id",
            "joining_date",
            "qualification",
            "salary",
            "specialization",
            "years_of_experience",
            "id_proof_url",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        tenant = getattr(request.user, "tenant", None)
        if not tenant:
            raise serializers.ValidationError("Tenant not found for this admin.")

        user_data = validated_data.pop("user")

        email = user_data["email"]
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        user = User(
            email=email,
            fullname=user_data.get("fullname", ""),
            phone=user_data.get("phone", ""),
            DOB=user_data.get("DOB", None),
            gender=user_data.get("gender", ""),
            user_type="teacher",
            status="active",
            tenant=tenant,
            is_staff=False,
        )
        # teacher created by admin, no password yet
        user.set_unusable_password()
        user.save()

        teacher = TeacherProfile.objects.create(
            user=user,
            **validated_data
        )
        return teacher

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        user = instance.user

        # update user fields
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        # update teacher profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance
