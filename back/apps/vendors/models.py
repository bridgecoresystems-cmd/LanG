from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
import uuid

class VendorProfile(models.Model):
    """
    Profile for vendors (cafeteria, shop, etc.)
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vendor_profile",
        verbose_name=_("User"),
    )
    name_tm = models.CharField(max_length=255, verbose_name=_("Name (Turkmen)"))
    name_ru = models.CharField(max_length=255, verbose_name=_("Name (Russian)"))
    name_en = models.CharField(max_length=255, verbose_name=_("Name (English)"))
    
    description_tm = models.TextField(blank=True, null=True, verbose_name=_("Description (Turkmen)"))
    description_ru = models.TextField(blank=True, null=True, verbose_name=_("Description (Russian)"))
    description_en = models.TextField(blank=True, null=True, verbose_name=_("Description (English)"))
    
    # Terminal settings for ESP32
    terminal_id = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
        verbose_name=_("Terminal ID"),
        help_text=_("Unique ID for the ESP32 terminal"),
    )
    auth_token = models.CharField(
        max_length=255,
        unique=True,
        blank=True,
        null=True,
        default=uuid.uuid4,
        verbose_name=_("Terminal Auth Token"),
        help_text=_("Secret token for terminal authentication"),
    )
    
    is_active = models.BooleanField(default=True, verbose_name=_("Active"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Vendor Profile")
        verbose_name_plural = _("Vendor Profiles")

    def __str__(self):
        return self.name_ru or self.name_tm or self.name_en or f"Vendor: {self.user.username}"

