"""
Content models for Language School Management System.
Educational content: books, audio, materials.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import FileExtensionValidator


class Book(models.Model):
    """
    Book model for educational content.
    Premium feature - requires subscription.
    """
    title = models.CharField(
        max_length=255,
        verbose_name=_("Title"),
    )
    author = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Author"),
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
    )
    cover_image = models.ImageField(
        upload_to="books/covers/",
        blank=True,
        null=True,
        verbose_name=_("Cover Image"),
    )
    pdf_file = models.FileField(
        upload_to="books/pdfs/",
        validators=[FileExtensionValidator(allowed_extensions=["pdf"])],
        verbose_name=_("PDF File"),
    )
    language = models.CharField(
        max_length=100,
        verbose_name=_("Language"),
    )
    level = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_("Level"),
    )
    is_premium = models.BooleanField(
        default=True,
        verbose_name=_("Premium Content"),
        help_text=_("Requires subscription to access"),
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
        verbose_name = _("Book")
        verbose_name_plural = _("Books")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["language"]),
            models.Index(fields=["is_premium"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.language})"


class Audio(models.Model):
    """
    Audio model for educational content.
    Premium feature - requires subscription.
    """
    title = models.CharField(
        max_length=255,
        verbose_name=_("Title"),
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
    )
    audio_file = models.FileField(
        upload_to="audio/",
        validators=[
            FileExtensionValidator(allowed_extensions=["mp3", "wav", "ogg", "m4a"])
        ],
        verbose_name=_("Audio File"),
    )
    duration_seconds = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_("Duration (Seconds)"),
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audio_files",
        verbose_name=_("Related Book"),
    )
    language = models.CharField(
        max_length=100,
        verbose_name=_("Language"),
    )
    is_premium = models.BooleanField(
        default=True,
        verbose_name=_("Premium Content"),
        help_text=_("Requires subscription to access"),
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
        verbose_name = _("Audio")
        verbose_name_plural = _("Audio Files")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["book"]),
            models.Index(fields=["is_premium"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.language})"


class Material(models.Model):
    """
    General educational material model.
    Can be used for various types of content.
    """
    class MaterialType(models.TextChoices):
        DOCUMENT = "document", _("Document")
        VIDEO = "video", _("Video")
        IMAGE = "image", _("Image")
        LINK = "link", _("Link")
        OTHER = "other", _("Other")

    title = models.CharField(
        max_length=255,
        verbose_name=_("Title"),
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
    )
    material_type = models.CharField(
        max_length=20,
        choices=MaterialType.choices,
        default=MaterialType.DOCUMENT,
        verbose_name=_("Material Type"),
    )
    file = models.FileField(
        upload_to="materials/",
        blank=True,
        null=True,
        verbose_name=_("File"),
    )
    url = models.URLField(
        blank=True,
        null=True,
        verbose_name=_("URL"),
    )
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="materials",
        verbose_name=_("Course"),
    )
    is_premium = models.BooleanField(
        default=False,
        verbose_name=_("Premium Content"),
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
        verbose_name = _("Material")
        verbose_name_plural = _("Materials")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["material_type"]),
            models.Index(fields=["course"]),
            models.Index(fields=["is_premium"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_material_type_display()})"
