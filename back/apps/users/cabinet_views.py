"""
Views for student cabinet API.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from apps.courses.models import Group, Lesson, Grade, Course, ExamGrade
from apps.users.models import User, StudentProfile
from .cabinet_serializers import (
    StudentCourseSerializer,
    TeacherGroupSerializer,
    ScheduleItemSerializer,
    GradeDetailSerializer,
    TeacherGradeSerializer,
    CabinetStudentSerializer,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics for the current user (student or teacher).
    """
    user = request.user
    now = timezone.now().date()

    if user.is_student:
        student = user
        # Get all groups where student is enrolled (active and completed)
        all_student_groups = Group.objects.filter(students=student)
        
        # Calculate active/completed based on dates and is_active flag
        active_courses = 0
        completed_courses = 0
        
        for group in all_student_groups:
            # If manually set to inactive, it's completed
            if not group.is_active:
                completed_courses += 1
                continue
            
            # Check dates
            is_active_by_dates = True
            if group.start_date and now < group.start_date:
                is_active_by_dates = False  # Course hasn't started yet
            if group.end_date and now > group.end_date:
                is_active_by_dates = False  # Course has ended
            
            if is_active_by_dates:
                active_courses += 1
            else:
                completed_courses += 1
        
        total_courses = all_student_groups.count()
        
        # Average grade (from all courses, including completed)
        grades_avg = Grade.objects.filter(
            student=student,
            lesson__group__in=all_student_groups
        ).aggregate(avg_grade=Avg('grade'))
        
        average_grade = round(float(grades_avg['avg_grade']), 2) if grades_avg['avg_grade'] else None
        
        # Activity points (from StudentProfile)
        try:
            student_profile = student.student_profile
            activity_points = student_profile.points
        except StudentProfile.DoesNotExist:
            activity_points = 0
        
        # Upcoming classes (next 7 days) - only from active groups
        upcoming_classes = Lesson.objects.filter(
            group__students=student,
            group__is_active=True,
            lesson_date__gt=now,
            lesson_date__lte=now + timedelta(days=7)
        ).count()
        
        return Response({
            'total_courses': total_courses,
            'active_courses': active_courses,
            'completed_courses': completed_courses,
            'average_grade': average_grade,
            'activity_points': activity_points,
            'upcoming_classes': upcoming_classes,
        })

    elif user.is_teacher:
        # Teacher statistics
        teacher_groups = Group.objects.filter(teacher=user)
        total_groups = teacher_groups.count()
        active_groups = teacher_groups.filter(is_active=True).count()
        
        # Unique students across all groups
        total_students = User.objects.filter(
            student_groups__in=teacher_groups
        ).distinct().count()
        
        # Upcoming classes next 7 days
        upcoming_classes = Lesson.objects.filter(
            group__teacher=user,
            group__is_active=True,
            lesson_date__gt=now,
            lesson_date__lte=now + timedelta(days=7)
        ).count()
        
        # Average attendance (mock for now, or calculate if attendance model exists)
        # Assuming for now we don't have a specific attendance model yet
        avg_attendance = 0 
        
        return Response({
            'total_groups': total_groups,
            'active_groups': active_groups,
            'total_students': total_students,
            'upcoming_classes': upcoming_classes,
            'avg_attendance': avg_attendance,
        })
    
    return Response(
        {'detail': 'Dashboard stats only available for students and teachers.'},
        status=status.HTTP_403_FORBIDDEN
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_courses(request):
    """
    Get list of courses/groups for the current user (student or teacher).
    """
    user = request.user
    is_active_param = request.query_params.get('is_active')
    
    if user.is_student:
        groups = Group.objects.filter(
            students=user
        ).select_related('course', 'teacher').prefetch_related('lessons', 'lessons__grades')
        
        if is_active_param is not None:
            groups = groups.filter(is_active=is_active_param.lower() == 'true')
            
        serializer = StudentCourseSerializer(groups, many=True, context={'request': request})
        courses_data = serializer.data
        active_count = sum(1 for course in courses_data if course.get('is_active', False))
    
    elif user.is_teacher:
        groups = Group.objects.filter(
            teacher=user
        ).select_related('course').prefetch_related('lessons')
        
        if is_active_param is not None:
            groups = groups.filter(is_active=is_active_param.lower() == 'true')
            
        serializer = TeacherGroupSerializer(groups, many=True, context={'request': request})
        courses_data = serializer.data
        active_count = sum(1 for group in courses_data if group.get('is_active_status', False))
        
    else:
        return Response(
            {'detail': 'Courses only available for students and teachers.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    completed_count = len(courses_data) - active_count
    
    return Response({
        'courses': courses_data,
        'total': len(courses_data),
        'active': active_count,
        'completed': completed_count,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_schedule(request):
    """
    Get schedule (upcoming lessons) for the current user (student or teacher).
    """
    import logging
    logger = logging.getLogger(__name__)
    
    user = request.user
    now = timezone.now()
    today = now.date()
    
    # Get number of days (default: 7)
    days = int(request.query_params.get('days', 7))
    end_date = now + timedelta(days=days)
    
    # Filter by group if specified
    group_id = request.query_params.get('group_id')
    
    logger.info(f'schedule called: user={user.id}, role={user.role}, days={days}, group_id={group_id}')
    
    if user.is_student:
        groups_qs = Group.objects.filter(students=user)
    elif user.is_teacher:
        groups_qs = Group.objects.filter(teacher=user)
    else:
        return Response(
            {'detail': 'Schedule only available for students and teachers.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    logger.info(f'Found {groups_qs.count()} groups for user')
    
    # Filter by group_id if specified
    if group_id:
        groups_qs = groups_qs.filter(id=group_id)
        logger.info(f'After group_id filter: {groups_qs.count()} groups')
    
    # Filter groups that are actually active (considering dates)
    active_groups = []
    for group in groups_qs:
        if not group.is_active:
            logger.debug(f'Group {group.id} is not active')
            continue
        if group.start_date and today < group.start_date:
            logger.debug(f'Group {group.id} hasn\'t started yet (starts {group.start_date})')
            continue
        if group.end_date and today > group.end_date:
            logger.debug(f'Group {group.id} has ended (ended {group.end_date})')
            continue
        active_groups.append(group.id)
    
    logger.info(f'Active groups after filtering: {len(active_groups)} groups: {active_groups}')
    
    if not active_groups:
        logger.warning(f'No active groups found for user {user.id}')
        return Response([])
    
    # Get ALL lessons from active groups first (for debugging)
    all_lessons = Lesson.objects.filter(group__id__in=active_groups)
    all_lessons_count = all_lessons.count()
    logger.info(f'Total lessons in active groups (before date filter): {all_lessons_count}')
    
    # Log some sample lessons if any exist (for debugging)
    if all_lessons_count > 0:
        sample = all_lessons[:3]
        for lesson in sample:
            logger.info(f'Sample lesson (before filter): id={lesson.id}, date={lesson.lesson_date}, group={lesson.group.id}, title={lesson.title}')
    
    # Get lessons from active groups with date filtering
    # Use datetime comparison that works with timezone-aware datetimes
    start_datetime = timezone.make_aware(datetime.combine(today, datetime.min.time()))
    end_datetime = timezone.make_aware(datetime.combine(end_date.date(), datetime.max.time()))
    
    lessons = Lesson.objects.filter(
        group__id__in=active_groups,
        lesson_date__gte=start_datetime,
        lesson_date__lte=end_datetime
    ).select_related('group', 'group__course', 'group__teacher').order_by('lesson_date')
    
    count = lessons.count()
    logger.info(f'Found {count} lessons in date range {start_datetime} to {end_datetime}')
    
    # Log some sample lesson dates if any exist
    if count > 0:
        sample_lessons = lessons[:3]
        for lesson in sample_lessons:
            logger.info(f'Sample lesson: id={lesson.id}, date={lesson.lesson_date}, group={lesson.group.id}')
    else:
        # Check if there are ANY lessons for these groups (regardless of date)
        any_lessons = Lesson.objects.filter(group__id__in=active_groups).order_by('lesson_date')[:5]
        if any_lessons.exists():
            logger.warning(f'Found {any_lessons.count()} lessons total, but none in date range {today} to {end_date.date()}')
            for lesson in any_lessons:
                logger.warning(f'Lesson date: {lesson.lesson_date} (date part: {lesson.lesson_date.date()})')
        else:
            logger.warning(f'No lessons found at all for groups: {active_groups}')
    
    serializer = ScheduleItemSerializer(lessons, many=True, context={'request': request})
    logger.info(f'Returning {len(serializer.data)} schedule items')
    
    # For debugging: also log the response structure
    if len(serializer.data) > 0:
        logger.info(f'First schedule item: {serializer.data[0]}')
    
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_grades(request):
    """
    Get grades for the current user (student or teacher).
    """
    import logging
    logger = logging.getLogger(__name__)
    
    user = request.user
    group_id = request.query_params.get('group_id')
    course_id = request.query_params.get('course_id')
    is_active = request.query_params.get('is_active')
    student_id = request.query_params.get('student_id')
    lesson_id = request.query_params.get('lesson_id')
    
    logger.info(f'student_grades called: user={user.id}, role={user.role}, group_id={group_id}, course_id={course_id}')
    
    if user.is_student:
        grades_qs = Grade.objects.filter(student=user)
        logger.info(f'Student {user.id}: Found {grades_qs.count()} grades before filters')
    elif user.is_teacher:
        grades_qs = Grade.objects.filter(lesson__group__teacher=user)
        if student_id:
            grades_qs = grades_qs.filter(student_id=student_id)
        if lesson_id:
            grades_qs = grades_qs.filter(lesson_id=lesson_id)
    else:
        return Response(
            {'detail': 'Grades only available for students and teachers.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if group_id:
        grades_qs = grades_qs.filter(lesson__group__id=group_id)
        logger.info(f'After group filter: {grades_qs.count()} grades')
    
    if course_id:
        grades_qs = grades_qs.filter(lesson__group__course_id=course_id)
        logger.info(f'After course filter: {grades_qs.count()} grades')
    
    if is_active is not None:
        is_active_bool = is_active.lower() == 'true'
        grades_qs = grades_qs.filter(lesson__group__is_active=is_active_bool)
        logger.info(f'After is_active filter ({is_active_bool}): {grades_qs.count()} grades')
    
    # Get grades
    grades = grades_qs.select_related(
        'lesson', 'lesson__group', 'lesson__group__course', 'student'
    ).order_by('-created_at')
    
    # Limit results
    limit = int(request.query_params.get('limit', 50))
    if limit > 0:
        grades = grades[:limit]
    
    logger.info(f'Final grades count: {len(grades)}')
    
    # Use appropriate serializer based on role
    if user.is_teacher:
        serializer = TeacherGradeSerializer(grades, many=True, context={'request': request})
    else:
        serializer = GradeDetailSerializer(grades, many=True, context={'request': request})
    
    # Calculate statistics
    if user.is_student:
        total_grades = Grade.objects.filter(student=user).count()
        active_grades = Grade.objects.filter(
            student=user,
            lesson__group__is_active=True
        ).count()
    else:
        total_grades = Grade.objects.filter(lesson__group__teacher=user).count()
        active_grades = Grade.objects.filter(
            lesson__group__teacher=user,
            lesson__group__is_active=True
        ).count()
        
    completed_grades = total_grades - active_grades
    
    logger.info(f'Returning: {len(serializer.data)} grades, total={total_grades}, active={active_grades}, completed={completed_grades}')
    
    # Get exam grades for students
    exam_grades_data = []
    if user.is_student:
        try:
            exam_grades_qs = ExamGrade.objects.filter(student=user)
            
            if group_id:
                exam_grades_qs = exam_grades_qs.filter(group_id=group_id)
            
            if course_id:
                exam_grades_qs = exam_grades_qs.filter(group__course_id=course_id)
            
            if is_active is not None:
                is_active_bool = is_active.lower() == 'true'
                exam_grades_qs = exam_grades_qs.filter(group__is_active=is_active_bool)
            
            exam_grades_qs = exam_grades_qs.select_related('group', 'group__course').order_by('group__course__name', 'group__name', 'exam_number')
            
            # Structure exam grades by group
            exam_grades_by_group = {}
            for exam_grade in exam_grades_qs:
                group_key = f"{exam_grade.group.course.name} - {exam_grade.group.name}"
                if group_key not in exam_grades_by_group:
                    exam_grades_by_group[group_key] = {
                        'course_name': exam_grade.group.course.name,
                        'group_name': exam_grade.group.name,
                        'group_id': exam_grade.group.id,
                        'exams': {}
                    }
                
                exam_num = exam_grade.exam_number
                avg = exam_grade.get_average()
                total_grade = exam_grade.get_total_grade()
                exam_grades_by_group[group_key]['exams'][exam_num] = {
                    'exam_number': exam_num,
                    'writing': float(exam_grade.writing) if exam_grade.writing is not None else None,
                    'listening': float(exam_grade.listening) if exam_grade.listening is not None else None,
                    'reading': float(exam_grade.reading) if exam_grade.reading is not None else None,
                    'speaking': float(exam_grade.speaking) if exam_grade.speaking is not None else None,
                    'average': round(float(avg), 2) if avg is not None else None,
                    'total_grade': round(float(total_grade), 2) if total_grade is not None else None,
                }
            
            # Convert to list format
            for group_key, group_data in exam_grades_by_group.items():
                exams_list = []
                for exam_num in range(1, 5):
                    if exam_num in group_data['exams']:
                        exams_list.append(group_data['exams'][exam_num])
                    else:
                        exams_list.append({
                            'exam_number': exam_num,
                            'writing': None,
                            'listening': None,
                            'reading': None,
                            'speaking': None,
                            'average': None,
                            'total_grade': None,
                        })
                
                # Calculate total grade for the group (sum of all exam total_grades)
                group_total = sum(
                    exam.get('total_grade', 0) or 0 
                    for exam in exams_list 
                    if exam.get('total_grade') is not None
                )
                group_total = round(group_total, 2) if group_total > 0 else None
                
                exam_grades_data.append({
                    'course_name': group_data['course_name'],
                    'group_name': group_data['group_name'],
                    'group_id': group_data['group_id'],
                    'exams': exams_list,
                    'total_grade': group_total
                })
            
            logger.info(f'Found {len(exam_grades_data)} groups with exam grades for student')
        except Exception as e:
            logger.warning(f'Error loading exam grades: {e}')
            exam_grades_data = []
    
    return Response({
        'grades': serializer.data,
        'exam_grades': exam_grades_data,
        'total': total_grades,
        'active_courses_grades': active_grades,
        'completed_courses_grades': completed_grades,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_students(request):
    """
    Get list of students for the current teacher.
    Optional query parameter: group_id
    """
    if not request.user.is_teacher:
        return Response(
            {'detail': 'Only teachers can access this endpoint.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    teacher = request.user
    group_id = request.query_params.get('group_id')
    
    # Get groups taught by teacher
    groups = Group.objects.filter(teacher=teacher)
    
    if group_id:
        groups = groups.filter(id=group_id)
    
    # Get unique students in these groups
    students = User.objects.filter(
        student_groups__in=groups
    ).distinct().select_related('student_profile').prefetch_related(
        'student_groups', 'student_groups__course'
    )
    
    serializer = CabinetStudentSerializer(students, many=True, context={'request': request})
    return Response(serializer.data)

