# meetings/urls.py
from django.urls import path
from .views import MeetingListCreateView, MeetingDetailView, JoinMeetingView, EndMeetingView

urlpatterns = [
    path('meetings/', MeetingListCreateView.as_view()),
    path('meetings/<int:pk>/', MeetingDetailView.as_view()),
    path('meetings/join/<str:room_name>/', JoinMeetingView.as_view()),
    path('meetings/<int:pk>/end/', EndMeetingView.as_view()),
]