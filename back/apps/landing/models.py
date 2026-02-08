"""
Landing page models for Language School Management System.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from PIL import Image
import os
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys


def compress_image(image_field, max_size_mb=0.1, quality=85):
    """
    Сжимает изображение до указанного размера без значительной потери качества.
    max_size_mb: максимальный размер в мегабайтах (по умолчанию 0.1 MB = 100 KB)
    quality: качество JPEG (1-100, чем выше, тем лучше качество)
    """
    if not image_field:
        return None

    try:
        # Если это уже загруженный файл, открываем его напрямую
        if hasattr(image_field, 'read'):
            image_field.seek(0)
            img = Image.open(image_field)
        else:
            img = Image.open(image_field)
    except Exception:
        return None
    
    # Конвертируем RGBA в RGB если нужно (для PNG с прозрачностью)
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    
    # Определяем максимальный размер в байтах
    max_size_bytes = max_size_mb * 1024 * 1024
    
    # Пробуем уменьшить качество, если файл слишком большой
    output = BytesIO()
    current_quality = quality
    
    while True:
        output.seek(0)
        output.truncate(0)
        
        # Сохраняем с текущим качеством
        img.save(output, format='JPEG', quality=current_quality, optimize=True)
        
        # Если размер подходит, выходим
        if output.tell() <= max_size_bytes or current_quality <= 20:
            break
        
        # Уменьшаем качество на 5
        current_quality -= 5
    
    output.seek(0)
    file_size = output.tell()
    output.seek(0)
    
    # Получаем имя файла
    if hasattr(image_field, 'name'):
        original_name = image_field.name.split('.')[0] if '.' in image_field.name else image_field.name
    else:
        original_name = 'compressed_image'
    
    # Создаем новое изображение в памяти
    compressed_image = InMemoryUploadedFile(
        output,
        'ImageField',
        "%s.jpg" % original_name,
        'image/jpeg',
        file_size,
        None
    )
    
    return compressed_image


class News(models.Model):
    """
    News model for landing page with multilingual support.
    """
    # Image field
    image = models.ImageField(
        upload_to="news/images/",
        verbose_name=_("Image"),
        help_text=_("Image will be automatically compressed to ~100KB"),
    )
    
    # Multilingual titles
    title_tm = models.CharField(
        max_length=255,
        verbose_name=_("Title (Turkmen)"),
    )
    title_ru = models.CharField(
        max_length=255,
        verbose_name=_("Title (Russian)"),
    )
    title_en = models.CharField(
        max_length=255,
        verbose_name=_("Title (English)"),
    )
    
    # Multilingual content
    content_tm = models.TextField(
        verbose_name=_("Content (Turkmen)"),
    )
    content_ru = models.TextField(
        verbose_name=_("Content (Russian)"),
    )
    content_en = models.TextField(
        verbose_name=_("Content (English)"),
    )
    
    # Metadata
    views = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Views"),
        help_text=_("Number of times this news has been viewed"),
    )
    is_published = models.BooleanField(
        default=True,
        verbose_name=_("Published"),
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name=_("Featured"),
        help_text=_("Featured news will be shown first"),
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
        verbose_name = _("News")
        verbose_name_plural = _("News")
        ordering = ["-is_featured", "-created_at"]
        indexes = [
            models.Index(fields=["is_published"]),
            models.Index(fields=["is_featured"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.title_en} ({self.created_at.date()})"

    def save(self, *args, **kwargs):
        """Override save to compress image."""
        # Если изображение было загружено
        if self.image and hasattr(self.image, 'file'):
            # Сжимаем изображение до ~100KB
            compressed_image = compress_image(self.image, max_size_mb=0.1, quality=85)
            if compressed_image:
                self.image = compressed_image
        
        super().save(*args, **kwargs)

    def get_title(self, language='tm'):
        """Get title in specified language."""
        lang_map = {
            'tm': 'title_tm',
            'ru': 'title_ru',
            'en': 'title_en'
        }
        return getattr(self, lang_map.get(language, 'title_tm'), '')

    def get_content(self, language='tm'):
        """Get content in specified language."""
        lang_map = {
            'tm': 'content_tm',
            'ru': 'content_ru',
            'en': 'content_en'
        }
        return getattr(self, lang_map.get(language, 'content_tm'), '')

    @property
    def preview_content(self, length=150):
        """Get preview of content (first 150 characters)."""
        return self.content_en[:length] + '...' if len(self.content_en) > length else self.content_en


class ContactMessage(models.Model):
    """
    Contact form messages/feedback from users.
    Requires moderation before being displayed.
    """
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('approved', _('Approved')),
        ('rejected', _('Rejected')),
    ]
    
    name = models.CharField(
        max_length=255,
        verbose_name=_("Name"),
    )
    phone = models.CharField(
        max_length=20,
        verbose_name=_("Phone"),
        help_text=_("Phone number"),
    )
    email = models.EmailField(
        verbose_name=_("Email"),
    )
    message = models.TextField(
        verbose_name=_("Message"),
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name=_("Status"),
        help_text=_("Message status for moderation"),
    )
    likes = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Likes"),
        help_text=_("Number of likes for this message"),
    )
    liked_by = models.ManyToManyField(
        'users.User',
        related_name='liked_messages',
        blank=True,
        verbose_name=_("Liked By"),
        help_text=_("Users who liked this message"),
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
        verbose_name = _("Contact Message")
        verbose_name_plural = _("Contact Messages")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=['status', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.email} ({self.get_status_display()})"


class CourseCategory(models.Model):
    """
    Course categories (languages/subjects) - e.g., English, Russian, Turkmen.
    """
    # Image for category
    image = models.ImageField(
        upload_to="course-categories/images/",
        blank=True,
        null=True,
        verbose_name=_("Image"),
        help_text=_("Category image (will be automatically compressed to ~100KB)"),
    )
    
    # Icon/Emoji for category
    icon = models.CharField(
        max_length=10,
        default='📚',
        verbose_name=_("Icon"),
        help_text=_("Emoji or icon for the category"),
    )
    
    # Multilingual name
    name_tm = models.CharField(
        max_length=255,
        verbose_name=_("Name (Turkmen)"),
    )
    name_ru = models.CharField(
        max_length=255,
        verbose_name=_("Name (Russian)"),
    )
    name_en = models.CharField(
        max_length=255,
        verbose_name=_("Name (English)"),
    )
    
    # Multilingual description
    description_tm = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description (Turkmen)"),
    )
    description_ru = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description (Russian)"),
    )
    description_en = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description (English)"),
    )
    
    # Order for display
    order = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Order"),
        help_text=_("Display order (lower number = higher priority)"),
    )
    
    # Status
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
        verbose_name = _("Course Category")
        verbose_name_plural = _("Course Categories")
        ordering = ["order", "name_en"]
        indexes = [
            models.Index(fields=["is_active", "order"]),
        ]
    
    def __str__(self):
        return self.name_en
    
    def get_name(self, language='tm'):
        """Get name in specified language."""
        lang_map = {
            'tm': 'name_tm',
            'ru': 'name_ru',
            'en': 'name_en'
        }
        return getattr(self, lang_map.get(language, 'name_tm'), '')
    
    def get_description(self, language='tm'):
        """Get description in specified language."""
        lang_map = {
            'tm': 'description_tm',
            'ru': 'description_ru',
            'en': 'description_en'
        }
        return getattr(self, lang_map.get(language, 'description_tm'), '')
    
    def save(self, *args, **kwargs):
        """Override save to compress image."""
        if self.image:
            try:
                compressed_image = compress_image(self.image, max_size_mb=0.1, quality=85)
                if compressed_image:
                    self.image = compressed_image
            except Exception as e:
                # Если сжатие не удалось, сохраняем оригинал
                pass
        super().save(*args, **kwargs)


class CourseSubCategory(models.Model):
    """
    Course subcategories (levels) - e.g., Beginner, Elementary, Intermediate, Advanced.
    Linked to CourseCategory.
    """
    category = models.ForeignKey(
        CourseCategory,
        on_delete=models.CASCADE,
        related_name='subcategories',
        verbose_name=_("Category"),
    )
    
    # Image for subcategory
    image = models.ImageField(
        upload_to="course-subcategories/images/",
        blank=True,
        null=True,
        verbose_name=_("Image"),
        help_text=_("Subcategory image (will be automatically compressed to ~100KB)"),
    )
    
    # Multilingual name
    name_tm = models.CharField(
        max_length=255,
        verbose_name=_("Name (Turkmen)"),
    )
    name_ru = models.CharField(
        max_length=255,
        verbose_name=_("Name (Russian)"),
    )
    name_en = models.CharField(
        max_length=255,
        verbose_name=_("Name (English)"),
    )
    
    # Multilingual description
    description_tm = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description (Turkmen)"),
    )
    description_ru = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description (Russian)"),
    )
    description_en = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description (English)"),
    )
    
    # Order for display
    order = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Order"),
        help_text=_("Display order within category"),
    )
    
    # Status
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
        verbose_name = _("Course SubCategory")
        verbose_name_plural = _("Course SubCategories")
        ordering = ["category", "order", "name_en"]
        indexes = [
            models.Index(fields=["category", "is_active", "order"]),
        ]
    
    def __str__(self):
        return f"{self.category.name_en} - {self.name_en}"
    
    def get_name(self, language='tm'):
        """Get name in specified language."""
        lang_map = {
            'tm': 'name_tm',
            'ru': 'name_ru',
            'en': 'name_en'
        }
        return getattr(self, lang_map.get(language, 'name_tm'), '')
    
    def get_description(self, language='tm'):
        """Get description in specified language."""
        lang_map = {
            'tm': 'description_tm',
            'ru': 'description_ru',
            'en': 'description_en'
        }
        return getattr(self, lang_map.get(language, 'description_tm'), '')
    
    def save(self, *args, **kwargs):
        """Override save to compress image."""
        if self.image:
            try:
                compressed_image = compress_image(self.image, max_size_mb=0.1, quality=85)
                if compressed_image:
                    self.image = compressed_image
            except Exception as e:
                # Если сжатие не удалось, сохраняем оригинал
                pass
        super().save(*args, **kwargs)


class Course(models.Model):
    """
    Individual course linked to a SubCategory.
    Contains detailed information about the course.
    """
    subcategory = models.ForeignKey(
        CourseSubCategory,
        on_delete=models.CASCADE,
        related_name='courses',
        verbose_name=_("SubCategory"),
    )
    
    # Image for course
    image = models.ImageField(
        upload_to="courses/images/",
        blank=True,
        null=True,
        verbose_name=_("Image"),
        help_text=_("Course image (will be automatically compressed to ~100KB)"),
    )
    
    # Multilingual title
    title_tm = models.CharField(
        max_length=255,
        verbose_name=_("Title (Turkmen)"),
    )
    title_ru = models.CharField(
        max_length=255,
        verbose_name=_("Title (Russian)"),
    )
    title_en = models.CharField(
        max_length=255,
        verbose_name=_("Title (English)"),
    )
    
    # Multilingual description
    description_tm = models.TextField(
        verbose_name=_("Description (Turkmen)"),
    )
    description_ru = models.TextField(
        verbose_name=_("Description (Russian)"),
    )
    description_en = models.TextField(
        verbose_name=_("Description (English)"),
    )
    
    # Course details
    duration_weeks = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Duration (Weeks)"),
        help_text=_("Course duration in weeks"),
    )
    hours_per_week = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Hours per Week"),
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        verbose_name=_("Price"),
        help_text=_("Course price in Gems"),
    )
    discount_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name=_("Discount Price"),
        help_text=_("Discounted price in Gems (will be shown crossed out)"),
    )
    
    # Status
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
        verbose_name = _("Course")
        verbose_name_plural = _("Courses")
        ordering = ["subcategory", "title_en"]
        indexes = [
            models.Index(fields=["subcategory", "is_active"]),
        ]
    
    def __str__(self):
        return f"{self.subcategory} - {self.title_en}"
    
    def get_title(self, language='tm'):
        """Get title in specified language."""
        lang_map = {
            'tm': 'title_tm',
            'ru': 'title_ru',
            'en': 'title_en'
        }
        return getattr(self, lang_map.get(language, 'title_tm'), '')
    
    def get_description(self, language='tm'):
        """Get description in specified language."""
        lang_map = {
            'tm': 'description_tm',
            'ru': 'description_ru',
            'en': 'description_en'
        }
        return getattr(self, lang_map.get(language, 'description_tm'), '')
    
    @property
    def category(self):
        """Get parent category."""
        return self.subcategory.category
    
    def save(self, *args, **kwargs):
        """Override save to compress image."""
        if self.image:
            try:
                compressed_image = compress_image(self.image, max_size_mb=0.1, quality=85)
                if compressed_image:
                    self.image = compressed_image
            except Exception as e:
                # Если сжатие не удалось, сохраняем оригинал
                pass
        super().save(*args, **kwargs)

class LeaderboardCarousel(models.Model):
    """
    Leaderboard carousel slots for the landing page.
    Admin can choose a course and an exam type to show top students.
    """
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='leaderboard_slots',
        verbose_name=_("Course"),
    )
    exam_type = models.ForeignKey(
        'courses.ExamType',
        on_delete=models.CASCADE,
        related_name='leaderboard_slots',
        verbose_name=_("Exam Type"),
    )
    title_tm = models.CharField(max_length=255, verbose_name=_("Title (Turkmen)"), blank=True)
    title_ru = models.CharField(max_length=255, verbose_name=_("Title (Russian)"), blank=True)
    title_en = models.CharField(max_length=255, verbose_name=_("Title (English)"), blank=True)
    
    is_active = models.BooleanField(default=True, verbose_name=_("Active"))
    order = models.PositiveIntegerField(default=0, verbose_name=_("Order"))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Leaderboard Carousel")
        verbose_name_plural = _("Leaderboard Carousels")
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"{self.course.name} - {self.exam_type.name}"

    def get_title(self, language='tm'):
        """Get title in specified language."""
        lang_map = {
            'tm': 'title_tm',
            'ru': 'title_ru',
            'en': 'title_en'
        }
        title = getattr(self, lang_map.get(language, 'title_tm'), '')
        if not title:
            # Fallback if title is empty
            return f"{self.course.name} - {self.exam_type.name}"
        return title
