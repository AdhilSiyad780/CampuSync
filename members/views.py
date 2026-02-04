# students/views.py
from rest_framework import generics, permissions
from .models import StudentProfile,TeacherProfile
from .serializers import StudentProfileSerializer,TeacherSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination


class PaginationProperties(PageNumberPagination):
    page_size = 3
    page_size_query_param = 'page_size'
    max_page_size = 100


class IsAdminUserType(permissions.BasePermission):
    def has_permission(self, request, view):
        print(request.user.user_type, "======================================" )
        return bool(request.user and request.user.is_authenticated and request.user.user_type == "admin")


class StudentProfileListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = PaginationProperties

    def get_queryset(self):
        user = self.request.user
        tenant = getattr(user, "tenant", None)
        if not tenant:
            return StudentProfile.objects.none()
        return StudentProfile.objects.filter(tenant=tenant).select_related("user")


class StudentProfileRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserType]

    def get_queryset(self):
        user = self.request.user
        tenant = getattr(user, "tenant", None)
        if not tenant:
            return StudentProfile.objects.none()
        return StudentProfile.objects.filter(tenant=tenant).select_related("user")
    




class TeacherListCreateView(generics.ListCreateAPIView):
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PaginationProperties

    def get_queryset(self):
        user = self.request.user
        tenant = getattr(user, "tenant", None)
        if not tenant:
            return TeacherProfile.objects.none()
        return TeacherProfile.objects.filter(user__tenant=tenant)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class TeacherRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        tenant = getattr(user, "tenant", None)
        if not tenant:
            return TeacherProfile.objects.none()
        return TeacherProfile.objects.filter(user__tenant=tenant)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
    




    
# core/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import ParentProfile
from .serializers import ParentSerializer  # adjust import

class ParentListCreateView(generics.ListCreateAPIView):
    serializer_class = ParentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PaginationProperties

    def get_queryset(self):
        user = self.request.user
        tenant = getattr(user, "tenant", None)
        if not tenant:
            return ParentProfile.objects.none()
        return ParentProfile.objects.filter(user__tenant=tenant).prefetch_related(
            "relations__student__user"
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class ParentRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ParentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        tenant = getattr(user, "tenant", None)
        if not tenant:
            return ParentProfile.objects.none()
        return ParentProfile.objects.filter(user__tenant=tenant).prefetch_related(
            "relations__student__user"
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


# ===================================TEACHER PROFILE============================



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import TeacherProfileSerializer
from .models import TeacherProfile
from .permission import IsTeacher


class TeacherProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get(self, request):
        if getattr(request.user, "user_type", "") != "teacher":
            return Response({"detail": "This account is not a teacher account."}, status=status.HTTP_403_FORBIDDEN)

        teacher = getattr(request.user, "teacher_profile", None)
        if not teacher:
            return Response({"detail": "Teacher profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TeacherProfileSerializer(teacher, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        # same retrieval as GET
        teacher = getattr(request.user, "teacher_profile", None)
        if not teacher:
            return Response({"detail": "Teacher profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TeacherProfileSerializer(teacher, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)