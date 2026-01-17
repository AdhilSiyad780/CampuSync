from django.urls import path,include
from .views import (
    AnnouncementDetailView,
    AnnouncementListCreateView,
    SchoolClassListCreateView,
    SchoolClassRetrieveUpdateDestroyView,
    AvailableTeachersView,
    SubjectView,TimeSlotViewSet,TableEntryView,
    TimetableGridView
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()


router.register(r'subjects',SubjectView,basename='subject')
router.register(r'timeslot',TimeSlotViewSet,basename='timeslot')
router.register(r'timetable-entries',TableEntryView,basename='timeentry')

urlpatterns = [
    path('classes/', SchoolClassListCreateView.as_view(), name='class-list-create'),
    path('classes/<int:pk>/', SchoolClassRetrieveUpdateDestroyView.as_view(), name='class-detail'),
    path('teachers/available/', AvailableTeachersView.as_view(), name='available-teachers'),
    path('announcements/', AnnouncementListCreateView.as_view(), name='announcement-list-create'),
    # Path for Viewing, Updating, or Deleting a specific announcement
    # maps to GET, PUT/PATCH, and DELETE
    path('announcements/<int:pk>/', AnnouncementDetailView.as_view(), name='announcement-detail'),
    path('timetable/grid/<int:class_id>/', TimetableGridView.as_view(), name='timetable-grid'),


    path('',include(router.urls))
]

