

from rest_framework.permissions import BasePermission

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request,'user',None)
        return bool(
            user and user.is_authenticated 
            and getattr(user,'user_type',None)=='student'
        )
        