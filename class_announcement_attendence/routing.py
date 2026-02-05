
from django.urls import path
from .consumer import AnnouncementConsumer

websocket_urlpatterns = [
    path("ws/announcements/", AnnouncementConsumer.as_asgi()),
]