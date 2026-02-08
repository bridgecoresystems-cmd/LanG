"""
Views for landing app.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
from rest_framework.pagination import PageNumberPagination
from .models import News, ContactMessage, CourseCategory, CourseSubCategory, Course, LeaderboardCarousel
from .serializers import (
    NewsSerializer, ContactMessageSerializer, ContactMessageCreateSerializer,
    CourseCategorySerializer, CourseSubCategorySerializer, CourseSerializer,
    LeaderboardCarouselSerializer
)


class NewsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for News.
    Read-only for public access.
    """
    queryset = News.objects.filter(is_published=True)
    serializer_class = NewsSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["is_featured"]
    ordering_fields = ["created_at", "updated_at", "views"]
    ordering = ["-is_featured", "-created_at"]
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def increment_views(self, request, pk=None):
        """Увеличить счетчик просмотров новости."""
        news = self.get_object()
        News.objects.filter(pk=news.pk).update(views=F('views') + 1)
        news.refresh_from_db()
        
        return Response({
            'id': news.id,
            'views': news.views
        }, status=status.HTTP_200_OK)


class LeaderboardCarouselViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for LeaderboardCarousel.
    Read-only for public access.
    """
    queryset = LeaderboardCarousel.objects.filter(is_active=True)
    serializer_class = LeaderboardCarouselSerializer
    permission_classes = [AllowAny]
    ordering = ['order', '-created_at']

    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ContactMessagePagination(PageNumberPagination):
    """Pagination for contact messages."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class ContactMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ContactMessage.
    Public can create messages, but only approved messages are visible.
    """
    queryset = ContactMessage.objects.all()
    permission_classes = [AllowAny]
    pagination_class = ContactMessagePagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'likes']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ContactMessageCreateSerializer
        return ContactMessageSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_anonymous or not self.request.user.is_staff:
            queryset = queryset.filter(status='approved')
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message = ContactMessage.objects.create(
            name=serializer.validated_data['name'],
            phone=serializer.validated_data['phone'],
            email=serializer.validated_data['email'],
            message=serializer.validated_data['message'],
            status='pending'
        )
        
        return Response({
            'status': 'success',
            'message': 'Your message has been sent. It will be reviewed before being published.',
            'data': ContactMessageSerializer(message).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        message = self.get_object()
        if message.liked_by.filter(id=request.user.id).exists():
            message.liked_by.remove(request.user)
            message.likes = max(0, message.likes - 1)
            is_liked = False
        else:
            message.liked_by.add(request.user)
            message.likes = message.likes + 1
            is_liked = True
        message.save()
        return Response({
            'id': message.id,
            'likes': message.likes,
            'is_liked': is_liked
        }, status=status.HTTP_200_OK)


class CourseCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for CourseCategory.
    Read-only for public access.
    """
    queryset = CourseCategory.objects.filter(is_active=True)
    serializer_class = CourseCategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['order', 'name_en']
    ordering = ['order', 'name_en']
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class CourseSubCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for CourseSubCategory.
    Read-only for public access.
    """
    queryset = CourseSubCategory.objects.filter(is_active=True).select_related('category')
    serializer_class = CourseSubCategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['category']
    ordering_fields = ['order', 'name_en']
    ordering = ['order', 'name_en']
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Course.
    Read-only for public access.
    """
    queryset = Course.objects.filter(is_active=True).select_related('subcategory', 'subcategory__category')
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['subcategory', 'subcategory__category']
    ordering_fields = ['title_en', 'duration_weeks', 'price']
    ordering = ['title_en']
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
