"""
URL configuration for users app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeacherProfileViewSet, StaffViewSet, StudentProfileViewSet, current_user, change_password
from .cabinet_views import (
    dashboard_stats,
    student_courses,
    student_schedule,
    student_grades,
    teacher_students,
)

router = DefaultRouter()
router.register(r'teachers', TeacherProfileViewSet, basename='teacher')
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'students', StudentProfileViewSet, basename='student')

urlpatterns = [
    path('me/', current_user, name='current-user'),
    path('me/change-password/', change_password, name='change-password'),
    # Student/Teacher Cabinet endpoints
    path('cabinet/dashboard/', dashboard_stats, name='cabinet-dashboard'),
    path('cabinet/courses/', student_courses, name='cabinet-courses'),
    path('cabinet/schedule/', student_schedule, name='cabinet-schedule'),
    path('cabinet/grades/', student_grades, name='cabinet-grades'),
    path('cabinet/teacher/students/', teacher_students, name='teacher-students'),
    path('', include(router.urls)),
]

