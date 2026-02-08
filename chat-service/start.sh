#!/bin/bash

# Скрипт для запуска chat-service
# Использует proxy настройки из .cursorrules

# Экспортируем proxy настройки для интернет-запросов
export http_proxy="http://127.0.0.1:10809"
export https_proxy="http://127.0.0.1:10809"

# Загружаем переменные окружения из .env файла
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Проверяем наличие bun
if ! command -v bun &> /dev/null; then
    echo "❌ Bun не установлен. Установите Bun: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    bun install
fi

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "⚠️  Файл .env не найден. Создаю .env из примера..."
    cat > .env << EOF
PORT=3001
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://lang_user:lang_password@localhost:5432/lang_db
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
UPLOAD_DIR=./src/uploads
MAX_FILE_SIZE=10485760
EOF
    echo "✅ Создан файл .env. Пожалуйста, отредактируйте его с правильными значениями."
fi

echo "🚀 Запуск chat-service..."
echo "📡 WebSocket: ws://localhost:${PORT:-3001}/ws/chat/:roomId"
echo "🔌 REST API: http://localhost:${PORT:-3001}/api"

# Запускаем сервис
bun run src/index.ts
