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
        refresh = RefreshToken.for_user(user)
        return {
            'refresh':str(refresh),
            'access':str(refresh.access_token),
            'user':{
                'id':user.id,
                'email':user.email,
                'name':user.fullname,
                'user_type':user.user_type
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
class AdminSignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    signup_token = serializers.CharField(max_length=64)

    fullname = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)

    instance_name = serializers.CharField(max_length=255)
    tenant_email = serializers.EmailField()
    tenant_phone = serializers.CharField(max_length=50)
    tenant_address = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        email = attrs.get("email")
        signup_token = attrs.get("signup_token")

        # OTP object that carries the signup_token
        otp_obj = (
            OTPVerification.objects.filter(
                email=email,
                purpose=OTPVerification.Purpose.ADMIN_SIGNUP,
                signup_token=signup_token,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp_obj:
            raise serializers.ValidationError("Signup token is invalid or expired.")

        from datetime import timedelta
        if otp_obj.created_at < timezone.now() - timedelta(minutes=30):
            raise serializers.ValidationError("Signup session expired. Please verify OTP again.")

        # User MUST already exist (created at verify-otp step)
        try:
            user = User.objects.get(email__iexact=email, user_type="admin")
        except User.DoesNotExist:
            raise serializers.ValidationError("Admin user not found. Please verify OTP again.")

        if getattr(user, "is_setup_complete", False):
            raise serializers.ValidationError("Setup already completed for this account.")

        attrs["otp_obj"] = otp_obj
        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        otp_obj = validated_data["otp_obj"]
        user = validated_data["user"]

        instance_name = validated_data["instance_name"]
        tenant_email = validated_data["tenant_email"]
        tenant_phone = validated_data["tenant_phone"]
        tenant_address = validated_data.get("tenant_address", "")
        fullname = validated_data["fullname"]
        phone = validated_data.get("phone", "")

        # 1) Create Tenant
        tenant = Tenant.objects.create(
            tenant_id=str(uuid.uuid4()),
            instance_name=instance_name,
            email=tenant_email,
            phone=tenant_phone,
            address=tenant_address,
            status="trial",
        )

        # 2) Update existing user with tenant + profile
        user.fullname = fullname
        user.phone = phone
        user.tenant = tenant
        user.is_setup_complete = True
        user.save(update_fields=["fullname", "phone", "tenant", "is_setup_complete"])

        # 3) Clear signup_token
        otp_obj.signup_token = None
        otp_obj.save(update_fields=["signup_token"])

        return user


class AdminVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        otp = attrs.get("otp")
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")

        # 1) Find OTP
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
            raise serializers.ValidationError("OTP has expired. Please request a new one.")

        if otp_obj.otp != otp:
            raise serializers.ValidationError("Invalid OTP.")

        # 2) Password checks
        if password != confirm_password:
            raise serializers.ValidationError("Passwords do not match.")

        # 3) Email must not already have an account
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")

        attrs["otp_obj"] = otp_obj
        return attrs

    def create(self, validated_data):
        otp_obj = validated_data["otp_obj"]
        email = validated_data["email"]
        password = validated_data["password"]

        # Create user here – minimal admin
        user = User.objects.create_user(
            email=email,
            password=password,
            fullname="",          # can be filled later
            user_type="admin",
            status="active",
            is_staff=True,
        )
        user.is_setup_complete = False
        user.save(update_fields=["is_setup_complete"])

        # mark OTP used
        otp_obj.is_used = True
        # optional: keep a token as a session reference for step 2 (or drop it)
        signup_token = uuid.uuid4().hex
        otp_obj.signup_token = signup_token
        otp_obj.save(update_fields=["is_used", "signup_token"])

        # Issue JWT right here so user is actually logged in
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        return {
            "email": user.email,
            "signup_token": signup_token,
            "access": str(access),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": user.email,
                "fullname": user.fullname,
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
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        tenant = getattr(user, "tenant", None)

        return {
            "access": str(access),
            "refresh": str(refresh),
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