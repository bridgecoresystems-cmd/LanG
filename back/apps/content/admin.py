"""
Admin configuration for content app.
"""
from django.contrib import admin
from .models import Book, Audio, Material


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """Admin interface for Book model."""
    list_display = ["title", "author", "language", "level", "is_premium", "is_active"]
    list_filter = ["language", "level", "is_premium", "is_active", "created_at"]
    search_fields = ["title", "author", "description"]


@admin.register(Audio)
class AudioAdmin(admin.ModelAdmin):
    """Admin interface for Audio model."""
    list_display = ["title", "book", "language", "duration_seconds", "is_premium", "is_active"]
    list_filter = ["language", "is_premium", "is_active", "created_at"]
    search_fields = ["title", "description"]


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    """Admin interface for Material model."""
    list_display = ["title", "material_type", "course", "is_premium", "is_active"]
    list_filter = ["material_type", "is_premium", "is_active", "created_at"]
    search_fields = ["title", "description"]
