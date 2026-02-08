"""
Permissions for mailing app.
"""
from rest_framework import permissions


class CanCreateMessage(permissions.BasePermission):
    """
    Permission to create messages.
    Only head_teacher and superuser can create messages.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Only head_teacher and superuser can create messages
        return (
            request.user.is_authenticated and
            (request.user.role == "head_teacher" or request.user.is_superuser)
        )


class CanViewOwnMessages(permissions.BasePermission):
    """
    Permission to view own messages.
    All authenticated users can view their own messages.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated

