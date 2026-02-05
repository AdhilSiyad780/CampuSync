# chat/models.py (create new app: python manage.py startapp chat)

import uuid
from django.db import models
from core.models import User, Tenant

class Conversation(models.Model):
    """
    A conversation between two users
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='conversations')
    
    # Participants (always exactly 2)
    participant_1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_p1')
    participant_2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_p2')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_conversations'
        ordering = ['-updated_at']
        # Ensure unique conversation between two users
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'participant_1', 'participant_2'],
                name='unique_conversation'
            )
        ]
    
    def __str__(self):
        return f"{self.participant_1.fullname} <-> {self.participant_2.fullname}"
    
    def get_other_participant(self, user):
        """Get the other participant in the conversation"""
        if self.participant_1 == user:
            return self.participant_2
        return self.participant_1
    
    @classmethod
    def get_or_create_conversation(cls, user1, user2, tenant):
        """
        Get or create a conversation between two users.
        Ensures consistent ordering to avoid duplicate conversations.
        """
        # Order users by ID to ensure consistency
        if user1.id < user2.id:
            p1, p2 = user1, user2
        else:
            p1, p2 = user2, user1
        
        conversation, created = cls.objects.get_or_create(
            tenant=tenant,
            participant_1=p1,
            participant_2=p2
        )
        return conversation


class Message(models.Model):
    """
    A message in a conversation
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    
    content = models.TextField()
    attachment = models.FileField(upload_to='chat/attachments/%Y/%m/', null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.fullname}: {self.content[:50]}"
    
    def mark_as_read(self):
        """Mark message as read"""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])