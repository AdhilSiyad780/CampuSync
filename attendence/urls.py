from django.urls import path
from .views import (
   
    MarkAttendanceView,
    TeacherClassesForAttendanceView,
    GetStudentsForAttendanceView,
    AttendanceSessionDetailView,
    StudentAttendanceView

   
)

urlpatterns = [
  
    path('attendance/teacher/classes/', TeacherClassesForAttendanceView.as_view()),
    path('attendance/students/<int:class_id>/', GetStudentsForAttendanceView.as_view()),
    path('attendance/mark/', MarkAttendanceView.as_view()),
    path('attendance/sessions/<int:pk>/', AttendanceSessionDetailView.as_view()),
    path('student/attendance/', StudentAttendanceView.as_view()),


    


   
]