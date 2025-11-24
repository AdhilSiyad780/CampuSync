from django.urls import path
from .views import SuperAdminLoginView,SuperAdminProfileView


urlpatterns = [
    path('superadmin/login/',SuperAdminLoginView.as_view(),name='superadmin_login'),
    path("superadmin/profile/", SuperAdminProfileView.as_view()),
    
]