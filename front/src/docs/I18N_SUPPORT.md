# Поддержка мультиязычности (i18n)

## Обзор

Все три UI библиотеки (PrimeVue, Quasar, Naive UI) **полностью поддерживают vue-i18n**.

## Настройка

Vue-i18n уже настроен в проекте:
- Файл: `src/i18n.ts`
- Переводы: `src/locales/tm.json`, `ru.json`, `en.json`
- Языки: Туркменский (tm), Русский (ru), Английский (en)

## Использование в компонентах

### Общий подход (для всех библиотек):

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// Использование
const title = t('common.title')
</script>

<template>
  <div>{{ t('common.welcome') }}</div>
</template>
```

## Примеры для каждой библиотеки

### 1. PrimeVue (Landing)

```vue
<template>
  <Button :label="t('common.readMore')" />
  <InputText :placeholder="t('form.email')" />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```

### 2. Quasar (Админка)

```vue
<template>
  <q-page>
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ t('admin.users') }}</div>
      </q-card-section>
      
      <q-card-section>
        <q-input 
          :placeholder="t('form.search')" 
          v-model="search"
        />
        
        <q-table
          :rows="users"
          :columns="columns"
          :loading-label="t('common.loading')"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```

### 3. Naive UI (Кабинет)

```vue
<template>
  <NCard :title="t('cabinet.dashboard')">
    <NForm>
      <NFormItem :label="t('form.name')">
        <NInput :placeholder="t('form.enterName')" />
      </NFormItem>
      
      <NFormItem>
        <NButton type="primary">
          {{ t('common.save') }}
        </NButton>
      </NFormItem>
    </NForm>
    
    <NDataTable
      :columns="columns"
      :data="data"
      :loading="loading"
    />
  </NCard>
</template>

<script setup lang="ts">
import { NCard, NForm, NFormItem, NInput, NButton, NDataTable } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
```

## Переводы в файлах локализации

### Структура `locales/tm.json`:

```json
{
  "common": {
    "save": "Ýatda saklamak",
    "cancel": "Ýatyrmak",
    "delete": "Pozmak",
    "edit": "Üýtgetmek",
    "loading": "Ýüklenýär..."
  },
  "admin": {
    "users": "Ulanyjylar",
    "courses": "Kurslar"
  },
  "cabinet": {
    "dashboard": "Baş panel",
    "courses": "Meniň kurslarym"
  },
  "form": {
    "name": "Ady",
    "email": "E-poçta",
    "search": "Gözlemek"
  }
}
```

## Смена языка

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

function changeLanguage(lang: 'tm' | 'ru' | 'en') {
  locale.value = lang
  localStorage.setItem('locale', lang)
}
</script>

<template>
  <select @change="changeLanguage($event.target.value)">
    <option value="tm">Türkmen</option>
    <option value="ru">Русский</option>
    <option value="en">English</option>
  </select>
</template>
```

## Важно

✅ **Все три библиотеки работают с vue-i18n из коробки**
✅ **Нет конфликтов между библиотеками**
✅ **Используй `useI18n()` везде для переводов**
✅ **Всегда переводи тексты, не хардкодь**

## Проверка

Чтобы проверить что i18n работает:

1. Открой любую страницу
2. Используй `useI18n()` в компоненте
3. Проверь что тексты переводятся при смене языка

