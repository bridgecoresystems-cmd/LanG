"""
URL configuration for Language School Management System.

The `urlpatterns` list routes URLs to views.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # JWT Authentication
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    # API endpoints
    path("api/v1/landing/", include("apps.landing.urls")),
    path("api/v1/users/", include("apps.users.urls")),
    path("api/v1/courses/", include("apps.courses.urls")),
    path("api/v1/mailing/", include("apps.mailing.urls")),
    # Activity logs - public endpoint for creating logs (all users)
    path("api/v1/activity-logs/", include("apps.activity_log.urls")),
    # Points and Rewards
    path("api/v1/points/", include("apps.points.urls")),
    path("api/v1/vendors/", include("apps.vendors.urls")),
    # Admin API endpoints
    path("api/v1/admin/landing/", include("apps.landing.admin_urls")),
    path("api/v1/admin/users/", include("apps.users.admin_urls")),
    path("api/v1/admin/", include("apps.activity_log.urls")),  # Activity logs (admin only for viewing)
    # path("api/v1/subscriptions/", include("apps.subscriptions.urls")),
    # path("api/v1/content/", include("apps.content.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/chat/", include("apps.chat.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
