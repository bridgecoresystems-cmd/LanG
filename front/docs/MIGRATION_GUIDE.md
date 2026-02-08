# Руководство по миграции с PrimeVue на Quasar + Naive UI

## Обзор изменений

- **Админка** (`/management/*`) → **Quasar Framework**
- **Кабинет** (`/cabinet/*`) → **Naive UI**
- **Landing** → остается как есть (можно использовать PrimeVue или собственные стили)

## Что установлено

✅ Quasar Framework (для админки)
✅ Naive UI (для кабинета)
✅ Плагины настроены
✅ Стили созданы

## Как использовать

### В админке (Quasar)

```vue
<script setup lang="ts">
import { QPage, QCard, QTable, QInput, QBtn } from 'quasar'
</script>

<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-table :rows="data" :columns="columns" />
    </q-card>
  </q-page>
</template>
```

### В кабинете (Naive UI)

```vue
<script setup lang="ts">
import { NCard, NDataTable, NInput, NButton } from 'naive-ui'
</script>

<template>
  <NCard>
    <NDataTable :columns="columns" :data="data" />
  </NCard>
</template>
```

## Примеры

Смотри примеры в:
- `src/examples/AdminExample.vue` - пример админки на Quasar
- `src/examples/CabinetExample.vue` - пример кабинета на Naive UI

## Следующие шаги

1. Начать миграцию компонентов админки на Quasar
2. Начать миграцию компонентов кабинета на Naive UI
3. Удалить PrimeVue после полной миграции (опционально)

## Документация

- [Quasar Docs](https://quasar.dev/)
- [Naive UI Docs](https://www.naiveui.com/)

