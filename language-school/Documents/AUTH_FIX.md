# Решение проблемы аутентификации в админ-панели

## Проблема
После логина админа возникали ошибки:
- `403 Forbidden` при запросах к `/api/v1/admin/categories`
- `401 Unauthorized` при запросах к `/api/v1/me`
- Пользователь не определялся в middleware

## Причина
В Elysia.js middleware, примененный через `.use()` в группе, не всегда применяется к роутам, определенным сразу после него. Нужно применять middleware непосредственно к нужным роутам через `.derive()` или `.use()`.

## Решение

### 1. Backend - `/api/v1/admin/categories`
В `packages/backend/src/routes/admin.ts` добавлена логика аутентификации непосредственно в роут через `.derive()`:

```typescript
export const adminRoutes = new Elysia({ prefix: "/admin" })
  .derive(async ({ request, set }) => {
    // Встраиваем логику аутентификации непосредственно здесь
    const cookieHeader = request.headers.get("Cookie") ?? "";
    const sessionId = lucia.readSessionCookie(cookieHeader);
    if (!sessionId) {
      return { user: null, session: null };
    }
    const { session, user } = await lucia.validateSession(sessionId);
    // ... обработка сессии
    return { user, session };
  })
  .onBeforeHandle(({ user, set }) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { error: "Forbidden: Admins only" };
    }
  })
```

### 2. Backend - `/api/v1/me`
В `packages/backend/src/index.ts` добавлен `.derive()` перед роутом `/me`:

```typescript
.use(authMiddleware)
.derive(async ({ request, set }) => {
  // Применяем authMiddleware непосредственно к /me
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const sessionId = lucia.readSessionCookie(cookieHeader);
  // ... валидация сессии
  return { user, session };
})
.get("/me", ({ user }) => {
  if (!user) return { error: "Unauthorized", status: 401 };
  return { user };
})
```

### 3. Frontend - Проксирование API
В `packages/frontend/server/api/[...].ts` настроен прокси для передачи cookie:

```typescript
export default defineEventHandler(async (event) => {
  const base = process.env.API_URL || 'http://127.0.0.1:8000'
  const path = event.path
  const target = base + path
  
  return proxyRequest(event, target, {
    cookieDomainRewrite: { '*': '' },
    cookiePathRewrite: { '*': '/' },
  })
})
```

### 4. Frontend - Конфигурация Nuxt
В `packages/frontend/nuxt.config.ts` убрана конфликтующая конфигурация routeRules для `/api/**`:

```typescript
routeRules: {
  '/': { redirect: '/landing' },
  '/uploads/**': {
    proxy: {
      to: `${process.env.API_URL || 'http://127.0.0.1:8000'}/uploads/**`,
      cookieDomainRewrite: { '*': '' },
    },
  },
},
```

## Ключевые моменты

1. **Порядок применения middleware в Elysia**: Middleware применяется только к роутам, определенным после `.use()`. Для гарантированной работы нужно применять через `.derive()` непосредственно в роуте.

2. **Cookie через прокси**: Использовать `cookieDomainRewrite` для удаления атрибута `Domain` из cookie, чтобы они работали с `localhost`.

3. **Структура файлов сервера**: В Nuxt 3 API роуты должны быть в `server/api/[...].ts`, а не в `server/routes/`.

## Файлы, которые были изменены

- `packages/backend/src/routes/admin.ts` - добавлен `.derive()` для аутентификации
- `packages/backend/src/index.ts` - добавлен `.derive()` для `/me`
- `packages/frontend/server/api/[...].ts` - настроен прокси
- `packages/frontend/nuxt.config.ts` - убрана конфликтующая конфигурация
- `packages/frontend/middleware/admin-auth.ts` - убрано лишнее логирование
- `packages/frontend/stores/authStore.ts` - убрано лишнее логирование
- `packages/frontend/pages/landing/login.vue` - убрано лишнее логирование

## Проверка работы

1. Запустить бэкенд: `cd packages/backend && bun run dev`
2. Запустить фронтенд: `cd packages/frontend && bun run dev`
3. Войти как админ (admin/admin123)
4. Проверить, что админ-панель загружается и категории отображаются

## Дата решения
2026-02-01
