"""
Middleware for automatic activity logging.
"""
from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone
from .models import ActivityLog
import json


class ActivityLogMiddleware(MiddlewareMixin):
    """
    Middleware для автоматического логирования действий пользователей.
    Логирует только запросы к API, которые содержат информацию о странице.
    """
    
    # Исключаем эти пути из логирования
    EXCLUDED_PATHS = [
        '/api/auth/',
        '/api/token/',
        '/static/',
        '/media/',
        '/admin/jsi18n/',
    ]
    
    def process_request(self, request):
        # Получаем информацию о странице из заголовков или query параметров
        page_path = request.META.get('HTTP_X_PAGE_PATH') or request.GET.get('page_path')
        component_name = request.META.get('HTTP_X_COMPONENT_NAME') or request.GET.get('component_name')
        action_type = request.META.get('HTTP_X_ACTION_TYPE') or request.GET.get('action_type', 'view')
        action_description = request.META.get('HTTP_X_ACTION_DESCRIPTION') or request.GET.get('action_description')
        object_type = request.META.get('HTTP_X_OBJECT_TYPE') or request.GET.get('object_type')
        object_id = request.META.get('HTTP_X_OBJECT_ID') or request.GET.get('object_id')
        object_name = request.META.get('HTTP_X_OBJECT_NAME') or request.GET.get('object_name')
        
        # Сохраняем в request для использования в process_response
        request._activity_log_data = {
            'page_path': page_path,
            'component_name': component_name,
            'action_type': action_type,
            'action_description': action_description,
            'object_type': object_type,
            'object_id': object_id,
            'object_name': object_name,
        }
    
    def process_response(self, request, response):
        # Логируем только успешные запросы (2xx, 3xx)
        if response.status_code >= 400:
            return response
        
        # Проверяем, нужно ли логировать
        if not self._should_log(request):
            return response
        
        # Не логируем действия суперпользователей
        if request.user.is_authenticated and request.user.is_superuser:
            return response
        
        # Получаем данные из request
        log_data = getattr(request, '_activity_log_data', {})
        if not log_data.get('page_path'):
            return response
        
        # Логируем действие
        try:
            object_id = None
            if log_data.get('object_id'):
                try:
                    object_id = int(log_data.get('object_id'))
                except (ValueError, TypeError):
                    pass
            
            ActivityLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action_type=log_data.get('action_type', 'view'),
                page_path=log_data.get('page_path', ''),
                component_name=log_data.get('component_name'),
                action_description=log_data.get('action_description'),
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                object_type=log_data.get('object_type'),
                object_id=object_id,
                object_name=log_data.get('object_name'),
                metadata={
                    'method': request.method,
                    'path': request.path,
                    'query_params': dict(request.GET),
                }
            )
        except Exception as e:
            # Не прерываем запрос при ошибке логирования
            print(f"Activity log error: {e}")
        
        return response
    
    def _should_log(self, request):
        """Проверяет, нужно ли логировать этот запрос"""
        path = request.path
        
        # Исключаем статические файлы и админку
        if any(path.startswith(excluded) for excluded in self.EXCLUDED_PATHS):
            return False
        
        # Логируем только API запросы
        if not path.startswith('/api/'):
            return False
        
        return True
    
    def _get_client_ip(self, request):
        """Получает IP адрес клиента"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

