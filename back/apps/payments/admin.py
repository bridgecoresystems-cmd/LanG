"""
Admin configuration for payments app.
"""
from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin interface for Payment model."""
    list_display = ["invoice_number", "student", "amount", "currency", "status", "payment_method", "created_at"]
    list_filter = ["status", "currency", "payment_method", "created_at"]
    search_fields = ["student__username", "student__first_name", "student__last_name", "invoice_number", "comment"]
    readonly_fields = ["invoice_number", "created_at", "updated_at"]
    ordering = ["-created_at"]
    raw_id_fields = ["student", "group", "received_by"]
