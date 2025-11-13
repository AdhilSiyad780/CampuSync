
from django.contrib import admin
from django.urls import path,include

urlpatterns = [
    path('api/', include('core.urls')),
    path('api/subscriptions/', include('subscription.urls')),
]
