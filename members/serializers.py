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



# core/serializer.py  (or a dedicated parents_serializers.py)
from rest_framework import serializers
from .models import User, ParentProfile, ParentStudentRelation, StudentProfile
from django.db import transaction

class ParentStudentRelationSerializer(serializers.ModelSerializer):
    # Read-only student details for list / view
    student_id = serializers.IntegerField(source="student.id")
    student_name = serializers.CharField(source="student.user.fullname", read_only=True)
    class_id = serializers.IntegerField(source="student.class_id", read_only=True)
    section = serializers.CharField(source="student.section", read_only=True)
    admission_number = serializers.CharField(source="student.admission_number", read_only=True)

    class Meta:
        model = ParentStudentRelation
        fields = [
            "id",
            "student_id",
            "student_name",
            "class_id",
            "section",
            "admission_number",
            "relation_type",
            "is_primary",
        ]
        extra_kwargs = {
            "student_name": {"read_only": True},
            "class_id": {"read_only": True},
            "section": {"read_only": True},
            "admission_number": {"read_only": True},
        }

class ParentSerializer(serializers.ModelSerializer):
    # user fields
    fullname = serializers.CharField(source="user.fullname")
    email = serializers.EmailField(source="user.email")
    phone = serializers.CharField(
        source="user.phone", allow_blank=True, allow_null=True, required=False
    )

    # profile fields
    contact_number = serializers.CharField()
    whatsapp_number = serializers.CharField()
    occupation = serializers.CharField(allow_blank=True, allow_null=True, required=False)

    # nested relations
    relations = ParentStudentRelationSerializer(many=True, required=False)

    class Meta:
        model = ParentProfile
        fields = [
            "id",
            "fullname",
            "email",
            "phone",
            "contact_number",
            "whatsapp_number",
            "occupation",
            "relations",
        ]

    def validate(self, attrs):
        # simple sanity checks
        user_data = attrs.get("user", {})
        email = user_data.get("email")
        if not email:
            raise serializers.ValidationError({"email": "Email is required."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        tenant = getattr(request.user, "tenant", None)
        if not tenant:
            raise serializers.ValidationError("Tenant not found for this admin.")

        user_data = validated_data.pop("user")
        relations_data = validated_data.pop("relations", [])

        email = user_data["email"]
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        # Create user
        user = User(
            email=email,
            fullname=user_data.get("fullname", ""),
            phone=user_data.get("phone", ""),
            user_type="parent",
            status="active",
            tenant=tenant,
        )
        user.set_unusable_password()
        user.save()

        # Parent profile
        parent = ParentProfile.objects.create(user=user, **validated_data)

        # Relations
        self._sync_relations(parent, relations_data)

        return parent

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        relations_data = validated_data.pop("relations", None)  # can be omitted

        # update user
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        # update profile
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # if relations were provided, replace existing with new set
        if relations_data is not None:
            self._sync_relations(instance, relations_data)

        return instance

    def _sync_relations(self, parent, relations_data):
        """
        Replace all existing relations for this parent with the provided list.
        relations_data => [{ "student": { "id": X }, "relation_type": "...", "is_primary": true }, ...]
        but because we used ParentStudentRelationSerializer with source="student.id",
        the parsed form will be something like { "student": {"id": ...}, "relation_type": ..., ... }
        So we’ll map manually.
        """
        ParentStudentRelation.objects.filter(parent=parent).delete()

        for rel in relations_data:
            student_id = rel.get("student", {}).get("id") or rel.get("student_id")
            if not student_id:
                continue
            try:
                student = StudentProfile.objects.get(id=student_id, user__tenant=parent.user.tenant)
            except StudentProfile.DoesNotExist:
                raise serializers.ValidationError({"relations": f"Student with id {student_id} not found for this tenant."})

            ParentStudentRelation.objects.create(
                parent=parent,
                student=student,
                relation_type=rel.get("relation_type", "other"),
                is_primary=bool(rel.get("is_primary", False)),
            )
