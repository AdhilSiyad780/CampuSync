from django.urls import path
from .views import SuperAdminLoginView,SuperAdminProfileView,AdminSignupSendOTPView,AdminVerifyOTPView,AdminSignupView


urlpatterns = [
    path('superadmin/login/',SuperAdminLoginView.as_view(),name='superadmin_login'),
    path("superadmin/profile/", SuperAdminProfileView.as_view()),

    path("signup/send-otp/", AdminSignupSendOTPView.as_view(), name="admin_signup_send_otp"),
    path("signup/verify-otp/", AdminVerifyOTPView.as_view(), name="admin_signup_verify_otp"),
    path("signup/", AdminSignupView.as_view(), name="admin_signup"),

   
    
]