"""
Views for head teacher to manage courses and groups.
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Avg, Count
from .models import Course, Group, Lesson, ExamGrade
from apps.users.models import User
from .serializers import SimpleCourseSerializer, GroupSerializer

logger = logging.getLogger(__name__)


class HeadTeacherCourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Course model (for head teacher).
    Simple courses without price, image, etc.
    """
    queryset = Course.objects.all()
    serializer_class = SimpleCourseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter courses."""
        queryset = Course.objects.all()
        
        # Filter by language
        language = self.request.query_params.get('language', None)
        if language:
            queryset = queryset.filter(language=language)
        
        # Filter by level
        level = self.request.query_params.get('level', None)
        if level:
            queryset = queryset.filter(level=level)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search by name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create course with price = 0."""
        serializer.save(price=0)
    
    @action(detail=True, methods=['get'], url_path='statistics')
    def statistics(self, request, pk=None):
        """
        Get statistics for a course.
        Returns average scores per exam for each group in the course.
        """
        course = self.get_object()
        groups = Group.objects.filter(course=course, is_active=True).select_related('teacher')
        
        groups_data = []
        course_averages = {1: [], 2: [], 3: [], 4: []}  # Store averages for each exam number
        
        for group in groups:
            group_stats = {
                'id': group.id,
                'name': group.name,
                'teacher': group.teacher.get_full_name() if group.teacher else None,
                'exam_averages': {}
            }
            
            # Get total number of students in the group
            total_students_count = group.students.count()
            
            # Calculate average for each exam (1-4)
            # Use exam_number as primary filter - it doesn't change when scheme changes
            for exam_num in [1, 2, 3, 4]:
                # Get all exam grades for this group and exam number
                # exam_number is stable and doesn't change when scheme changes
                exam_grades = ExamGrade.objects.filter(
                    group=group,
                    exam_number=exam_num
                )
                
                # If group has a current scheme, optionally filter by scheme item too
                # But don't make it required - we want to show old grades even if scheme changed
                if group.exam_scheme:
                    current_scheme_items = list(group.exam_scheme.items.order_by('order').values_list('id', flat=True))
                    scheme_index = exam_num - 1
                    
                    # If this exam exists in current scheme, prefer grades with matching scheme_item
                    if scheme_index < len(current_scheme_items):
                        scheme_item_id = current_scheme_items[scheme_index]
                        # Try to get grades with matching scheme_item first
                        scheme_grades = exam_grades.filter(exam_scheme_item_id=scheme_item_id)
                        if scheme_grades.exists():
                            exam_grades = scheme_grades
                    # If exam doesn't exist in current scheme but has old grades, still show them
                    # (exam_grades already filtered by exam_number)
                
                # Calculate sum of G (General) scores for all students
                # G = writing + listening + reading + speaking (get_total_score returns this sum)
                total_g_sum = 0
                students_with_grades = 0
                
                for grade in exam_grades:
                    # get_total_score() returns G = sum of all components
                    g_score = grade.get_total_score()
                    if g_score is not None and g_score >= 0:
                        total_g_sum += g_score
                        students_with_grades += 1
                
                # Calculate average: sum of all G divided by total number of students in group
                # If no students have grades, show None
                if total_students_count > 0:
                    if students_with_grades > 0:
                        # Average = sum of all G / total students
                        avg_score = total_g_sum / total_students_count
                        group_stats['exam_averages'][exam_num] = round(avg_score, 2)
                        course_averages[exam_num].append(avg_score)
                    else:
                        # No grades entered yet for this exam
                        group_stats['exam_averages'][exam_num] = None
                else:
                    group_stats['exam_averages'][exam_num] = None
            
            groups_data.append(group_stats)
        
        # Calculate course-wide averages
        course_avg_by_exam = {}
        for exam_num in [1, 2, 3, 4]:
            if course_averages[exam_num]:
                course_avg_by_exam[exam_num] = round(
                    sum(course_averages[exam_num]) / len(course_averages[exam_num]), 
                    2
                )
            else:
                course_avg_by_exam[exam_num] = None
        
        return Response({
            'course': {
                'id': course.id,
                'name': course.name,
                'language': course.language,
                'level': course.level
            },
            'groups': groups_data,
            'course_averages': course_avg_by_exam
        })


class HeadTeacherGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Group model (for head teacher).
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Override create to log validation errors and generate schedule."""
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        group = serializer.instance
        
        # Auto-generate schedule if all required fields are present
        if group.time_slot and group.week_days and group.start_date:
            try:
                lessons_created = group.generate_schedule()
                logger.info("Auto-generated %s lessons for group %s", lessons_created, group.id)
            except Exception as e:
                logger.error("Error auto-generating schedule for group %s: %s", group.id, str(e))
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Override update to auto-generate schedule if fields changed."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        group = serializer.instance
        
        # Auto-generate schedule if all required fields are present
        # Only generate if time_slot, week_days, or dates were updated
        if group.time_slot and group.week_days and group.start_date:
            # Check if schedule-related fields were updated
            if 'time_slot' in serializer.validated_data or \
               'week_days' in serializer.validated_data or \
               'start_date' in serializer.validated_data or \
               'end_date' in serializer.validated_data:
                try:
                    lessons_created = group.generate_schedule()
                    logger.info("Auto-regenerated %s lessons for group %s after update", lessons_created, group.id)
                except Exception as e:
                    logger.error("Error auto-regenerating schedule for group %s: %s", group.id, str(e))
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='generate-schedule')
    def generate_schedule(self, request, pk=None):
        """Manually generate schedule for a group."""
        group = self.get_object()
        
        if not group.time_slot or not group.week_days or not group.start_date:
            return Response(
                {'detail': 'Group must have time_slot, week_days, and start_date to generate schedule.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lessons_created = group.generate_schedule()
            logger.info("Manually generated %s lessons for group %s", lessons_created, group.id)
            return Response({
                'detail': f'Successfully generated {lessons_created} lessons.',
                'lessons_created': lessons_created
            })
        except Exception as e:
            logger.error("Error generating schedule for group %s: %s", group.id, str(e))
            return Response(
                {'detail': f'Error generating schedule: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_queryset(self):
        """Filter groups."""
        queryset = Group.objects.select_related('course', 'teacher').prefetch_related('students')
        
        # Filter by course
        course_id = self.request.query_params.get('course', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Filter by teacher
        teacher_id = self.request.query_params.get('teacher', None)
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by time slot
        time_slot = self.request.query_params.get('time_slot', None)
        if time_slot:
            queryset = queryset.filter(time_slot=time_slot)
        
        # Filter by week days
        week_days = self.request.query_params.get('week_days', None)
        if week_days:
            queryset = queryset.filter(week_days=week_days)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def add_students(self, request, pk=None):
        """Add students to group."""
        group = self.get_object()
        student_ids = request.data.get('student_ids', [])
        
        print(f"Add students request: group_id={pk}, student_ids={student_ids}, type={type(student_ids)}")
        
        if not isinstance(student_ids, list):
            print(f"Error: student_ids is not a list, it's {type(student_ids)}")
            return Response(
                {'error': 'student_ids must be a list'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not student_ids:
            return Response(
                {'error': 'student_ids cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert to integers if needed
        try:
            student_ids = [int(sid) for sid in student_ids]
        except (ValueError, TypeError) as e:
            print(f"Error converting student_ids to integers: {e}")
            return Response(
                {'error': 'student_ids must be integers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get students
        students = User.objects.filter(
            id__in=student_ids,
            role=User.Role.STUDENT
        )
        
        print(f"Found {students.count()} students out of {len(student_ids)} requested")
        print(f"Student IDs found: {list(students.values_list('id', flat=True))}")
        
        if students.count() != len(student_ids):
            missing_ids = set(student_ids) - set(students.values_list('id', flat=True))
            return Response(
                {'error': f'Some students not found or invalid. Missing IDs: {list(missing_ids)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check max students
        current_count = group.students.count()
        if current_count + len(student_ids) > group.max_students:
            return Response(
                {'error': f'Group is full. Max students: {group.max_students}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add students
        group.students.add(*students)
        
        # Create enrollments
        from .models import Enrollment
        for student in students:
            Enrollment.objects.get_or_create(
                student=student,
                group=group,
                defaults={'status': Enrollment.Status.ACTIVE}
            )
        
        serializer = self.get_serializer(group)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def remove_students(self, request, pk=None):
        """Remove students from group."""
        group = self.get_object()
        student_ids = request.data.get('student_ids', [])
        
        if not isinstance(student_ids, list):
            return Response(
                {'error': 'student_ids must be a list'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get students
        students = User.objects.filter(
            id__in=student_ids,
            role=User.Role.STUDENT
        )
        
        # Remove students
        group.students.remove(*students)
        
        serializer = self.get_serializer(group)
        return Response(serializer.data)

