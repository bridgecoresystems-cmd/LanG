import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Consumer для системных уведомлений (Гемы, статусы, новости).
    Каждый пользователь подключается к своей персональной комнате.
    """
    async def connect(self):
        self.user = self.scope["user"]
        
        # Разрешаем подключение только авторизованным пользователям
        if self.user.is_authenticated:
            self.room_group_name = f"user_{self.user.id}"
            
            # Присоединяемся к группе пользователя
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # Метод для получения сообщения из группы и отправки в WebSocket
    async def send_notification(self, event):
        message = event["message"]
        notification_type = event.get("notification_type", "system")
        
        await self.send(text_data=json.dumps({
            "type": notification_type,
            "payload": message
        }))

