from django.urls import re_path
from  . import consumer
websocket_urlpatterns = [
    # Remove the extra .AnnouncementConsumer
    re_path(r'ws/announcements/', consumer.AnnouncementConsumer.as_asgi()),
]