"""
Admin URLs for users app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminUserViewSet, AdminTeacherProfileViewSet, AdminStudentProfileViewSet,
    AdminDirectorViewSet, AdminAdministratorViewSet, AdminHeadTeacherViewSet
)

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'teachers', AdminTeacherProfileViewSet, basename='admin-teacher')
router.register(r'students', AdminStudentProfileViewSet, basename='admin-student')
router.register(r'directors', AdminDirectorViewSet, basename='admin-director')
router.register(r'head-teachers', AdminHeadTeacherViewSet, basename='admin-head-teacher')
router.register(r'administrators', AdminAdministratorViewSet, basename='admin-administrator')

urlpatterns = [
    path('', include(router.urls)),
]

