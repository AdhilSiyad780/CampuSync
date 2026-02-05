# config/asgi.py

import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from core.middleware import CookieJWTAuthMiddleware

# Import all WebSocket routes
from class_announcement_attendence.routing import websocket_urlpatterns as announcement_ws
from chat.routing import websocket_urlpatterns as chat_ws

django_asgi_app = get_asgi_application()

# Combine all WebSocket routes
all_websocket_patterns = announcement_ws + chat_ws

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": CookieJWTAuthMiddleware(
        URLRouter(all_websocket_patterns)
    ),
})