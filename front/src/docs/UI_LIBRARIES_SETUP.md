# Настройка UI библиотек (PrimeVue + Quasar + Naive UI)

## Обзор

Проект использует **три разные UI библиотеки** для разных частей приложения:

1. **PrimeVue** - для landing страниц (`/`, `/about`, `/courses`, etc.)
2. **Quasar Framework** - для админ-панели (`/management/*`)
3. **Naive UI** - для кабинета (`/cabinet/*`)

## Почему три библиотеки?

- **Landing** - PrimeVue уже используется, оставляем для консистентности
- **Админка** - Quasar предоставляет мощные компоненты для управления
- **Кабинет** - Naive UI дает современный, дружелюбный дизайн

## Изоляция стилей

### Как предотвратить конфликты CSS:

1. **Уникальные префиксы классов:**
   - Quasar: `q-*` (q-page, q-card, q-table)
   - Naive UI: `n-*` (n-card, n-data-table, n-button)
   - PrimeVue: `p-*` (p-button, p-inputtext)

2. **Scoped стили:**
   Всегда используй `<style scoped>` в компонентах

3. **Условная загрузка:**
   Библиотеки загружаются глобально, но используются только в нужных местах

### Структура использования:

```
Landing (/about, /courses, etc.)
  └── PrimeVue компоненты

Админка (/management/*)
  └── Quasar компоненты

Кабинет (/cabinet/*)
  └── Naive UI компоненты
```

## Мультиязычность (i18n)

### Все три библиотеки поддерживают vue-i18n:

#### PrimeVue:
```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <Button :label="t('common.save')" />
</template>
```

#### Quasar:
```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <q-btn :label="t('common.save')" />
</template>
```

#### Naive UI:
```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <NButton>{{ t('common.save') }}</NButton>
</template>
```

### Все переводы в `src/locales/`:
- `tm.json` - Туркменский
- `ru.json` - Русский
- `en.json` - Английский

## Правила использования

### ✅ DO (Делай):

1. **Используй правильную библиотеку в правильном месте:**
   - Landing → PrimeVue
   - Админка → Quasar
   - Кабинет → Naive UI

2. **Всегда используй scoped стили:**
   ```vue
   <style scoped>
   /* Твои стили */
   </style>
   ```

3. **Используй vue-i18n для всех текстов:**
   ```vue
   <script setup lang="ts">
   import { useI18n } from 'vue-i18n'
   const { t } = useI18n()
   </script>
   ```

### ❌ DON'T (Не делай):

1. **НЕ смешивай библиотеки в одном компоненте:**
   ```vue
   <!-- ❌ ПЛОХО -->
   <q-card>
     <NButton>Click</NButton>
   </q-card>
   ```

2. **НЕ используй глобальные стили без необходимости:**
   ```vue
   <!-- ❌ ПЛОХО -->
   <style>
   .my-class { } /* Может конфликтовать */
   </style>
   ```

3. **НЕ хардкодь тексты:**
   ```vue
   <!-- ❌ ПЛОХО -->
   <button>Сохранить</button>
   
   <!-- ✅ ХОРОШО -->
   <button>{{ t('common.save') }}</button>
   ```

## Примеры

### Landing (PrimeVue):
```vue
<template>
  <Button :label="t('common.readMore')" />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```

### Админка (Quasar):
```vue
<template>
  <q-page>
    <q-card>
      <q-table :rows="data" :columns="columns" />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```

### Кабинет (Naive UI):
```vue
<template>
  <NCard :title="t('cabinet.dashboard')">
    <NDataTable :columns="columns" :data="data" />
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NDataTable } from 'naive-ui'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```

## Проверка конфликтов

Если видишь проблемы со стилями:

1. Проверь что используешь правильную библиотеку
2. Убедись что стили scoped
3. Проверь консоль браузера на ошибки
4. Используй DevTools для проверки примененных стилей

## Документация

- [PrimeVue Docs](https://primevue.org/)
- [Quasar Docs](https://quasar.dev/)
- [Naive UI Docs](https://www.naiveui.com/)
- [Vue I18n Docs](https://vue-i18n.intlify.dev/)

