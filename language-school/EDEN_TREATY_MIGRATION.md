# Миграция на Eden Treaty - Руководство

## ✅ Что уже сделано:

### Composables созданы:

- ✅ `useAdminCategories` - управление категориями
- ✅ `useAdminSubcategories` - управление подкатегориями
- ✅ `useAdminCourses` - управление курсами
- ✅ `useAdminUsers` - управление пользователями
- ✅ `useAdminChangelogs` - управление changelog
- ✅ `useAdminProfile` - профиль админа
- ✅ `useAdminNews` - новости (уже было)
- ✅ `useAdminSchools` - школы (уже было)
- ✅ `useUpload` - загрузка файлов
- ✅ `useCabinetProfile` - профиль в кабинете
- ✅ `useLandingContact` - контактные сообщения

### Страницы мигрированы:

- ✅ `pages/admin/index.vue` - главная админки
- ✅ `pages/admin/landing/categories/index.vue` - список категорий

## 📋 Паттерн миграции страницы:

### Было (с $fetch):

```vue
<script setup lang="ts">
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const fetchData = async () => {
  const data = await $fetch(`${apiBase}/admin/categories`, {
    credentials: "include",
  });
  return data;
};

const deleteItem = async (id: number) => {
  await $fetch(`${apiBase}/admin/categories/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
};
</script>
```

### Стало (с Eden Treaty):

```vue
<script setup lang="ts">
const { getAll, remove } = useAdminCategories();

const fetchData = async () => {
  const data = await getAll();
  return data;
};

const deleteItem = async (id: number) => {
  await remove(id);
};
</script>
```

## 🔧 Синтаксис Eden Treaty:

### GET запросы:

```typescript
// Список
await api.api.v1.admin.categories.get();

// По ID
await api.api.v1.admin.categories({ id: 123 }).get();
```

### POST запросы:

```typescript
await api.api.v1.admin.categories.post({ name: "Test" });
```

### PATCH запросы (не PUT!):

```typescript
await api.api.v1.admin.categories({ id: 123 }).patch({ name: "Updated" });
```

### DELETE запросы:

```typescript
await api.api.v1.admin.categories({ id: 123 }).delete();
```

## ⚠️ Важные замечания:

1. **Бэкенд использует PATCH, а не PUT** - все `update` методы должны использовать `.patch()`
2. **Динамические параметры** - используй `({ id })`, а не `[id]`
3. **Убери `apiBase`** - Eden Treaty сам знает базовый URL
4. **Убери `credentials: 'include'`** - уже настроено в `useEden`
5. **Lint ошибки в .vue файлах** - это нормально, Nuxt auto-import работает в runtime

## 📂 Файлы для миграции (приоритет):

### Высокий приоритет (админка):

- [ ] `pages/admin/users/index.vue`
- [ ] `pages/admin/users/add.vue`
- [ ] `pages/admin/users/[id].vue`
- [ ] `pages/admin/landing/categories/add.vue`
- [ ] `pages/admin/landing/categories/[id].vue`
- [ ] `pages/admin/landing/subcategories/index.vue`
- [ ] `pages/admin/landing/subcategories/add.vue`
- [ ] `pages/admin/landing/subcategories/[id].vue`
- [ ] `pages/admin/landing/courses/index.vue`
- [ ] `pages/admin/landing/courses/[id].vue`
- [ ] `pages/admin/changelogs/index.vue`
- [ ] `pages/admin/changelogs/add.vue`
- [ ] `pages/admin/changelogs/[id].vue`
- [ ] `pages/admin/profile.vue`

### Средний приоритет (кабинет):

- [ ] `pages/cabinet/profile.vue`

### Низкий приоритет (landing):

- [ ] `pages/landing/contact.vue`

## 🎯 Следующие шаги:

1. Исправь composables - замени `.put()` на `.patch()`
2. Исправь синтаксис динамических параметров `[id]` → `({ id })`
3. Мигрируй остальные страницы по паттерну выше
4. Тестируй каждую страницу после миграции

## 💡 Преимущества после миграции:

- ✅ Полная type safety
- ✅ Автокомплит в IDE
- ✅ Меньше багов
- ✅ Проще рефакторинг
- ✅ Единообразный код
