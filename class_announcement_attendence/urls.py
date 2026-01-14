from django.urls import path
from .views import (
    AnnouncementDetailView,
    AnnouncementListCreateView,
    SchoolClassListCreateView,
    SchoolClassRetrieveUpdateDestroyView,
    AvailableTeachersView
)

urlpatterns = [
    path('classes/', SchoolClassListCreateView.as_view(), name='class-list-create'),
    path('classes/<int:pk>/', SchoolClassRetrieveUpdateDestroyView.as_view(), name='class-detail'),
    path('teachers/available/', AvailableTeachersView.as_view(), name='available-teachers'),
    path('announcements/', AnnouncementListCreateView.as_view(), name='announcement-list-create'),
    # Path for Viewing, Updating, or Deleting a specific announcement
    # maps to GET, PUT/PATCH, and DELETE
    path('announcements/<int:pk>/', AnnouncementDetailView.as_view(), name='announcement-detail'),
]

