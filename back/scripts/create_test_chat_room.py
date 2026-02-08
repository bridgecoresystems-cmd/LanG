#!/usr/bin/env python3
"""
Скрипт для создания тестовой Direct Message комнаты вручную
Использование: python3 scripts/create_test_chat_room.py <teacher_id> <student_id>
"""

import sys
import os
import django

# Настройка Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.chat.models import Room
from apps.users.models import User

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Использование: python3 create_test_chat_room.py <teacher_id> <student_id>")
        print("Пример: python3 create_test_chat_room.py 31 123")
        sys.exit(1)
    
    teacher_id = int(sys.argv[1])
    student_id = int(sys.argv[2])
    
    try:
        teacher = User.objects.get(id=teacher_id)
        student = User.objects.get(id=student_id)
    except User.DoesNotExist as e:
        print(f"❌ Пользователь не найден: {e}")
        sys.exit(1)
    
    # Проверяем существующую комнату
    existing = Room.objects.filter(
        room_type=Room.RoomType.DIRECT,
        participants=teacher,
        is_private=True
    ).filter(participants=student).first()
    
    if existing:
        print(f"✅ Комната уже существует:")
        print(f"   ID: {existing.id}")
        print(f"   Name: {existing.name}")
        print(f"   Active: {existing.is_active}")
        print(f"   Participants: {[p.username for p in existing.participants.all()]}")
    else:
        # Создаем новую
        room_name = f"{teacher.get_full_name() or teacher.username} & {student.get_full_name() or student.username}"
        room = Room.objects.create(
            name=room_name,
            room_type=Room.RoomType.DIRECT,
            is_private=True,
            is_active=True
        )
        room.participants.add(teacher, student)
        print(f"✅ Комната создана:")
        print(f"   ID: {room.id}")
        print(f"   Name: {room.name}")
        print(f"   Active: {room.is_active}")
        print(f"   Participants: {[p.username for p in room.participants.all()]}")
