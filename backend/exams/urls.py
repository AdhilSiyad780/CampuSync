from django.urls import path
from .views import (
    # Teacher views
    ExamListCreateView,
    ExamDetailView,
    ExamResultsView,
    BulkCreateExamResultsView,
    GradeExamResultView,
    ExamConcernsListView,
    ResolveConcernView,
    
    # Student views
    StudentExamsView,
    StudentExamDetailView,
    StudentExamResultsView,
    RaiseConcernView,
    StudentConcernsView,
)

urlpatterns = [
    # ============================================
    # TEACHER EXAM ENDPOINTS
    # ============================================
    
    # List/Create exams
    path('teacher/exams/', ExamListCreateView.as_view(), name='teacher-exam-list-create'),
    
    # View/Update/Delete specific exam
    path('teacher/exams/<int:pk>/', ExamDetailView.as_view(), name='teacher-exam-detail'),
    
    # View all results for an exam
    path('teacher/exams/<int:exam_id>/results/', ExamResultsView.as_view(), name='teacher-exam-results'),
    
    # Auto-create result entries for all students in class
    path('teacher/exams/<int:exam_id>/create-results/', BulkCreateExamResultsView.as_view(), name='teacher-bulk-create-results'),
    
    # Grade a specific result
    path('teacher/results/<int:result_id>/grade/', GradeExamResultView.as_view(), name='teacher-grade-result'),
    
    # View all concerns for teacher's exams
    path('teacher/concerns/', ExamConcernsListView.as_view(), name='teacher-concerns-list'),
    
    # Resolve a concern
    path('teacher/concerns/<int:concern_id>/resolve/', ResolveConcernView.as_view(), name='teacher-resolve-concern'),
    
    # ============================================
    # STUDENT EXAM ENDPOINTS
    # ============================================
    
    # List all exams for student's class
    path('student/exams/', StudentExamsView.as_view(), name='student-exams'),
    
    # View specific exam with result
    path('student/exams/<int:pk>/', StudentExamDetailView.as_view(), name='student-exam-detail'),
    
    # List all student's results
    path('student/results/', StudentExamResultsView.as_view(), name='student-results'),
    
    # Raise concern about result
    path('student/concerns/raise/', RaiseConcernView.as_view(), name='student-raise-concern'),
    
    # View student's concerns
    path('student/concerns/', StudentConcernsView.as_view(), name='student-concerns'),
]