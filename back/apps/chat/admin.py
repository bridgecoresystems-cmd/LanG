"""
Admin configuration for chat app.
"""
from django.contrib import admin
from .models import Room, Message, MessageReadStatus


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    """Admin interface for Room model."""
    list_display = ["name", "room_type", "course", "group", "is_private", "is_active"]
    list_filter = ["room_type", "is_private", "is_active", "created_at"]
    search_fields = ["name"]
    filter_horizontal = ["participants"]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Admin interface for Message model."""
    list_display = ["user", "room", "content_preview", "is_edited", "is_deleted", "created_at"]
    list_filter = ["room", "is_edited", "is_deleted", "created_at"]
    search_fields = ["content", "user__username", "room__name"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]
    
    def content_preview(self, obj):
        """Return first 50 characters of content."""
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_preview.short_description = "Content"


@admin.register(MessageReadStatus)
class MessageReadStatusAdmin(admin.ModelAdmin):
    """Admin interface for MessageReadStatus model."""
    list_display = ["message", "user", "read_at"]
    list_filter = ["read_at"]
    search_fields = ["user__username", "message__content"]
