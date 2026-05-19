# chat/views.py

from rest_framework import generics, status
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, 
    MessageSerializer,
    ConversationCreateSerializer
)
from core.models import User
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class MessagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100


class ConversationListView(generics.ListAPIView):
    """List all conversations for current user"""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        tenant = user.tenant
        
        if not tenant:
            return Conversation.objects.none()
        
        return Conversation.objects.filter(
            Q(participant_1=user) | Q(participant_2=user),
            tenant=tenant
        ).select_related(
            'participant_1', 'participant_2'
        ).prefetch_related('messages')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_conversation(request):
    """Create or get existing conversation with another user"""
    serializer = ConversationCreateSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    other_user_id = serializer.validated_data['other_user_id']
    other_user = User.objects.get(id=other_user_id)
    
    conversation = Conversation.get_or_create_conversation(
        user1=request.user,
        user2=other_user,
        tenant=request.user.tenant
    )
    
    return Response(
        ConversationSerializer(conversation, context={'request': request}).data,
        status=status.HTTP_200_OK
    )


class ConversationDetailView(generics.RetrieveAPIView):
    """Get conversation details"""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(participant_1=user) | Q(participant_2=user),
            tenant=user.tenant
        )


class ConversationMessagesView(generics.ListCreateAPIView):
    """List messages in a conversation or send a new message"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MessagePagination
    
    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        user = self.request.user
        
        # Verify user is participant
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                tenant=user.tenant
            )
            if user not in [conversation.participant_1, conversation.participant_2]:
                return Message.objects.none()
        except Conversation.DoesNotExist:
            return Message.objects.none()
        
        return Message.objects.filter(
            conversation_id=conversation_id
        ).select_related('sender')
    
    def perform_create(self, serializer):
        conversation_id = self.kwargs.get("conversation_id")

        conversation = Conversation.objects.get(
            id=conversation_id,
            tenant=self.request.user.tenant
        )

    # Verify user is participant
        if self.request.user not in [conversation.participant_1, conversation.participant_2]:
            raise PermissionDenied("Not a participant")

    # Save message
        message = serializer.save(
            conversation=conversation,
            sender=self.request.user
        )

    # ✅ Correct broadcast call
        self.broadcast_message(message, conversation)

    
    def broadcast_message(self, message, conversation):
        """Broadcast new message via WebSocket"""
        channel_layer = get_channel_layer()
        
        # Get both participants
        participants = [conversation.participant_1.id, conversation.participant_2.id]
        
        message_data = json.loads(
            json.dumps(MessageSerializer(message).data, default=str)
            ) 
        
        print(f"📢 Broadcasting message to conversation: {conversation.id}")
        
        # Send to conversation group
        async_to_sync(channel_layer.group_send)(
            f'chat_{conversation.id}',
            {
                'type': 'chat_message',
                'message': message_data
            }
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_messages_read(request, conversation_id):
    """Mark all messages in conversation as read"""
    try:
        conversation = Conversation.objects.get(
            id=conversation_id,
            tenant=request.user.tenant
        )
        
        # Verify user is participant
        if request.user not in [conversation.participant_1, conversation.participant_2]:
            return Response(
                {'error': 'Not a participant'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Mark all unread messages from other user as read
        unread_messages = Message.objects.filter(
            conversation=conversation,
            is_read=False
        ).exclude(sender=request.user)
        
        for msg in unread_messages:
            msg.mark_as_read()
        
        return Response({'status': 'Messages marked as read'})
        
    except Conversation.DoesNotExist:
        return Response(
            {'error': 'Conversation not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_chat_users(request):
    """Get list of users current user can chat with"""
    user = request.user
    tenant = user.tenant
    
    if not tenant:
        return Response([])
    
    # Define allowed combinations
    if user.user_type == 'teacher':
        allowed_types = ['student', 'parent']
    elif user.user_type in ['student', 'parent']:
        allowed_types = ['teacher']
    else:
        allowed_types = []
    
    users = User.objects.filter(
        tenant=tenant,
        user_type__in=allowed_types,
        status='active'
    ).exclude(id=user.id).values(
        'id', 'fullname', 'email', 'user_type', 'profile_picture'
    )
    
    return Response(list(users))