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
    # ✅ No OTP here. We use signup_token from verify-otp step
    email = serializers.EmailField()
    signup_token = serializers.CharField(max_length=64)

    # Admin user data
    fullname = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)

    # Tenant (school/institute) data
    instance_name = serializers.CharField(max_length=255)
    tenant_email = serializers.EmailField()
    tenant_phone = serializers.CharField(max_length=50)
    tenant_address = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        email = attrs.get("email")
        signup_token = attrs.get("signup_token")

        # 1) Check verified OTP exists for this email + token
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
            raise serializers.ValidationError("Email is not verified or token is invalid.")

        # Optional: limit how long after verification signup can be completed
        from datetime import timedelta
        if otp_obj.created_at < timezone.now() - timedelta(minutes=30):
            raise serializers.ValidationError("Signup session expired. Please verify OTP again.")

        # 2) Password check
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match.")

        # 3) Email uniqueness safety
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")

        # Pass otp_obj to create()
        attrs["otp_obj"] = otp_obj
        return attrs

    def create(self, validated_data):
        otp_obj = validated_data.pop("otp_obj")

        email = validated_data["email"]
        fullname = validated_data["fullname"]
        password = validated_data["password"]
        phone = validated_data.get("phone", "")

        instance_name = validated_data["instance_name"]
        tenant_email = validated_data["tenant_email"]
        tenant_phone = validated_data["tenant_phone"]
        tenant_address = validated_data.get("tenant_address", "")

        # 1) Create Tenant
        tenant = Tenant.objects.create(
            tenant_id=str(uuid.uuid4()),
            instance_name=instance_name,
            email=tenant_email,
            phone=tenant_phone,
            address=tenant_address,
            status="trial",
        )

        # 2) Create Admin user linked to Tenant
        user = User.objects.create_user(
            email=email,
            password=password,
            fullname=fullname,
            phone=phone,
            tenant=tenant,
            user_type="admin",
            status="active",
            is_staff=True,
        )


        otp_obj.signup_token = None
        otp_obj.save(update_fields=["signup_token"])

        return user





class AdminVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs.get("email")
        otp = attrs.get("otp")

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

        attrs["otp_obj"] = otp_obj
        return attrs

    def create(self, validated_data):
        otp_obj = validated_data["otp_obj"]
        signup_token = uuid.uuid4().hex

        otp_obj.is_used = True
        otp_obj.signup_token = signup_token
        otp_obj.save(update_fields=["is_used", "signup_token"])

        return {
          "email": otp_obj.email,
          "signup_token": signup_token,
        }
