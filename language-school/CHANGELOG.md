# 📝 Changelog

Все изменения в проекте Language School.

---

## [1.0.6] - 2026-02-27

### 🎓 Кабинет учителя: уроки и ученики

**Backend:**
- ✅ API уроков для учителя: `GET/PATCH /cabinet/teacher/groups/:groupId/lessons`, `GET/PATCH /cabinet/teacher/lessons/:id`
- ✅ API уроков для ученика: `GET /cabinet/student/groups/:groupId/lessons`, `GET /cabinet/student/lessons/:id`
- ✅ API списка учеников группы: `GET /cabinet/teacher/groups/:groupId/students` (ФИО, тел. ученика и родителя)
- ✅ Схема `ht_lessons`: поля `lesson_plan`, `lesson_notes` (конспект и заметки)
- ✅ Исправлена валидация PATCH уроков: опциональные поля принимают `null`

**Frontend — уроки:**
- ✅ Реструктуризация страниц уроков: список → детали → редактирование (учитель)
- ✅ Ученик: просмотр списка уроков и детальной страницы
- ✅ `useCabinetLessons`: переход на `$fetch` для teacher/student API

**Frontend — список учеников:**
- ✅ Новая страница `/cabinet/teacher/groups/:id/students` с шапкой курса и таблицей учеников
- ✅ Таблица: ФИО ученика, ФИО родителя, тел. ученика, тел. родителя (оплата, чат, наградить — заглушки)
- ✅ Клик по курсу в «Мои курсы» ведёт на список учеников
- ✅ Пункт «Список учеников» в сайдбаре учителя (при выбранной группе)

**Frontend — UX:**
- ✅ При смене группы в сайдбаре страница автоматически перезагружается с данными новой группы (Журнал/Уроки, Список учеников, Посещаемость, Оценки, Игры)

---

## [1.0.5] - 2026-02-23

### 🎉 Добавлено BridgeCore брендинг

- ✅ Обновлён README.md с информацией о BridgeCore SYSTEMS
- ✅ Добавлена секция "О разработчике" с контактами
- ✅ Обновлена секция "Команда" с ссылкой на bridgecore.tech
- ✅ Обновлён copyright в лицензии

### 📦 Новые файлы

- ✅ `.env.example` - шаблон переменных окружения с подробными комментариями
- ✅ `QUICKSTART.md` - краткое руководство по быстрому старту
- ✅ `CHANGELOG.md` - история изменений проекта

### 🔧 Улучшены скрипты (package.json)

**Корневой package.json:**
- ✅ `dev` - одновременный запуск backend + frontend
- ✅ `dev:backend` - запуск только backend
- ✅ `dev:frontend` - запуск только frontend
- ✅ `build` - сборка всего проекта
- ✅ `db:*` - команды для работы с миграциями
- ✅ `typecheck` - проверка типов
- ✅ `lint` - linting кода
- ✅ `format` - форматирование (Prettier)
- ✅ `clean` - очистка node_modules

**Backend package.json:**
- ✅ `build` - сборка backend
- ✅ `start` - запуск backend
- ✅ `typecheck` - проверка типов
- ✅ `test` - тесты (Bun.test)

**Frontend package.json:**
- ✅ `typecheck` - проверка типов (Nuxt)
- ✅ `lint` - ESLint

### 📚 Обновлён README.md

- ✅ Добавлены бейджи технологий
- ✅ Подробная архитектура проекта
- ✅ Структура backend routes
- ✅ Структура frontend pages
- ✅ Таблица ролей и доступов
- ✅ Примеры кода (Eden Treaty)
- ✅ Troubleshooting секция
- ✅ Roadmap развития

### 🎯 Технические улучшения

- ✅ Установлен `concurrently` для параллельного запуска
- ✅ Установлен `prettier` для форматирования
- ✅ Добавлен `.env.example` с комментариями
- ✅ Все `.gitignore` файлы проверены и актуальны

---

## [1.0.0] - 2026-02-XX

### 🚀 Initial Release

- ✅ Backend: Elysia.js + Drizzle ORM + Lucia Auth
- ✅ Frontend: Nuxt 3 + TypeScript + Eden Treaty
- ✅ База данных: PostgreSQL
- ✅ Аутентификация: Session-based (Lucia)
- ✅ Ролевая модель: SUPERUSER, DIRECTOR, HEAD_TEACHER, TEACHER, STUDENT, PARENT
- ✅ Мульти-школьность
- ✅ Геймификация (гемы, достижения)
- ✅ WebSocket для real-time
- ✅ Многоязычность (TM/RU/EN)

---

**Разработано:** BridgeCore SYSTEMS  
**CEO & Founder:** Batyr Akmuradov  
**Сайт:** [bridgecore.tech](https://bridgecore.tech)
