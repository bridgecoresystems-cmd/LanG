from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def send_user_notification(user_id, message, notification_type="system"):
    """
    Отправляет уведомление конкретному пользователю через WebSocket.
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        {
            "type": "send_notification",
            "message": message,
            "notification_type": notification_type
        }
    )

def notify_balance_update(user_id, new_balance):
    """
    Уведомление об изменении баланса Гемов.
    """
    send_user_notification(
        user_id,
        {
            "new_balance": float(new_balance),
            "text": f"Ваш баланс обновлен: {new_balance} 💎"
        },
        notification_type="BALANCE_UPDATE"
    )

