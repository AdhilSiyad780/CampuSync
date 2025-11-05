from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import User



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

        