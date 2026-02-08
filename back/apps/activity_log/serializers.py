"""
Serializers for Activity Log API.
"""
from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    user_full_name = serializers.SerializerMethodField()
    user_username = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    def get_user_full_name(self, obj):
        """Получить полное имя пользователя"""
        if obj.user:
            # Используем get_full_name() из AbstractUser
            full_name = obj.user.get_full_name()
            if full_name and full_name.strip():
                return full_name.strip()
            # Если нет полного имени, используем first_name + last_name
            if obj.user.first_name or obj.user.last_name:
                name = f"{obj.user.first_name or ''} {obj.user.last_name or ''}".strip()
                if name:
                    return name
            # Если ничего нет, возвращаем username
            return obj.user.username or 'Unknown'
        return None
    
    def get_user_username(self, obj):
        """Получить username пользователя"""
        return obj.user.username if obj.user else None
    
    def get_user_role(self, obj):
        """Получить роль пользователя"""
        if obj.user:
            return obj.user.role or '—'
        return None
    
    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'user',
            'user_full_name',
            'user_username',
            'user_role',
            'action_type',
            'action_type_display',
            'timestamp',
            'page_path',
            'component_name',
            'action_description',
            'ip_address',
            'object_type',
            'object_id',
            'object_name',
            'metadata',
        ]
        read_only_fields = ['id', 'timestamp']

