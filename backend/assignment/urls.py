# assignment/urls.py
from django.urls import path
from .views import (
    # Teacher views
    AssignmentClassPerformanceView,
    AssignmentListCreateView,
    AssingmentDetailView,
    AssignmentSubmissionsView,
    GradeSubmissionView,
    
    # Student views
    StudentAssignmentView,
    SubmitAssignmentView,
    StudentSubmissionsView,
    StudentSubmissionDetailView,
)

urlpatterns = [
    # ============================================
    # TEACHER ASSIGNMENT ENDPOINTS
    # ============================================
    path('assignments/', AssignmentListCreateView.as_view(), name='assignment-list-create'),
    path('assignments/<int:pk>/', AssingmentDetailView.as_view(), name='assignment-detail'),
    path('assignments/<int:assignment_id>/submissions/', AssignmentSubmissionsView.as_view(), name='assignment-submissions'),
    path('submissions/<int:submission_id>/grade/', GradeSubmissionView.as_view(), name='grade-submission'),
    path('assignments/<int:assignment_id>/class-report/', AssignmentClassPerformanceView.as_view(), name='assignment-class-report'),
    
    # ============================================
    # STUDENT ASSIGNMENT ENDPOINTS
    # ============================================
    path('student/assignments/', StudentAssignmentView.as_view(), name='student-assignments'),
    path('student/assignments/submit/', SubmitAssignmentView.as_view(), name='submit-assignment'),
    path('student/submissions/', StudentSubmissionsView.as_view(), name='student-submissions'),
    path('student/submissions/<int:pk>/', StudentSubmissionDetailView.as_view(), name='student-submission-detail'),
]