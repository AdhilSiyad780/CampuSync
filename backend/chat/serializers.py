# chat/serializers.py

from rest_framework import serializers
from .models import Conversation, Message
from core.models import User

class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for chat"""
    class Meta:
        model = User
        fields = ['id', 'fullname', 'email', 'user_type', 'profile_picture']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserBasicSerializer(read_only=True)
    sender_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'sender_id', 
            'content', 'attachment', 'is_read', 'read_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            "id",
            "conversation",
            "sender",
            "created_at",
            "updated_at",
            "is_read",
            "read_at",
        ]


class ConversationSerializer(serializers.ModelSerializer):
    participant_1 = UserBasicSerializer(read_only=True)
    participant_2 = UserBasicSerializer(read_only=True)
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participant_1', 'participant_2', 'other_participant',
            'last_message', 'unread_count', 'created_at', 'updated_at'
        ]
    
    def get_other_participant(self, obj):
        """Get the other participant from request user's perspective"""
        request = self.context.get('request')
        if request and request.user:
            other = obj.get_other_participant(request.user)
            return UserBasicSerializer(other).data
        return None
    
    def get_last_message(self, obj):
        """Get the last message in the conversation"""
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None
    
    def get_unread_count(self, obj):
        """Get unread message count for current user"""
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(
                is_read=False
            ).exclude(
                sender=request.user
            ).count()
        return 0


class ConversationCreateSerializer(serializers.Serializer):
    """Serializer for creating a new conversation"""
    other_user_id = serializers.UUIDField()
    
    def validate_other_user_id(self, value):
        """Validate that the other user exists and is in same tenant"""
        request = self.context.get('request')
        try:
            other_user = User.objects.get(id=value, tenant=request.user.tenant)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found in your organization")
        
        # Validate allowed conversation types
        current_user_type = request.user.user_type
        other_user_type = other_user.user_type
        
        allowed_combinations = [
            ('teacher', 'student'),
            ('teacher', 'parent'),
            ('student', 'teacher'),
            ('parent', 'teacher'),
        ]
        
        if (current_user_type, other_user_type) not in allowed_combinations:
            raise serializers.ValidationError(
                f"{current_user_type.capitalize()} cannot chat with {other_user_type}"
            )
        
        return value