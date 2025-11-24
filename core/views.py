from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializer import SuperAdminLoginSerializer,AdminVerifyOTPSerializer,SuperAdminProfileSerializer,SuperAdminProfileUpdateSerializer,AdminSignupSendOTPSerializer,AdminSignupSerializer

from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken



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

        # Auto-login
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

        return Response(data, status=status.HTTP_201_CREATED)

# accounts/views.py
class AdminVerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AdminVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(
            {"detail": "OTP verified successfully.", **data},
            status=status.HTTP_200_OK,
        )
