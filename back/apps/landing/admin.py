"""
Admin configuration for landing app.
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import News, ContactMessage, CourseCategory, CourseSubCategory, Course


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    """Admin interface for News model."""
    list_display = ["title_en", "is_published", "is_featured", "created_at"]
    list_filter = ["is_published", "is_featured", "created_at"]
    search_fields = ["title_tm", "title_ru", "title_en"]
    ordering = ["-created_at"]
    
    fieldsets = (
        ("Image", {
            "fields": ("image",)
        }),
        ("Turkmen", {
            "fields": ("title_tm", "content_tm")
        }),
        ("Russian", {
            "fields": ("title_ru", "content_ru")
        }),
        ("English", {
            "fields": ("title_en", "content_en")
        }),
        ("Settings", {
            "fields": ("is_published", "is_featured")
        }),
    )


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    """Admin interface for ContactMessage model."""
    list_display = ["name", "email", "phone", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["name", "email", "phone", "message"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]
    
    fieldsets = (
        ("Message Information", {
            "fields": ("name", "email", "phone", "message")
        }),
        ("Moderation", {
            "fields": ("status",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )
    
    actions = ['approve_messages', 'reject_messages']
    
    def approve_messages(self, request, queryset):
        """Approve selected messages."""
        updated = queryset.update(status='approved')
        self.message_user(request, f"{updated} message(s) approved.")
    approve_messages.short_description = "Approve selected messages"
    
    def reject_messages(self, request, queryset):
        """Reject selected messages."""
        updated = queryset.update(status='rejected')
        self.message_user(request, f"{updated} message(s) rejected.")
    reject_messages.short_description = "Reject selected messages"


@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    """Admin interface for CourseCategory model."""
    list_display = ["name_en", "icon", "order", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name_tm", "name_ru", "name_en"]
    ordering = ["order", "name_en"]
    
    fieldsets = (
        (_("Image"), {
            "fields": ("image",)
        }),
        (_("Basic Information"), {
            "fields": ("icon", "order", "is_active")
        }),
        (_("Turkmen"), {
            "fields": ("name_tm", "description_tm")
        }),
        (_("Russian"), {
            "fields": ("name_ru", "description_ru")
        }),
        (_("English"), {
            "fields": ("name_en", "description_en")
        }),
    )


@admin.register(CourseSubCategory)
class CourseSubCategoryAdmin(admin.ModelAdmin):
    """Admin interface for CourseSubCategory model."""
    list_display = ["name_en", "category", "order", "is_active", "created_at"]
    list_filter = ["category", "is_active", "created_at"]
    search_fields = ["name_tm", "name_ru", "name_en", "category__name_en"]
    ordering = ["category", "order", "name_en"]
    
    fieldsets = (
        (_("Image"), {
            "fields": ("image",)
        }),
        (_("Basic Information"), {
            "fields": ("category", "order", "is_active")
        }),
        (_("Turkmen"), {
            "fields": ("name_tm", "description_tm")
        }),
        (_("Russian"), {
            "fields": ("name_ru", "description_ru")
        }),
        (_("English"), {
            "fields": ("name_en", "description_en")
        }),
    )


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """Admin interface for Course model."""
    list_display = ["title_en", "subcategory", "duration_weeks", "price", "discount_price", "is_active", "created_at"]
    list_filter = ["subcategory__category", "subcategory", "is_active", "created_at"]
    search_fields = ["title_tm", "title_ru", "title_en", "subcategory__name_en"]
    ordering = ["subcategory", "title_en"]
    
    fieldsets = (
        (_("Image"), {
            "fields": ("image",)
        }),
        (_("Basic Information"), {
            "fields": ("subcategory", "is_active")
        }),
        (_("Course Details"), {
            "fields": ("duration_weeks", "hours_per_week", "price", "discount_price")
        }),
        (_("Turkmen"), {
            "fields": ("title_tm", "description_tm")
        }),
        (_("Russian"), {
            "fields": ("title_ru", "description_ru")
        }),
        (_("English"), {
            "fields": ("title_en", "description_en")
        }),
    )
