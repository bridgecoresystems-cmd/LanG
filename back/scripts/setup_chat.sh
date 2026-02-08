#!/bin/bash

# Скрипт для настройки чата между учителем и учеником
# Создает необходимые миграции и применяет их

cd "$(dirname "$0")/.." || exit

echo "🔧 Настройка чата..."

# Применяем миграции
echo "📦 Применение миграций Django..."
python manage.py makemigrations chat
python manage.py migrate chat

echo "✅ Чат настроен!"
echo ""
echo "📝 Следующие шаги:"
echo "1. Убедитесь, что PostgreSQL запущен"
echo "2. Проверьте настройки DATABASE_URL в .env"
echo "3. Запустите chat-service: cd ../chat-service && ./start.sh"
echo "4. Запустите Django: python manage.py runserver"
