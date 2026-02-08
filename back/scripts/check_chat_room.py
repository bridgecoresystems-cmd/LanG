#!/usr/bin/env python
"""
Скрипт для проверки существования чат-комнаты и участников
Использование: python manage.py shell < scripts/check_chat_room.py
Или: python scripts/check_chat_room.py (если настроен Django)
"""

import os
import sys
import django

# Настройка Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.chat.models import Room
from apps.users.models import User

def check_room(room_id: int):
    """Проверяет существование комнаты и её участников"""
    try:
        room = Room.objects.get(id=room_id)
        print(f"✅ Комната найдена: {room.name}")
        print(f"   Тип: {room.room_type}")
        print(f"   Приватная: {room.is_private}")
        print(f"   Активна: {room.is_active}")
        print(f"   Участники:")
        
        participants = room.participants.all()
        for user in participants:
            print(f"     - {user.username} (ID: {user.id}, {user.get_full_name()})")
        
        if participants.count() == 0:
            print("   ⚠️  ВНИМАНИЕ: В комнате нет участников!")
        
        return True
    except Room.DoesNotExist:
        print(f"❌ Комната с ID {room_id} не найдена")
        return False

if __name__ == '__main__':
    if len(sys.argv) > 1:
        room_id = int(sys.argv[1])
        check_room(room_id)
    else:
        print("Использование: python check_chat_room.py <room_id>")
        print("Пример: python check_chat_room.py 1")
