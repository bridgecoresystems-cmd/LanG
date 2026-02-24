# 🎯 Исправления авторизации и редиректов

## Проблема

После логина:
- ✅ Admin (SUPERUSER) → правильно перенаправлялся на `/admin`
- ❌ Остальные пользователи → иногда оставались на landing, иногда попадали в cabinet
- ❌ Ссылка на "Cabinet Profile" отображалась всем, включая admin

## Решение

### 1. **Navbar.vue** — Убрана ссылка на Cabinet Profile для admin

**Файл:** `components/Layout/Navbar.vue`

**Было:**
```vue
<NuxtLink to="/cabinet/profile" class="dropdown-item">
  <i class="pi pi-user"></i>
  <span>Профиль</span>
</NuxtLink>
```

**Стало:**
```vue
<NuxtLink
  v-if="!authStore.isSuperuser"
  to="/cabinet/profile"
  class="dropdown-item"
>
  <i class="pi pi-user"></i>
  <span>Профиль</span>
</NuxtLink>
```

### 2. **login.vue** — Улучшена логика редиректа

**Файл:** `pages/landing/login.vue`

**Изменения:**
1. Добавлен явный вызов `authStore.fetchCurrentUser()` после логина
2. Добавлена небольшая задержка (100ms) для обновления store
3. Улучшена проверка ролей

**Было:**
```typescript
const handleLogin = async () => {
  const success = await authStore.login(credentials.value)
  if (success) {
    const user = authStore.user
    const role = user?.role?.toUpperCase()
    // ... редирект
    await navigateTo(path)
  }
}
```

**Стало:**
```typescript
const handleLogin = async () => {
  const success = await authStore.login(credentials.value)
  if (success) {
    // Для надёжности получаем пользователя явно
    await authStore.fetchCurrentUser()
    
    const user = authStore.user
    const role = user?.role?.toUpperCase()
    // ... редирект
    
    // Небольшая задержка чтобы store успел обновиться
    await new Promise(resolve => setTimeout(resolve, 100))
    await navigateTo(path)
  }
}
```

## Результат

| Роль | Редирект после логина | Ссылка на Cabinet Profile |
|------|----------------------|--------------------------|
| **SUPERUSER** | ✅ `/admin` | ❌ Не отображается |
| **TEACHER** | ✅ `/cabinet` | ✅ Отображается |
| **STUDENT** | ✅ `/cabinet` | ✅ Отображается |
| **EDITOR** | ✅ `/cabinet` | ✅ Отображается |
| **DIRECTOR** | ✅ `/cabinet` | ✅ Отображается |
| **HEAD_TEACHER** | ✅ `/cabinet` | ✅ Отображается |
| **SALES** | ✅ `/cabinet` | ✅ Отображается |
| **RECEPTIONIST** | ✅ `/cabinet` | ✅ Отображается |

## Тестирование

1. Залогиниться как SUPERUSER → должен перенаправить на `/admin`
2. Залогиниться как TEACHER/STUDENT → должен перенаправить на `/cabinet`
3. Проверить dropdown меню:
   - У SUPERUSER → нет ссылки на Cabinet Profile
   - У остальных → есть ссылка на Cabinet Profile

## Файлы изменены

- `components/Layout/Navbar.vue` — условное отображение ссылок
- `pages/landing/login.vue` — улучшенная логика редиректа
