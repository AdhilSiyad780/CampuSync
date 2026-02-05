# chat/routing.py

from django.urls import path
from . import consumer

websocket_urlpatterns = [
    path('ws/chat/<uuid:conversation_id>/', consumer.ChatConsumer.as_asgi()),
]