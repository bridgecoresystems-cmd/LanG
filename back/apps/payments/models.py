"""
Payment models for Language School Management System.
Supports manual cash payments and future bank integrations.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
import uuid


class Payment(models.Model):
    """
    Payment model for tracking tuition fees and other transactions.
    Supports manual cash payments received by staff.
    """
    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        COMPLETED = "completed", _("Completed")
        CANCELLED = "cancelled", _("Cancelled")
        REFUNDED = "refunded", _("Refunded")

    class PaymentMethod(models.TextChoices):
        CASH = "cash", _("Cash")
        BANK_TRANSFER = "bank_transfer", _("Bank Transfer")
        CARD = "card", _("Card")

    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        verbose_name=_("Invoice Number"),
        help_text=_("Unique identifier for this payment transaction")
    )
    student = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="payments",
        null=True,
        blank=True,
        verbose_name=_("Student"),
    )
    group = models.ForeignKey(
        "courses.Group",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
        verbose_name=_("Group"),
        help_text=_("Optional: group this payment is for")
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_("Amount"),
    )
    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name=_("Discount"),
        help_text=_("Discount amount applied to this payment")
    )
    currency = models.CharField(
        max_length=3,
        default="TMT",
        verbose_name=_("Currency"),
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
        verbose_name=_("Payment Method"),
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.COMPLETED,
        verbose_name=_("Status"),
    )
    received_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="received_payments",
        verbose_name=_("Received By"),
        help_text=_("Staff member (Head Teacher) who received the payment")
    )
    comment = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Comment"),
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At"),
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Updated At"),
    )

    class Meta:
        verbose_name = _("Payment")
        verbose_name_plural = _("Payments")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["student"]),
            models.Index(fields=["status"]),
            models.Index(fields=["invoice_number"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.invoice_number} - {self.student.get_full_name() or self.student.username} ({self.amount} {self.currency})"

    @staticmethod
    def generate_invoice_number():
        """Generates a unique invoice number."""
        import random
        import string
        from django.utils import timezone
        
        prefix = timezone.now().strftime('%Y%m%d')
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"INV-{prefix}-{random_str}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        super().save(*args, **kwargs)
