"""
Admin views for landing app with full CRUD operations.
Only accessible to superusers.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.contrib.auth import get_user_model
from .models import News, ContactMessage, CourseCategory, CourseSubCategory, Course, LeaderboardCarousel
from apps.users.models import TeacherProfile
from .serializers import (
    AdminContactMessageSerializer,
    NewsSerializer, AdminNewsSerializer, ContactMessageSerializer,
    CourseCategorySerializer, CourseSubCategorySerializer, CourseSerializer,
    AdminCourseCategorySerializer, AdminCourseSubCategorySerializer, AdminCourseSerializer,
    AdminLeaderboardCarouselSerializer
)

User = get_user_model()


class AdminNewsViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for News with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = News.objects.all()
    serializer_class = AdminNewsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_published', 'is_featured']
    search_fields = ['title_tm', 'title_ru', 'title_en', 'content_tm', 'content_ru', 'content_en']
    ordering_fields = ['created_at', 'updated_at', 'views']
    ordering = ['-created_at']
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminLeaderboardCarouselViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for LeaderboardCarousel with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = LeaderboardCarousel.objects.all().select_related('course', 'exam_type')
    serializer_class = AdminLeaderboardCarouselSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active', 'course']
    ordering_fields = ['order', 'created_at']
    ordering = ['order', '-created_at']
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminContactMessageViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for ContactMessage with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = ContactMessage.objects.all()
    serializer_class = AdminContactMessageSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'email', 'phone', 'message']
    ordering_fields = ['created_at', 'likes']
    ordering = ['-created_at']
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminLeaderboardCarouselViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for LeaderboardCarousel with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = LeaderboardCarousel.objects.all().select_related('course', 'exam_type')
    serializer_class = AdminLeaderboardCarouselSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active', 'course']
    ordering_fields = ['order', 'created_at']
    ordering = ['order', '-created_at']
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=True, methods=['post'])
    def toggle_approval(self, request, pk=None):
        """Toggle approval status of a message."""
        message = self.get_object()
        if message.status == 'approved':
            message.status = 'pending'
        else:
            message.status = 'approved'
        message.save()
        serializer = self.get_serializer(message)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Increment likes count for a message."""
        message = self.get_object()
        message.likes += 1
        message.save()
        serializer = self.get_serializer(message)
        return Response(serializer.data)


class AdminCourseCategoryViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for CourseCategory with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = CourseCategory.objects.all()
    serializer_class = AdminCourseCategorySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name_tm', 'name_ru', 'name_en']
    ordering_fields = ['order', 'name_en']
    ordering = ['order', 'name_en']
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminLeaderboardCarouselViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for LeaderboardCarousel with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = LeaderboardCarousel.objects.all().select_related('course', 'exam_type')
    serializer_class = AdminLeaderboardCarouselSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active', 'course']
    ordering_fields = ['order', 'created_at']
    ordering = ['order', '-created_at']
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminCourseSubCategoryViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for CourseSubCategory with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = CourseSubCategory.objects.all().select_related('category')
    serializer_class = AdminCourseSubCategorySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name_tm', 'name_ru', 'name_en']
    ordering_fields = ['order', 'name_en']
    ordering = ['order', 'name_en']
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminLeaderboardCarouselViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for LeaderboardCarousel with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = LeaderboardCarousel.objects.all().select_related('course', 'exam_type')
    serializer_class = AdminLeaderboardCarouselSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active', 'course']
    ordering_fields = ['order', 'created_at']
    ordering = ['order', '-created_at']
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminCourseViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Course with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = Course.objects.all().select_related('subcategory', 'subcategory__category')
    serializer_class = AdminCourseSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['subcategory', 'subcategory__category', 'is_active']
    search_fields = ['title_tm', 'title_ru', 'title_en', 'description_tm', 'description_ru', 'description_en']
    ordering_fields = ['title_en', 'duration_weeks', 'price']
    ordering = ['title_en']
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminLeaderboardCarouselViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for LeaderboardCarousel with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = LeaderboardCarousel.objects.all().select_related('course', 'exam_type')
    serializer_class = AdminLeaderboardCarouselSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active', 'course']
    ordering_fields = ['order', 'created_at']
    ordering = ['order', '-created_at']
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminDashboardStatsView(APIView):
    """
    API endpoint to get dashboard statistics.
    Only accessible to superusers.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Return dashboard statistics."""
        stats = {
            'totalUsers': User.objects.count(),
            'totalTeachers': TeacherProfile.objects.count(),
            'totalCourses': Course.objects.count(),
            'totalMessages': ContactMessage.objects.count(),
            'totalNews': News.objects.count(),
        }
        return Response(stats)
