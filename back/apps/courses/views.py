"""
Views for courses app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, Avg, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Course, Group, Lesson, Grade, ExamGrade, Attendance, Game, ExamType, ExamScheme, ExamSchemeItem
from apps.users.models import User
from .serializers import (
    CourseSerializer,
    GroupSerializer,
    LessonSerializer,
    GradeSerializer,
    GradeCreateUpdateSerializer,
    ExamGradeSerializer,
    ExamGradeCreateUpdateSerializer,
    ExamGradesBulkSerializer,
    AttendanceSerializer,
    AttendanceUpdateSerializer,
    GroupAttendanceMatrixSerializer,
    GameSerializer,
    ExamTypeSerializer,
    ExamSchemeSerializer,
    ExamSchemeItemSerializer,
)
from .permissions import (
    IsTeacherOrAdmin,
    IsGroupTeacherOrAdmin,
    IsStudentOrAdmin,
    IsOwnerOrAdmin,
)


class ExamTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for ExamType model."""
    queryset = ExamType.objects.all()
    serializer_class = ExamTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]


class ExamSchemeViewSet(viewsets.ModelViewSet):
    """ViewSet for ExamScheme model."""
    queryset = ExamScheme.objects.all()
    serializer_class = ExamSchemeSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]


class ExamSchemeItemViewSet(viewsets.ModelViewSet):
    """ViewSet for ExamSchemeItem model."""
    queryset = ExamSchemeItem.objects.all()
    serializer_class = ExamSchemeItemSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]


class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Course model.
    CRUD operations for courses.
    Only admins and directors can create/update/delete.
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Allow read-only for authenticated users,
        full access for admins/directors.
        """
        if self.action in ['list', 'retrieve', 'leaderboard']:
            return [AllowAny()]
        return [IsTeacherOrAdmin()]
    
    def get_queryset(self):
        """Filter courses based on query parameters."""
        queryset = Course.objects.all()
        
        # Filter by language
        language = self.request.query_params.get('language')
        if language:
            queryset = queryset.filter(language=language)
        
        # Filter by level
        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-created_at')

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def leaderboard(self, request, pk=None):
        """
        Get TOP 10 students for the latest exam across all groups of this course.
        """
        course = self.get_object()
        groups = Group.objects.filter(course=course, is_active=True)
        
        if not groups.exists():
            return Response({'course_name': course.name, 'leaderboard': [], 'exam_info': None})

        # 1. Find the latest ExamSchemeItem (highest order) that has at least one grade
        latest_grade = ExamGrade.objects.filter(
            group__in=groups,
            exam_scheme_item__isnull=False
        ).select_related('exam_scheme_item', 'exam_scheme_item__exam_type').order_by('-exam_scheme_item__order').first()

        if not latest_grade:
            # Fallback for old system or if no grades yet
            latest_grade = ExamGrade.objects.filter(
                group__in=groups
            ).order_by('-exam_number').first()
            
            if not latest_grade:
                return Response({'course_name': course.name, 'leaderboard': [], 'exam_info': None})
            
            latest_exam_id = None
            latest_exam_number = latest_grade.exam_number
            latest_exam_name = f"Exam {latest_exam_number}"
        else:
            latest_exam_id = latest_grade.exam_scheme_item.id
            latest_exam_number = latest_grade.exam_scheme_item.order
            latest_exam_name = latest_grade.exam_scheme_item.exam_type.name

        # 2. Get grades for this specific exam
        if latest_exam_id:
            grades = ExamGrade.objects.filter(
                group__in=groups,
                exam_scheme_item_id=latest_exam_id
            )
        else:
            grades = ExamGrade.objects.filter(
                group__in=groups,
                exam_number=latest_exam_number
            )

        # 3. Aggregate and sort
        leaderboard_data = []
        for grade in grades.select_related('student', 'group'):
            total_score = grade.get_total_score()
            if total_score > 0:
                leaderboard_data.append({
                    'student_name': grade.student.get_full_name() or grade.student.username,
                    'group_name': grade.group.name,
                    'score': total_score,
                    'avatar_url': request.build_absolute_uri(grade.student.avatar.url) if grade.student.avatar else None,
                    'gender': grade.student.gender,
                })
        
        # Sort by score DESC
        leaderboard_data.sort(key=lambda x: x['score'], reverse=True)
        
        # Take Top 10
        top_10 = leaderboard_data[:10]
        
        return Response({
            'course_name': course.name,
            'exam_info': {
                'name': latest_exam_name,
                'number': latest_exam_number,
            },
            'leaderboard': top_10
        })


class GroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Group model.
    Teachers can view their own groups.
    Admins/directors have full access.
    """
    queryset = Group.objects.select_related('course', 'teacher').prefetch_related('students')
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter groups based on user role."""
        queryset = Group.objects.select_related('course', 'teacher').prefetch_related('students')
        
        # Teachers see only their groups
        if self.request.user.is_teacher and not (self.request.user.is_admin_user or self.request.user.is_superuser):
            queryset = queryset.filter(teacher=self.request.user)
        
        # Students see only groups they're enrolled in
        elif self.request.user.is_student:
            queryset = queryset.filter(students=self.request.user)
        
        # Filter by course
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by teacher
        teacher_id = self.request.query_params.get('teacher_id')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        
        # Filter by student
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(students__id=student_id)
        
        return queryset.order_by('-created_at')
    
    def get_permissions(self):
        """
        Allow read for authenticated users,
        write for teachers (their groups) and admins.
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]
    
    def perform_create(self, serializer):
        """Set teacher to current user if not provided."""
        if not serializer.validated_data.get('teacher') and self.request.user.is_teacher:
            serializer.save(teacher=self.request.user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def add_student(self, request, pk=None):
        """Add a student to the group."""
        group = self.get_object()
        
        # Check permissions
        is_owner = group.teacher == request.user
        is_staff = request.user.is_head_teacher or request.user.is_admin_user or request.user.is_superuser
        if not (is_owner or is_staff):
            return Response(
                {'detail': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        student_id = request.data.get('student_id')
        if not student_id:
            return Response(
                {'detail': 'student_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student = User.objects.get(id=student_id, role=User.Role.STUDENT)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Student not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if group.students.filter(id=student.id).exists():
            return Response(
                {'detail': 'Student is already in this group.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if group.is_full:
            return Response(
                {'detail': 'Group is full.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        group.students.add(student)
        return Response({'detail': 'Student added successfully.'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def remove_student(self, request, pk=None):
        """Remove a student from the group."""
        group = self.get_object()
        
        # Check permissions
        is_owner = group.teacher == request.user
        is_staff = request.user.is_head_teacher or request.user.is_admin_user or request.user.is_superuser
        if not (is_owner or is_staff):
            return Response(
                {'detail': 'You do not have permission to perform this action.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        student_id = request.data.get('student_id')
        if not student_id:
            return Response(
                {'detail': 'student_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Student not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not group.students.filter(id=student.id).exists():
            return Response(
                {'detail': 'Student is not in this group.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        group.students.remove(student)
        return Response({'detail': 'Student removed successfully.'}, status=status.HTTP_200_OK)


class LessonViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Lesson model.
    Teachers can manage lessons in their groups.
    """
    queryset = Lesson.objects.select_related('group', 'group__course', 'group__teacher')
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter lessons based on user role."""
        queryset = Lesson.objects.select_related('group', 'group__course', 'group__teacher')
        
        # Teachers see only lessons from their groups
        if self.request.user.is_teacher and not (self.request.user.is_admin_user or self.request.user.is_superuser):
            queryset = queryset.filter(group__teacher=self.request.user)
        
        # Students see only lessons from their groups
        elif self.request.user.is_student:
            queryset = queryset.filter(group__students=self.request.user)
        
        # Filter by group
        group_id = self.request.query_params.get('group_id')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(lesson_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(lesson_date__lte=date_to)
        
        return queryset.order_by('-lesson_date')
    
    def get_permissions(self):
        """
        Allow read for authenticated users,
        write for teachers (their groups) and admins.
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]
    
    def perform_create(self, serializer):
        """Check that user is the teacher of the group or head teacher/admin."""
        group = serializer.validated_data.get('group')
        if group and group.teacher != self.request.user:
            is_staff = self.request.user.is_head_teacher or self.request.user.is_admin_user or self.request.user.is_superuser
            if not is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only create lessons for your own groups.")
        serializer.save()

    def perform_update(self, serializer):
        """Check that user is the teacher of the group or head teacher/admin."""
        lesson = self.get_object()
        if lesson.group.teacher != self.request.user:
            is_staff = self.request.user.is_head_teacher or self.request.user.is_admin_user or self.request.user.is_superuser
            if not is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only update lessons in your own groups.")
        serializer.save()

    def perform_destroy(self, instance):
        """Check that user is the teacher of the group or head teacher/admin."""
        if instance.group.teacher != self.request.user:
            is_staff = self.request.user.is_head_teacher or self.request.user.is_admin_user or self.request.user.is_superuser
            if not is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete lessons in your own groups.")
        instance.delete()


class GradeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Grade model.
    Teachers can create/update grades for students in their groups.
    Students can view their own grades.
    """
    queryset = Grade.objects.select_related('student', 'lesson', 'lesson__group', 'lesson__group__course')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Use different serializers for create/update vs read."""
        if self.action in ['create', 'update', 'partial_update']:
            return GradeCreateUpdateSerializer
        return GradeSerializer
    
    def get_queryset(self):
        """Filter grades based on user role."""
        queryset = Grade.objects.select_related(
            'student', 'lesson', 'lesson__group', 'lesson__group__course'
        )
        
        # Teachers see grades from their groups
        if self.request.user.is_teacher and not (self.request.user.is_admin_user or self.request.user.is_superuser):
            queryset = queryset.filter(lesson__group__teacher=self.request.user)
        
        # Students see only their own grades
        elif self.request.user.is_student:
            queryset = queryset.filter(student=self.request.user)
        
        # Filter by student
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by lesson
        lesson_id = self.request.query_params.get('lesson_id')
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        
        # Filter by group
        group_id = self.request.query_params.get('group_id')
        if group_id:
            queryset = queryset.filter(lesson__group_id=group_id)
        
        # Filter by course
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(lesson__group__course_id=course_id)
        
        return queryset.order_by('-created_at')
    
    def get_permissions(self):
        """
        Allow read for students (own grades) and teachers/admins.
        Allow write for teachers (their groups) and admins.
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]
    
    def perform_create(self, serializer):
        """Check that user is the teacher of the lesson's group or head teacher/admin."""
        lesson = serializer.validated_data.get('lesson')
        if lesson and lesson.group.teacher != self.request.user:
            is_staff = self.request.user.is_head_teacher or self.request.user.is_admin_user or self.request.user.is_superuser
            if not is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only create grades for lessons in your own groups.")
        serializer.save()

    def perform_update(self, serializer):
        """Check that user is the teacher of the lesson's group or head teacher/admin."""
        grade = self.get_object()
        if grade.lesson.group.teacher != self.request.user:
            is_staff = self.request.user.is_head_teacher or self.request.user.is_admin_user or self.request.user.is_superuser
            if not is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only update grades for lessons in your own groups.")
        serializer.save()

    def perform_destroy(self, instance):
        """Check that user is the teacher of the lesson's group or head teacher/admin."""
        if instance.lesson.group.teacher != self.request.user:
            is_staff = self.request.user.is_head_teacher or self.request.user.is_admin_user or self.request.user.is_superuser
            if not is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete grades for lessons in your own groups.")
        instance.delete()
    
    @action(detail=False, methods=['get'], permission_classes=[IsStudentOrAdmin])
    def my_grades(self, request):
        """
        Get all grades for the current student.
        Includes grades from all courses (active and completed).
        """
        if not request.user.is_student:
            return Response(
                {'detail': 'Only students can access this endpoint.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        grades = self.get_queryset().filter(student=request.user)
        
        # Group by course
        courses_data = {}
        for grade in grades:
            course_id = grade.lesson.group.course.id
            course_name = grade.lesson.group.course.name
            
            if course_id not in courses_data:
                courses_data[course_id] = {
                    'course_id': course_id,
                    'course_name': course_name,
                    'group_name': grade.lesson.group.name,
                    'group_id': grade.lesson.group.id,
                    'is_active': grade.lesson.group.is_active,
                    'grades': [],
                    'average_grade': None,
                }
            
            courses_data[course_id]['grades'].append({
                'id': grade.id,
                'lesson_title': grade.lesson.title,
                'lesson_date': grade.lesson.lesson_date.isoformat(),
                'grade': float(grade.grade),
                'comment': grade.comment,
                'created_at': grade.created_at.isoformat(),
            })
        
        # Calculate average for each course
        for course_id, course_data in courses_data.items():
            grades_list = [g['grade'] for g in course_data['grades']]
            if grades_list:
                course_data['average_grade'] = round(sum(grades_list) / len(grades_list), 2)
        
        return Response({
            'courses': list(courses_data.values()),
            'total_grades': grades.count(),
        })


class ExamGradeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ExamGrade model.
    Teachers can create/update exam grades for students in their groups.
    """
    queryset = ExamGrade.objects.select_related('student', 'group', 'group__teacher')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Use different serializers for create/update vs read."""
        if self.action in ['create', 'update', 'partial_update']:
            return ExamGradeCreateUpdateSerializer
        return ExamGradeSerializer
    
    def get_queryset(self):
        """Filter exam grades based on user role."""
        queryset = ExamGrade.objects.select_related('student', 'group', 'group__teacher', 'exam_scheme_item', 'exam_scheme_item__exam_type')
        
        # Teachers see grades from their groups
        if self.request.user.is_teacher and not (self.request.user.is_admin_user or self.request.user.is_superuser):
            queryset = queryset.filter(group__teacher=self.request.user)
        
        # Students see only their own grades
        elif self.request.user.is_student:
            queryset = queryset.filter(student=self.request.user)
        
        # Filter by student
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        # Filter by group
        group_id = self.request.query_params.get('group_id')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        # Filter by exam_number
        exam_number = self.request.query_params.get('exam_number')
        if exam_number:
            queryset = queryset.filter(exam_number=exam_number)

        # Filter by exam_scheme_item
        exam_scheme_item_id = self.request.query_params.get('exam_scheme_item_id')
        if exam_scheme_item_id:
            queryset = queryset.filter(exam_scheme_item_id=exam_scheme_item_id)
        
        return queryset.order_by('group', 'student', 'exam_number')
    
    def get_permissions(self):
        """
        Allow read for students (own grades) and teachers/admins.
        Allow write for teachers (their groups) and admins.
        """
        if self.action in ['list', 'retrieve', 'by_group']:
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]
    
    def perform_create(self, serializer):
        """Check that user is the teacher of the group or head teacher/admin."""
        group = serializer.validated_data.get('group')
        if group and group.teacher != self.request.user:
            is_staff = self.request.user.is_head_teacher or self.request.user.is_admin_user or self.request.user.is_superuser
            if not is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only create exam grades for your own groups.")
        serializer.save()

    def perform_update(self, serializer):
        """Check that user is the teacher of the group or head teacher/admin."""
        exam_grade = self.get_object()
        if exam_grade.group.teacher != self.request.user:
            is_staff = self.request.user.is_head_teacher or self.request.user.is_admin_user or self.request.user.is_superuser
            if not is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only update exam grades for your own groups.")
        serializer.save()

    def perform_destroy(self, instance):
        """Check that user is the teacher of the group or head teacher/admin."""
        if instance.group.teacher != self.request.user:
            is_staff = self.request.user.is_head_teacher or self.request.user.is_admin_user or self.request.user.is_superuser
            if not is_staff:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete exam grades for your own groups.")
        instance.delete()
    
    @action(detail=False, methods=['get'], url_path='by-group/(?P<group_id>[^/.]+)')
    def by_group(self, request, group_id=None):
        """
        Get all exam grades for a specific group.
        Returns data structured by student, following the group's exam scheme.
        """
        try:
            group = Group.objects.select_related('exam_scheme').get(id=group_id)
        except Group.DoesNotExist:
            return Response(
                {'detail': 'Group not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions: teacher, head_teacher, admin, or student in the group
        is_teacher = group.teacher == request.user
        is_head_teacher = getattr(request.user, 'is_head_teacher', False)
        is_admin = getattr(request.user, 'is_admin_user', False) or request.user.is_superuser
        is_student_in_group = group.students.filter(id=request.user.id).exists()

        if not (is_teacher or is_head_teacher or is_admin or is_student_in_group):
                return Response(
                    {'detail': 'You do not have permission to view grades for this group.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get all students in the group
        students = group.students.all().order_by('first_name', 'last_name')
        
        # Determine exams structure from scheme
        if group.exam_scheme:
            scheme_items = group.exam_scheme.items.select_related('exam_type').order_by('order')
            exams_template = [
                {
                    'id': item.id,
                    'name': item.exam_type.name,
                    'writing_max': item.exam_type.writing_weight,
                    'listening_max': item.exam_type.listening_weight,
                    'reading_max': item.exam_type.reading_weight,
                    'speaking_max': item.exam_type.speaking_weight,
                    'weight': item.weight_percentage,
                }
                for item in scheme_items
            ]
        else:
            # Fallback to default 4 exams structure
            exams_template = [
                {
                    'exam_number': i,
                    'name': f"Exam {i}",
                    'writing_max': 100,
                    'listening_max': 100,
                    'reading_max': 100,
                    'speaking_max': 100,
                    'weight': 40 if i == 4 else 20,
                }
                for i in range(1, 5)
            ]

        # Get all exam grades for this group
        exam_grades = ExamGrade.objects.filter(group=group).select_related('student', 'exam_scheme_item')
        
        # Structure data by student
        result = []
        for student in students:
            student_exams = []
            student_grades = exam_grades.filter(student=student)
            
            for idx, template in enumerate(exams_template):
                exam_info = template.copy()
                exam_number = idx + 1
                grade = None
                
                # Try to find matching grade - first by scheme item, then by exam number
                if group.exam_scheme:
                    # First try by exam_scheme_item
                    grade = student_grades.filter(exam_scheme_item_id=template['id']).first()
                    # If not found, try by exam_number as fallback (for old grades)
                    if not grade:
                        grade = student_grades.filter(exam_number=exam_number).first()
                else:
                    grade = student_grades.filter(exam_number=exam_number).first()
                
                if grade:
                    exam_info.update({
                        'grade_id': grade.id,
                        'writing': float(grade.writing) if grade.writing is not None else None,
                        'listening': float(grade.listening) if grade.listening is not None else None,
                        'reading': float(grade.reading) if grade.reading is not None else None,
                        'speaking': float(grade.speaking) if grade.speaking is not None else None,
                        'total_score': grade.get_total_score(),
                        'weighted_grade': round(float(grade.get_weighted_grade()), 2),
                    })
                else:
                    exam_info.update({
                        'grade_id': None,
                        'writing': None,
                        'listening': None,
                        'reading': None,
                        'speaking': None,
                        'total_score': 0,
                        'weighted_grade': 0,
                    })
                student_exams.append(exam_info)

            student_total = ExamGrade.calculate_student_total_grade(student, group)
            
            result.append({
                'id': student.id,
                'full_name': student.get_full_name() or student.username,
                'exams': student_exams,
                'total_grade': student_total
            })
        
        return Response({
            'group_id': group.id,
            'group_name': group.name,
            'exam_scheme_name': group.exam_scheme.name if group.exam_scheme else "Default",
            'students': result,
        })
    
    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        """
        Bulk update exam grades for a group.
        Expects data in format:
        {
            "group_id": 1,
            "grades": [
                {
                    "student_id": 1,
                    "exams": [
                        {"writing": 85, "listening": 90, "reading": 88, "speaking": 87},
                        {"writing": 90, "listening": 85, "reading": 92, "speaking": 88},
                        {"writing": 88, "listening": 90, "reading": 85, "speaking": 90},
                        {"writing": 92, "listening": 88, "reading": 90, "speaking": 91}
                    ]
                },
                ...
            ]
        }
        """
        group_id = request.data.get('group_id')
        if not group_id:
            return Response(
                {'detail': 'group_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response(
                {'detail': 'Group not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        is_owner = group.teacher == request.user
        is_staff = request.user.is_head_teacher or request.user.is_admin_user or request.user.is_superuser
        if not (is_owner or is_staff):
            return Response(
                {'detail': 'You do not have permission to update grades for this group.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        grades_data = request.data.get('grades', [])
        if not grades_data:
            return Response(
                {'detail': 'grades array is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = 0
        created_count = 0
        errors = []
        
        for grade_data in grades_data:
            student_id = grade_data.get('student_id')
            if not student_id:
                errors.append({'detail': 'student_id is required for each grade entry.'})
                continue
            
            # Check if student is in the group
            if not group.students.filter(id=student_id).exists():
                errors.append({
                    'student_id': student_id,
                    'detail': 'Student is not enrolled in this group.'
                })
                continue
            
            exams = grade_data.get('exams', [])
            
            # Determine how many exams are expected
            expected_count = group.exam_scheme.items.count() if group.exam_scheme else 4
            
            if len(exams) != expected_count:
                errors.append({
                    'student_id': student_id,
                    'detail': f'Exactly {expected_count} exams are required.'
                })
                continue
            
            # Update or create exam grades
            for idx, exam_components in enumerate(exams):
                exam_number = idx + 1
                lookup_kwargs = {
                    'student_id': student_id,
                    'group': group,
                }
                
                if group.exam_scheme:
                    # Get scheme items ordered by order field
                    scheme_items = list(group.exam_scheme.items.order_by('order'))
                    if idx < len(scheme_items):
                        scheme_item = scheme_items[idx]
                        lookup_kwargs['exam_scheme_item'] = scheme_item
                    else:
                        # If scheme has fewer items than expected, use exam_number only
                        # This handles cases where scheme was changed
                        lookup_kwargs['exam_number'] = exam_number
                        # Try to find existing grade by exam_number first
                        existing_grade = ExamGrade.objects.filter(
                            student_id=student_id,
                            group=group,
                            exam_number=exam_number
                        ).first()
                        if existing_grade:
                            # Update existing grade
                            exam_grade = existing_grade
                            exam_grade.writing = exam_components.get('writing')
                            exam_grade.listening = exam_components.get('listening')
                            exam_grade.reading = exam_components.get('reading')
                            exam_grade.speaking = exam_components.get('speaking')
                            exam_grade.save()
                            updated_count += 1
                            continue
                else:
                    lookup_kwargs['exam_number'] = exam_number

                # Try to find existing grade by exam_number if scheme_item lookup fails
                if 'exam_scheme_item' not in lookup_kwargs:
                    existing_grade = ExamGrade.objects.filter(
                        student_id=student_id,
                        group=group,
                        exam_number=exam_number
                    ).first()
                    if existing_grade:
                        # Update existing grade
                        exam_grade = existing_grade
                        exam_grade.writing = exam_components.get('writing')
                        exam_grade.listening = exam_components.get('listening')
                        exam_grade.reading = exam_components.get('reading')
                        exam_grade.speaking = exam_components.get('speaking')
                        exam_grade.save()
                        updated_count += 1
                        continue

                try:
                    exam_grade, created = ExamGrade.objects.update_or_create(
                        **lookup_kwargs,
                        defaults={
                            'writing': exam_components.get('writing'),
                            'listening': exam_components.get('listening'),
                            'reading': exam_components.get('reading'),
                            'speaking': exam_components.get('speaking'),
                        }
                    )
                    
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                except Exception as e:
                    errors.append({
                        'student_id': student_id,
                        'exam_number': exam_number,
                        'detail': f'Error updating exam {exam_number}: {str(e)}'
                    })
                    continue
        
        return Response({
            'detail': 'Grades updated successfully.',
            'created': created_count,
            'updated': updated_count,
            'errors': errors if errors else None,
        }, status=status.HTTP_200_OK)


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Attendance model.
    Teachers can manage attendance for students in their groups.
    """
    queryset = Attendance.objects.select_related('student', 'lesson', 'lesson__group')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return AttendanceUpdateSerializer
        return AttendanceSerializer

    def get_queryset(self):
        queryset = Attendance.objects.select_related('student', 'lesson', 'lesson__group')
        
        # Teachers see attendance from their groups
        if self.request.user.is_teacher and not (self.request.user.is_admin_user or self.request.user.is_superuser):
            queryset = queryset.filter(lesson__group__teacher=self.request.user)
        
        # Filter by group
        group_id = self.request.query_params.get('group_id')
        if group_id:
            queryset = queryset.filter(lesson__group_id=group_id)
            
        # Filter by lesson
        lesson_id = self.request.query_params.get('lesson_id')
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)

        return queryset.order_by('lesson__lesson_date', 'student__last_name')

    @action(detail=False, methods=['get'], url_path='by-group/(?P<group_id>[^/.]+)')
    def by_group(self, request, group_id=None):
        """
        Get attendance matrix for a specific group.
        """
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response({'detail': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions: teacher, head_teacher, admin, or student in the group
        is_teacher = group.teacher == request.user
        is_head_teacher = getattr(request.user, 'is_head_teacher', False)
        is_admin = getattr(request.user, 'is_admin_user', False) or request.user.is_superuser
        is_student_in_group = group.students.filter(id=request.user.id).exists()

        if not (is_teacher or is_head_teacher or is_admin or is_student_in_group):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        students = group.students.all().order_by('last_name', 'first_name')
        lessons = group.lessons.all().order_by('lesson_date')
        attendance_records = Attendance.objects.filter(lesson__group=group)

        # Build matrix
        attendance_map = {}
        for record in attendance_records:
            attendance_map[f"{record.student_id}_{record.lesson_id}"] = {
                'id': record.id,
                'is_present': record.is_present,
                'notes': record.notes
            }

        student_list = []
        for student in students:
            student_list.append({
                'id': student.id,
                'full_name': student.get_full_name() or student.username,
            })

        lesson_list = []
        for lesson in lessons:
            lesson_list.append({
                'id': lesson.id,
                'title': lesson.title,
                'date': lesson.lesson_date,
            })

        return Response({
            'group_id': group.id,
            'group_name': group.name,
            'course_name': group.course.name,
            'students': student_list,
            'lessons': lesson_list,
            'attendance': attendance_map
        })

    @action(detail=False, methods=['post'], url_path='toggle')
    def toggle(self, request):
        """
        Toggle attendance for a student in a lesson.
        """
        student_id = request.data.get('student_id')
        lesson_id = request.data.get('lesson_id')
        
        if not student_id or not lesson_id:
            return Response({'detail': 'student_id and lesson_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lesson = Lesson.objects.get(id=lesson_id)
            student = User.objects.get(id=student_id, role=User.Role.STUDENT)
        except (Lesson.DoesNotExist, User.DoesNotExist):
            return Response({'detail': 'Lesson or Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions
        is_owner = lesson.group.teacher == request.user
        is_staff = request.user.is_head_teacher or request.user.is_admin_user or request.user.is_superuser
        if not (is_owner or is_staff):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        attendance, created = Attendance.objects.get_or_create(
            student=student,
            lesson=lesson,
            defaults={'is_present': True}
        )
        
        if not created:
            attendance.is_present = not attendance.is_present
            attendance.save()

        return Response({
            'id': attendance.id,
            'student_id': student.id,
            'lesson_id': lesson.id,
            'is_present': attendance.is_present
        })

    @action(detail=False, methods=['post'], url_path='bulk-save')
    def bulk_save(self, request):
        """
        Bulk save attendance for a group.
        Expects:
        {
            "group_id": 1,
            "attendance": [
                {"student_id": 1, "lesson_id": 1, "is_present": true},
                ...
            ]
        }
        """
        group_id = request.data.get('group_id')
        attendance_data = request.data.get('attendance', [])

        if not group_id:
            return Response({'detail': 'group_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            return Response({'detail': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions
        is_owner = group.teacher == request.user
        is_staff = request.user.is_head_teacher or request.user.is_admin_user or request.user.is_superuser
        if not (is_owner or is_staff):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        updated_count = 0
        for item in attendance_data:
            student_id = item.get('student_id')
            lesson_id = item.get('lesson_id')
            is_present = item.get('is_present', False)

            if student_id and lesson_id:
                Attendance.objects.update_or_create(
                    student_id=student_id,
                    lesson_id=lesson_id,
                    defaults={'is_present': is_present}
                )
                updated_count += 1

        return Response({
            'detail': f'Successfully updated {updated_count} records.',
            'updated_count': updated_count
        })


class GameViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Game model.
    Teachers can manage games for their groups.
    Students can view games for their groups.
    """
    queryset = Game.objects.select_related('group', 'group__teacher').prefetch_related('group__students', 'attempts')
    serializer_class = GameSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Game.objects.select_related('group', 'group__teacher').prefetch_related('group__students', 'attempts', 'played_by')
        
        # Teachers see only games in their groups
        if self.request.user.is_teacher and not (self.request.user.is_admin_user or self.request.user.is_superuser):
            queryset = queryset.filter(group__teacher=self.request.user)
        
        # Students see only games in their groups
        elif self.request.user.is_student:
            queryset = queryset.filter(group__students=self.request.user)
        
        # Filter by group
        group_id = self.request.query_params.get('group_id')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
            
        return queryset.order_by('-created_at')

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'play', 'sprint_session', 'memory_cards']:
            return [IsAuthenticated()]
        return [IsTeacherOrAdmin()]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def memory_cards(self, request, pk=None):
        """Generate memory cards for this game."""
        import random
        game = self.get_object()
        
        # Get pairs from game data
        original_pairs = game.data  # List of {"word": "...", "translation": "..."}
        if not original_pairs or not isinstance(original_pairs, list):
            return Response({'error': 'No words available for this game'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Limit to 6-8 pairs for optimal game experience
        pairs_to_use = original_pairs[:8] if len(original_pairs) > 8 else original_pairs
        if len(pairs_to_use) < 3:
            return Response({'error': 'At least 3 word pairs are required for memory game'}, status=status.HTTP_400_BAD_REQUEST)
        
        cards = []
        card_id = 0
        
        # Create two cards for each pair (one with word, one with translation)
        for pair_idx, pair in enumerate(pairs_to_use):
            word = pair.get('word', '').strip()
            translation = pair.get('translation', '').strip()
            
            if not word or not translation:
                continue
            
            match_id = f"pair_{pair_idx}"
            
            # Card 1: English word
            cards.append({
                'id': card_id,
                'content': word,
                'matchId': match_id,
                'type': 'word'
            })
            card_id += 1
            
            # Card 2: Translation
            cards.append({
                'id': card_id,
                'content': translation,
                'matchId': match_id,
                'type': 'translation'
            })
            card_id += 1
        
        # Shuffle cards randomly
        random.shuffle(cards)
        
        return Response(cards)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def sprint_session(self, request, pk=None):
        """Generate a True/False sprint session for this game."""
        import random
        game = self.get_object()
        
        # Get pairs from game data
        original_pairs = game.data # List of {"word": "...", "translation": "..."}
        if not original_pairs or not isinstance(original_pairs, list):
            return Response({'error': 'No words available for this game'}, status=status.HTTP_400_BAD_REQUEST)
            
        words = [p.get('word') for p in original_pairs]
        translations = [p.get('translation') for p in original_pairs]
        
        session_data = []
        
        # We want around 20-30 items, or at least all words we have
        num_items = min(max(len(original_pairs), 20), 30)
        
        for i in range(num_items):
            # Pick a random pair index
            pair_idx = random.randrange(len(original_pairs))
            pair = original_pairs[pair_idx]
            
            is_correct = random.choice([True, False])
            
            if is_correct:
                session_data.append({
                    'id': i,
                    'word': pair.get('word'),
                    'translation': pair.get('translation'),
                    'is_correct': True
                })
            else:
                # Pick a random translation from another word
                other_translations = [t for j, t in enumerate(translations) if j != pair_idx]
                if not other_translations:
                    # Fallback to correct if only one word exists
                    wrong_translation = pair.get('translation')
                    is_correct_fallback = True
                else:
                    wrong_translation = random.choice(other_translations)
                    is_correct_fallback = False
                    
                session_data.append({
                    'id': i,
                    'word': pair.get('word'),
                    'translation': wrong_translation,
                    'is_correct': is_correct_fallback
                })
        
        random.shuffle(session_data)
        return Response(session_data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def play(self, request, pk=None):
        """Mark game as played by current user and record attempt."""
        game = self.get_object()
        user = request.user
        score = request.data.get('score', 0)
        
        # Explicit check for student role (using string to be safe)
        if user.role != 'student':
            return Response({'error': 'Only students can play games'}, status=status.HTTP_403_FORBIDDEN)
        
        # Record attempt
        from .models import GameAttempt
        GameAttempt.objects.create(
            game=game,
            student=user,
            score=int(score)
        )
        
        # Add to played_by (unique players) if not already there
        if not game.played_by.filter(id=user.id).exists():
            game.played_by.add(user)
            game.refresh_from_db()
            print(f"DEBUG: Game '{game.title}' (ID: {game.id}) played by {user.username} for the first time.")
        
        # Return the updated game data using the serializer
        serializer = self.get_serializer(game)
        return Response(serializer.data)
