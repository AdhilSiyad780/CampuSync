from django.urls import path
from .views import (
    AdminProfileView,
    SchoolProfileView,
    StudentProfileView,
    ParentProfileView,
)


urlpatterns = [
    path('admin/profile/',AdminProfileView.as_view(),name='admin_profile'),
    path('school/profile/',SchoolProfileView.as_view(),name='school_profile'),
    path('student/profile/',StudentProfileView.as_view(),name='student_profile'),
    path('parent/profile/',ParentProfileView.as_view(),name='parent_profile'),
    
]