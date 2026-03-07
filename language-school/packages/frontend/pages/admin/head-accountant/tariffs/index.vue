<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Тарифы и услуги</NH1>
        <p class="page-header__subtitle">Управление стоимостью обучения и услуг</p>
      </div>
      <div class="page-header__actions">
        <NButton type="primary" size="large" @click="navigateTo('/admin/head-accountant/tariffs/add')">
          <template #icon><NIcon><AddIcon /></NIcon></template>
          Добавить тариф
        </NButton>
      </div>
    </header>

    <NCard class="cabinet-card table-card" :content-style="{ padding: 0 }">
      <NTabs type="line" animated class="tariffs-tabs" :tabs-padding="24">
        <NTabPane name="active" tab="Актуальные тарифы">
          <NDataTable
            :columns="activeColumns"
            :data="activeTariffs"
            :loading="loading"
            class="cabinet-data-table"
          />
        </NTabPane>
        <NTabPane name="history" tab="История изменений">
          <NDataTable
            :columns="historyColumns"
            :data="allTariffs"
            :loading="loading"
            class="cabinet-data-table"
          />
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { NH1, NButton, NIcon, NCard, NDataTable, NTag, NText, useMessage, NTabs, NTabPane, NTooltip, NPopconfirm } from 'naive-ui'
import { AddOutline as AddIcon, TimeOutline as HistoryIcon, CloseCircleOutline as DeactivateIcon } from '@vicons/ionicons5'
import { useEden } from '~/composables/useEden'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const api = useEden()
const message = useMessage()
const loading = ref(false)
const allTariffs = ref<any[]>([])

const activeTariffs = computed(() => allTariffs.value.filter(t => t.isActive))

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

const baseColumns = [
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

const activeColumns = [
  ...baseColumns,
  {
    title: 'Действия',
    key: 'actions',
    align: 'right',
    render: (row: any) => h(NPopconfirm, {
      onPositiveClick: () => deactivateTariff(row.id),
      positiveText: 'Да, деактивировать',
      negativeText: 'Отмена'
    }, {
      trigger: () => h(NTooltip, { trigger: 'hover' }, {
        trigger: () => h(NButton, {
          size: 'small',
          quaternary: true,
          circle: true,
          type: 'error'
        }, { icon: () => h(NIcon, null, { default: () => h(DeactivateIcon) }) }),
        default: () => 'Деактивировать (архив)'
      }),
      default: () => 'Вы уверены, что хотите перенести этот тариф в архив? Он перестанет быть актуальным.'
    })
  }
]

const historyColumns = [
  ...baseColumns,
  { 
    title: 'Статус', 
    key: 'isActive',
    render: (row: any) => h(NTag, { size: 'small', type: row.isActive ? 'success' : 'default', bordered: false }, { default: () => row.isActive ? 'Актуален' : 'Архив' })
  },
  { 
    title: 'Изменен', 
    key: 'createdAt',
    render: (row: any) => new Date(row.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  },
  { title: 'Автор', key: 'createdByName' }
]

const loadTariffs = async () => {
  loading.value = true
  try {
    const { data } = await api.api.v1.cabinet.tariffs.history.get()
    if (data) {
      allTariffs.value = data
    }
  } catch (e) {
    console.error(e)
    message.error('Ошибка загрузки тарифов')
  } finally {
    loading.value = false
  }
}

const deactivateTariff = async (id: number) => {
  try {
    await api.api.v1.cabinet.tariffs[id as any].deactivate.patch()
    message.success('Тариф перенесен в архив')
    loadTariffs()
  } catch (e) {
    console.error(e)
    message.error('Ошибка при деактивации')
  }
}

onMounted(loadTariffs)
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
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
.tariffs-tabs {
  margin-top: 8px;
}
:deep(.cabinet-data-table) {
  --n-border-radius: 16px;
}
</style>
