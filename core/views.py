from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializer import SuperAdminLoginSerializer,SuperAdminProfileSerializer,SuperAdminProfileUpdateSerializer
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser



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