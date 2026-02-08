from rest_framework import permissions

class IsHeadTeacherOrDirector(permissions.BasePermission):
    """
    Custom permission to only allow head teachers and directors to record payments.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['head_teacher', 'director', 'admin']

