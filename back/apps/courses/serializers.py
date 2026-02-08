"""
Serializers for courses app.
"""
from rest_framework import serializers
from django.db.models import Avg, Count, Sum
from django.utils import timezone
from .models import Course, Group, Lesson, Grade, ExamGrade, Attendance, Game, ExamType, ExamScheme, ExamSchemeItem
from apps.users.models import User
from apps.payments.models import Payment


class ExamTypeSerializer(serializers.ModelSerializer):
    """Serializer for ExamType model."""
    class Meta:
        model = ExamType
        fields = '__all__'


class ExamSchemeItemSerializer(serializers.ModelSerializer):
    """Serializer for ExamSchemeItem model."""
    exam_type_name = serializers.CharField(source='exam_type.name', read_only=True)
    writing_weight = serializers.IntegerField(source='exam_type.writing_weight', read_only=True)
    listening_weight = serializers.IntegerField(source='exam_type.listening_weight', read_only=True)
    reading_weight = serializers.IntegerField(source='exam_type.reading_weight', read_only=True)
    speaking_weight = serializers.IntegerField(source='exam_type.speaking_weight', read_only=True)
    
    class Meta:
        model = ExamSchemeItem
        fields = [
            'id', 'scheme', 'exam_type', 'exam_type_name', 
            'weight_percentage', 'order',
            'writing_weight', 'listening_weight', 'reading_weight', 'speaking_weight'
        ]


class ExamSchemeSerializer(serializers.ModelSerializer):
    """Serializer for ExamScheme model."""
    items = ExamSchemeItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = ExamScheme
        fields = ['id', 'name', 'items', 'created_at', 'updated_at']


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance model."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    lesson_date = serializers.DateTimeField(source='lesson.lesson_date', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id',
            'student',
            'student_id',
            'student_name',
            'student_username',
            'lesson',
            'lesson_id',
            'lesson_title',
            'lesson_date',
            'is_present',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class AttendanceUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating attendance."""
    class Meta:
        model = Attendance
        fields = ['is_present', 'notes']


class GroupAttendanceMatrixSerializer(serializers.Serializer):
    """Serializer for group attendance matrix (for teacher cabinet)."""
    group_id = serializers.IntegerField()
    group_name = serializers.CharField()
    course_name = serializers.CharField()
    students = serializers.ListField(
        child=serializers.DictField()
    )
    lessons = serializers.ListField(
        child=serializers.DictField()
    )
    attendance = serializers.ListField(
        child=serializers.DictField()
    )


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model."""
    groups_count = serializers.SerializerMethodField()
    active_groups_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id',
            'name',
            'description',
            'language',
            'level',
            'duration_months',
            'price',
            'is_active',
            'groups_count',
            'active_groups_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_groups_count(self, obj):
        """Get total number of groups for this course."""
        return obj.groups.count()
    
    def get_active_groups_count(self, obj):
        """Get number of active groups for this course."""
        return obj.groups.filter(is_active=True).count()


class SimpleCourseSerializer(serializers.ModelSerializer):
    """Simple serializer for Course model without price (for head teacher)."""
    groups_count = serializers.SerializerMethodField()
    active_groups_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id',
            'name',
            'description',
            'language',
            'level',
            'duration_months',
            'is_active',
            'groups_count',
            'active_groups_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_groups_count(self, obj):
        """Get total number of groups for this course."""
        return obj.groups.count()
    
    def get_active_groups_count(self, obj):
        """Get number of active groups for this course."""
        return obj.groups.filter(is_active=True).count()
    
    def create(self, validated_data):
        """Create course with default price = 0."""
        validated_data['price'] = 0
        return super().create(validated_data)


class GroupSerializer(serializers.ModelSerializer):
    """Serializer for Group model."""
    course_name = serializers.CharField(source='course.name', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    teacher_id = serializers.IntegerField(source='teacher.id', read_only=True)
    exam_scheme_name = serializers.CharField(source='exam_scheme.name', read_only=True)
    exam_scheme_details = ExamSchemeSerializer(source='exam_scheme', read_only=True)
    students_count = serializers.IntegerField(source='current_students_count', read_only=True)
    students = serializers.SerializerMethodField()
    lessons_count = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    time_slot_display = serializers.CharField(source='get_time_slot_display', read_only=True)
    week_days_display = serializers.CharField(source='get_week_days_display', read_only=True)
    
    class Meta:
        model = Group
        fields = [
            'id',
            'name',
            'course',
            'course_name',
            'teacher',
            'teacher_id',
            'teacher_name',
            'exam_scheme',
            'exam_scheme_name',
            'exam_scheme_details',
            'students',
            'students_count',
            'max_students',
            'time_slot',
            'time_slot_display',
            'week_days',
            'week_days_display',
            'start_date',
            'end_date',
            'schedule',
            'is_active',
            'lessons_count',
            'progress',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate_time_slot(self, value):
        """Validate time_slot value."""
        if value and value not in ['A', 'B', 'C']:
            raise serializers.ValidationError("Time slot must be A, B, or C")
        return value
    
    def validate_week_days(self, value):
        """Validate week_days value."""
        if value and value not in ['1', '2']:
            raise serializers.ValidationError("Week days must be 1 or 2")
        return value
    
    def validate(self, attrs):
        """Validate required fields for head teacher."""
        # For head teacher, time_slot and week_days are required
        if not attrs.get('time_slot'):
            raise serializers.ValidationError({
                'time_slot': 'Time slot is required.'
            })
        if not attrs.get('week_days'):
            raise serializers.ValidationError({
                'week_days': 'Week days is required.'
            })
        
        # Validate teacher exists and is a teacher (teacher is already a User instance from ForeignKey)
        teacher = attrs.get('teacher')
        if teacher:
            if not hasattr(teacher, 'role') or teacher.role != User.Role.TEACHER:
                raise serializers.ValidationError({
                    'teacher': 'Selected user must be a teacher.'
                })
        
        return attrs
    
    def get_teacher_name(self, obj):
        """Get teacher's full name."""
        if obj.teacher:
            return obj.teacher.get_full_name() or obj.teacher.username
        return None
    
    def get_students(self, obj):
        """Get list of students in the group with payment info."""
        students = obj.students.all()
        result = []
        for student in students:
            # Calculate total paid for this group
            total_paid = Payment.objects.filter(
                student=student,
                group=obj,
                status=Payment.Status.COMPLETED
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            result.append({
                'id': student.id,
                'username': student.username,
                'full_name': student.get_full_name() or student.username,
                'email': student.email,
                'gender': getattr(student, 'gender', None),
                'total_paid': float(total_paid)
            })
        return result
    
    def get_lessons_count(self, obj):
        """Get total number of lessons in the group."""
        return obj.lessons.count()

    def get_progress(self, obj):
        """Get group progress percentage."""
        return obj.progress


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for Lesson model."""
    group_name = serializers.CharField(source='group.name', read_only=True)
    group_id = serializers.IntegerField(source='group.id', read_only=True)
    course_name = serializers.CharField(source='group.course.name', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    grades_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = [
            'id',
            'group',
            'group_id',
            'group_name',
            'course_name',
            'title',
            'description',
            'lesson_date',
            'duration_minutes',
            'homework',
            'materials',
            'teacher_name',
            'grades_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_teacher_name(self, obj):
        """Get teacher's full name."""
        if obj.group.teacher:
            return obj.group.teacher.get_full_name() or obj.group.teacher.username
        return None
    
    def get_grades_count(self, obj):
        """Get number of grades for this lesson."""
        return obj.grades.count()


class GradeSerializer(serializers.ModelSerializer):
    """Serializer for Grade model."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_id = serializers.IntegerField(source='student.id', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    lesson_id = serializers.IntegerField(source='lesson.id', read_only=True)
    lesson_date = serializers.DateTimeField(source='lesson.lesson_date', read_only=True)
    group_name = serializers.CharField(source='lesson.group.name', read_only=True)
    group_id = serializers.IntegerField(source='lesson.group.id', read_only=True)
    course_name = serializers.CharField(source='lesson.group.course.name', read_only=True)
    
    class Meta:
        model = Grade
        fields = [
            'id',
            'student',
            'student_id',
            'student_name',
            'student_username',
            'lesson',
            'lesson_id',
            'lesson_title',
            'lesson_date',
            'group_name',
            'group_id',
            'course_name',
            'grade',
            'comment',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class GradeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating grades (used by teachers)."""
    
    class Meta:
        model = Grade
        fields = [
            'id',
            'student',
            'lesson',
            'grade',
            'comment',
        ]
    
    def validate(self, attrs):
        """Validate that student is in the lesson's group."""
        student = attrs.get('student')
        lesson = attrs.get('lesson')
        
        if student and lesson:
            # Check if student is in the group
            if not lesson.group.students.filter(id=student.id).exists():
                raise serializers.ValidationError(
                    "Student is not enrolled in this group."
                )
            
            # Check if student role is correct
            if not student.is_student:
                raise serializers.ValidationError(
                    "Selected user is not a student."
                )
        
        return attrs
    
    def validate_grade(self, value):
        """Validate grade value."""
        if value < 0 or value > 100:
            raise serializers.ValidationError(
                "Grade must be between 0 and 100."
            )
        return value


class ExamGradeSerializer(serializers.ModelSerializer):
    """Serializer for ExamGrade model."""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.IntegerField(source='student.id', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    group_id = serializers.IntegerField(source='group.id', read_only=True)
    exam_scheme_item_name = serializers.CharField(source='exam_scheme_item.exam_type.name', read_only=True)
    total_score = serializers.SerializerMethodField()
    weighted_grade = serializers.SerializerMethodField()
    
    class Meta:
        model = ExamGrade
        fields = [
            'id',
            'student',
            'student_id',
            'student_name',
            'group',
            'group_id',
            'group_name',
            'exam_scheme_item',
            'exam_scheme_item_name',
            'exam_number',
            'writing',
            'listening',
            'reading',
            'speaking',
            'total_score',
            'weighted_grade',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_total_score(self, obj):
        """Get sum of all components."""
        return obj.get_total_score()
    
    def get_weighted_grade(self, obj):
        """Get weighted contribution to final grade."""
        grade = obj.get_weighted_grade()
        return round(float(grade), 2) if grade is not None else None


class ExamGradeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating exam grades."""
    
    class Meta:
        model = ExamGrade
        fields = [
            'id',
            'student',
            'group',
            'exam_scheme_item',
            'exam_number',
            'writing',
            'listening',
            'reading',
            'speaking',
        ]
    
    def validate(self, attrs):
        """Validate that student is in the group and components are valid."""
        student = attrs.get('student')
        group = attrs.get('group')
        exam_scheme_item = attrs.get('exam_scheme_item')
        
        if student and group:
            # Check if student is in the group
            if not group.students.filter(id=student.id).exists():
                raise serializers.ValidationError(
                    "Student is not enrolled in this group."
                )
            
            # Check if student role is correct
            if not student.is_student:
                raise serializers.ValidationError(
                    "Selected user is not a student."
                )
        
        # Validate component values (0-100)
        components = ['writing', 'listening', 'reading', 'speaking']
        for component in components:
            value = attrs.get(component)
            if value is not None and (value < 0 or value > 100):
                raise serializers.ValidationError(
                    f"{component.capitalize()} must be between 0 and 100."
                )
        
        # If scheme item is provided, validate component scores against its weights
        if exam_scheme_item:
            exam_type = exam_scheme_item.exam_type
            if attrs.get('writing') and attrs.get('writing') > exam_type.writing_weight:
                raise serializers.ValidationError(f"Writing score cannot exceed {exam_type.writing_weight}")
            if attrs.get('listening') and attrs.get('listening') > exam_type.listening_weight:
                raise serializers.ValidationError(f"Listening score cannot exceed {exam_type.listening_weight}")
            if attrs.get('reading') and attrs.get('reading') > exam_type.reading_weight:
                raise serializers.ValidationError(f"Reading score cannot exceed {exam_type.reading_weight}")
            if attrs.get('speaking') and attrs.get('speaking') > exam_type.speaking_weight:
                raise serializers.ValidationError(f"Speaking score cannot exceed {exam_type.speaking_weight}")
        
        return attrs


class ExamGradesBulkSerializer(serializers.Serializer):
    """Serializer for bulk updating exam grades."""
    student_id = serializers.IntegerField()
    group_id = serializers.IntegerField()
    exams = serializers.ListField(
        child=serializers.DictField(
            child=serializers.DictField(
                child=serializers.DecimalField(
                    max_digits=5,
                    decimal_places=2,
                    allow_null=True,
                    required=False
                )
            )
        )
    )
    
    def validate(self, attrs):
        """Validate bulk update data structure."""
        exams = attrs.get('exams', [])
        if len(exams) != 4:
            raise serializers.ValidationError(
                "Exactly 4 exams are required."
            )
        
        for exam_num, exam_data in enumerate(exams, start=1):
            if not isinstance(exam_data, dict):
                raise serializers.ValidationError(
                    f"Exam {exam_num} must be a dictionary."
                )
            
            valid_components = ['writing', 'listening', 'reading', 'speaking']
            for component in exam_data.keys():
                if component not in valid_components:
                    raise serializers.ValidationError(
                        f"Invalid component: {component}. Valid components are: {valid_components}"
                    )
                
                value = exam_data[component]
                if value is not None and (value < 0 or value > 100):
                    raise serializers.ValidationError(
                        f"{component} must be between 0 and 100."
                    )
        
        return attrs


class GameSerializer(serializers.ModelSerializer):
    """Serializer for Game model."""
    group_name = serializers.CharField(source='group.name', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    played_count = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()
    play_percentage = serializers.SerializerMethodField()
    is_played = serializers.SerializerMethodField()
    student_stats = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            'id',
            'group',
            'group_name',
            'lesson',
            'lesson_title',
            'title',
            'game_type',
            'data',
            'is_active',
            'played_count',
            'total_students',
            'play_percentage',
            'is_played',
            'student_stats',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'played_count', 'total_students', 'play_percentage', 'is_played', 'student_stats']

    def get_played_count(self, obj):
        return obj.played_by.count()

    def get_total_students(self, obj):
        return obj.group.students.count()

    def get_play_percentage(self, obj):
        total = obj.group.students.count()
        if total == 0:
            return 0
        return round((obj.played_by.count() / total) * 100)
    
    def get_is_played(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.played_by.filter(id=request.user.id).exists()
        return False

    def get_student_stats(self, obj):
        """Get stats for each student in the group for this game."""
        # Force a fresh query for students to avoid any caching issues
        students = obj.group.students.all().order_by('first_name', 'last_name')
        stats = []
        
        # Get all attempts for this game once to avoid N+1 in this loop
        all_attempts = list(obj.attempts.all())
        
        for student in students:
            student_attempts = [a for a in all_attempts if a.student_id == student.id]
            count = len(student_attempts)
            
            if count > 0:
                best_score = max(a.score for a in student_attempts)
            else:
                best_score = 0
                
            stats.append({
                'id': student.id,
                'full_name': student.get_full_name() or student.username,
                'username': student.username,
                'attempts_count': count,
                'best_score': round(float(best_score), 1),
                'is_played': count > 0
            })
        return stats


class AttendanceBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating attendance."""
    group_id = serializers.IntegerField()
    attendance_data = serializers.DictField(
        child=serializers.DictField()
    )

