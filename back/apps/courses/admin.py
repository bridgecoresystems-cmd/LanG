"""
Admin configuration for courses app.
"""
from django.contrib import admin
from .models import Course, Group, Lesson, Grade, ExamGrade


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """Admin interface for Course model."""
    list_display = ["name", "language", "level", "price", "duration_months", "is_active"]
    list_filter = ["language", "level", "is_active", "created_at"]
    search_fields = ["name", "description", "language"]
    ordering = ["-created_at"]


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    """Admin interface for Group model."""
    list_display = ["name", "course", "teacher", "current_students_count", "max_students", "is_active"]
    list_filter = ["course", "is_active", "start_date"]
    search_fields = ["name", "course__name"]
    filter_horizontal = ["students"]
    readonly_fields = ["current_students_count"]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    """Admin interface for Lesson model."""
    list_display = ["title", "group", "lesson_date", "duration_minutes"]
    list_filter = ["group", "lesson_date"]
    search_fields = ["title", "description", "group__name"]
    ordering = ["-lesson_date"]


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    """Admin interface for Grade model."""
    list_display = ["student", "lesson", "grade", "created_at"]
    list_filter = ["lesson__group", "created_at"]
    search_fields = ["student__username", "lesson__title"]
    ordering = ["-created_at"]


@admin.register(ExamGrade)
class ExamGradeAdmin(admin.ModelAdmin):
    """Admin interface for ExamGrade model."""
    list_display = ["student", "group", "exam_number", "writing", "listening", "reading", "speaking", "created_at"]
    list_filter = ["group", "exam_number", "created_at"]
    search_fields = ["student__username", "group__name"]
    ordering = ["group", "student", "exam_number"]
