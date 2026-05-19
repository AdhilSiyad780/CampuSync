from core.permission import IsStudent
from rest_framework.exceptions import PermissionDenied
from members.permission import IsTeacher
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q, Count
from .models import Assignment, AssignmentSubmission
from .serializers import (
    AssignmentSerializer,
    AssignmentSubmissionSerializer,
    AssignmentSubmissionListSerializer

)




class AssignmentListCreateView(generics.ListCreateAPIView):
    """
    GET: List all assignments (filtered by teacher if teacher, all if admin)
    POST: Create new assignment (teacher only)
    """
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Assignment.objects.filter(tenant=user.tenant).select_related(
            'teacher', 'subject'
        ).prefetch_related('classes')
        
        # Teachers only see their own assignments
        if user.user_type == 'teacher':
            queryset = queryset.filter(teacher=user)
        
        # Filter by subject, class, or status
        subject_id = self.request.query_params.get('subject')
        class_id = self.request.query_params.get('class_ids')
        
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if class_id:
            queryset = queryset.filter(classes__id=class_id)
        
        return queryset.distinct().order_by('-created_at')
    
    def perform_create(self, serializer):
        # Only teachers can create
        if self.request.user.user_type != 'teacher':
            raise permissions.PermissionDenied("Only teachers can create assignments")
        serializer.save()


class AssingmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def get_queryset(self):
        user = self.request.user 
        queryset = Assignment.objects.filter(tenant=user.tenant)
        if user.user_type=='teacher':
            queryset = queryset.filter(teacher=user)
        return queryset
    def perform_update(self, serializer):
        if self.request.user.user_type != 'teacher':
            raise permissions.PermissionDenied("Only teachers can delete assignments")
        serializer.save()
    def perform_destroy(self, instance):
        user = self.request.user
        queryset = Assignment.objects.filter(tenant=user.tenant)
        queryset = queryset.filter(teacher=user)
        if self.request.user.user_type != 'teacher':
            print(queryset.count())
            raise permissions.PermissionDenied("Only teachers can delete assignments")
        instance.delete()





class AssignmentSubmissionsView(generics.ListAPIView):
    """
    GET: List all submissions for a specific assignment (teacher view)
    """
    serializer_class = AssignmentSubmissionListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        assignment_id = self.kwargs.get('assignment_id')
        user = self.request.user
        
        queryset = AssignmentSubmission.objects.filter(
            assignment_id=assignment_id,
            assignment__tenant=user.tenant
        ).select_related('student', 'assignment', 'student__student_profile')
        
        # Teachers can only see submissions for their assignments
        if user.user_type == 'teacher':
            queryset = queryset.filter(assignment__teacher=user)
        
        return queryset.order_by('-submitted_at')
    


class GradeSubmissionView(APIView):
    """
    POST: Grade a student's submission (teacher only)
    """
    permission_classes = [IsTeacher]
    
    def post(self, request, submission_id):
        try:
            submission = AssignmentSubmission.objects.get(
                id=submission_id,
                assignment__teacher=request.user,
                assignment__tenant=request.user.tenant
            )
        except AssignmentSubmission.DoesNotExist:
            return Response(
                {"error": "Submission not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        marks_obtained = request.data.get('marks_obtained')
        feedback = request.data.get('feedback', '')
        
        if marks_obtained is None:
            return Response(
                {"error": "marks_obtained is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate marks
        if marks_obtained < 0 or marks_obtained > submission.assignment.total_marks:
            return Response(
                {"error": f"Marks must be between 0 and {submission.assignment.total_marks}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AssignmentSubmissionSerializer(
            submission,
            data={
                'marks_obtained': marks_obtained,
                'feedback': feedback
            },
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# ==================================ASSIGNMENT - STUDENT========================================================================


class StudentAssignmentView(generics.ListAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [IsStudent]
    def get_queryset(self):
        user = self.request.user
        
        # Get student's class
        try:
            student_profile = user.student_profile
            student_class = student_profile.school_class
        except:
            return Assignment.objects.none()
        
        if not student_class:
            return Assignment.objects.none()
        
        # Get assignments for student's class
        queryset = Assignment.objects.filter(
            tenant=user.tenant,
            classes=student_class
        ).select_related('teacher', 'subject').prefetch_related('classes')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter == 'pending':
            # Assignments not yet submitted
            submitted_ids = AssignmentSubmission.objects.filter(
                student=user
            ).values_list('assignment_id', flat=True)
            queryset = queryset.exclude(id__in=submitted_ids)
        elif status_filter == 'submitted':
            # Assignments already submitted
            submitted_ids = AssignmentSubmission.objects.filter(
                student=user
            ).values_list('assignment_id', flat=True)
            queryset = queryset.filter(id__in=submitted_ids)
        
        return queryset.distinct().order_by('-due_date')
    



class SubmitAssignmentView(generics.CreateAPIView):
    """
    POST: Submit an assignment (student only)
    """
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser]
    
    def perform_create(self, serializer):
        assignment_id = self.request.data.get('assignment')
        
        # Check if assignment exists and is for student's class
        try:
            assignment = Assignment.objects.get(
                id=assignment_id,
                tenant=self.request.user.tenant
            )
            
            # Verify student is in one of the assigned classes
            student_class = self.request.user.student_profile.school_class
            if student_class not in assignment.classes.all():
                raise permissions.PermissionDenied(
                    "This assignment is not for your class"
                )
            
            # Check if already submitted
            if AssignmentSubmission.objects.filter(
                assignment=assignment,
                student=self.request.user
            ).exists():
                raise permissions.PermissionDenied(
                    "You have already submitted this assignment"
                )
            
        except Assignment.DoesNotExist:
            raise permissions.PermissionDenied("Assignment not found")
        
        serializer.save()

        

# school/views.py

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q, Count
from .models import Assignment, AssignmentSubmission
from .serializers import (
    AssignmentSerializer,
    AssignmentSubmissionSerializer,
    AssignmentSubmissionListSerializer
)


class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'teacher'


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'student'


# ============================================
# TEACHER VIEWS
# ============================================

class AssignmentListCreateView(generics.ListCreateAPIView):
    """
    GET: List all assignments (filtered by teacher if teacher, all if admin)
    POST: Create new assignment (teacher only)
    """
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Assignment.objects.filter(tenant=user.tenant).select_related(
            'teacher', 'subject'
        ).prefetch_related('classes')
        
        # Teachers only see their own assignments
        if user.user_type == 'teacher':
            queryset = queryset.filter(teacher=user)
        
        # Filter by subject, class, or status
        subject_id = self.request.query_params.get('subject')
        class_id = self.request.query_params.get('class')
        
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if class_id:
            queryset = queryset.filter(classes__id=class_id)
        
        return queryset.distinct().order_by('-created_at')
    
    def perform_create(self, serializer):
        # Only teachers can create
        if self.request.user.user_type != 'teacher':
            raise permissions.PermissionDenied("Only teachers can create assignments")
        serializer.save()


class AssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: View assignment details
    PUT/PATCH: Update assignment (teacher only)
    DELETE: Delete assignment (teacher only)
    """
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Assignment.objects.filter(tenant=user.tenant)
        
        # Teachers can only modify their own assignments
        if user.user_type == 'teacher':
            queryset = queryset.filter(teacher=user)
        
        return queryset
    
    def perform_update(self, serializer):
        if self.request.user.user_type != 'teacher':
            raise permissions.PermissionDenied("Only teachers can update assignments")
        serializer.save()
    
    def perform_destroy(self, instance):
        if self.request.user.user_type != 'teacher':
            raise permissions.PermissionDenied("Only teachers can delete assignments")
        instance.delete()


class AssignmentSubmissionsView(generics.ListAPIView):
    """
    GET: List all submissions for a specific assignment (teacher view)
    """
    serializer_class = AssignmentSubmissionListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        assignment_id = self.kwargs.get('assignment_id')
        user = self.request.user
        
        queryset = AssignmentSubmission.objects.filter(
            assignment_id=assignment_id,
            assignment__tenant=user.tenant
        ).select_related('student', 'assignment', 'student__student_profile')
        
        # Teachers can only see submissions for their assignments
        if user.user_type == 'teacher':
            queryset = queryset.filter(assignment__teacher=user)
        
        return queryset.order_by('-submitted_at')


class GradeSubmissionView(APIView):
    """
    POST: Grade a student's submission (teacher only)
    """
    permission_classes = [IsTeacher]
    
    def post(self, request, submission_id):
        try:
            submission = AssignmentSubmission.objects.get(
                id=submission_id,
                assignment__teacher=request.user,
                assignment__tenant=request.user.tenant
            )
        except AssignmentSubmission.DoesNotExist:
            return Response(
                {"error": "Submission not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        marks_obtained = request.data.get('marks_obtained')
        feedback = request.data.get('feedback', '')
        
        if marks_obtained is None:
            return Response(
                {"error": "marks_obtained is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate marks
        if marks_obtained < 0 or marks_obtained > submission.assignment.total_marks:
            return Response(
                {"error": f"Marks must be between 0 and {submission.assignment.total_marks}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AssignmentSubmissionSerializer(
            submission,
            data={
                'marks_obtained': marks_obtained,
                'feedback': feedback
            },
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AssignmentClassPerformanceView(APIView):
    """
    GET: Returns ALL students from the classes assigned to this assignment
    along with their submission status (submitted, graded, or missing).
    """
    permission_classes = [IsTeacher]

    def get(self, request, assignment_id):
        try:
            assignment = Assignment.objects.get(id=assignment_id, tenant=request.user.tenant)
        except Assignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=404)

        # Get all students who are in the classes linked to this assignment
        assigned_classes = assignment.classes.all()
        from members.models import StudentProfile  # Adjust path as needed
        
        students = StudentProfile.objects.filter(
            school_class__in=assigned_classes,
            tenant=request.user.tenant
        ).select_related('user')

        # Get all existing submissions for this assignment to map them
        submissions = AssignmentSubmission.objects.filter(assignment=assignment)
        submission_map = {sub.student_id: sub for sub in submissions}

        report = []
        for profile in students:
            sub = submission_map.get(profile.user_id)
            report.append({
                "student_id": profile.user_id,
                "student_name": profile.user.fullname,
                "roll_number": profile.roll_number,
                "status": sub.status if sub else "not_submitted",
                "submission_id": sub.id if sub else None,
                "marks_obtained": sub.marks_obtained if sub else None,
                "attachment": request.build_absolute_uri(sub.attachment.url) if sub and sub.attachment else None,
                "submitted_at": sub.submitted_at if sub else None,
            })

        return Response(report)

# ============================================
# STUDENT VIEWS
# ============================================

class StudentAssignmentsView(generics.ListAPIView):
    """
    GET: List all assignments for the logged-in student's class
    """
    serializer_class = AssignmentSerializer
    permission_classes = [IsStudent]
    
    def get_queryset(self):
        user = self.request.user
        
        # Get student's class
        try:
            student_profile = user.student_profile
            student_class = student_profile.school_class
        except:
            return Assignment.objects.none()
        
        if not student_class:
            return Assignment.objects.none()
        
        # Get assignments for student's class
        queryset = Assignment.objects.filter(
            tenant=user.tenant,
            classes=student_class
        ).select_related('teacher', 'subject').prefetch_related('classes')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter == 'pending':
            # Assignments not yet submitted
            submitted_ids = AssignmentSubmission.objects.filter(
                student=user
            ).values_list('assignment_id', flat=True)
            queryset = queryset.exclude(id__in=submitted_ids)
        elif status_filter == 'submitted':
            # Assignments already submitted
            submitted_ids = AssignmentSubmission.objects.filter(
                student=user
            ).values_list('assignment_id', flat=True)
            queryset = queryset.filter(id__in=submitted_ids)
        
        return queryset.distinct().order_by('-due_date')



    
class SubmitAssignmentView(generics.CreateAPIView):
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser]
    
    def perform_create(self, serializer):
        user = self.request.user
        assignment_id = self.request.data.get('assignment')
        
        # 1. Profile Check
        if not hasattr(user, 'student_profile'):
            print("DEBUG: Student has no profile")
            raise PermissionDenied("Student profile not found.")
            
        try:
            assignment = Assignment.objects.get(id=assignment_id, tenant=user.tenant)
            
            # 2. Class Check
            student_class = user.student_profile.school_class
            if student_class not in assignment.classes.all():
                print(f"DEBUG: Student class {student_class} not in {assignment.classes.all()}")
                raise PermissionDenied("This assignment is not for your class")
            
            # 3. Duplicate Check
            if AssignmentSubmission.objects.filter(assignment=assignment, student=user).exists():
                print("DEBUG: Already submitted")
                raise PermissionDenied("You have already submitted this assignment")
            
        except Assignment.DoesNotExist:
            print(f"DEBUG: Assignment {assignment_id} not found")
            raise PermissionDenied("Assignment not found")
        
        serializer.save(student=user) # Force the student to be the current user


class StudentSubmissionsView(generics.ListAPIView):
    """
    GET: List all submissions by the logged-in student
    """
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsStudent]
    
    def get_queryset(self):
        return AssignmentSubmission.objects.filter(
            student=self.request.user
        ).select_related('assignment', 'assignment__subject', 'assignment__teacher')
    


class StudentSubmissionDetailView(generics.RetrieveUpdateAPIView):
    """
    GET: View submission details
    PUT/PATCH: Update submission (only if not graded)
    """
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        return AssignmentSubmission.objects.filter(student=self.request.user)
    
    def perform_update(self, serializer):
        if serializer.instance.status == 'graded':
            raise permissions.PermissionDenied(
                "Cannot update a graded submission"
            )
        serializer.save()




