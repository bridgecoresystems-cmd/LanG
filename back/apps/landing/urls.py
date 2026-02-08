"""
URLs for landing app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NewsViewSet, ContactMessageViewSet,
    CourseCategoryViewSet, CourseSubCategoryViewSet, CourseViewSet,
    LeaderboardCarouselViewSet
)

router = DefaultRouter()
router.register(r'news', NewsViewSet, basename='news')
router.register(r'contact-messages', ContactMessageViewSet, basename='contact-messages')
router.register(r'course-categories', CourseCategoryViewSet, basename='course-category')
router.register(r'course-subcategories', CourseSubCategoryViewSet, basename='course-subcategory')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'leaderboards', LeaderboardCarouselViewSet, basename='leaderboard')

urlpatterns = [
    path('', include(router.urls)),
]

