"""
Admin configuration for users app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, StudentProfile, TeacherProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model."""
    list_display = ["username", "email", "role", "first_name", "last_name", "is_active", "created_at"]
    list_filter = ["role", "is_active", "is_staff", "is_superuser", "created_at"]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering = ["-created_at"]
    
    fieldsets = BaseUserAdmin.fieldsets + (
        (_("Additional Info"), {
            "fields": ("role", "phone", "avatar", "date_of_birth", "address")
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (_("Additional Info"), {
            "fields": ("role", "phone", "email")
        }),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    """Admin interface for StudentProfile model."""
    list_display = ["get_username", "get_email", "get_full_name", "parent1_name", "parent1_phone", "parent2_name", "parent2_phone", "points"]
    search_fields = [
        "user__username", 
        "user__email", 
        "user__first_name", 
        "user__last_name",
        "parent1_name", 
        "parent1_phone",
        "parent2_name",
        "parent2_phone"
    ]
    list_filter = ["user__is_active", "user__created_at"]
    ordering = ["-user__created_at"]
    
    fieldsets = (
        (_("User Information"), {
            "fields": ("user",)
        }),
        (_("Parent 1 Information"), {
            "fields": ("parent1_name", "parent1_phone")
        }),
        (_("Parent 2 Information"), {
            "fields": ("parent2_name", "parent2_phone")
        }),
        (_("Student Information"), {
            "fields": ("points", "notes")
        }),
        (_("Legacy Fields (Deprecated)"), {
            "fields": ("parent_name", "parent_phone"),
            "classes": ("collapse",)
        }),
    )
    
    readonly_fields = ["user"]
    
    def get_username(self, obj):
        """Get username from related user."""
        return obj.user.username if obj.user else "-"
    get_username.short_description = _("Username")
    get_username.admin_order_field = "user__username"
    
    def get_email(self, obj):
        """Get email from related user."""
        return obj.user.email if obj.user else "-"
    get_email.short_description = _("Email")
    get_email.admin_order_field = "user__email"
    
    def get_full_name(self, obj):
        """Get full name from related user."""
        return obj.user.get_full_name() if obj.user else "-"
    get_full_name.short_description = _("Full Name")
    get_full_name.admin_order_field = "user__first_name"


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    """Admin interface for TeacherProfile model."""
    list_display = ["get_username", "get_email", "get_full_name", "specialization_tm", "experience_years", "views", "likes", "hire_date", "has_video"]
    search_fields = [
        "user__username", 
        "user__email", 
        "user__first_name",
        "user__last_name",
        "specialization_tm", 
        "specialization_ru", 
        "specialization_en"
    ]
    list_filter = ["hire_date", "user__is_active", "user__created_at"]
    ordering = ["-user__created_at"]
    
    fieldsets = (
        (_("Basic Information"), {
            "fields": ("user", "experience_years", "hire_date", "video")
        }),
        (_("Specialization - Turkmen"), {
            "fields": ("specialization_tm",)
        }),
        (_("Specialization - Russian"), {
            "fields": ("specialization_ru",)
        }),
        (_("Specialization - English"), {
            "fields": ("specialization_en",)
        }),
        (_("Biography - Turkmen"), {
            "fields": ("bio_tm",)
        }),
        (_("Biography - Russian"), {
            "fields": ("bio_ru",)
        }),
        (_("Biography - English"), {
            "fields": ("bio_en",)
        }),
        (_("Statistics"), {
            "fields": ("views", "likes")
        }),
        (_("Legacy Fields (Deprecated)"), {
            "fields": ("specialization", "bio"),
            "classes": ("collapse",)
        }),
    )
    
    def get_username(self, obj):
        """Get username from related user."""
        return obj.user.username if obj.user else "-"
    get_username.short_description = _("Username")
    get_username.admin_order_field = "user__username"
    
    def get_email(self, obj):
        """Get email from related user."""
        return obj.user.email if obj.user else "-"
    get_email.short_description = _("Email")
    get_email.admin_order_field = "user__email"
    
    def get_full_name(self, obj):
        """Get full name from related user."""
        return obj.user.get_full_name() if obj.user else "-"
    get_full_name.short_description = _("Full Name")
    get_full_name.admin_order_field = "user__first_name"
    
    def has_video(self, obj):
        """Check if teacher has video."""
        return bool(obj.video)
    has_video.boolean = True
    has_video.short_description = _("Has Video")
