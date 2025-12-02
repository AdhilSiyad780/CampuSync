# core/permissions.py

from rest_framework import permissions

class IsSuperAdminOrAdmin(permissions.BasePermission):
    """
    Allow only users with user_type 'superadmin' or 'admin'
    OR Django superusers.
    """

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        user_type = getattr(user, "user_type", None)

        if user.is_superuser:
            return True

        return user_type in ("superadmin", "admin")
