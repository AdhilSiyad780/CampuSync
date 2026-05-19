# chat/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Conversations
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/create/', views.create_conversation, name='conversation-create'),
    path('conversations/<uuid:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    
    # Messages
    path('conversations/<uuid:conversation_id>/messages/', views.ConversationMessagesView.as_view(), name='conversation-messages'),
    path('conversations/<uuid:conversation_id>/mark-read/', views.mark_messages_read, name='mark-messages-read'),
    
    # Available users
    path('available-users/', views.available_chat_users, name='available-chat-users'),
]