from django.urls import path
from .views import (
    AdminProfileView,
    SchoolProfileView,
    StudentProfileView,
    ParentProfileView,
    ForgotPasswordView,
    ResetPasswordView,
    ValidateTokenView
)


urlpatterns = [
    path('admin/profile/',AdminProfileView.as_view(),name='admin_profile'),
    path('school/profile/',SchoolProfileView.as_view(),name='school_profile'),
    path('student/profile/',StudentProfileView.as_view(),name='student_profile'),
    path('parent/profile/',ParentProfileView.as_view(),name='parent_profile'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('auth/validate-reset-token/', ValidateTokenView.as_view(), name='validate-reset-token'),
    
]