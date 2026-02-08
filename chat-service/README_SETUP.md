# Настройка Chat Service

## Требования

- Bun (JavaScript runtime)
- PostgreSQL (та же БД что и Django)
- JWT Secret (должен совпадать с Django SECRET_KEY)

## Быстрый старт

1. **Настройте переменные окружения**

   Создайте файл `.env` в корне `chat-service/`:

   ```bash
   PORT=3001
   JWT_SECRET=your-secret-key-here  # Должен совпадать с Django SECRET_KEY
   DATABASE_URL=postgresql://lang_user:lang_password@localhost:5432/lang_db
   CORS_ORIGIN=http://localhost:5173
   LOG_LEVEL=info
   UPLOAD_DIR=./src/uploads
   MAX_FILE_SIZE=10485760
   ```

2. **Установите зависимости**

   ```bash
   bun install
   ```

3. **Запустите сервис**

   ```bash
   ./start.sh
   ```

   Или вручную:

   ```bash
   export http_proxy="http://127.0.0.1:10809"
   export https_proxy="http://127.0.0.1:10809"
   bun run src/index.ts
   ```

## Проверка работы

После запуска вы должны увидеть:

```
🚀 Chat service running on http://localhost:3001
📡 WebSocket: ws://localhost:3001/ws/chat/:roomId
🔌 REST API: http://localhost:3001/api
✅ PostgreSQL connected: ...
```

## API Endpoints

- `GET /` - Health check
- `GET /health` - Health check
- `GET /api/rooms` - Список комнат пользователя
- `GET /api/rooms/:roomId` - Информация о комнате
- `GET /api/rooms/:roomId/messages` - Сообщения комнаты
- `POST /api/rooms/:roomId/messages` - Создать сообщение
- `POST /api/upload` - Загрузить файл (изображение/аудио)
- `WS /ws/chat/:roomId?token=...` - WebSocket соединение

## Интеграция с Django

Chat service использует ту же PostgreSQL базу данных что и Django.

Таблицы:
- `chat_room` - Комнаты чата
- `chat_message` - Сообщения
- `chat_room_participants` - Участники комнат (ManyToMany)
- `chat_messagereadstatus` - Статусы прочтения
- `users_user` - Пользователи

## Создание чата между учителем и учеником

Используйте Django API:

```bash
POST /api/v1/chat/rooms/direct_message/
{
  "user_id": 123  # ID ученика или учителя
}
```

Это создаст или вернет существующую комнату для прямой переписки.
