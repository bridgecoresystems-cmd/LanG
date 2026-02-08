# Быстрый старт Chat Service

## ✅ Что уже установлено:

- ✅ Bun (версия 1.3.5)
- ✅ Все зависимости (node_modules)
- ✅ .env файл настроен
- ✅ PostgreSQL подключение работает
- ✅ Директории для загрузки файлов созданы

## 🚀 Запуск:

```bash
cd chat-service
./start.sh
```

Или вручную:

```bash
export http_proxy="http://127.0.0.1:10809"
export https_proxy="http://127.0.0.1:10809"
bun run src/index.ts
```

## 📝 Проверка работы:

После запуска вы должны увидеть:

```
✅ PostgreSQL connected: PostgreSQL 14.20...
🚀 Chat service running on http://localhost:3001
📡 WebSocket: ws://localhost:3001/ws/chat/:roomId
🔌 REST API: http://localhost:3001/api
```

## 🔧 Если нужно обновить зависимости:

```bash
export http_proxy="http://127.0.0.1:10809"
export https_proxy="http://127.0.0.1:10809"
bun install
```

## ⚠️ Важно:

- `JWT_SECRET` в `.env` должен совпадать с `SECRET_KEY` в Django
- PostgreSQL должен быть запущен
- `DATABASE_URL` должен быть правильным

## 📚 Дополнительная информация:

См. `README_SETUP.md` и `CHAT_SETUP.md` в корне проекта.
