"""
Serializers for student cabinet API.
"""
from rest_framework import serializers
from django.db.models import Avg, Count, Sum
from django.utils import timezone
from datetime import datetime, timedelta
from apps.courses.models import Group, Lesson, Grade, Course
from apps.users.models import User
from apps.payments.models import Payment


class CourseGroupSerializer(serializers.ModelSerializer):
    """Serializer for Group with course information."""
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_description = serializers.CharField(source='course.description', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    students_count = serializers.IntegerField(source='current_students_count', read_only=True)
    
    class Meta:
        model = Group
        fields = [
            'id',
            'name',
            'course_name',
            'course_description',
            'teacher_name',
            'students_count',
            'max_students',
            'start_date',
            'end_date',
            'schedule',
            'is_active',
        ]
    
    def get_teacher_name(self, obj):
        """Get teacher's full name."""
        if obj.teacher:
            return obj.teacher.get_full_name() or obj.teacher.username
        return None


class StudentCourseSerializer(serializers.ModelSerializer):
    """Serializer for student's course with progress and grades."""
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_description = serializers.CharField(source='course.description', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    average_grade = serializers.SerializerMethodField()
    total_lessons = serializers.SerializerMethodField()
    completed_lessons = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    next_lesson = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = [
            'id',
            'name',
            'course_name',
            'course_description',
            'teacher_name',
            'start_date',
            'end_date',
            'schedule',
            'is_active',
            'average_grade',
            'total_lessons',
            'completed_lessons',
            'progress',
            'next_lesson',
            'total_paid',
        ]
    
    def get_teacher_name(self, obj):
        """Get teacher's full name."""
        if obj.teacher:
            return obj.teacher.get_full_name() or obj.teacher.username
        return None
    
    def get_average_grade(self, obj):
        """Calculate average grade for current student."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        student = request.user
        grades = Grade.objects.filter(
            student=student,
            lesson__group=obj
        ).aggregate(avg_grade=Avg('grade'))
        
        avg = grades.get('avg_grade')
        return round(float(avg), 2) if avg else None
    
    def get_total_lessons(self, obj):
        """Get total number of lessons in the group."""
        return obj.lessons.count()
    
    def get_completed_lessons(self, obj):
        """Get number of completed lessons (lessons that have passed)."""
        now = timezone.now()
        return obj.lessons.filter(lesson_date__lt=now).count()
    
    def get_progress(self, obj):
        """Get progress percentage from model property."""
        return obj.progress
    
    def get_next_lesson(self, obj):
        """Get next upcoming lesson."""
        now = timezone.now()
        next_lesson = obj.lessons.filter(
            lesson_date__gt=now
        ).order_by('lesson_date').first()
        
        if next_lesson:
            return {
                'id': next_lesson.id,
                'title': next_lesson.title,
                'date': next_lesson.lesson_date.isoformat(),
            }
        return None
    
    def get_is_active(self, obj):
        """Determine if course is active based on dates and is_active flag."""
        # If manually set to inactive, return False
        if not obj.is_active:
            return False
        
        now = timezone.now().date()
        
        # Check start date
        if obj.start_date:
            if now < obj.start_date:
                return False  # Course hasn't started yet
        
        # Check end date
        if obj.end_date:
            if now > obj.end_date:
                return False  # Course has ended
        
        return True

    def get_total_paid(self, obj):
        """Calculate total paid amount for this group by current student."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        
        total = Payment.objects.filter(
            student=request.user,
            group=obj,
            status=Payment.Status.COMPLETED
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return float(total)


class ScheduleItemSerializer(serializers.ModelSerializer):
    """Serializer for schedule item (lesson)."""
    group = serializers.IntegerField(source='group.id', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    course_name = serializers.CharField(source='group.course.name', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = [
            'id',
            'title',
            'description',
            'lesson_date',
            'duration_minutes',
            'homework',
            'group',
            'group_name',
            'course_name',
            'teacher_name',
        ]
    
    def get_teacher_name(self, obj):
        """Get teacher's full name."""
        if obj.group.teacher:
            return obj.group.teacher.get_full_name() or obj.group.teacher.username
        return None


class TeacherGroupSerializer(serializers.ModelSerializer):
    """Serializer for teacher's group."""
    course_name = serializers.CharField(source='course.name', read_only=True)
    students_count = serializers.IntegerField(source='current_students_count', read_only=True)
    total_lessons = serializers.SerializerMethodField()
    completed_lessons = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    next_lesson = serializers.SerializerMethodField()
    is_active_status = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            'id',
            'name',
            'course_name',
            'start_date',
            'end_date',
            'schedule',
            'is_active',
            'is_active_status',
            'students_count',
            'max_students',
            'total_lessons',
            'completed_lessons',
            'progress',
            'next_lesson',
        ]

    def get_total_lessons(self, obj):
        return obj.lessons.count()

    def get_completed_lessons(self, obj):
        now = timezone.now()
        return obj.lessons.filter(lesson_date__lt=now).count()

    def get_progress(self, obj):
        return obj.progress

    def get_next_lesson(self, obj):
        now = timezone.now()
        next_lesson = obj.lessons.filter(
            lesson_date__gt=now
        ).order_by('lesson_date').first()
        
        if next_lesson:
            return {
                'id': next_lesson.id,
                'title': next_lesson.title,
                'date': next_lesson.lesson_date.isoformat(),
            }
        return None

    def get_is_active_status(self, obj):
        if not obj.is_active:
            return False
        now = timezone.now().date()
        if obj.start_date and now < obj.start_date:
            return False
        if obj.end_date and now > obj.end_date:
            return False
        return True


class GradeDetailSerializer(serializers.ModelSerializer):
    """Serializer for grade with lesson and course information."""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    lesson_date = serializers.DateTimeField(source='lesson.lesson_date', read_only=True)
    course_name = serializers.CharField(source='lesson.group.course.name', read_only=True)
    group_name = serializers.CharField(source='lesson.group.name', read_only=True)
    group_id = serializers.IntegerField(source='lesson.group.id', read_only=True)
    lesson_id = serializers.IntegerField(source='lesson.id', read_only=True)
    student_id = serializers.IntegerField(source='student.id', read_only=True)
    
    class Meta:
        model = Grade
        fields = [
            'id',
            'grade',
            'comment',
            'lesson_title',
            'lesson_date',
            'course_name',
            'group_name',
            'group_id',
            'lesson_id',
            'student_id',
            'created_at',
        ]


class TeacherGradeSerializer(GradeDetailSerializer):
    """Serializer for grades viewed by a teacher, including student name."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta(GradeDetailSerializer.Meta):
        fields = GradeDetailSerializer.Meta.fields + ['student_name']


class CabinetStudentSerializer(serializers.ModelSerializer):
    """Serializer for students in teacher/director cabinet."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    points = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'full_name',
            'email',
            'phone',
            'avatar',
            'points',
            'groups',
        ]

    def get_points(self, obj):
        """Safely get points from student profile."""
        try:
            if hasattr(obj, 'student_profile') and obj.student_profile:
                return obj.student_profile.points
        except Exception:
            pass
        return 0

    def get_groups(self, obj):
        # Only return groups that the teacher (from context) teaches
        request = self.context.get('request')
        groups = obj.student_groups.all()
        if request and request.user.is_teacher:
            groups = groups.filter(teacher=request.user)
        
        return [
            {
                'id': g.id,
                'name': g.name,
                'course_name': g.course.name if g.course else None
            } for g in groups
        ]

