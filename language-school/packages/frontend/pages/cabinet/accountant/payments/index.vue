<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Отчёт по оплатам</NH1>
        <p class="page-header__subtitle">История всех транзакций</p>
      </div>
      <div class="page-header__actions">
        <NSpace>
          <NButton v-if="canExport" type="info" secondary size="large" @click="exportToExcel">
            <template #icon><NIcon><DownloadIcon /></NIcon></template>
            Экспорт Excel
          </NButton>
          <NButton type="primary" size="large" @click="navigateTo('/cabinet/accountant/payments/add')">
            <template #icon><NIcon><AddIcon /></NIcon></template>
            Принять оплату
          </NButton>
        </NSpace>
      </div>
    </header>

    <NCard class="cabinet-card search-card">
      <NGrid :cols="24" :x-gap="12" :y-gap="12" item-responsive responsive="screen">
        <NGi span="24 m:10 l:11">
          <NInput
            v-model:value="searchQuery"
            placeholder="Супер-поиск: Имя, Группа, Назначение, Сумма..."
            clearable
            size="large"
          >
            <template #prefix>
              <NIcon><component :is="SearchIcon" /></NIcon>
            </template>
          </NInput>
        </NGi>
        <NGi span="24 m:4 l:3">
          <NSelect
            v-model:value="methodFilter"
            :options="methodOptions"
            placeholder="Метод"
            clearable
            size="large"
          />
        </NGi>
        <NGi span="12 m:5 l:5">
          <NInput
            v-model:value="dateFrom"
            type="date"
            clearable
            size="large"
          >
            <template #prefix>
              <NIcon><component :is="CalendarIcon" /></NIcon>
            </template>
          </NInput>
          <div class="filter-label">Дата от</div>
        </NGi>
        <NGi span="12 m:5 l:5">
          <NInput
            v-model:value="dateTo"
            type="date"
            clearable
            size="large"
          >
            <template #prefix>
              <NIcon><component :is="CalendarIcon" /></NIcon>
            </template>
          </NInput>
          <div class="filter-label">Дата до</div>
        </NGi>
      </NGrid>
    </NCard>

    <NCard class="cabinet-card table-card" :content-style="{ padding: 0 }">
      <NDataTable
        remote
        :columns="columns"
        :data="payments"
        :loading="loading"
        :pagination="naivePagination"
        :row-key="(row) => row.id"
        class="cabinet-data-table"
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, reactive, watch, computed } from 'vue'
import { NH1, NButton, NIcon, NCard, NDataTable, NTag, NSpace, NText, NInput, useMessage, NGrid, NGi, NTooltip } from 'naive-ui'
import { AddOutline as AddIcon, PrintOutline as PrintIcon, SearchOutline as SearchIcon, CalendarOutline as CalendarIcon, DownloadOutline as DownloadIcon, PencilOutline as EditIcon } from '@vicons/ionicons5'
import { useEden } from '~/composables/useEden'
import { useAdminPagination } from '~/composables/useAdminPagination'
import { useAuthStore } from '~/stores/authStore'
import * as XLSX from 'xlsx'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const api = useEden()
const message = useMessage()
const authStore = useAuthStore()
const loading = ref(false)
const payments = ref<any[]>([])

const isHeadAccountant = computed(() => authStore.user?.role === 'HEAD_ACCOUNTANT' || authStore.user?.role === 'GEN_DIRECTOR')
const canExport = computed(() => authStore.user?.can_export_excel || isHeadAccountant.value)

const searchQuery = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const methodFilter = ref<string | null>(null)

const methodOptions = [
  { label: 'Все методы', value: null },
  { label: 'Наличные', value: 'cash' },
  { label: 'Карта', value: 'card' },
  { label: 'Банковский перевод', value: 'bank_transfer' },
]

const { pagination, resetPage } = useAdminPagination('payments-report')

const naivePagination = reactive({
  page: pagination.value.page,
  pageSize: pagination.value.rowsPerPage,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  onUpdatePage: (page: number) => {
    naivePagination.page = page
    pagination.value.page = page
    loadPayments()
  },
  onUpdatePageSize: (pageSize: number) => {
    naivePagination.pageSize = pageSize
    pagination.value.rowsPerPage = pageSize
    naivePagination.page = 1
    pagination.value.page = 1
    loadPayments()
  },
})

const columns = computed(() => {
  const cols: any[] = [
    { title: 'ID', key: 'id', width: 70 },
    { 
      title: 'Дата', 
      key: 'created_at',
      render: (row: any) => new Date(row.created_at).toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
      })
    },
    { title: 'Плательщик', key: 'payer', render: (row: any) => h('div', { style: 'font-weight: 600' }, row.payer) },
    { title: 'Группа', key: 'group_name', render: (row: any) => row.group_name || h(NText, { depth: 3 }, { default: () => '—' }) },
    { title: 'Назначение', key: 'purpose' },
    { 
      title: 'Сумма', 
      key: 'total',
      render: (row: any) => h(NText, { type: 'success', strong: true }, { default: () => `${row.total} TMT` })
    },
  ]

  if (isHeadAccountant.value) {
    cols.push({ title: 'Школа', key: 'school_name' })
    cols.push({ title: 'Создал', key: 'created_by' })
  }

  cols.push({ 
    title: 'Метод', 
    key: 'method',
    render: (row: any) => {
      const map: any = { cash: 'Наличные', card: 'Карта', bank_transfer: 'Банк' }
      const typeMap: any = { cash: 'success', card: 'info', bank_transfer: 'warning' }
      return h(NTag, { size: 'small', type: typeMap[row.method], round: true }, { default: () => map[row.method] || row.method })
    }
  })

  cols.push({
    title: 'Действия',
    key: 'actions',
    align: 'right',
    render: (row: any) => {
      const actions = [
        h(NTooltip, { trigger: 'hover' }, {
          trigger: () => h(NButton, {
            size: 'small',
            quaternary: true,
            circle: true,
            onClick: () => navigateTo(`/cabinet/accountant/payments/${row.id}/receipt`)
          }, { icon: () => h(NIcon, null, { default: () => h(PrintIcon) }) }),
          default: () => 'Печать квитанции'
        })
      ]

      if (isHeadAccountant.value) {
        actions.push(
          h(NTooltip, { trigger: 'hover' }, {
            trigger: () => h(NButton, {
              size: 'small',
              quaternary: true,
              circle: true,
              type: 'info',
              onClick: () => navigateTo(`/cabinet/accountant/payments/${row.id}/edit`)
            }, { icon: () => h(NIcon, null, { default: () => h(EditIcon) }) }),
            default: () => 'Редактировать'
          })
        )
      }

      return h(NSpace, { justify: 'end', size: 'small' }, { default: () => actions })
    }
  })

  return cols
})

const loadPayments = async () => {
  loading.value = true
  try {
    const { data } = await api.api.v1.cabinet.accountant.payments.get({
      query: {
        limit: naivePagination.pageSize.toString(),
        offset: ((naivePagination.page - 1) * naivePagination.pageSize).toString(),
        search: searchQuery.value || undefined,
        dateFrom: dateFrom.value || undefined,
        dateTo: dateTo.value || undefined,
        method: methodFilter.value || undefined,
      }
    })
    
    if (data && 'items' in data) {
      payments.value = data.items
      naivePagination.itemCount = data.total
    }
  } catch (e) {
    console.error(e)
    message.error('Ошибка загрузки платежей')
  } finally {
    loading.value = false
  }
}

const exportToExcel = () => {
  if (!payments.value.length) return
  
  const data = payments.value.map(p => ({
    'ID': p.id,
    'Дата': new Date(p.created_at).toLocaleString('ru-RU'),
    'Плательщик': p.payer,
    'Группа': p.group_name || '—',
    'Назначение': p.purpose,
    'Сумма (TMT)': p.total,
    'Метод': p.method === 'cash' ? 'Наличные' : p.method === 'card' ? 'Карта' : 'Банк',
    'Школа': p.school_name || '—',
    'Создал': p.created_by || '—'
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Платежи')
  XLSX.writeFile(wb, `payments_report_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// Reset page when filters change
watch([searchQuery, dateFrom, dateTo, methodFilter], () => {
  resetPage()
  naivePagination.page = 1
  loadPayments()
})

onMounted(loadPayments)
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

.search-card {
  margin-bottom: 24px;
  padding: 8px;
}

.filter-label {
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 4px;
}

.table-card {
  overflow: hidden;
}

:deep(.cabinet-data-table) {
  --n-border-radius: 16px;
}

:deep(.n-data-table-th) {
  background-color: transparent !important;
  font-weight: 600 !important;
  color: var(--n-text-color-3) !important;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 16px 24px !important;
}

:deep(.n-data-table-td) {
  padding: 16px 24px !important;
  font-size: 0.9375rem;
}

:deep(.n-data-table-tr:hover .n-data-table-td) {
  background-color: #f9fafb !important;
}
</style>
