# 🎓 Language School

**Современная платформа для управления языковыми школами**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3-white?logo=bun)](https://bun.com/)
[![Elysia](https://img.shields.io/badge/Elysia-1.3-red?logo=elysia)](https://elysiajs.com/)
[![Nuxt](https://img.shields.io/badge/Nuxt-3.0-green?logo=nuxt.js)](https://nuxt.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-orange?logo=drizzle)](https://orm.drizzle.team/)
[![Lucia](https://img.shields.io/badge/Lucia-Auth-black)](https://lucia-auth.com/)

---

## 🏢 О разработчике

**Разработано:** [BridgeCore SYSTEMS](https://bridgecore.tech)  
**CEO & Founder:** Batyr Akmuradov  
**Опыт:** 10+ лет в разработке ERP систем  
**Локация:** Туркменистан 🇹🇲

| Показатель | Значение |
|------------|----------|
| Завершённых проектов | 10+ |
| Довольных клиентов | 5+ |
| Уровень успеха | 99% |
| Специализация | ERP-системы для бизнеса |

**Технологический стек:** TypeScript, Bun, Elysia.js, Drizzle ORM, Lucia Auth, Nuxt 3, Capacitor

---

## 📖 О проекте

**Language School** — это полнофункциональная система управления для языковых школ с поддержкой:

- 👥 **Управление пользователями** (студенты, преподаватели, администраторы, директора)
- 🏫 **Мульти-школьность** (одна система для нескольких филиалов)
- 📚 **Курсы и категории** (с многоязычной поддержкой TM/RU/EN)
- 📊 **Кабинет студента** (успеваемость, посещаемость, баланс)
- 🔐 **Ролевая модель** (SUPERUSER, DIRECTOR, HEAD_TEACHER, TEACHER, STUDENT, PARENT)
- 💳 **Продажи и оплаты** (трекинг платежей, скидки)
- 📱 **WebSocket** (real-time уведомления)
- 🎮 **Геймификация** (гемы, достижения, игры)

---

## 🏗 Архитектура

```
language-school/
├── packages/
│   ├── backend/          # Elysia.js API сервер
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── db/       # Drizzle ORM + схема БД
│   │   │   ├── auth/     # Lucia authentication
│   │   │   ├── models/   # Бизнес-логика
│   │   │   └── services/ # Внешние сервисы
│   │   └── drizzle/      # Миграции БД
│   │
│   └── frontend/         # Nuxt 3 приложение
│       ├── pages/        # Страницы (Admin, Cabinet, Landing)
│       ├── components/   # Vue компоненты
│       ├── composables/  # Composition API + Eden Treaty
│       ├── stores/       # Pinia state management
│       └── i18n/         # Интернационализация
│
└── package.json          # Workspace корень
```

---

## 🚀 Стек технологий

### Backend

| Технология | Версия | Назначение |
|------------|--------|------------|
| **Bun** | 1.3+ | JavaScript runtime |
| **Elysia.js** | 1.3+ | HTTP фреймворк |
| **Drizzle ORM** | 0.45+ | Работа с PostgreSQL |
| **Lucia** | 3.2+ | Аутентификация (session-based) |
| **PostgreSQL** | 14+ | Основная БД |
| **Eden Treaty** | 1.4+ | Type-safe API клиент |

### Frontend

| Технология | Версия | Назначение |
|------------|--------|------------|
| **Nuxt 3** | 3.x | Vue фреймворк |
| **Vue 3** | 3.x | UI фреймворк |
| **TypeScript** | 5.x | Типизация |
| **Pinia** | 2.2+ | State management |
| **Naive UI** | 2.38+ | UI компоненты |
| **TailwindCSS** | 3.4+ | Стилизация |
| **Vue I18n** | 9.x | Интернационализация |
| **Eden Treaty** | 1.4+ | API клиент |

---

## 📦 Установка

### Требования

- **Bun** ≥ 1.3 (`curl -fsSL https://bun.sh/install | bash`)
- **Node.js** ≥ 22.12 (для frontend dev сервера)
- **PostgreSQL** ≥ 14

### 1. Клонирование

```bash
git clone <repository-url>
cd language-school
```

### 2. Установка зависимостей

```bash
bun install
```

### 3. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# Backend (.env в packages/backend/ или корневой)
DATABASE_URL=postgresql://user:password@localhost:5432/language_school
PORT=8000
NODE_ENV=development

# Frontend (.env в packages/frontend/)
API_URL=http://localhost:8000
NUXT_PUBLIC_API_BASE=http://localhost:8000
```

> 💡 **Совет:** Скопируйте `.env.example` (если есть) и заполните значения.

### 4. Настройка базы данных

```bash
cd packages/backend

# Генерация миграций
bun run db:generate

# Применение миграций
bun run db:migrate

# Или push схемы (для разработки)
bun run db:push
```

### 5. Seed данные (опционально)

```bash
cd packages/backend
bun run seed
```

---

## 🎯 Запуск проекта

### Вариант 1: Запуск по отдельности

**Backend:**
```bash
cd packages/backend
bun run dev
# → http://localhost:8000
# → Swagger: http://localhost:8000/swagger
```

**Frontend:**
```bash
cd packages/frontend
bun run dev
# → http://localhost:3000
```

### Вариант 2: Одновременный запуск (рекомендуется)

В двух разных терминалах:

```bash
# Терминал 1 - Backend
cd packages/backend && bun run dev

# Терминал 2 - Frontend  
cd packages/frontend && bun run dev
```

---

## 📁 Структура проекта

### Backend Routes

```
packages/backend/src/routes/
├── auth.ts           # /api/v1/auth - Регистрация, логин, logout
├── landing.ts        # /api/v1/landing - Публичные данные (категории, курсы)
├── users.ts          # /api/v1/users - Управление пользователями
├── admin/
│   ├── index.ts      # /api/v1/admin - Админ панель (общее)
│   ├── landing/
│   │   ├── categories.ts   # Категории курсов
│   │   ├── subcategories.ts # Подкатегории
│   │   └── courses.ts      # Курсы
│   ├── users/
│   │   ├── index.ts        # Список пользователей
│   │   ├── [id].ts         # Профиль пользователя
│   │   └── roles.ts        # Роли
│   ├── changelog.ts  # Changelog системы
│   ├── profile.ts    # Профиль админа
│   ├── sales.ts      # Продажи и оплаты
│   ├── schools.ts    # Управление школами
│   └── teachers.ts   # Преподаватели
├── cabinet/
│   ├── index.ts      # /api/v1/cabinet - Кабинет студента
│   ├── courses.ts    # Курсы студента
│   ├── lessons.ts    # Расписание уроков
│   ├── grades.ts     # Оценки
│   └── profile.ts    # Профиль студента
├── upload.ts         # /api/v1/upload - Загрузка файлов
└── ws.ts             # WebSocket для real-time
```

### Frontend Pages

```
packages/frontend/pages/
├── landing/          # Публичные страницы
│   ├── index.vue     # Главная
│   ├── courses.vue   # Каталог курсов
│   └── contact.vue   # Контакты
│
├── admin/            # Админ панель
│   ├── index.vue     # Дашборд
│   ├── users/        # Управление пользователями
│   ├── landing/      # Контент лендинга
│   │   ├── categories/
│   │   ├── subcategories/
│   │   └── courses/
│   ├── changelogs/   # Changelog
│   ├── sales/        # Продажи
│   ├── schools/      # Школы
│   └── profile.vue   # Профиль админа
│
├── cabinet/          # Кабинет студента
│   ├── index.vue     # Дашборд
│   ├── profile.vue   # Профиль
│   ├── courses.vue   # Мои курсы
│   ├── lessons.vue   # Расписание
│   └── grades.vue    # Оценки
│
└── auth/             # Аутентификация
    ├── login.vue     # Вход
    └── register.vue  # Регистрация
```

---

## 🔐 Ролевая модель

| Роль | Описание | Доступ |
|------|----------|--------|
| **SUPERUSER** | Полный доступ | Все эндпоинты |
| **DIRECTOR** | Директор школы | Управление своей школой |
| **HEAD_TEACHER** | Завуч | Преподаватели + студенты |
| **TEACHER** | Преподаватель | Свои группы + оценки |
| **STUDENT** | Студент | Свой кабинет |
| **PARENT** | Родитель | Кабинет ребёнка |

### Дополнительные роли (many-to-many)

Пользователь может иметь несколько ролей через таблицу `user_role`:
- Основная роль: `users.role`
- Дополнительные: `user_role.role[]`

---

## 🌐 Интернационализация

Поддержка трёх языков:

- 🇹🇲 **TM** - Туркменский
- 🇷🇺 **RU** - Русский
- 🇬🇧 **EN** - Английский

Все сущности с названиями хранят переводы:
```typescript
{
  name_tm: "Diller mekdebi",
  name_ru: "Языковая школа",
  name_en: "Language school"
}
```

---

## 🎮 Геймификация

Система мотивации студентов:

- 💎 **Гемы** — внутренняя валюта (за посещения, успехи)
- 🏆 **Достижения** — награды за прогресс
- 🎯 **Игры** — matching, sprint, memory
- 📊 **Рейтинг** — таблица лидеров

---

## 📊 API Документация

### Swagger UI

После запуска backend откройте:
```
http://localhost:8000/swagger
```

### Type-safe клиент (Eden Treaty)

Frontend использует type-safe клиент:

```typescript
// composables/useAdminCategories.ts
const api = useEden()

const getAll = async () => {
  const { data, error } = await api.api.v1.admin.categories.get()
  if (error) throw error
  return data
}
```

**Преимущества:**
- ✅ Полная типизация (автокомплит в IDE)
- ✅ Проверка типов на этапе компиляции
- ✅ Нет магических строк (URL, методы)

---

## 🧪 Тестирование

### Backend

```bash
cd packages/backend
bun test
```

### Frontend

```bash
cd packages/frontend
bun run test
```

---

## 📝 Миграции

### Создать новую миграцию

```bash
cd packages/backend
bun run db:generate
```

### Применить миграции

```bash
bun run db:migrate
```

### Push схемы (dev)

```bash
bun run db:push
```

### Studio (GUI для БД)

```bash
bun run db:studio
# → http://localhost:3000
```

---

## 🔧 Полезные команды

### Backend

```bash
bun run dev          # Dev сервер (watch mode)
bun run db:generate  # Генерация миграций
bun run db:migrate   # Применение миграций
bun run db:push      # Push схемы (dev)
bun run db:studio    # Drizzle Studio
bun run seed         # Seed данные
```

### Frontend

```bash
bun run dev      # Dev сервер
bun run build    # Production сборка
bun run generate # SSR генерация
bun run preview  # Preview production
```

---

## 🐛 Troubleshooting

### Ошибка: `crypto.hash is not a function`

**Проблема:** Node.js < 21.7 не поддерживает `crypto.hash()`

**Решение:**
```bash
nvm install 22 && nvm use 22
```

### Ошибка: CORS на frontend

**Проблема:** Backend не настроен для CORS

**Решение:** Проверьте `packages/backend/src/index.ts`:
```typescript
.use(cors({
  origin: true,
  credentials: true,
  preflight: true,
}))
```

### Ошибка: 401 Unauthorized

**Проблема:** Нет сессии или истекла

**Решение:**
1. Проверьте куки в браузере
2. Перезалогиньтесь
3. Проверьте `lucia` настройки

---

## 📚 Документы

- [EDEN_TREATY_MIGRATION.md](./EDEN_TREATY_MIGRATION.md) — Руководство по миграции на Eden Treaty
- [Backend README](./packages/backend/README.md) — Детали backend настройки
- [Frontend README](./packages/frontend/README.md) — Детали frontend настройки

---

## 👥 Команда

- **Разработчик:** BridgeCore SYSTEMS
- **CEO & Founder:** Batyr Akmuradov
- **Стек:** Qwen Code + Cursor Pro (AI-assisted development)
- **Сайт:** [bridgecore.tech](https://bridgecore.tech)

---

## 📄 Лицензия

© 2026 BridgeCore SYSTEMS. Все права защищены.

---

## 🚀 Roadmap

- [ ] Мобильное приложение (React Native / Flutter)
- [ ] Telegram бот для уведомлений
- [ ] Интеграция с платежными системами
- [ ] Экспорт отчётов в Excel/PDF
- [ ] Email рассылки
- [ ] Календарь событий
- [ ] Библиотека материалов

---

<div align="center">

**Made with ❤️ using Bun + Elysia + Nuxt**

[Report Bug](../../issues) · [Request Feature](../../issues)

</div>
