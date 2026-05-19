from rest_framework import permissions

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        print(request.user.user_type, "======================================" )
        return bool(request.user and request.user.is_authenticated and request.user.user_type == "teacher")
