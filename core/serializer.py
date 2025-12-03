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
    
class AdminSignupComlpeteSignupflow(serializers.Serializer):
    # Basic profile / tenant fields
    email = serializers.EmailField()
    fullname = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True)

    instance_name = serializers.CharField(max_length=255)
    tenant_email = serializers.EmailField()
    tenant_phone = serializers.CharField(max_length=50)
    tenant_address = serializers.CharField(required=False, allow_blank=True)

    signup_token = serializers.CharField()

    def validate(self, attrs):
        """
        Basic validation:
        - If signup_token provided, ensure it exists and hasn't expired (server-side logic depends on OTP model).
        - If signup_token not provided, ensure request.user is authenticated (login/google flow).
        - Ensure tenant_email same-domain guard etc. can be added here if needed.
        """
        request = self.context.get("request")
        signup_token = attrs.get("signup_token", "").strip()

        # OTP flow: validate token exists
        if signup_token:
            otp_obj = OTPVerification.objects.filter(signup_token=signup_token).first()
            if not otp_obj:
                raise serializers.ValidationError({"signup_token": "Invalid or expired signup token."})
            # optional: ensure purpose matches
            if otp_obj.purpose != OTPVerification.Purpose.ADMIN_SIGNUP:
                raise serializers.ValidationError({"signup_token": "Invalid signup token purpose."})
            # optional: check expiry if your OTP model tracks expires_at
            if getattr(otp_obj, "expires_at", None) and otp_obj.expires_at < timezone.now():
                raise serializers.ValidationError({"signup_token": "Signup token has expired."})

            attrs["_otp_obj"] = otp_obj  # stash for create()
            # ensure email consistency (frontend should send same email)
            if otp_obj.email.lower() != attrs.get("email", "").lower():
                raise serializers.ValidationError({"email": "Email does not match signup session."})
            return attrs

        # Non-OTP flow: require authenticated request.user
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required to complete signup (or provide a signup_token).")

        # Ensure email (if provided) matches authenticated user's email (optional but safer)
        if attrs.get("email", "").lower() != request.user.email.lower():
            raise serializers.ValidationError({"email": "Email must match the authenticated user."})

        return attrs

    def create(self, validated_data):
        """
        Create tenant and attach to the resolved user.
        Resolution priority:
          1) If _otp_obj present -> resolve user by email saved in otp_obj (user should already exist).
          2) Else -> use request.user (authenticated flow).
        Make tenant creation idempotent: if user already has a tenant, return that user after updating profile.
        """
        request = self.context.get("request")
        otp_obj = validated_data.pop("_otp_obj", None)
        signup_token = validated_data.pop("signup_token", None)  # not needed after resolution

        # Resolve user
        user = None
        if otp_obj:
            # OTP verify step earlier created the user with the OTP email — find user by email.
            user = User.objects.filter(email__iexact=otp_obj.email).first()
            if not user:
                raise serializers.ValidationError("User associated with signup token not found. Contact support.")
        else:
            user = request.user
            if not user or not user.is_authenticated:
                raise serializers.ValidationError("Authentication required to complete signup.")

        # Extract tenant/profile fields
        instance_name = validated_data["instance_name"].strip()
        tenant_email = validated_data["tenant_email"].strip()
        tenant_phone = validated_data["tenant_phone"].strip()
        tenant_address = validated_data.get("tenant_address", "").strip()
        fullname = validated_data["fullname"].strip()
        phone = validated_data.get("phone", "").strip()
        email = validated_data["email"].strip()

        # If user already has a tenant -> treat as idempotent update (avoid creating duplicates)
        if getattr(user, "tenant", None):
            tenant = user.tenant
            # Update tenant fields if different (optional)
            changed = False
            if tenant.instance_name != instance_name:
                tenant.instance_name = instance_name
                changed = True
            if tenant.email != tenant_email:
                tenant.email = tenant_email
                changed = True
            if tenant.phone != tenant_phone:
                tenant.phone = tenant_phone
                changed = True
            if tenant.address != tenant_address:
                tenant.address = tenant_address
                changed = True
            if changed:
                tenant.save(update_fields=["instance_name", "email", "phone", "address"])
        else:
            # Create a new tenant
            tenant = Tenant.objects.create(
                tenant_id=str(uuid.uuid4()),
                instance_name=instance_name,
                email=tenant_email,
                phone=tenant_phone,
                address=tenant_address,
                status="trial",
            )
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
                    features=["Basic features", "Limited usage"],
                    is_active=True,
                )

            now = timezone.now()
            duration_days = trial_plan.duration_days or 7

            Subscription.objects.create(
                tenant=tenant,
                plan=trial_plan,
                start_date=now,
                expiry_date=now + timedelta(days=duration_days),
                next_billing_date=None,
                status="trial",     
                is_active=True,
            )
        # Update user profile and attach tenant
        user.fullname = fullname
        user.phone = phone
        user.tenant = tenant
        user.is_setup_complete = True
        user.save(update_fields=["fullname", "phone", "tenant", "is_setup_complete"])

        # Optionally: mark signup_token or otp_obj as consumed/cleared here
        if otp_obj:
            # Keep existing behavior consistent: mark signup token as consumed (if you want)
            # (Do NOT delete audit trail unless intended)
            otp_obj.signup_token = None
            otp_obj.save(update_fields=["signup_token"])

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
        request = self.context.get("request")
        user = request.user

        # tenant/profile fields
        instance_name = validated_data["instance_name"].strip()
        tenant_email = validated_data["tenant_email"].strip()
        tenant_phone = validated_data["tenant_phone"].strip()
        tenant_address = validated_data.get("tenant_address", "").strip()
        fullname = validated_data["fullname"].strip()
        phone = validated_data.get("phone", "").strip()

        # idempotent tenant creation
        if getattr(user, "tenant", None):
            tenant = user.tenant
            changed = False
            if tenant.instance_name != instance_name:
                tenant.instance_name = instance_name
                changed = True
            if tenant.email != tenant_email:
                tenant.email = tenant_email
                changed = True
            if tenant.phone != tenant_phone:
                tenant.phone = tenant_phone
                changed = True
            if tenant.address != tenant_address:
                tenant.address = tenant_address
                changed = True
            if changed:
                tenant.save(update_fields=["instance_name", "email", "phone", "address"])
        else:
            tenant = Tenant.objects.create(
                tenant_id=str(uuid.uuid4()),
                instance_name=instance_name,
                email=tenant_email,
                phone=tenant_phone,
                address=tenant_address,
                status="trial",
            )
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
                    features=["Basic features", "Limited usage"],
                    is_active=True,
                )

            now = timezone.now()
            duration_days = trial_plan.duration_days or 7

            Subscription.objects.create(
                tenant=tenant,
                plan=trial_plan,
                start_date=now,
                expiry_date=now + timedelta(days=duration_days),
                next_billing_date=None,
                status="trial",     # matches your STATUS_CHOICES
                is_active=True,
            )
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
                    features=["Basic features", "Limited usage"],
                    is_active=True,
                )

            now = timezone.now()
            duration_days = trial_plan.duration_days or 7

            Subscription.objects.create(
                tenant=tenant,
                plan=trial_plan,
                start_date=now,
                expiry_date=now + timedelta(days=duration_days),
                next_billing_date=None,
                status="trial",     # matches your STATUS_CHOICES
                is_active=True,
            )

        # update user
        user.fullname = fullname
        user.phone = phone
        user.tenant = tenant
        user.is_setup_complete = True
        user.save(update_fields=["fullname", "phone", "tenant", "is_setup_complete"])

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