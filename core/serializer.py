from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
import random
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import serializers
from .models import User, OTPVerification, Tenant
import uuid
from subscription.models import SubscriptionPlan,Subscription
from datetime import timedelta
from django.db import transaction   

class SuperAdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        user = authenticate(email=email,password=password)
        if not user:
            raise serializers.ValidationError('invalid email or password')
        if not user.is_superuser:
            raise serializers.ValidationError('credentials are Superuser')
        return {
            'user':{
                'id':user.id,
                'email':user.email,
                'name':user.fullname,
                'user_type':user.is_superuser,

            }
        }   
    
class SuperAdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "fullname",
            "email",
            "profile_picture",
            "last_login"
        ]
        read_only_fields = ["email", "last_login"]

class SuperAdminProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["fullname", "profile_picture"]




# ------------------------------------admin(User) authentication-------------------------------------------------------


class AdminSignupSendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # Don’t allow signup if email already used by any user
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data["email"]

        # Remove previous unused OTPs for this email/purpose
        OTPVerification.objects.filter(
            email=email,
            purpose=OTPVerification.Purpose.ADMIN_SIGNUP,
            is_used=False,
        ).delete()

        # Generate 6-digit OTP
        otp_code = f"{random.randint(100000, 999999)}"

        otp_obj = OTPVerification.objects.create(
            email=email,
            otp=otp_code,
            purpose=OTPVerification.Purpose.ADMIN_SIGNUP,
        )

        # Send OTP email (for now, console backend → will show in terminal)
        subject = "Your  Signup OTP"
        message = f"Your OTP for Admin signup is: {otp_code}. It is valid for 5 minutes."
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@canvas-sync.com")

        send_mail(subject, message, from_email, [email], fail_silently=False)

        return otp_obj
    
    
class AdminSignupComlpeteSignupflow(serializers.Serializer):
    fullname = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)

    instance_name = serializers.CharField(max_length=255)
    tenant_email = serializers.EmailField()
    tenant_phone = serializers.CharField(max_length=50)
    tenant_address = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        if not request.user.tenant:
            raise serializers.ValidationError("Tenant not found.")

        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        tenant = user.tenant

        # update user
        user.fullname = validated_data["fullname"]
        user.phone = validated_data.get("phone", "")
        user.is_setup_complete = True
        user.save(update_fields=["fullname", "phone", "is_setup_complete"])

        # update tenant
        tenant.instance_name = validated_data["instance_name"]
        tenant.email = validated_data["tenant_email"]
        tenant.phone = validated_data["tenant_phone"]
        tenant.address = validated_data.get("tenant_address", "")
        tenant.save(update_fields=["instance_name", "email", "phone", "address"])

        return user

    
class AdminSignupCompleteLoginflow(serializers.Serializer):
    # No signup_token here — this serializer expects an authenticated request.user
    email = serializers.EmailField()
    fullname = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)

    instance_name = serializers.CharField(max_length=255)
    tenant_email = serializers.EmailField()
    tenant_phone = serializers.CharField(max_length=50)
    tenant_address = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required to complete signup.")

        # Ensure the provided email matches authenticated user's email (recommended)
        if attrs.get("email", "").lower() != request.user.email.lower():
            raise serializers.ValidationError({"email": "Email must match the authenticated user."})

        return attrs

    def create(self, validated_data):
       request = self.context["request"]
       user = request.user
       tenant = user.tenant

       user.fullname = validated_data["fullname"]
       user.phone = validated_data.get("phone", "")
       user.is_setup_complete = True
       user.save()

       tenant.instance_name = validated_data["instance_name"]
       tenant.email = validated_data["tenant_email"]
       tenant.phone = validated_data["tenant_phone"]
       tenant.address = validated_data.get("tenant_address", "")
       tenant.save()

       return user


class AdminVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"]
        otp = attrs["otp"]

        otp_obj = (
            OTPVerification.objects.filter(
                email=email,
                purpose=OTPVerification.Purpose.ADMIN_SIGNUP,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp_obj:
            raise serializers.ValidationError("No OTP found or it has already been used.")

        if otp_obj.expires_at < timezone.now():
            raise serializers.ValidationError("OTP has expired.")

        if otp_obj.otp != otp:
            raise serializers.ValidationError("Invalid OTP.")

        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match.")

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("User already exists.")

        attrs["otp_obj"] = otp_obj
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        otp_obj = validated_data["otp_obj"]
        email = validated_data["email"]
        password = validated_data["password"]

        # 1️⃣ Create user
        user = User.objects.create_user(
            email=email,
            password=password,
            fullname="",
            user_type="admin",
            status="active",
            is_staff=True,
        )

        # 2️⃣ Create tenant NOW (OTP verified = commitment)
        tenant = Tenant.objects.create(
            tenant_id=str(uuid.uuid4()),
            instance_name="",
            email=email,
            phone="",
            address="",
            status="trial",
        )

        # 3️⃣ Attach trial subscription
        trial_plan = SubscriptionPlan.objects.filter(
            plan_name__iexact="Trial", is_active=True
        ).first()

        if not trial_plan:
            trial_plan = SubscriptionPlan.objects.create(
                plan_name="Trial",
                description="Default trial plan",
                duration_days=7,
                price=0,
                max_students=None,
                max_teachers=None,
                max_admins=1,
                features=["Basic features"],
                is_active=True,
            )

        now = timezone.now()
        Subscription.objects.create(
            tenant=tenant,
            plan=trial_plan,
            start_date=now,
            expiry_date=now + timedelta(days=trial_plan.duration_days),
            status="trial",
            is_active=True,
        )

        # 4️⃣ Link user ↔ tenant
        user.tenant = tenant
        user.is_setup_complete = False
        user.save(update_fields=["tenant", "is_setup_complete"])

        # 5️⃣ Mark OTP used
        otp_obj.is_used = True
        otp_obj.save(update_fields=["is_used"])

        # 6️⃣ Issue JWT

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "user_type": user.user_type,
                "is_setup_complete": user.is_setup_complete,
            },
        }



class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField()


class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")

        # authenticate() will work if AUTH_USER_MODEL + AUTHENTICATION_BACKENDS are set correctly
        user = authenticate(email=email, password=password)
        print('this is the user',user)

        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        if user.user_type != "admin":
            raise serializers.ValidationError("This account is not an admin account.")

        if user.status != "active":
            raise serializers.ValidationError("Your account is not active.")

        # Generate JWT pair
        

        tenant = getattr(user, "tenant", None)

        return {
            'authenticated': True,
            "user": {
                "id": user.id,
                "email": user.email,
                "fullname": user.fullname,
                "user_type": user.user_type,
                "is_setup_complete": getattr(user, "is_setup_complete", False),
            },
            "tenant": {
                "id": tenant.id,
                "tenant_id": tenant.tenant_id,
                "instance_name": tenant.instance_name,
                "email": tenant.email,
                "phone": tenant.phone,
                "address": tenant.address,
                "status": tenant.status,
            } if tenant else None,
            "needs_setup": not getattr(user, "is_setup_complete", False),
        }
   
class TenantWithPlanSerializer(serializers.ModelSerializer):
    current_plan = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            "id",
            "tenant_id",
            "instance_name",
            "email",
            "phone",
            "status",
            "created_at",
            "current_plan",
        ]

    def get_current_plan(self, obj):
        # latest active subscription for this tenant
        sub = (
            Subscription.objects
            .filter(tenant=obj, is_active=True)
            .order_by("-start_date")
            .first()
        )
        if not sub:
            return None

        plan = sub.plan

        days_left = None
        if sub.expiry_date:                            # ✅ use sub, not plan
            delta = sub.expiry_date - timezone.now()   # ✅ use sub.expiry_date
            days_left = max(delta.days, 0)

        return {
            "plan_id": plan.id if plan else None,
            "plan_name": plan.plan_name if plan else "",
            "price": str(plan.price) if plan else None,
            "status": sub.status,
            "start_date": sub.start_date,
            "expiry_date": sub.expiry_date,   # ✅ from sub
            "days_left": days_left,
            "is_active": sub.is_active,
        }
    


# ================================Student Login ======================================

class StudentLoginSerializers(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    def validate(self,attr):
        request = self.context.get('request')
        email = attr.get('email')
        password = attr.get('password')
        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")
        user = authenticate(request=request,email=email,password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if user.user_type!='student':
            raise serializers.ValidationError('This account is not a student account')
        if user.status != "active":
            raise serializers.ValidationError("This account is not active.")
        attr['user']=user 
        return attr
    def create(self, validated_data):
        return validated_data['user']
    


# ======================================teacher login ============================================



class TeacherLoginSerializers(serializers.Serializer):
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    def validate(self,attr):
        request = self.context.get('request')
        email = attr.get('email')
        password = attr.get('password')
        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")
        user = authenticate(request=request,email=email,password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if user.user_type!='teacher':
            raise serializers.ValidationError('This account is not a teacher account')
        if user.status != "active":
            raise serializers.ValidationError("This account is not active.")
        attr['user']=user 
        return attr
    def create(self, validated_data):
        return validated_data['user']

# ===================================================Parent Login======================================

class ParentLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        request = self.context.get("request")
        email = attrs.get("email")
        password = attrs.get("password")

        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")

        user = authenticate(request=request, email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        if getattr(user, "user_type", "") != "parent":
            raise serializers.ValidationError("This account is not a parent account.")

        if getattr(user, "status", "") != "active":
            raise serializers.ValidationError("This account is not active.")

        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        return validated_data["user"]