"""
Views for users app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import F
from django.contrib.auth import update_session_auth_hash
from .models import User, TeacherProfile, StudentProfile
from .serializers import (
    TeacherProfileSerializer, 
    TeacherListSerializer, 
    UserSerializer,
    ChangePasswordSerializer,
    StudentProfileSerializer
)


class TeacherProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for TeacherProfile.
    Read-only for public access.
    """
    queryset = TeacherProfile.objects.select_related('user').filter(
        user__is_active=True,
        user__role=User.Role.TEACHER
    )
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        """Use different serializers for list and detail."""
        if self.action == 'list':
            return TeacherListSerializer
        return TeacherProfileSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_object(self):
        """Get TeacherProfile by user.id instead of pk."""
        lookup_value = self.kwargs.get('pk')
        queryset = self.get_queryset()
        try:
            # Convert to int in case it's a string
            user_id = int(lookup_value)
            obj = queryset.get(user__id=user_id)
            return obj
        except (TeacherProfile.DoesNotExist, ValueError, TypeError):
            from rest_framework.exceptions import NotFound
            raise NotFound("No TeacherProfile matches the given query.")
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def increment_views(self, request, pk=None):
        """Увеличить счетчик просмотров профиля учителя."""
        teacher = self.get_object()
        TeacherProfile.objects.filter(pk=teacher.pk).update(views=F('views') + 1)
        teacher.refresh_from_db()
        
        return Response({
            'id': teacher.user.id,
            'views': teacher.views
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """Toggle like для учителя. Только для авторизованных пользователей."""
        teacher = self.get_object()
        
        # Проверяем, поставил ли пользователь уже лайк
        if teacher.liked_by.filter(id=request.user.id).exists():
            # Убираем лайк
            teacher.liked_by.remove(request.user)
            teacher.likes = max(0, teacher.likes - 1)
            teacher.save()
            is_liked = False
        else:
            # Добавляем лайк
            teacher.liked_by.add(request.user)
            teacher.likes = teacher.likes + 1
            teacher.save()
            is_liked = True
        
        teacher.refresh_from_db()
        
        return Response({
            'id': teacher.user.id,
            'likes': teacher.likes,
            'is_liked': is_liked
        }, status=status.HTTP_200_OK)


class StaffViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing staff members (Head Teachers, Teachers).
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.filter(is_active=True).select_related('wallet')
        
        # Director sees Head Teachers and Teachers
        if user.role == User.Role.DIRECTOR:
            role = self.request.query_params.get('role')
            if role:
                return queryset.filter(role=role)
            return queryset.filter(role__in=[User.Role.HEAD_TEACHER, User.Role.TEACHER])
        
        # Head Teacher sees Teachers
        if user.role == User.Role.HEAD_TEACHER:
            return queryset.filter(role=User.Role.TEACHER)
            
        return queryset.none()


class StudentProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing student profiles.
    Available for staff (Head Teachers, Directors).
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [User.Role.DIRECTOR, User.Role.HEAD_TEACHER, User.Role.ADMIN]:
            return User.objects.filter(role=User.Role.STUDENT, is_active=True).select_related('wallet')
        return User.objects.none()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Get current authenticated user."""
    try:
        user = request.user
        if not user or user.is_anonymous:
            return Response({'detail': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
            
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in current_user view: {str(e)}", exc_info=True)
        return Response({'detail': f'Internal server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password."""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    # Update session auth hash to prevent logout after password change
    update_session_auth_hash(request, request.user)
    
    return Response({
        'status': 'success',
        'message': 'Password changed successfully.'
    }, status=status.HTTP_200_OK)
