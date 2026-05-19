from django.urls import path
from .views import StudentAIAssistantView


urlpatterns = [
    path('student/ai-assistant/', StudentAIAssistantView.as_view()),

]