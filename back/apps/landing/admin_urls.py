"""
Admin URLs for landing app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminNewsViewSet, AdminContactMessageViewSet,
    AdminCourseCategoryViewSet, AdminCourseSubCategoryViewSet, AdminCourseViewSet,
    AdminDashboardStatsView, AdminLeaderboardCarouselViewSet
)

router = DefaultRouter()
router.register(r'news', AdminNewsViewSet, basename='admin-news')
router.register(r'contact-messages', AdminContactMessageViewSet, basename='admin-contact-messages')
router.register(r'course-categories', AdminCourseCategoryViewSet, basename='admin-course-category')
router.register(r'course-subcategories', AdminCourseSubCategoryViewSet, basename='admin-course-subcategory')
router.register(r'courses', AdminCourseViewSet, basename='admin-course')
router.register(r'leaderboards', AdminLeaderboardCarouselViewSet, basename='admin-leaderboard')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', AdminDashboardStatsView.as_view(), name='admin-dashboard-stats'),
]

