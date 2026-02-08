"""
User models for Language School Management System.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Custom User model with roles for language school.
    Roles: student, teacher, director, admin, head_teacher, merchant
    """

    class Role(models.TextChoices):
        STUDENT = "student", _("Student")
        TEACHER = "teacher", _("Teacher")
        DIRECTOR = "director", _("Director")
        ADMIN = "admin", _("Admin")
        HEAD_TEACHER = "head_teacher", _("Head Teacher")
        MERCHANT = "merchant", _("Merchant")

    class Gender(models.TextChoices):
        BOY = "boy", _("Boy")
        GIRL = "girl", _("Girl")

    # Additional fields
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
        verbose_name=_("Role"),
    )
    gender = models.CharField(
        max_length=10,
        choices=Gender.choices,
        blank=True,
        null=True,
        verbose_name=_("Gender"),
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name=_("Phone Number"),
    )
    avatar = models.ImageField(
        upload_to="avatars/",
        blank=True,
        null=True,
        verbose_name=_("Avatar"),
    )
    date_of_birth = models.DateField(
        blank=True,
        null=True,
        verbose_name=_("Date of Birth"),
    )
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Address"),
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At"),
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Updated At"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Active"),
        help_text=_("Designates whether this user should be treated as active."),
    )

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["role"]),
            models.Index(fields=["email"]),
            models.Index(fields=["username"]),
        ]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_student(self):
        """Check if user is a student."""
        return self.role == self.Role.STUDENT

    @property
    def is_teacher(self):
        """Check if user is a teacher."""
        return self.role == self.Role.TEACHER

    @property
    def is_director(self):
        """Check if user is a director."""
        return self.role == self.Role.DIRECTOR

    @property
    def is_admin_user(self):
        """Check if user is an admin."""
        return self.role == self.Role.ADMIN or self.is_superuser
    
    @property
    def is_head_teacher(self):
        """Check if user is a head teacher."""
        return self.role == self.Role.HEAD_TEACHER
    
    @property
    def is_merchant(self):
        """Check if user is a merchant."""
        return self.role == self.Role.MERCHANT


class StudentProfile(models.Model):
    """
    Extended profile for students.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile",
        verbose_name=_("User"),
    )
    parent1_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Parent 1 Name"),
    )
    parent1_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name=_("Parent 1 Phone"),
    )
    parent2_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Parent 2 Name"),
    )
    parent2_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name=_("Parent 2 Phone"),
    )
    points = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Activity Points"),
        help_text=_("Points for student activities"),
    )
    rfid_uid = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        unique=True,
        verbose_name=_("RFID UID"),
        help_text=_("Unique identifier from RFID bracelet"),
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Notes"),
    )
    # Legacy fields for backward compatibility
    parent_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Parent Name (Legacy)"),
        help_text=_("Deprecated: Use parent1_name instead"),
    )
    parent_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name=_("Parent Phone (Legacy)"),
        help_text=_("Deprecated: Use parent1_phone instead"),
    )

    class Meta:
        verbose_name = _("Student Profile")
        verbose_name_plural = _("Student Profiles")

    def __str__(self):
        return f"Student Profile: {self.user.username}"


class TeacherProfile(models.Model):
    """
    Extended profile for teachers.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="teacher_profile",
        verbose_name=_("User"),
    )
    # Multilingual specialization fields
    specialization_tm = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Specialization (Turkmen)"),
    )
    specialization_ru = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Specialization (Russian)"),
    )
    specialization_en = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Specialization (English)"),
    )
    # Legacy field for backward compatibility
    specialization = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Specialization (Legacy)"),
        help_text=_("Deprecated: Use specialization_tm/ru/en instead"),
    )
    experience_years = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Experience (Years)"),
    )
    # Multilingual biography fields
    bio_tm = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Biography (Turkmen)"),
    )
    bio_ru = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Biography (Russian)"),
    )
    bio_en = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Biography (English)"),
    )
    # Legacy field for backward compatibility
    bio = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Biography (Legacy)"),
        help_text=_("Deprecated: Use bio_tm/ru/en instead"),
    )
    hire_date = models.DateField(
        blank=True,
        null=True,
        verbose_name=_("Hire Date"),
    )
    views = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Views"),
        help_text=_("Number of profile views"),
    )
    likes = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Likes"),
        help_text=_("Number of likes for this teacher"),
    )
    liked_by = models.ManyToManyField(
        User,
        related_name='liked_teachers',
        blank=True,
        verbose_name=_("Liked By"),
        help_text=_("Users who liked this teacher profile"),
    )
    video = models.FileField(
        upload_to="teacher_videos/",
        blank=True,
        null=True,
        verbose_name=_("Teaching Video"),
        help_text=_("Video showing how the teacher teaches (3-5 minutes)"),
    )

    class Meta:
        verbose_name = _("Teacher Profile")
        verbose_name_plural = _("Teacher Profiles")

    def __str__(self):
        return f"Teacher Profile: {self.user.username}"
