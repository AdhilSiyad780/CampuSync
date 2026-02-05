
from django.contrib import admin
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('api/chat/',include('chat.urls')),
    path('api/', include('core.urls')),
    path('api/subscriptions/', include('subscription.urls')),
    path('api/',include('members.urls')),
    path('api/',include('profiles.urls')),
    path('api/',include('class_announcement_attendence.urls')),
    path('api/',include('assignment.urls')),
    path('api/',include('attendence.urls')),
    path('api/',include('exams.urls')),
    path('api/',include('finance.urls')),
    

]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)