# Chat Service API Documentation

## Base URL
```
http://localhost:3001
```

## Authentication

Все запросы (кроме WebSocket подключения) требуют JWT токен в заголовке:
```
Authorization: Bearer <token>
```

Токен должен быть выдан Django сервером и использовать тот же `SECRET_KEY`.

---

## WebSocket API

### Подключение к чату

```
ws://localhost:3001/ws/chat/:roomId?token=<jwt_token>
```

**Параметры:**
- `roomId` - ID комнаты
- `token` - JWT токен (query параметр или в заголовке Authorization)

**События при подключении:**
- Автоматически отправляется история последних 50 сообщений
- Отправляется уведомление `user_joined` всем участникам

### Отправка сообщений

**Тип: `message`**
```json
{
  "type": "message",
  "content": "Текст сообщения",
  "file_path": "/uploads/images/photo.jpg",  // опционально
  "file_name": "photo.jpg",                    // опционально
  "file_type": "image"                         // опционально: "image" | "audio"
}
```

**Ответ:**
```json
{
  "type": "message_sent",
  "message_id": 123,
  "timestamp": 1234567890
}
```

### Статус "печатает"

**Тип: `typing`**
```json
{
  "type": "typing"
}
```

Автоматически удаляется через 3 секунды.

**Тип: `stop_typing`**
```json
{
  "type": "stop_typing"
}
```

### Статус прочтения

**Тип: `read`**
```json
{
  "type": "read",
  "message_id": 123
}
```

**Ответ:**
```json
{
  "type": "read_confirmed",
  "message_id": 123,
  "timestamp": 1234567890
}
```

### Получение сообщений

**Тип: `messages_history`** (автоматически при подключении)
```json
{
  "type": "messages_history",
  "room_id": 1,
  "messages": [...]
}
```

### События от сервера

**`user_joined`** - пользователь подключился
```json
{
  "type": "user_joined",
  "room_id": 1,
  "user_id": 5,
  "timestamp": 1234567890
}
```

**`user_left`** - пользователь отключился
```json
{
  "type": "user_left",
  "room_id": 1,
  "user_id": 5,
  "timestamp": 1234567890
}
```

**`message`** - новое сообщение
```json
{
  "type": "message",
  "room_id": 1,
  "user_id": 5,
  "message": {
    "id": 123,
    "room_id": 1,
    "user_id": 5,
    "content": "Текст сообщения",
    "file": "/uploads/images/photo.jpg",
    "file_name": "photo.jpg",
    "is_edited": false,
    "is_deleted": false,
    "created_at": "2024-01-01T12:00:00Z",
    "user": {
      "id": 5,
      "username": "user123",
      "first_name": "Имя",
      "last_name": "Фамилия",
      "avatar": "/media/avatars/avatar.jpg"
    }
  },
  "timestamp": 1234567890
}
```

**`typing`** - пользователь печатает
```json
{
  "type": "typing",
  "room_id": 1,
  "user_id": 5,
  "timestamp": 1234567890
}
```

**`stop_typing`** - пользователь перестал печатать
```json
{
  "type": "stop_typing",
  "room_id": 1,
  "user_id": 5,
  "timestamp": 1234567890
}
```

---

## REST API

### Получить список комнат

```
GET /api/rooms
```

**Ответ:**
```json
{
  "rooms": [
    {
      "id": 1,
      "name": "Course Chat",
      "room_type": "course",
      "course_id": 5,
      "is_private": false,
      "is_active": true,
      "message_count": 42,
      "last_message_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Получить информацию о комнате

```
GET /api/rooms/:roomId
```

**Ответ:**
```json
{
  "room": {
    "id": 1,
    "name": "Course Chat",
    "room_type": "course",
    "course_id": 5,
    "is_private": false,
    "is_active": true,
    "participants": [
      {
        "id": 5,
        "username": "user123",
        "first_name": "Имя",
        "last_name": "Фамилия",
        "avatar": "/media/avatars/avatar.jpg",
        "role": "student"
      }
    ]
  }
}
```

### Получить сообщения комнаты

```
GET /api/rooms/:roomId/messages?page=1&limit=50
```

**Параметры:**
- `page` - номер страницы (по умолчанию: 1)
- `limit` - количество сообщений (по умолчанию: 50)

**Ответ:**
```json
{
  "messages": [
    {
      "id": 123,
      "room_id": 1,
      "user_id": 5,
      "content": "Текст сообщения",
      "file": "/uploads/images/photo.jpg",
      "file_name": "photo.jpg",
      "is_edited": false,
      "is_deleted": false,
      "created_at": "2024-01-01T12:00:00Z",
      "username": "user123",
      "first_name": "Имя",
      "last_name": "Фамилия",
      "avatar": "/media/avatars/avatar.jpg",
      "read_count": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### Создать сообщение

```
POST /api/rooms/:roomId/messages
```

**Тело запроса:**
```json
{
  "content": "Текст сообщения",
  "file_path": "/uploads/images/photo.jpg",  // опционально
  "file_name": "photo.jpg"                    // опционально
}
```

**Ответ:**
```json
{
  "message": {
    "id": 123,
    "room_id": 1,
    "user_id": 5,
    "content": "Текст сообщения",
    "file": "/uploads/images/photo.jpg",
    "file_name": "photo.jpg",
    "is_edited": false,
    "is_deleted": false,
    "created_at": "2024-01-01T12:00:00Z",
    "user": {
      "id": 5,
      "username": "user123",
      "first_name": "Имя",
      "last_name": "Фамилия",
      "avatar": "/media/avatars/avatar.jpg"
    }
  }
}
```

### Редактировать сообщение

```
PATCH /api/messages/:messageId
```

**Тело запроса:**
```json
{
  "content": "Обновленный текст"
}
```

**Ответ:**
```json
{
  "message": {
    "id": 123,
    "content": "Обновленный текст",
    "is_edited": true,
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

### Удалить сообщение

```
DELETE /api/messages/:messageId
```

**Ответ:**
```json
{
  "success": true
}
```

### Загрузить файл

```
POST /api/upload
```

**Content-Type:** `multipart/form-data`

**Поля:**
- `file` - файл (обязательно)
- `room_id` - ID комнаты (обязательно)
- `file_type` - тип файла: `"image"` или `"audio"` (обязательно)

**Ответ:**
```json
{
  "file_path": "/uploads/images/room_1_user_5_1234567890.jpg",
  "file_name": "photo.jpg",
  "file_size": 102400
}
```

**Обработка:**
- **Изображения:** автоматически сжимаются и ресайзятся до 1920x1920
- **Аудио:** сохраняются как есть

**Ограничения:**
- Максимальный размер: 10MB (настраивается через `MAX_FILE_SIZE`)
- Изображения: JPEG, PNG, WebP
- Аудио: MP3, WAV, OGG, WebM

### Отметить сообщения как прочитанные

```
POST /api/rooms/:roomId/read
```

Отмечает все непрочитанные сообщения в комнате как прочитанные текущим пользователем.

**Ответ:**
```json
{
  "success": true
}
```

---

## Статические файлы

### Получить изображение

```
GET /uploads/images/:filename
```

### Получить аудио файл

```
GET /uploads/audio/:filename
```

---

## Ошибки

Все ошибки возвращаются в формате:
```json
{
  "error": "Error message",
  "statusCode": 400
}
```

**Коды ошибок:**
- `400` - Bad Request (неверные данные)
- `401` - Unauthorized (нет токена или неверный токен)
- `403` - Forbidden (нет доступа к комнате)
- `404` - Not Found (комната/сообщение не найдено)
- `500` - Internal Server Error

---

## Примеры использования

### Vue.js WebSocket подключение

```typescript
const token = localStorage.getItem('access_token')
const roomId = 1
const ws = new WebSocket(`ws://localhost:3001/ws/chat/${roomId}?token=${token}`)

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  switch (data.type) {
    case 'message':
      // Новое сообщение
      break
    case 'user_joined':
      // Пользователь подключился
      break
    case 'typing':
      // Пользователь печатает
      break
  }
}

// Отправить сообщение
ws.send(JSON.stringify({
  type: 'message',
  content: 'Привет!'
}))
```

### Загрузка файла

```typescript
const formData = new FormData()
formData.append('file', file)
formData.append('room_id', '1')
formData.append('file_type', 'image')

const response = await fetch('http://localhost:3001/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})

const result = await response.json()
```

