# config/asgi.py

import os
import django
from django.core.asgi import get_asgi_application

# Set Django settings module FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django BEFORE importing anything else
django.setup()

# Now import Channels and your routing
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from class_announcement_attendence.routing import websocket_urlpatterns
from core.middleware import TokenAuthMiddleware

# Get ASGI application
django_asgi_app = get_asgi_application()

# Define application
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        TokenAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})