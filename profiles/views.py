from rest_framework.response import Response
from rest_framework.views import APIView   
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework.permissions import IsAuthenticated

from core.models import User
from .serializers import (AdminProfileSerializers,SchoolProfileSerializers,StudentProfileSerializers,
                          ParentProfileSerializers,ForgotPasswordSerializer,ResetPasswordSerializer)

class AdminProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        if request.user.user_type!='admin':
            return Response({'detail':'forbidden'},status=403)
        serilazer = AdminProfileSerializers(request.user,partial=True)
        return Response(serilazer.data)
    def put(self,request):
        if request.user.user_type!='admin':
            return Response({'detail':'forbidden'},status=403)
        serializer = AdminProfileSerializers(request.user,
                                             data = request.data,
                                             partial = True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
class SchoolProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        if request.user.user_type!='admin':
            return Response({'detail':'forbidden'},status=403)
        serilazer = SchoolProfileSerializers(request.user.tenant)
        return Response(serilazer.data)
    def put(self,request):
        if request.user.user_type!='admin':
            return Response({'detail':'forbidden'},status=403)
        serializer = SchoolProfileSerializers(request.user.tenant,
                                             data = request.data,
                                             partial = True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)



class StudentProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        if request.user.user_type!='student':
            return Response({'detail':'forbidden'},status=403)
        serializer = StudentProfileSerializers(request.user,partial = True)
        return Response(serializer.data)
    def put(self,request):
        if request.user.user_type!='student':
            return Response({'detail':'forbidden'},status=403)
        serializer = StudentProfileSerializers(request.user,
                                             data = request.data,
                                             partial = True)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors,status=400)
    

class ParentProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        if request.user.user_type!='parent':
            return Response({'detail':'forbidden'},status=403)
        serializer = ParentProfileSerializers(request.user,partial = True)
        return Response(serializer.data)
    def put(self,request):
        if request.user.user_type!='parent':
            return Response({'detail':'forbidden'},status=403)
        serializer = ParentProfileSerializers(request.user,
                                             data = request.data,
                                             partial = True)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors,status=400)



class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    def post(self,request):
        serializers = ForgotPasswordSerializer(data = request.data)
        if serializers.is_valid():
            serializers.save()
            return Response({
                "message": "If an account exists with this email, you will receive password reset instructions."
            }, status=status.HTTP_200_OK)
        return Response(serializers.errors,status=status.HTTP_400_BAD_REQUEST)
    
class ValidateTokenView(APIView):
    permission_classes = [AllowAny]
    def post(self,request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        if not uid or not token:
            return Response({
                'valid':False,
                'message':'missing uid or token',
            },status=status.HTTP_400_BAD_REQUEST)
        try:
            uid_decoded = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid_decoded)
            if default_token_generator.check_token(user,token):
                return Response({
                    'valid':True,
                    'email':user.email,
                    'user_type':user.user_type,
                },status=status.HTTP_200_OK)
            else:
                return Response({
                    "valid": False,
                    "message": "Token has expired or is invalid"
                }, status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({
                "valid": False,
                "message": "Invalid reset link"
            }, status=status.HTTP_400_BAD_REQUEST)
        

class ResetPasswordView(APIView):
    """
    Reset password with token
    POST /api/auth/reset-password/
    Body: {
        "uid": "MQ",
        "token": "abcd1234...",
        "new_password": "newpass123",
        "confirm_password": "newpass123"
    }
    """
    permission_classes = []  # Allow unauthenticated users
    
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Password has been reset successfully. You can now login with your new password."
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
