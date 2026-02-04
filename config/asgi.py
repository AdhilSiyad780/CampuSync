# config/asgi.py

import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from class_announcement_attendence.routing import websocket_urlpatterns
from core.middleware import CookieJWTAuthMiddleware

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": CookieJWTAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})