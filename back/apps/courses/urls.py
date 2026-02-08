"""
URL configuration for courses app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, 
    GroupViewSet, 
    LessonViewSet, 
    GradeViewSet, 
    ExamGradeViewSet,
    AttendanceViewSet,
    GameViewSet,
    ExamTypeViewSet,
    ExamSchemeViewSet,
    ExamSchemeItemViewSet,
)
from .head_teacher_views import HeadTeacherCourseViewSet, HeadTeacherGroupViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'exam-grades', ExamGradeViewSet, basename='exam-grade')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'games', GameViewSet, basename='game')
router.register(r'exam-types', ExamTypeViewSet, basename='exam-type')
router.register(r'exam-schemes', ExamSchemeViewSet, basename='exam-scheme')
router.register(r'exam-scheme-items', ExamSchemeItemViewSet, basename='exam-scheme-item')

# Head teacher endpoints
head_teacher_router = DefaultRouter()
head_teacher_router.register(r'courses', HeadTeacherCourseViewSet, basename='head-teacher-course')
head_teacher_router.register(r'groups', HeadTeacherGroupViewSet, basename='head-teacher-group')

urlpatterns = [
    path('', include(router.urls)),
    path('head-teacher/', include(head_teacher_router.urls)),
]

