"""
WebSocket routing for Language School Management System.
"""
from django.urls import re_path
from apps.chat import consumers

websocket_urlpatterns = [
    # Системные уведомления (Гемы, статусы, и т.д.)
    re_path(r"ws/notifications/$", consumers.NotificationConsumer.as_asgi()),
]
