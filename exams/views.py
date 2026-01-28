from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count

from .models import Exam, ExamResult, ExamConcern
from .serializers import (
    ExamSerializer,
    ExamResultSerializer,
    ExamResultListSerializer,
    ExamConcernSerializer
)
from core.permission import IsStudent
from members.permission import IsTeacher


# ============================================
# TEACHER EXAM VIEWS
# ============================================

class ExamListCreateView(generics.ListCreateAPIView):
    """
    GET: List all exams (filtered by teacher)
    POST: Create new exam (teacher only)
    """
    serializer_class = ExamSerializer
    permission_classes = [IsTeacher]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Exam.objects.filter(
            tenant=user.tenant,
            teacher=user
        ).select_related('teacher', 'subject').prefetch_related('classes')
        
        # Filters
        subject_id = self.request.query_params.get('subject')
        class_id = self.request.query_params.get('class')
        status_filter = self.request.query_params.get('status')
        
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if class_id:
            queryset = queryset.filter(classes__id=class_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.distinct().order_by('-exam_date', '-start_time')


class ExamDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: View exam details
    PUT/PATCH: Update exam (teacher only)
    DELETE: Delete exam (teacher only)
    """
    serializer_class = ExamSerializer
    permission_classes = [IsTeacher]
    
    def get_queryset(self):
        return Exam.objects.filter(
            tenant=self.request.user.tenant,
            teacher=self.request.user
        )


class ExamResultsView(generics.ListAPIView):
    """
    GET: List all results for a specific exam (teacher view)
    """
    serializer_class = ExamResultListSerializer
    permission_classes = [IsTeacher]
    
    def get_queryset(self):
        exam_id = self.kwargs.get('exam_id')
        user = self.request.user
        
        queryset = ExamResult.objects.filter(
            exam_id=exam_id,
            exam__tenant=user.tenant,
            exam__teacher=user
        ).select_related('student', 'exam', 'student__student_profile')
        
        return queryset.order_by('student__student_profile__roll_number')


class BulkCreateExamResultsView(APIView):
    """
    POST: Auto-create exam results for all students in the exam's classes
    """
    permission_classes = [IsTeacher]
    
    def post(self, request, exam_id):
        try:
            exam = Exam.objects.get(
                id=exam_id,
                tenant=request.user.tenant,
                teacher=request.user
            )
        except Exam.DoesNotExist:
            return Response(
                {"error": "Exam not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all students from all the exam's classes
        from members.models import StudentProfile
        students = StudentProfile.objects.filter(
            school_class__in=exam.classes.all(),
            user__tenant=request.user.tenant
        ).select_related('user').distinct()
        
        created_count = 0
        for student_profile in students:
            _, created = ExamResult.objects.get_or_create(
                exam=exam,
                student=student_profile.user,
                defaults={'status': 'pending'}
            )
            if created:
                created_count += 1
        
        return Response({
            "message": f"Created {created_count} exam result entries",
            "total_students": students.count()
        })


class GradeExamResultView(APIView):
    """
    POST: Grade a student's exam result (teacher only)
    """
    permission_classes = [IsTeacher]
    
    def post(self, request, result_id):
        try:
            result = ExamResult.objects.get(
                id=result_id,
                exam__teacher=request.user,
                exam__tenant=request.user.tenant
            )
        except ExamResult.DoesNotExist:
            return Response(
                {"error": "Result not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        marks_obtained = request.data.get('marks_obtained')
        remarks = request.data.get('remarks', '')
        result_status = request.data.get('status', 'graded')
        
        if marks_obtained is None and result_status != 'absent':
            return Response(
                {"error": "marks_obtained is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate marks
        if marks_obtained is not None:
            marks_obtained = float(marks_obtained)
            if marks_obtained < 0 or marks_obtained > result.exam.max_marks:
                return Response(
                    {"error": f"Marks must be between 0 and {result.exam.max_marks}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = ExamResultSerializer(
            result,
            data={
                'marks_obtained': marks_obtained,
                'remarks': remarks,
                'status': result_status
            },
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExamConcernsListView(generics.ListAPIView):
    """
    GET: List all concerns for teacher's exams
    """
    serializer_class = ExamConcernSerializer
    permission_classes = [IsTeacher]
    
    def get_queryset(self):
        user = self.request.user
        
        queryset = ExamConcern.objects.filter(
            result__exam__teacher=user,
            result__exam__tenant=user.tenant
        ).select_related('student', 'result', 'result__exam', 'reviewed_by')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')


class ResolveConcernView(APIView):
    """
    POST: Resolve a student's concern (teacher only)
    """
    permission_classes = [IsTeacher]
    
    def post(self, request, concern_id):
        try:
            concern = ExamConcern.objects.get(
                id=concern_id,
                result__exam__teacher=request.user,
                result__exam__tenant=request.user.tenant
            )
        except ExamConcern.DoesNotExist:
            return Response(
                {"error": "Concern not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        response_text = request.data.get('response', '')
        concern_status = request.data.get('status', 'resolved')
        revised_marks = request.data.get('revised_marks')
        
        if not response_text:
            return Response(
                {"error": "Response is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update concern
        concern.response = response_text
        concern.status = concern_status
        concern.reviewed_by = request.user
        concern.reviewed_at = timezone.now()
        
        # If marks are being revised
        if revised_marks is not None:
            revised_marks = float(revised_marks)
            if revised_marks < 0 or revised_marks > concern.result.exam.max_marks:
                return Response(
                    {"error": f"Marks must be between 0 and {concern.result.exam.max_marks}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            concern.revised_marks = revised_marks
            # Update the actual result
            concern.result.marks_obtained = revised_marks
            concern.result.save()
        
        concern.save()
        
        serializer = ExamConcernSerializer(concern)
        return Response(serializer.data)


# ============================================
# STUDENT EXAM VIEWS
# ============================================
class StudentExamsView(generics.ListAPIView):
    """
    GET: List all exams for the logged-in student's class
    """
    serializer_class = ExamSerializer
    permission_classes = [IsStudent]
    
    def get_queryset(self):
        user = self.request.user
        
        # Get student's class
        try:
            student_profile = user.student_profile
            # FIX 1: Changed from 'students' to 'school_class'
            student_class = student_profile.school_class
        except:
            return Exam.objects.none()
        
        if not student_class:
            return Exam.objects.none()
        
        # FIX 2: Changed 'school_class' to 'classes' (ManyToManyField)
        queryset = Exam.objects.filter(
            tenant=user.tenant,
            classes=student_class
        ).select_related('teacher', 'subject').prefetch_related('classes')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-exam_date', '-start_time')


class StudentExamDetailView(generics.RetrieveAPIView):
    """
    GET: View exam details with student's result
    """
    serializer_class = ExamSerializer
    permission_classes = [IsStudent]
    
    def get_queryset(self):
        user = self.request.user
        try:
            # FIX 3: Changed from 'students' to 'school_class'
            student_class = user.student_profile.school_class
        except:
            return Exam.objects.none()
        
        return Exam.objects.filter(
            tenant=user.tenant,
            classes=student_class
        )

class StudentExamResultsView(generics.ListAPIView):
    """
    GET: List all exam results for the logged-in student
    """
    serializer_class = ExamResultSerializer
    permission_classes = [IsStudent]
    
    def get_queryset(self):
        return ExamResult.objects.filter(
            student=self.request.user
        ).select_related('exam', 'exam__subject').order_by('-created_at')


class RaiseConcernView(generics.CreateAPIView):
    """
    POST: Raise a concern about exam result (student only)
    """
    serializer_class = ExamConcernSerializer
    permission_classes = [IsStudent]
    
    def perform_create(self, serializer):
        result_id = self.request.data.get('result')
        
        # Verify result belongs to student
        try:
            result = ExamResult.objects.get(
                id=result_id,
                student=self.request.user
            )
        except ExamResult.DoesNotExist:
            raise permissions.PermissionDenied("Result not found")
        
        # Check if result is graded
        if result.status != 'graded':
            raise permissions.PermissionDenied("Can only raise concern for graded results")
        
        # Check if concern already exists
        if result.concerns.filter(status__in=['pending', 'under_review']).exists():
            raise permissions.PermissionDenied("You already have a pending concern for this result")
        
        serializer.save()


class StudentConcernsView(generics.ListAPIView):
    """
    GET: List all concerns raised by the student
    """
    serializer_class = ExamConcernSerializer
    permission_classes = [IsStudent]
    
    def get_queryset(self):
        return ExamConcern.objects.filter(
            student=self.request.user
        ).select_related('result', 'result__exam', 'reviewed_by')