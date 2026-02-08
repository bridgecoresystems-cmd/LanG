"""
Admin configuration for subscriptions app.
"""
from django.contrib import admin
from .models import SubscriptionPlan, Subscription


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    """Admin interface for SubscriptionPlan model."""
    list_display = ["name", "price", "duration_days", "is_active"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "description"]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    """Admin interface for Subscription model."""
    list_display = ["user", "plan", "status", "start_date", "end_date", "is_active"]
    list_filter = ["status", "plan", "start_date", "end_date"]
    search_fields = ["user__username", "user__email", "plan__name"]
    readonly_fields = ["is_active"]
    ordering = ["-created_at"]
