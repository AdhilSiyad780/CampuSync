# students/urls.py
from django.urls import path
from .views import (
    StudentProfileListCreateView,
    StudentProfileRetrieveUpdateDestroyView,
    TeacherListCreateView,TeacherRetrieveUpdateView
)

urlpatterns = [
    path("students/", StudentProfileListCreateView.as_view(), name="students_list_create"),
    path("students/<int:pk>/", StudentProfileRetrieveUpdateDestroyView.as_view(), name="students_detail"),
    path("teachers/", TeacherListCreateView.as_view(), name="teacher_list_create"),
    path("teachers/<int:pk>/", TeacherRetrieveUpdateView.as_view(), name="teacher_detail"),
]
