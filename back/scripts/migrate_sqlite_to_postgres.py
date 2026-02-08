#!/usr/bin/env python
"""
Скрипт для переноса данных из SQLite в PostgreSQL
"""
import os
import sys
import django

# Настройка Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connections
from django.core.management import call_command

def migrate_data():
    """Перенос данных из SQLite в PostgreSQL"""
    
    # Временно переключаемся на SQLite для чтения
    old_use_postgres = os.environ.get('USE_POSTGRES', 'False')
    os.environ['USE_POSTGRES'] = 'False'
    
    # Перезагружаем настройки
    from django.conf import settings
    from django import setup
    setup()
    
    sqlite_conn = connections['default']
    
    # Переключаемся обратно на PostgreSQL
    os.environ['USE_POSTGRES'] = old_use_postgres
    from django.conf import settings
    from django import setup
    setup()
    
    postgres_conn = connections['default']
    
    print("📦 Перенос данных из SQLite в PostgreSQL...")
    print("⚠️  Внимание: Этот скрипт переносит только основные данные.")
    print("   Для полного переноса используйте django-admin dumpdata/loaddata")
    
    # Используем встроенную команду Django для переноса
    try:
        # Сначала делаем дамп из SQLite
        print("1. Создание дампа из SQLite...")
        call_command('dumpdata', 
                    exclude=['contenttypes', 'auth.permission', 'sessions'],
                    output='sqlite_dump.json',
                    database='default')
        
        # Переключаемся на PostgreSQL
        os.environ['USE_POSTGRES'] = 'True'
        from django.conf import settings
        from django import setup
        setup()
        
        # Загружаем в PostgreSQL
        print("2. Загрузка данных в PostgreSQL...")
        call_command('loaddata', 'sqlite_dump.json', database='default')
        
        print("✅ Данные успешно перенесены!")
        
    except Exception as e:
        print(f"❌ Ошибка при переносе: {e}")
        print("💡 Попробуй вручную:")
        print("   1. USE_POSTGRES=False python manage.py dumpdata > dump.json")
        print("   2. USE_POSTGRES=True python manage.py loaddata dump.json")

if __name__ == '__main__':
    migrate_data()

