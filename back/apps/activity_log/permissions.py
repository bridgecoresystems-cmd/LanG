"""
Permissions for Activity Log app.
Only administrators can view activity logs.
All authenticated users can create logs.
"""
from rest_framework import permissions


class CanViewActivityLog(permissions.BasePermission):
    """
    Разрешение на просмотр логов активности.
    Только администраторы могут просматривать логи.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Только администраторы могут видеть логи
        return request.user.role == 'admin' or request.user.is_superuser
    
    def has_object_permission(self, request, view, obj):
        # Только администраторы могут видеть все логи
        return request.user.role == 'admin' or request.user.is_superuser

