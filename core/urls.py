from django.urls import path
from .views import (SuperAdminLoginView,SuperAdminProfileView,
                    AdminSignupSendOTPView,AdminVerifyOTPView,AdminSignupView,
                    GoogleAuthView,AdminLoginView,
                    TenantListForSuperadminView,StudentLoginView,TeacherLoginView,
                    ParentLoginView,LogoutView, ToggleTenantBlockView)
from . import views


urlpatterns = [
    path('superadmin/login/',SuperAdminLoginView.as_view(),name='superadmin_login'),
    path("superadmin/profile/", SuperAdminProfileView.as_view()),

    path("signup/send-otp/", AdminSignupSendOTPView.as_view(), name="admin_signup_send_otp"),
    path("signup/verify-aaotp/", AdminVerifyOTPView.as_view(), name="admin_signup_verify_otp"),
    path("signup/", AdminSignupView.as_view(), name="admin_signup"),
    path("auth/google-login/", GoogleAuthView.as_view(), name="google_login"),
    path("login/", AdminLoginView.as_view(), name="admin_login"),
    path('superadmin/tenants/',TenantListForSuperadminView.as_view(),name='superadmin-tenants-list'),
    path('superadmin/tenants/<int:pk>/toggle-block/', ToggleTenantBlockView.as_view(), name='toggle-tenant-block'),
    path('student/login/',StudentLoginView.as_view(),name='student_login'),

    path("teacher/login/", TeacherLoginView.as_view(), name="teacher_login"),

    path("parent/login/", ParentLoginView.as_view(), name="parent_login"),

    path('auth/check/', views.check_auth, name='auth-check'),


    path("logout/", LogoutView.as_view(), name="logout"),
    

]