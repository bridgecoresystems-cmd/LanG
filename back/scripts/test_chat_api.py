#!/usr/bin/env python3
"""
Скрипт для тестирования API создания чат-комнаты
Использование: python3 scripts/test_chat_api.py <user_id>
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
from apps.chat.views import RoomViewSet
from rest_framework.test import APIRequestFactory
from rest_framework import status

def test_direct_message_creation(teacher_id: int, student_id: int):
    """Тестирует создание Direct Message комнаты"""
    print(f"🧪 Тестирование создания Direct Message комнаты...")
    print(f"   Учитель ID: {teacher_id}")
    print(f"   Ученик ID: {student_id}")
    
    try:
        teacher = User.objects.get(id=teacher_id)
        student = User.objects.get(id=student_id)
        print(f"✅ Учитель найден: {teacher.username}")
        print(f"✅ Ученик найден: {student.username}")
    except User.DoesNotExist as e:
        print(f"❌ Пользователь не найден: {e}")
        return False
    
    # Проверяем существующие комнаты
    existing_rooms = Room.objects.filter(
        room_type=Room.RoomType.DIRECT,
        participants=teacher,
        is_private=True
    ).filter(participants=student)
    
    print(f"\n📋 Существующие Direct Message комнаты: {existing_rooms.count()}")
    for room in existing_rooms:
        print(f"   - ID: {room.id}, Name: {room.name}, Active: {room.is_active}")
        print(f"     Участники: {[p.username for p in room.participants.all()]}")
    
    # Создаем комнату через API логику
    room = Room.objects.filter(
        room_type=Room.RoomType.DIRECT,
        participants=teacher,
        is_private=True
    ).filter(participants=student).first()
    
    if not room:
        print(f"\n🆕 Создание новой комнаты...")
        room_name = f"{teacher.get_full_name() or teacher.username} & {student.get_full_name() or student.username}"
        room = Room.objects.create(
            name=room_name,
            room_type=Room.RoomType.DIRECT,
            is_private=True,
            is_active=True
        )
        room.participants.add(teacher, student)
        print(f"✅ Комната создана: ID={room.id}, Name={room.name}")
    else:
        print(f"\n✅ Комната уже существует: ID={room.id}, Name={room.name}")
    
    # Проверяем участников
    participants = room.participants.all()
    print(f"\n👥 Участники комнаты {room.id}:")
    for p in participants:
        print(f"   - {p.username} (ID: {p.id})")
    
    if participants.count() != 2:
        print(f"❌ ОШИБКА: Ожидалось 2 участника, найдено {participants.count()}")
        return False
    
    if teacher not in participants or student not in participants:
        print(f"❌ ОШИБКА: Не все участники добавлены!")
        return False
    
    print(f"\n✅ Тест пройден успешно!")
    print(f"   Комната ID: {room.id}")
    print(f"   Комната активна: {room.is_active}")
    print(f"   Участников: {participants.count()}")
    
    return True

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Использование: python3 test_chat_api.py <teacher_id> <student_id>")
        print("Пример: python3 test_chat_api.py 31 123")
        sys.exit(1)
    
    teacher_id = int(sys.argv[1])
    student_id = int(sys.argv[2])
    
    success = test_direct_message_creation(teacher_id, student_id)
    sys.exit(0 if success else 1)
