<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Актуальные тарифы</NH1>
        <p class="page-header__subtitle">Справочник стоимости обучения и услуг</p>
      </div>
    </header>

    <NCard class="cabinet-card table-card" :content-style="{ padding: 0 }">
      <NDataTable
        :columns="columns"
        :data="tariffs"
        :loading="loading"
        class="cabinet-data-table"
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NH1, NCard, NDataTable, NTag, NText, useMessage } from 'naive-ui'
import { useEden } from '~/composables/useEden'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const api = useEden()
const message = useMessage()
const loading = ref(false)
const tariffs = ref<any[]>([])

const categoryMap: any = {
  course_adult: 'Курс (Взрослые)',
  course_kid: 'Курс (Дети)',
  translation: 'Перевод',
  certificate: 'Сертификат',
  other: 'Прочее'
}

const categoryTypeMap: any = {
  course_adult: 'info',
  course_kid: 'success',
  translation: 'warning',
  certificate: 'error',
  other: 'default'
}

const columns = [
  { title: 'Название', key: 'name', render: (row: any) => h('div', { style: 'font-weight: 600' }, row.name) },
  { 
    title: 'Категория', 
    key: 'category',
    render: (row: any) => h(NTag, { size: 'small', type: categoryTypeMap[row.category], round: true }, { default: () => categoryMap[row.category] || row.category })
  },
  { 
    title: 'Цена', 
    key: 'price',
    render: (row: any) => h(NText, { strong: true, type: 'success' }, { default: () => `${row.price} TMT` })
  },
  { title: 'Описание', key: 'description', render: (row: any) => row.description || h(NText, { depth: 3 }, { default: () => '—' }) },
]

const loadTariffs = async () => {
  loading.value = true
  try {
    const { data } = await api.api.v1.cabinet.tariffs.get()
    if (data) {
      tariffs.value = data
    }
  } catch (e) {
    console.error(e)
    message.error('Ошибка загрузки тарифов')
  } finally {
    loading.value = false
  }
}

onMounted(loadTariffs)
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
}
.page-header {
  margin-bottom: 32px;
}
.page-header__title {
  margin: 0 0 8px;
  font-weight: 700;
}
.page-header__subtitle {
  margin: 0;
  color: var(--n-text-color-3);
}
.cabinet-card {
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.table-card {
  overflow: hidden;
}
:deep(.cabinet-data-table) {
  --n-border-radius: 16px;
}
</style>
