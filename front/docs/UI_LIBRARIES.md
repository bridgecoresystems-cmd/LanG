# UI Libraries Setup

## Обзор

Проект использует **две разные UI библиотеки** для разных частей приложения:

1. **Quasar Framework** - для админ-панели (`/management/*`)
2. **Naive UI** - для кабинета (`/cabinet/*`)

## Зачем две библиотеки?

- **Админка** требует мощные компоненты, таблицы с фильтрацией, сложные формы
- **Кабинет** требует дружелюбный, современный дизайн для пользователей
- Разные стили для разных целей

## Установка

### Quasar (для админки)
```bash
npm install quasar @quasar/extras @quasar/vite-plugin
```

### Naive UI (для кабинета)
```bash
npm install -D naive-ui @vicons/ionicons5
```

## Использование

### В админке (`apps/admin/**`)

Используй компоненты Quasar:

```vue
<script setup lang="ts">
import { QTable, QInput, QBtn, QCard } from 'quasar'
</script>

<template>
  <q-page>
    <q-card>
      <q-table :rows="data" :columns="columns" />
    </q-card>
  </q-page>
</template>
```

### В кабинете (`apps/cabinet/**`)

Используй компоненты Naive UI:

```vue
<script setup lang="ts">
import { NCard, NDataTable, NButton } from 'naive-ui'
</script>

<template>
  <NCard>
    <NDataTable :columns="columns" :data="data" />
  </NCard>
</template>
```

## Структура

```
front/
├── src/
│   ├── plugins/
│   │   ├── quasar.ts        # Настройка Quasar
│   │   └── naive-ui.ts      # Настройка Naive UI
│   ├── styles/
│   │   ├── admin.scss       # Стили для админки
│   │   └── cabinet.scss     # Стили для кабинета
│   └── apps/
│       ├── admin/           # Quasar компоненты
│       └── cabinet/         # Naive UI компоненты
```

## Важно

- **НЕ смешивай** компоненты Quasar и Naive UI в одном компоненте
- Используй Quasar только в `apps/admin/**`
- Используй Naive UI только в `apps/cabinet/**`
- Landing page может использовать собственные стили или PrimeVue (если нужно)

## Документация

- [Quasar Docs](https://quasar.dev/)
- [Naive UI Docs](https://www.naiveui.com/)

