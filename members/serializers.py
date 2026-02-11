# students/serializers.py
from rest_framework import serializers
from core.models import User, Tenant
from .models import StudentProfile
from django.utils.crypto import get_random_string
from django.utils import timezone
from .models import User, TeacherProfile
from django.conf import settings
from django.core.mail import send_mail
import os
from rest_framework import serializers
from .models import User, ParentProfile, ParentStudentRelation, StudentProfile
from django.db import transaction
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TeacherProfile

User = get_user_model()


class StudentProfileSerializer(serializers.ModelSerializer):
    # User fields
    fullname = serializers.CharField(source="user.fullname")
    email = serializers.EmailField(source="user.email")
    phone = serializers.CharField(source="user.phone", allow_blank=True, required=False)
    DOB = serializers.DateField(source="user.DOB", allow_null=True, required=False)
    gender = serializers.CharField(source="user.gender", allow_blank=True, required=False)
    
    class_name = serializers.CharField(source="school_class.class_name", read_only=True)
    division = serializers.CharField(source="school_class.division", read_only=True,required=False)
    roll_number = serializers.IntegerField(read_only=True)
    admission_number = serializers.CharField(read_only=True)

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
            "school_class",
            "class_name",      
            "guardian_name",
            "guardian_number",
            "roll_number",
            "student_contact",
            "id_proof_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
    def _generate_admission_number(self, tenant):
        """
        Generate unique admission number per tenant
        Format: ADM-{YEAR}-{SEQUENCE}
        Example: ADM-2026-0001
        """
        from datetime import datetime
        current_year = datetime.now().year
        
        # Get the last admission number for this tenant in current year
        prefix = f"ADM-{current_year}-"
        last_student = StudentProfile.objects.filter(
            tenant=tenant,
            admission_number__startswith=prefix
        ).order_by('-admission_number').first()
        
        if last_student:
            # Extract sequence number and increment
            try:
                last_seq = int(last_student.admission_number.split('-')[-1])
                new_seq = last_seq + 1
            except (ValueError, IndexError):
                new_seq = 1
        else:
            new_seq = 1
        
        return f"{prefix}{str(new_seq).zfill(4)}"

    def _generate_roll_number(self, school_class, tenant):
        """
        Generate auto-increment roll number per class
        """
        if not school_class:
            # If no class assigned, return 0 or handle as needed
            return 0
        
        # Get the highest roll number in this class
        last_student = StudentProfile.objects.filter(
            tenant=tenant,
            school_class=school_class
        ).order_by('-roll_number').first()
        
        if last_student and last_student.roll_number:
            return last_student.roll_number + 1
        else:
            return 1

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
        raw_password = dob.strftime("%d%m%Y")
        student_user = User.objects.create_user(
            email=email,
            fullname=fullname,
            password=raw_password,
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

        admission_number = self._generate_admission_number(tenant)
        
        # Auto-generate roll number based on class
        school_class = validated_data.get('school_class')
        roll_number = self._generate_roll_number(school_class, tenant)

        # create StudentProfile
        profile = StudentProfile.objects.create(
            user=student_user,
            tenant=tenant,
            admission_number=admission_number,
            roll_number=roll_number,
            **validated_data,
        )
        link = os.getenv('FRONTEND_LINK_STUDENT')
        try:
            send_mail(
                subject="Your Student Account Credentials",
                message=(
    f"Hi {student_user.fullname},\n\n"
    f"Your student account has been created.\n\n"
    f"🔐 Login Details:\n"
    f"Email: {student_user.email}\n"
    f"Password: {raw_password} (DOB in DDMMYYYY)\n\n"
    f"🎓 Student Dashboard:\n"
    f"{link}\n\n"
    f"Please log in and change your password immediately."
),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[student_user.email],
                fail_silently=True,  # avoid breaking create if email config is wrong
            )
        except Exception:
            pass
           
            

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

            
        new_class = validated_data.get('school_class')
        if new_class and new_class != instance.school_class:
            # Regenerate roll number for new class
            validated_data['roll_number'] = self._generate_roll_number(
                new_class, 
                instance.tenant
            )

        # update profile fields
        for attr, value in validated_data.items():
            if attr != 'admission_number':  # Prevent admission number changes
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
            "joining_date",
            "qualification",
            "salary",
            "specialization",
            "years_of_experience",
            "id_proof",
        ]
    
    def employee_idgenerator(self,tenant):
        last_emloyee = TeacherProfile.objects.filter(
            tenant=tenant,
        ).order_by('-employee_id').first()
        
        if last_emloyee and last_emloyee.employee_id:
            return last_emloyee.employee_id + 1
        else:
            return 1

        

    def create(self, validated_data):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        tenant = getattr(request.user, "tenant", None)
        if not tenant:
            raise serializers.ValidationError("Tenant not found for this admin.")

        # nested user data
        user_data = validated_data.pop("user")

        email = user_data["email"]
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                {"email": "A user with this email already exists."}
            )

        dob = user_data.get("DOB")
        if not dob:
            # you said password = DOB, so DOB must exist
            raise serializers.ValidationError(
                {"DOB": "Date of birth is required to generate the initial password."}
            )

        # choose the password format for DOB → e.g. DDMMYYYY
        raw_password = dob.strftime("%d%m%Y")  # 01-02-2000 -> "01022000"

        user = User(
            email=email,
            fullname=user_data.get("fullname", ""),
            phone=user_data.get("phone", ""),
            DOB=dob,
            gender=user_data.get("gender", ""),
            user_type="teacher",
            status="active",
            tenant=tenant,
            is_staff=False,
        )
        user.set_password(raw_password)
        user.save()
        employee_id = self.employee_idgenerator(tenant)

        teacher = TeacherProfile.objects.create(
            user=user,
            tenant=tenant,
            employee_id=employee_id,
            **validated_data,
        )

        # send email with credentials
        try:
            send_mail(
                subject="Your Teacher Account Credentials",
                message=(
                    f"Hi {user.fullname},\n\n"
                    f"Your teacher account has been created.\n\n"
                    f"Login details:\n"
                    f"Email: {user.email}\n"
                    f"Password: {raw_password} (your date of birth in DDMMYYYY format)\n\n"
                    f"Please log in and change your password immediately."
                ),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[user.email],
                fail_silently=True,  # avoid breaking create if email config is wrong
            )
        except Exception:
            # don't block creation if email fails
            pass

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
    DOB =  serializers.DateField(source='user.DOB')
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
            'DOB',
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
        date_of_birth = user_data.get('DOB')
        if not date_of_birth:
            raise serializers.ValidationError({'DOB':'date of birth cannot be empty'})
        # Create user
        user = User(
            email=email,
            fullname=user_data.get("fullname", ""),
            phone=user_data.get("phone", ""),
            user_type="parent",
            status="active",
            tenant=tenant,
        )
        new_pass = date_of_birth.strftime('%d%m%Y')
        user.set_password(new_pass)
        user.save()
        try:
            send_mail(
                subject="Your Parent Account Credentials",
                message=(
                    f"Hi {user.fullname},\n\n"
                    f"Your Parent account has been created.\n\n"
                    f"Login details:\n"
                    f"Email: {user.email}\n"
                    f"Password: {new_pass} (your date of birth in DDMMYYYY format)\n\n"
                    f"Please log in and change your password immediately."
                ),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[user.email],
                fail_silently=True,  # avoid breaking create if email config is wrong
            )
        except Exception:
            # don't block creation if email fails
            pass

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


# =================================================Teacher Profile ===================================



class TeacherProfileSerializer(serializers.ModelSerializer):
    # Flattened user fields allowed for teacher to edit
    fullname = serializers.CharField(source="user.fullname", required=True)
    email = serializers.EmailField(source="user.email", required=True)
    phone = serializers.CharField(source="user.phone", allow_blank=True, required=False)
    DOB = serializers.DateField(source="user.DOB", allow_null=True, required=False,)
    gender = serializers.CharField(source="user.gender", allow_blank=True, required=False)

    class Meta:
        model = TeacherProfile
        fields = [
            "id",
            # user fields (flattened)
            "fullname",
            "email",
            "phone",
            "DOB",
            "gender",
            # teacher profile fields
            "department_id",
            "employee_id",
            "joining_date",
            "qualification",
            "salary",
            "specialization",
            "years_of_experience",
            "id_proof_url",
        ]
        read_only_fields = ["employee_id", "joining_date"]  # optionally lock fields you don't want teacher changing

    def validate_email(self, value):
        # ensure email uniqueness if changed
        request = self.context.get("request")
        user = request.user
        if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def update(self, instance, validated_data):
        """
        validated_data contains nested 'user' dict for user fields and remaining keys for profile.
        Update both user and teacher profile atomically.
        """
        user_data = validated_data.pop("user", {})
        user = instance.user

        # update user fields
        allowed_user_fields = {"fullname", "email", "phone", "DOB", "gender"}
        for k, v in user_data.items():
            if k in allowed_user_fields:
                setattr(user, k, v)
        user.save()

        # update profile fields
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        return instance
