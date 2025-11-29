from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializer import SuperAdminLoginSerializer,AdminVerifyOTPSerializer,SuperAdminProfileSerializer,SuperAdminProfileUpdateSerializer,AdminSignupSendOTPSerializer,AdminSignupSerializer,AdminLoginSerializer

from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from .models import User, Tenant
from .serializer import GoogleAuthSerializer

class SuperAdminLoginView(APIView):
    permission_classes = [AllowAny] 
    def post(self,request):
        serializers = SuperAdminLoginSerializer(data=request.data)
        serializers.is_valid(raise_exception=True)
        return Response(serializers.validated_data,status=status.HTTP_200_OK)
    
class SuperAdminProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        # USE PROFILE SERIALIZER HERE, NOT LOGIN SERIALIZER
        serializer = SuperAdminProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        # Use update serializer to validate + save
        serializer = SuperAdminProfileUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # After saving, return FULL updated profile
        profile_serializer = SuperAdminProfileSerializer(request.user)
        return Response(profile_serializer.data, status=status.HTTP_200_OK)



# -------------------------------AdminSignup--------------------------------------------------------------------


class AdminSignupSendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AdminSignupSendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.create(serializer.validated_data)
        return Response(
            {"detail": "OTP sent to email if it is valid."},
            status=status.HTTP_200_OK,
        )
    
class AdminSignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AdminSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        tenant = user.tenant

        data = {
            "refresh": str(refresh),
            "access": str(access),
            "user": {
                "id": user.id,
                "email": user.email,
                "fullname": user.fullname,
                "user_type": user.user_type,
                "is_setup_complete": user.is_setup_complete,
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
        }

        return Response(data, status=status.HTTP_200_OK)


class AdminVerifyOTPView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = AdminVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(
            {"detail": "OTP verified and account created.", **data},
            status=status.HTTP_201_CREATED,
        )


from django.utils import timezone

class AdminSignupSendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AdminSignupSendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp_obj = serializer.save()  # <-- use save(), get otp_obj

        # how many seconds until expiry
        expires_in = 0
        if getattr(otp_obj, "expires_at", None):
            expires_in = max(
                int((otp_obj.expires_at - timezone.now()).total_seconds()),
                0
            )
        else:
            # fallback if you somehow don't set expires_at; assume 5 mins
            expires_in = 5 * 60

        return Response(
            {
                "detail": "OTP sent to email if it is valid.",
                "expires_in": expires_in,
            },
            status=status.HTTP_200_OK,
        )


# --------------------------------------Google Auth----------------------------------------------------



class GoogleAuthView(APIView):
    authentication_classes = []  # public
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.validated_data["credential"]

        try:
            # Verify token with Google
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )

            # Basic checks
            if idinfo.get("iss") not in [
                "accounts.google.com",
                "https://accounts.google.com",
            ]:
                return Response({"detail": "Invalid issuer."}, status=status.HTTP_400_BAD_REQUEST)

            email = idinfo.get("email")
            fullname = idinfo.get("name", "")
            picture = idinfo.get("picture", "")

            if not email:
                return Response({"detail": "Email not available from Google."},
                                status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            # Don't leak internal errors to client
            print(e)
            return Response({"detail": "Invalid Google token."}, status=status.HTTP_400_BAD_REQUEST)

        # Find or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "fullname": fullname,
                "user_type": "admin",      # you can change this
                "status": "active",
                "is_staff": True,
                "profile_picture": picture,
            },
        )

        # If created and you want to auto-create a Tenant, you can do it here.
        # For now, we won't, to avoid over-complicating:
        tenant = user.tenant

        # Issue JWT
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        data = {
            "refresh": str(refresh),
            "access": str(access),
            "user": {
                "id": user.id,
                "email": user.email,
                "fullname": user.fullname,
                "user_type": user.user_type,
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
        }

        return Response(data, status=status.HTTP_200_OK)
    

class AdminLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []


    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)