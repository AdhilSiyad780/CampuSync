# students/views.py
from rest_framework import generics, permissions
from .models import StudentProfile,TeacherProfile
from .serializers import StudentProfileSerializer,TeacherSerializer
from rest_framework.permissions import IsAuthenticated


class IsAdminUserType(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_superuser", False):
            return True
        return getattr(user, "user_type", "") == "admin"


class StudentProfileListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserType]

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
