"""
Admin configuration for mailing app.
"""
from django.contrib import admin
from .models import Message, MessageRecipient, MessageGroupFilter


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "recipient_type",
        "created_by",
        "total_recipients",
        "is_sent",
        "created_at",
        "sent_at",
    ]
    list_filter = ["recipient_type", "is_sent", "created_at"]
    search_fields = ["title", "content", "created_by__username"]
    readonly_fields = ["created_at", "sent_at", "total_recipients"]
    date_hierarchy = "created_at"
    
    fieldsets = (
        ("Основная информация", {
            "fields": ("title", "content", "created_by")
        }),
        ("Получатели", {
            "fields": ("recipient_type", "total_recipients")
        }),
        ("Расписание", {
            "fields": ("scheduled_at",)
        }),
        ("Статус", {
            "fields": ("is_sent", "sent_at", "created_at")
        }),
    )


@admin.register(MessageRecipient)
class MessageRecipientAdmin(admin.ModelAdmin):
    list_display = [
        "message",
        "recipient",
        "is_read",
        "read_at",
        "received_at",
    ]
    list_filter = ["is_read", "received_at"]
    search_fields = ["message__title", "recipient__username"]
    readonly_fields = ["received_at", "read_at"]


@admin.register(MessageGroupFilter)
class MessageGroupFilterAdmin(admin.ModelAdmin):
    list_display = ["message", "group"]
    list_filter = ["group__course"]
    search_fields = ["message__title", "group__name"]
