"""
Subscription models for Language School Management System.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator


class SubscriptionPlan(models.Model):
    """
    Subscription plan model for premium features.
    """
    name = models.CharField(
        max_length=255,
        verbose_name=_("Plan Name"),
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_("Price"),
    )
    duration_days = models.PositiveIntegerField(
        default=30,
        verbose_name=_("Duration (Days)"),
    )
    features = models.JSONField(
        default=list,
        verbose_name=_("Features"),
        help_text=_("List of features: ['books', 'audio', 'ai_chat']"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Active"),
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
        verbose_name = _("Subscription Plan")
        verbose_name_plural = _("Subscription Plans")
        ordering = ["price"]
        indexes = [
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.price} Gems"


class Subscription(models.Model):
    """
    User subscription model.
    """
    class Status(models.TextChoices):
        ACTIVE = "active", _("Active")
        EXPIRED = "expired", _("Expired")
        CANCELLED = "cancelled", _("Cancelled")
        PENDING = "pending", _("Pending")

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="subscriptions",
        verbose_name=_("User"),
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.CASCADE,
        related_name="subscriptions",
        verbose_name=_("Plan"),
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name=_("Status"),
    )
    start_date = models.DateTimeField(
        verbose_name=_("Start Date"),
    )
    end_date = models.DateTimeField(
        verbose_name=_("End Date"),
    )
    auto_renew = models.BooleanField(
        default=False,
        verbose_name=_("Auto Renew"),
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
        verbose_name = _("Subscription")
        verbose_name_plural = _("Subscriptions")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["status"]),
            models.Index(fields=["end_date"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.plan.name} ({self.status})"

    @property
    def is_active(self):
        """Check if subscription is currently active."""
        from django.utils import timezone
        return (
            self.status == self.Status.ACTIVE
            and self.end_date > timezone.now()
        )

    def has_feature(self, feature_name):
        """Check if subscription includes a specific feature."""
        if not self.is_active:
            return False
        return feature_name in self.plan.features
