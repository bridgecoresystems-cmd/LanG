"""
URLs for Activity Log API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityLogViewSet, create_activity_log

router = DefaultRouter()
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-log')

urlpatterns = [
    path('', include(router.urls)),
    # Public endpoint for creating logs (all authenticated users)
    # Note: This will be available at /api/v1/activity-logs/create/
    path('create/', create_activity_log, name='activity-log-create'),
]

