"""
Admin views for users app with full CRUD operations.
Only accessible to superusers.
"""
import logging
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.contrib.auth import get_user_model
from .models import User, TeacherProfile, StudentProfile
from .serializers import (
    UserSerializer, TeacherProfileSerializer, TeacherListSerializer, StudentProfileSerializer,
    CreateTeacherSerializer, CreateStudentSerializer, CreateDirectorSerializer, CreateAdministratorSerializer,
    CreateHeadTeacherSerializer
)

logger = logging.getLogger(__name__)
User = get_user_model()


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for User with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'is_staff', 'is_superuser']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username', 'email']
    ordering = ['-created_at']
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Create user with password."""
        user = serializer.save()
        password = self.request.data.get('password')
        if password:
            user.set_password(password)
            user.save()
    
    def update(self, request, *args, **kwargs):
        """Override update to handle password separately."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Log request data for debugging
        logger.info(f"Updating user {instance.id} - Request data keys: {list(request.data.keys())}")
        logger.info(f"Updating user - Username: {request.data.get('username')}")
        logger.info(f"Updating user - Email: {request.data.get('email')}")
        logger.info(f"Updating user - Password provided: {request.data.get('password') is not None}")
        
        # Log instance details before creating serializer
        logger.info(f"Instance details - ID: {instance.id}, Username: '{instance.username}' (repr: {repr(instance.username)})")
        logger.info(f"Request data username: '{request.data.get('username')}' (repr: {repr(request.data.get('username'))})")
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as e:
            logger.error(f"Serializer validation errors: {e.detail}")
            logger.error(f"Instance username at error time: '{instance.username}'")
            raise
        
        # Get password from request data before saving
        # Handle both regular data and FormData
        password = None
        if hasattr(request.data, 'get'):
            password = request.data.get('password')
        elif isinstance(request.data, dict):
            password = request.data.get('password')
        
        # Convert to string if it's not None (FormData might send as list)
        if password is not None:
            if isinstance(password, list) and len(password) > 0:
                password = password[0]
            if not isinstance(password, str):
                password = str(password) if password else None
        
        logger.info(f"Password value: {password}, type: {type(password)}, is None: {password is None}")
        
        # Save user (password is excluded in serializer.update method)
        user = serializer.save()
        logger.info(f"User {user.id} saved successfully")
        
        # Check if password was provided and is not empty
        # Only update password if it's a non-empty string
        if password is not None:
            password_str = password.strip() if isinstance(password, str) else str(password).strip()
            if password_str:
                logger.info(f"Updating password for user {user.id}")
                user.set_password(password_str)
                user.save(update_fields=['password'])
                # Verify password was saved
                user.refresh_from_db()
                logger.info(f"Password updated for user {user.id}, has usable password: {user.has_usable_password()}")
            else:
                logger.info(f"Password provided but empty after strip, skipping update")
        else:
            logger.info(f"Password not provided, skipping password update")
        
        return Response(serializer.data)


class AdminTeacherProfileViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for TeacherProfile with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = TeacherProfile.objects.all().select_related('user')
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = None  # Disable server-side pagination to let frontend handle it
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user__is_active']
    search_fields = [
        'user__username', 'user__email', 'user__first_name', 'user__last_name',
        'specialization_tm', 'specialization_ru', 'specialization_en'
    ]
    ordering_fields = ['experience_years', 'views', 'likes']
    ordering = ['-experience_years']
    
    def get_serializer_class(self):
        """Use different serializers for list, detail, and create."""
        if self.action == 'list':
            return TeacherListSerializer
        elif self.action == 'create':
            return CreateTeacherSerializer
        return TeacherProfileSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Create teacher with user and profile."""
        serializer.save()


class AdminStudentProfileViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for StudentProfile with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = StudentProfile.objects.all().select_related('user').prefetch_related('user__student_groups')
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = None  # Disable server-side pagination to let frontend handle it
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user__is_active']
    search_fields = [
        'user__username', 'user__email', 'user__first_name', 'user__last_name',
        'parent_name', 'parent_phone'
    ]
    ordering_fields = ['user__created_at']
    ordering = ['-user__created_at']
    
    def get_queryset(self):
        """Filter students by group if group_id is provided."""
        queryset = super().get_queryset()
        
        # Filter by group_id if provided
        group_id = self.request.query_params.get('group_id')
        if group_id:
            from apps.courses.models import Group
            try:
                group = Group.objects.get(id=group_id)
                queryset = queryset.filter(user__student_groups=group)
            except Group.DoesNotExist:
                queryset = queryset.none()
        
        return queryset
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_serializer_class(self):
        """Use different serializers for create and other actions."""
        if self.action == 'create':
            return CreateStudentSerializer
        return StudentProfileSerializer
    
    def perform_create(self, serializer):
        """Create student with user and profile."""
        serializer.save()


class AdminDirectorViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Director with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = User.objects.filter(role=User.Role.DIRECTOR)
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username', 'email']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use different serializers for create and other actions."""
        if self.action == 'create':
            return CreateDirectorSerializer
        return UserSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Create director user."""
        serializer.save()


class AdminAdministratorViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Administrator (not superuser) with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = User.objects.filter(role=User.Role.ADMIN, is_superuser=False)
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username', 'email']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use different serializers for create and other actions."""
        if self.action == 'create':
            return CreateAdministratorSerializer
        return UserSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Create administrator user."""
        serializer.save()


class AdminHeadTeacherViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Head Teacher with full CRUD operations.
    Only accessible to superusers.
    """
    queryset = User.objects.filter(role=User.Role.HEAD_TEACHER)
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username', 'email']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use different serializers for create and other actions."""
        if self.action == 'create':
            return CreateHeadTeacherSerializer
        return UserSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Create head teacher user."""
        serializer.save()

