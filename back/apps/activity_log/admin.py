from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user', 'action_type', 'page_path', 'component_name', 'action_description']
    list_filter = ['action_type', 'timestamp', 'page_path']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'page_path', 'component_name', 'action_description']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'action_type', 'timestamp')
        }),
        ('Информация о странице', {
            'fields': ('page_path', 'component_name', 'action_description')
        }),
        ('Связанный объект', {
            'fields': ('object_type', 'object_id', 'object_name'),
            'classes': ('collapse',)
        }),
        ('Метаданные', {
            'fields': ('ip_address', 'user_agent', 'metadata'),
            'classes': ('collapse',)
        }),
    )

