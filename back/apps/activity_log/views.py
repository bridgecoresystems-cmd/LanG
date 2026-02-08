"""
API Views for Activity Log.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from rest_framework.pagination import PageNumberPagination
from .models import ActivityLog
from .serializers import ActivityLogSerializer
from .permissions import CanViewActivityLog


class ActivityLogPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 10000


class ActivityLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet для просмотра и создания логов активности пользователей.
    Логи создаются автоматически через middleware или вручную через API.
    Только администраторы могут просматривать логи.
    """
    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer
    permission_classes = [CanViewActivityLog]
    pagination_class = ActivityLogPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    def get_permissions(self):
        """
        Разрешаем создание логов всем аутентифицированным пользователям.
        Просмотр - только администраторам.
        """
        if self.action == 'create':
            from rest_framework.permissions import IsAuthenticated
            return [IsAuthenticated()]
        return [CanViewActivityLog()]
    
    filterset_fields = {
        'user': ['exact'],
        'action_type': ['exact'],
        'page_path': ['icontains'],
        'component_name': ['icontains'],
        'timestamp': ['gte', 'lte'],
        'object_type': ['exact'],
    }
    
    search_fields = [
        'user__username',
        'user__first_name',
        'user__last_name',
        'action_description',
        'object_name',
        'page_path',
    ]
    
    ordering_fields = ['timestamp', 'user', 'action_type']
    ordering = ['-timestamp']
    
    @action(detail=False, methods=['get'])
    def by_user(self, request):
        """Получить логи конкретного пользователя"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=400)
        
        logs = self.queryset.filter(user_id=user_id)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Статистика по активности"""
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)
        
        stats = {
            'total_actions': ActivityLog.objects.filter(timestamp__gte=start_date).count(),
            'by_action_type': {},
            'by_user': [],
            'by_page': [],
        }
        
        # По типам действий
        for action_type, label in ActivityLog.ActionType.choices:
            count = ActivityLog.objects.filter(
                timestamp__gte=start_date,
                action_type=action_type
            ).count()
            stats['by_action_type'][label] = count
        
        # По пользователям (топ 10)
        top_users = ActivityLog.objects.filter(
            timestamp__gte=start_date,
            user__isnull=False
        ).values('user__username', 'user__first_name', 'user__last_name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        stats['by_user'] = [
            {
                'user': f"{u['user__first_name']} {u['user__last_name']}".strip() or u['user__username'],
                'count': u['count']
            }
            for u in top_users
        ]
        
        # По страницам (топ 10)
        top_pages = ActivityLog.objects.filter(
            timestamp__gte=start_date
        ).values('page_path').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        stats['by_page'] = [
            {
                'page': p['page_path'],
                'count': p['count']
            }
            for p in top_pages
        ]
        
        return Response(stats)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_activity_log(request):
    """
    Endpoint для создания лога активности.
    Доступен всем аутентифицированным пользователям.
    Не логирует действия администраторов/суперпользователей.
    """
    # Не логируем действия суперпользователей
    if request.user.is_superuser:
        return Response({'message': 'Activity logging skipped for superusers'}, status=status.HTTP_200_OK)
    
    # Создаем лог напрямую, чтобы убедиться, что user установлен правильно
    data = request.data.copy()
    
    # Получаем IP адрес
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    
    # Создаем лог напрямую
    log_entry = ActivityLog.objects.create(
        user=request.user,  # Устанавливаем пользователя из запроса
        action_type=data.get('action_type', 'view'),
        page_path=data.get('page_path', ''),
        component_name=data.get('component_name'),
        action_description=data.get('action_description'),
        ip_address=ip,
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
        object_type=data.get('object_type'),
        object_id=data.get('object_id'),
        object_name=data.get('object_name'),
        metadata={}
    )
    
    # Возвращаем сериализованные данные
    serializer = ActivityLogSerializer(log_entry)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

