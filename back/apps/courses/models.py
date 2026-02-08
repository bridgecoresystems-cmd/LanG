"""
Course models for Language School Management System.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator


class Course(models.Model):
    """
    Course model representing a language course.
    """
    name = models.CharField(
        max_length=255,
        verbose_name=_("Course Name"),
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
    )
    language = models.CharField(
        max_length=100,
        verbose_name=_("Language"),
        help_text=_("e.g., English, Russian, Turkmen"),
    )
    level = models.CharField(
        max_length=50,
        verbose_name=_("Level"),
        help_text=_("e.g., Beginner, Intermediate, Advanced"),
    )
    duration_months = models.PositiveIntegerField(
        default=3,
        verbose_name=_("Duration (Months)"),
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        verbose_name=_("Price"),
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
        verbose_name = _("Course")
        verbose_name_plural = _("Courses")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["language"]),
            models.Index(fields=["level"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.language} - {self.level})"


class ExamType(models.Model):
    """
    Template for an exam, defining the weight of each component.
    The sum of component weights should be 100.
    """
    name = models.CharField(max_length=255, verbose_name=_("Name"))
    writing_weight = models.PositiveIntegerField(default=25, verbose_name=_("Writing Weight"))
    listening_weight = models.PositiveIntegerField(default=25, verbose_name=_("Listening Weight"))
    reading_weight = models.PositiveIntegerField(default=25, verbose_name=_("Reading Weight"))
    speaking_weight = models.PositiveIntegerField(default=25, verbose_name=_("Speaking Weight"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Exam Type")
        verbose_name_plural = _("Exam Types")

    def __str__(self):
        return f"{self.name} (W:{self.writing_weight}, L:{self.listening_weight}, R:{self.reading_weight}, S:{self.speaking_weight})"


class ExamScheme(models.Model):
    """
    Configuration for a course/group, defining which exams are included and their weights.
    The sum of exam weights should be 100%.
    """
    name = models.CharField(max_length=255, verbose_name=_("Scheme Name"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Exam Scheme")
        verbose_name_plural = _("Exam Schemes")

    def __str__(self):
        return self.name


class ExamSchemeItem(models.Model):
    """
    Intermediate model for ExamScheme to define multiple exams with weights and order.
    """
    scheme = models.ForeignKey(ExamScheme, on_delete=models.CASCADE, related_name="items")
    exam_type = models.ForeignKey(ExamType, on_delete=models.CASCADE)
    weight_percentage = models.PositiveIntegerField(
        verbose_name=_("Weight (%)"),
        help_text=_("How much this exam contributes to the final grade (0-100)")
    )
    order = models.PositiveIntegerField(default=1, verbose_name=_("Order"))

    class Meta:
        verbose_name = _("Exam Scheme Item")
        verbose_name_plural = _("Exam Scheme Items")
        ordering = ["order"]

    def __str__(self):
        return f"{self.scheme.name} - {self.exam_type.name} ({self.weight_percentage}%)"


class Group(models.Model):
    """
    Group model representing a class group of students.
    """
    class TimeSlot(models.TextChoices):
        A = "A", _("08:00 - 11:00")
        B = "B", _("13:00 - 17:00")
        C = "C", _("17:00 - 19:00")
    
    class WeekDays(models.TextChoices):
        MON_WED_FRI = "1", _("Monday, Wednesday, Friday")
        TUE_THU_SAT = "2", _("Tuesday, Thursday, Saturday")
    
    name = models.CharField(
        max_length=255,
        verbose_name=_("Group Name"),
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="groups",
        verbose_name=_("Course"),
    )
    exam_scheme = models.ForeignKey(
        ExamScheme,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="groups",
        verbose_name=_("Exam Scheme"),
    )
    teacher = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="teaching_groups",
        verbose_name=_("Teacher"),
    )
    students = models.ManyToManyField(
        "users.User",
        related_name="student_groups",
        limit_choices_to={"role": "student"},
        blank=True,
        verbose_name=_("Students"),
    )
    max_students = models.PositiveIntegerField(
        default=15,
        verbose_name=_("Maximum Students"),
    )
    time_slot = models.CharField(
        max_length=1,
        choices=TimeSlot.choices,
        blank=True,
        null=True,
        verbose_name=_("Time Slot"),
        help_text=_("A: 08:00-11:00, B: 13:00-17:00, C: 17:00-19:00"),
    )
    week_days = models.CharField(
        max_length=1,
        choices=WeekDays.choices,
        blank=True,
        null=True,
        verbose_name=_("Week Days"),
        help_text=_("1: Monday/Wednesday/Friday, 2: Tuesday/Thursday/Saturday"),
    )
    start_date = models.DateField(
        verbose_name=_("Start Date"),
    )
    end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name=_("End Date"),
    )
    schedule = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Schedule"),
        help_text=_("Schedule in JSON format: {'monday': '10:00-12:00', ...}"),
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
        verbose_name = _("Group")
        verbose_name_plural = _("Groups")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["course"]),
            models.Index(fields=["teacher"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.course.name}"

    @property
    def current_students_count(self):
        """Get current number of students in the group."""
        return self.students.count()

    @property
    def is_full(self):
        """Check if group is full."""
        return self.current_students_count >= self.max_students
    
    @property
    def progress(self):
        """
        Calculate group progress as percentage of lessons passed.
        """
        from django.utils import timezone
        total_lessons = self.lessons.count()
        if total_lessons == 0:
            return 0
        
        passed_lessons = self.lessons.filter(lesson_date__lt=timezone.now()).count()
        return round((passed_lessons / total_lessons) * 100)
    
    def generate_schedule(self):
        """
        Generate lessons schedule based on group settings:
        - start_date and end_date
        - week_days (1: Mon/Wed/Fri, 2: Tue/Thu/Sat)
        - time_slot (A: 08:00-11:00, B: 13:00-17:00, C: 17:00-19:00)
        """
        import logging
        logger = logging.getLogger(__name__)
        
        from datetime import datetime, timedelta
        from django.utils import timezone
        from .models import Lesson
        
        logger.info(f'generate_schedule called for group {self.id}: time_slot={self.time_slot}, week_days={self.week_days}, start_date={self.start_date}, end_date={self.end_date}')
        
        if not self.time_slot or not self.week_days or not self.start_date:
            logger.warning(f'Cannot generate schedule: missing required fields (time_slot={self.time_slot}, week_days={self.week_days}, start_date={self.start_date})')
            return 0
        
        # Map time slots to start times
        time_slot_map = {
            'A': (8, 0),   # 08:00
            'B': (13, 0),  # 13:00
            'C': (17, 0),  # 17:00
        }
        
        # Map week days
        week_days_map = {
            '1': [0, 2, 4],  # Monday, Wednesday, Friday (0, 2, 4)
            '2': [1, 3, 5],  # Tuesday, Thursday, Saturday (1, 3, 5)
        }
        
        start_hour, start_minute = time_slot_map.get(self.time_slot, (8, 0))
        target_weekdays = week_days_map.get(self.week_days, [])
        
        if not target_weekdays:
            return 0
        
        # Calculate duration based on time slot
        duration_map = {
            'A': 180,  # 3 hours (08:00-11:00)
            'B': 240,  # 4 hours (13:00-17:00)
            'C': 120,  # 2 hours (17:00-19:00)
        }
        duration = duration_map.get(self.time_slot, 90)
        
        # Start from start_date
        current_date = self.start_date
        # If no end_date, generate lessons for next 3 months (more reasonable than 1 year)
        if not self.end_date:
            end_date = current_date + timedelta(days=90)  # 3 months
            logger.info(f'No end_date specified, generating lessons for 90 days (until {end_date})')
        else:
            end_date = self.end_date
        
        logger.info(f'Generating lessons from {current_date} to {end_date}, weekdays: {target_weekdays}, time: {start_hour}:{start_minute}')
        
        lessons_created = 0
        lesson_number = 1
        max_iterations = 1000  # Safety limit to avoid infinite loops
        iterations = 0
        
        # Generate lessons for each target weekday between start_date and end_date
        while current_date <= end_date and iterations < max_iterations:
            iterations += 1
            weekday = current_date.weekday()  # 0=Monday, 6=Sunday
            
            if weekday in target_weekdays:
                # Create lesson datetime
                lesson_datetime = timezone.make_aware(
                    datetime.combine(current_date, datetime.min.time().replace(hour=start_hour, minute=start_minute))
                )
                
                # Check if lesson already exists
                existing_lesson = self.lessons.filter(lesson_date=lesson_datetime).first()
                if not existing_lesson:
                    try:
                        Lesson.objects.create(
                            group=self,
                            title=f"Lesson {lesson_number}",
                            lesson_date=lesson_datetime,
                            duration_minutes=duration,
                        )
                        lessons_created += 1
                        logger.info(f'Created lesson {lesson_number}: {lesson_datetime}')
                        lesson_number += 1
                    except Exception as e:
                        logger.error(f'Error creating lesson on {current_date}: {e}')
            
            # Move to next day
            current_date += timedelta(days=1)
        
        logger.info(f'Generated {lessons_created} lessons for group {self.id}')
        return lessons_created


class Lesson(models.Model):
    """
    Lesson model representing a single lesson in a group.
    """
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="lessons",
        verbose_name=_("Group"),
    )
    title = models.CharField(
        max_length=255,
        verbose_name=_("Lesson Title"),
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
    )
    lesson_date = models.DateTimeField(
        verbose_name=_("Lesson Date"),
    )
    duration_minutes = models.PositiveIntegerField(
        default=90,
        verbose_name=_("Duration (Minutes)"),
    )
    homework = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Homework"),
    )
    materials = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Materials"),
        help_text=_("List of material IDs or URLs"),
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
        verbose_name = _("Lesson")
        verbose_name_plural = _("Lessons")
        ordering = ["-lesson_date"]
        indexes = [
            models.Index(fields=["group"]),
            models.Index(fields=["lesson_date"]),
        ]

    def __str__(self):
        return f"{self.title} - {self.group.name} ({self.lesson_date})"


class Grade(models.Model):
    """
    Grade model for student grades/assessments.
    """
    student = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="grades",
        limit_choices_to={"role": "student"},
        verbose_name=_("Student"),
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="grades",
        verbose_name=_("Lesson"),
    )
    grade = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name=_("Grade"),
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
        verbose_name = _("Grade")
        verbose_name_plural = _("Grades")
        ordering = ["-created_at"]
        unique_together = [["student", "lesson"]]
        indexes = [
            models.Index(fields=["student"]),
            models.Index(fields=["lesson"]),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.grade} ({self.lesson.title})"


class ExamGrade(models.Model):
    """
    ExamGrade model for storing exam grades with components (writing, listening, reading, speaking).
    Each student can have up to 4 exams per group.
    """
    student = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="exam_grades",
        limit_choices_to={"role": "student"},
        verbose_name=_("Student"),
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="exam_grades",
        verbose_name=_("Group"),
    )
    exam_scheme_item = models.ForeignKey(
        ExamSchemeItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="grades",
        verbose_name=_("Exam Scheme Item"),
    )
    exam_number = models.PositiveIntegerField(
        choices=[(1, "1"), (2, "2"), (3, "3"), (4, "4")],
        verbose_name=_("Exam Number"),
        help_text=_("Exam number (1-4)"),
    )
    writing = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name=_("Writing"),
        help_text=_("Writing component grade (0-100)"),
    )
    listening = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name=_("Listening"),
        help_text=_("Listening component grade (0-100)"),
    )
    reading = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name=_("Reading"),
        help_text=_("Reading component grade (0-100)"),
    )
    speaking = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name=_("Speaking"),
        help_text=_("Speaking component grade (0-100)"),
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
        verbose_name = _("Exam Grade")
        verbose_name_plural = _("Exam Grades")
        ordering = ["group", "student", "exam_number"]
        unique_together = [["student", "group", "exam_number"], ["student", "group", "exam_scheme_item"]]
        indexes = [
            models.Index(fields=["student", "group"]),
            models.Index(fields=["group", "exam_number"]),
            models.Index(fields=["exam_scheme_item"]),
        ]

    def __str__(self):
        return f"{self.student.username} - Exam {self.exam_number} - {self.group.name}"
    
    def get_total_score(self):
        """Calculate total score for this exam by summing all components."""
        components = [self.writing, self.listening, self.reading, self.speaking]
        return sum(float(c) for c in components if c is not None)
    
    def get_weighted_grade(self):
        """
        Calculate contribution to final grade.
        Formula: total_score * (weight_percentage / 100)
        """
        score = self.get_total_score()
        
        # If we have a scheme item, use its weight
        if self.exam_scheme_item:
            weight = self.exam_scheme_item.weight_percentage / 100.0
            return score * weight
        
        # Fallback to old 20/40 logic if no scheme is set
        if self.exam_number == 4:
            return score * 0.4
        else:
            return score * 0.2

    @staticmethod
    def calculate_student_total_grade(student, group):
        """
        Calculate total grade for a student in a group across all exams.
        Uses the group's ExamScheme if available, otherwise falls back to 20/40 logic.
        """
        exam_grades = ExamGrade.objects.filter(student=student, group=group)
        total = 0.0
        has_any_grade = False
        
        for exam_grade in exam_grades:
            weighted_grade = exam_grade.get_weighted_grade()
            if weighted_grade is not None:
                total += weighted_grade
                has_any_grade = True
        
        return round(total, 2) if has_any_grade else None


class Enrollment(models.Model):
    """
    Enrollment model to track student's participation in a group/course.

    Used for course history: one student can attend many courses,
    and we keep records even after the group is finished.
    """

    class Status(models.TextChoices):
        ACTIVE = "active", _("Active")
        COMPLETED = "completed", _("Completed")
        CANCELLED = "cancelled", _("Cancelled")

    student = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="enrollments",
        limit_choices_to={"role": "student"},
        verbose_name=_("Student"),
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="enrollments",
        verbose_name=_("Group"),
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name=_("Status"),
    )
    start_date = models.DateField(
        blank=True,
        null=True,
        verbose_name=_("Start Date"),
        help_text=_("Date when the student started this course/group"),
    )
    end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name=_("End Date"),
        help_text=_("Date when the student finished this course/group"),
    )
    final_grade = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name=_("Final Grade"),
        help_text=_("Optional final grade for the whole course"),
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
        verbose_name = _("Enrollment")
        verbose_name_plural = _("Enrollments")
        ordering = ["-created_at"]
        unique_together = [["student", "group"]]
        indexes = [
            models.Index(fields=["student"]),
            models.Index(fields=["group"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Enrollment: {self.student.username} -> {self.group.name} ({self.status})"


class Attendance(models.Model):
    """
    Attendance model to track student's presence in a specific lesson.
    """
    student = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="attendance_records",
        limit_choices_to={"role": "student"},
        verbose_name=_("Student"),
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="attendance_records",
        verbose_name=_("Lesson"),
    )
    is_present = models.BooleanField(
        default=False,
        verbose_name=_("Is Present"),
    )
    notes = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Notes"),
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
        verbose_name = _("Attendance")
        verbose_name_plural = _("Attendance Records")
        unique_together = [["student", "lesson"]]
        indexes = [
            models.Index(fields=["student"]),
            models.Index(fields=["lesson"]),
            models.Index(fields=["is_present"]),
        ]

    def __str__(self):
        status = "Present" if self.is_present else "Absent"
        return f"{self.student.username} - {self.lesson.title}: {status}"


class Game(models.Model):
    """
    Game model for educational games associated with a group.
    """

    class GameType(models.TextChoices):
        MATCHING = "matching", _("Matching (Drag & Drop)")
        SPRINT = "sprint", _("True or False Sprint")
        MEMORY = "memory", _("Memory Flip Cards")

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="games",
        verbose_name=_("Group"),
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="games",
        verbose_name=_("Lesson"),
    )
    title = models.CharField(
        max_length=255,
        verbose_name=_("Game Title"),
    )
    game_type = models.CharField(
        max_length=50,
        choices=GameType.choices,
        default=GameType.MATCHING,
        verbose_name=_("Game Type"),
    )
    data = models.JSONField(
        default=list,
        verbose_name=_("Game Data"),
        help_text=_(
            "JSON data containing words and translations: [{'word': 'apple', 'translation': 'alma'}, ...]"
        ),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
    )
    played_by = models.ManyToManyField(
        "users.User",
        related_name="played_games",
        blank=True,
        verbose_name=_("Played By Students"),
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
        verbose_name = _("Game")
        verbose_name_plural = _("Games")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["group"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_game_type_display()}) - {self.group.name}"


class GameAttempt(models.Model):
    """
    Model to record each time a student plays a game.
    """
    game = models.ForeignKey(
        Game,
        on_delete=models.CASCADE,
        related_name="attempts",
        verbose_name=_("Game"),
    )
    student = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="game_attempts",
        verbose_name=_("Student"),
    )
    score = models.PositiveIntegerField(
        verbose_name=_("Score (%)"),
        default=0
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Played At"),
    )

    class Meta:
        verbose_name = _("Game Attempt")
        verbose_name_plural = _("Game Attempts")
        ordering = ["-created_at"]

