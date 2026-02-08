"""
Custom permissions for courses app.
"""
from rest_framework import permissions


class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Permission to allow only teachers and admins.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (
                request.user.is_teacher or 
                request.user.is_head_teacher or 
                request.user.is_admin_user or 
                request.user.is_superuser
            )
        )


class IsGroupTeacherOrAdmin(permissions.BasePermission):
    """
    Permission to allow only the teacher of the group or admin.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin and superuser have full access
        if request.user.is_admin_user or request.user.is_superuser:
            return True
        
        # For Group objects
        if hasattr(obj, 'teacher'):
            return obj.teacher == request.user
        
        # For Lesson objects (check through group)
        if hasattr(obj, 'group'):
            return obj.group.teacher == request.user
        
        # For Grade objects (check through lesson -> group)
        if hasattr(obj, 'lesson'):
            return obj.lesson.group.teacher == request.user
        
        return False


class IsStudentOrAdmin(permissions.BasePermission):
    """
    Permission to allow only students and admins.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_student or request.user.is_admin_user or request.user.is_superuser)
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to allow only the owner of the object or admin.
    Used for students viewing their own grades.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin and superuser have full access
        if request.user.is_admin_user or request.user.is_superuser:
            return True
        
        # For Grade objects
        if hasattr(obj, 'student'):
            return obj.student == request.user
        
        return False

