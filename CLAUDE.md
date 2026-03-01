# LanG — Language School ERP

**Разработчик:** Батыр Акмурадов (BridgeCore SYSTEMS)
**Статус:** Активная разработка (vibe-coding стиль)

---

## Структура проекта

```
LanG/
├── language-school/        # ОСНОВНОЙ ПРОЕКТ (monorepo)
│   ├── packages/backend/   # Elysia.js API
│   └── packages/frontend/  # Nuxt 3 SPA
├── back/                   # СТАРЫЙ Django backend (не трогать)
├── chat-service/           # Микросервис чата (Elysia.js)
└── .cursor/rules/          # Правила для Cursor AI
```

---

## Стек (language-school)

| Слой | Технология |
|------|-----------|
| Runtime (везде) | **Bun** |
| Backend | **Elysia.js** + Drizzle ORM + PostgreSQL |
| Auth | ~~Lucia Auth~~ → **Better Auth** (в процессе миграции) |
| Frontend | **Nuxt 3** (SSR=false, SPA режим) |
| Mobile | **Capacitor** (планируется) |
| API клиент | **Eden Treaty** (type-safe, monorepo) |
| UI | Naive UI + Quasar + TailwindCSS |
| State | Pinia |
| i18n | Vue I18n (TM / RU / EN) |

---

## Команды разработки

```bash
# Из корня language-school/
bun run dev              # Backend + Frontend вместе
bun run dev:backend      # Только backend (порт 8000)
bun run dev:frontend     # Только frontend (порт 3000)

bun run db:push          # Применить схему в БД
bun run db:generate      # Сгенерировать миграцию
bun run db:studio        # Drizzle Studio GUI
bun run seed             # Заполнить тестовыми данными
```

---

## Ключевые файлы

- `packages/backend/src/db/schema.ts` — Drizzle схема (всё в одном файле)
- `packages/backend/src/index.ts` — точка входа Elysia
- `packages/backend/src/constants/roles.ts` — роли пользователей
- `packages/frontend/nuxt.config.ts` — конфиг Nuxt
- `packages/frontend/composables/` — API через Eden Treaty
- `packages/frontend/stores/` — Pinia stores

---

## Роли пользователей (RBAC)

```
SUPERUSER > GEN_DIRECTOR > HEAD_ACCOUNTANT > DIRECTOR
HEAD_TEACHER > TEACHER > STUDENT > PARENT
MERCHANT, SALES, RECEPTIONIST, EDITOR, ACCOUNTANT
```

- Основная роль: `users.role`
- Доп. роли: таблица `user_role` (many-to-many)
- Область школы: `users.school_id` (для DIRECTOR, HEAD_TEACHER)

---

## Важные правила разработки

### Всегда использовать Bun
- `bun` вместо `node`
- `bun install` вместо `npm install` / `pnpm install`
- `bunx` вместо `npx`

### Backend (Elysia.js)
- Маршруты группируются: `/api/v1/auth`, `/api/v1/cabinet`, `/api/v1/admin`
- Auth middleware через `.derive()` в группе
- Авторизация через `onBeforeHandle` на каждой группе
- Пароли: `Bun.password.hash()` / `Bun.password.verify()` (bcrypt)

### Frontend (Nuxt 3)
- SSR отключён (`ssr: false`) — только SPA
- API вызовы ТОЛЬКО через Eden Treaty (`useEden()`)
- i18n: все тексты через `$t('key')`, файлы в `locales/`
- Composables для каждого раздела API

### База данных (Drizzle)
- Схема в одном файле: `schema.ts`
- После изменений: `bun run db:generate` → `bun run db:push`
- i18n поля: `name_tm`, `name_ru`, `name_en`

---

## Частые ошибки и решения

### Eden Treaty типы не обновляются
- Перезапустить backend → frontend подхватит типы автоматически
- Если не помогает: `bun run typecheck`

### Lucia Auth сессии не работают на localhost
- В dev режиме cookie: `secure: false`, `sameSite: 'lax'`
- В prod: `secure: true`

### Drizzle миграция конфликтует
- Проверить `drizzle/` папку — там SQL файлы миграций
- Не редактировать SQL файлы руками

---

## Планируется / В процессе

- [ ] Миграция Lucia Auth → **Better Auth**
- [ ] Mobile приложение на **Capacitor**
- [ ] Большая аудитория → масштабирование
