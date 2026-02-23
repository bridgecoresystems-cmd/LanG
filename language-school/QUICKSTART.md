# 🚀 Quick Start Guide

**Быстрый старт для Language School проекта от BridgeCore SYSTEMS**

---

## ⚡ Установка и запуск за 1 минуту

### 1. Установка зависимостей

```bash
cd language-school
bun install
```

### 2. Настройка окружения

```bash
# Скопировать пример
cp .env.example .env

# Отредактировать .env (если нужно)
# Обычно значения по умолчанию подходят для разработки
```

### 3. База данных

```bash
# Применить миграции
bun run db:push

# Или создать миграции
bun run db:generate
bun run db:migrate
```

### 4. Запуск разработки

```bash
# Один командой (backend + frontend)
bun run dev

# Или по отдельности в разных терминалах
bun run dev:backend   # http://localhost:8000
bun run dev:frontend  # http://localhost:3000
```

---

## 📚 Все команды

### Основные

| Команда | Описание |
|---------|----------|
| `bun run dev` | Запустить backend + frontend одновременно |
| `bun run dev:backend` | Запустить только backend (Elysia) |
| `bun run dev:frontend` | Запустить только frontend (Nuxt) |
| `bun run build` | Собрать backend + frontend |
| `bun run start` | Запустить production backend |

### База данных

| Команда | Описание |
|---------|----------|
| `bun run db:generate` | Создать новую миграцию |
| `bun run db:migrate` | Применить миграции |
| `bun run db:push` | Push схемы (для разработки) |
| `bun run db:studio` | Открыть Drizzle Studio (GUI) |
| `bun run seed` | Заполнить БД тестовыми данными |

### Утилиты

| Команда | Описание |
|---------|----------|
| `bun run typecheck` | Проверка типов TypeScript |
| `bun run lint` |Lint frontend кода |
| `bun run format` | Форматирование кода (Prettier) |
| `bun run clean` | Удалить node_modules |
| `bun run install:all` | Перустановить все зависимости |

---

## 🔗 Полезные ссылки

| Сервис | URL |
|--------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **Swagger Docs** | http://localhost:8000/swagger |
| **Drizzle Studio** | http://localhost:3000 (отдельный порт) |

---

## 🐛 Частые проблемы

### Ошибка: `crypto.hash is not a function`

**Решение:** Обновить Node.js до 22+

```bash
nvm install 22 && nvm use 22
```

### Ошибка: Порт 8000 или 3000 занят

**Решение:** Изменить порт в `.env`

```bash
PORT=8001  # для backend
PORT=3001  # для frontend
```

### Ошибка: База данных не подключается

**Решение:** Проверить DATABASE_URL в `.env`

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/language_school
```

---

## 📞 Поддержка

- **Документация:** [README.md](./README.md)
- **Сайт разработчика:** [bridgecore.tech](https://bridgecore.tech)
- **Email:** info@bridgecore.tech

---

**Made with ❤️ by BridgeCore SYSTEMS**
