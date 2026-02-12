<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Sales дневник</NH2>
        <p class="page-header__subtitle">
          Здесь менеджер фиксирует звонки: с кем говорил, результат и заметки.
        </p>
      </div>
      <div class="page-header__actions">
        <NButton type="primary" size="large" @click="navigateTo('/cabinet/sales/add')">
          <template #icon>
            <NIcon><component :is="AddIcon" /></NIcon>
          </template>
          Добавить звонок
        </NButton>
      </div>
    </header>

    <!-- Summary -->
    <div class="sales-summary">
      <NCard class="sales-summary__card">
        <div class="sales-summary__item">
          <span class="sales-summary__label">Звонков сегодня</span>
          <span class="sales-summary__value">{{ todayCount }}</span>
        </div>
        <div class="sales-summary__item">
          <span class="sales-summary__label">Звонков за 7 дней</span>
          <span class="sales-summary__value">{{ last7DaysCount }}</span>
        </div>
        <div class="sales-summary__item">
          <span class="sales-summary__label">Всего контактов</span>
          <span class="sales-summary__value">{{ logs.length }}</span>
        </div>
      </NCard>
    </div>

    <!-- Filters -->
    <NCard class="cabinet-card search-card">
      <NSpace :size="16" wrap>
        <div style="flex: 1; min-width: 300px;">
          <NInput
            v-model:value="searchQuery"
            placeholder="Поиск по имени, фамилии или телефону"
            clearable
            size="large"
          >
            <template #prefix>
              <NIcon><component :is="SearchIcon" /></NIcon>
            </template>
          </NInput>
        </div>

        <div style="width: 220px">
          <NDatePicker
            v-model:value="dateRange"
            type="daterange"
            clearable
            size="large"
            :update-value-on-close="true"
            placeholder="Период"
          />
        </div>

        <div style="width: 220px">
          <NSelect
            v-model:value="outcomeFilter"
            :options="outcomeOptions"
            clearable
            size="large"
            placeholder="Результат"
          />
        </div>
      </NSpace>
    </NCard>

    <!-- Table -->
    <NCard class="cabinet-card table-card" :content-style="{ padding: 0 }">
      <NDataTable
        :columns="columns"
        :data="sortedFilteredLogs"
        :loading="loading"
        :row-key="(row) => row.id"
        :pagination="pagination"
        class="cabinet-data-table"
        :row-props="rowProps"
      />
    </NCard>

    <!-- Delete Confirm Modal -->
    <NModal
      v-model:show="showDeleteConfirm"
      preset="dialog"
      title="Удалить запись о звонке?"
      content="Это действие необратимо. Запись будет полностью удалена."
      positive-text="Удалить"
      negative-text="Отмена"
      @positive-click="confirmDelete"
      @negative-click="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, h, reactive } from 'vue'
import { useCabinetSales } from '~/composables/useCabinetSales'
import {
  NCard,
  NButton,
  NInput,
  NForm,
  NIcon,
  NH2,
  NDataTable,
  NDatePicker,
  NSelect,
  NModal,
  NSpace,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import {
  AddOutline as AddIcon,
  SearchOutline as SearchIcon,
  TrashOutline as TrashIcon,
} from '@vicons/ionicons5'

definePageMeta({
  layout: 'cabinet',
  middleware: 'cabinet-auth',
})

type Outcome = 'no_answer' | 'interested' | 'not_interested' | 'follow_up'

interface CallLog {
  id: number
  datetime: string | Date
  firstName: string
  lastName: string
  phone: string
  outcome: Outcome
  notes: string | null
}

const message = useMessage()
const { getAll, remove, getStats } = useCabinetSales()

const logs = ref<CallLog[]>([])
const loading = ref(false)
const searchQuery = ref('')
const dateRange = ref<[number, number] | null>(null)
const outcomeFilter = ref<Outcome | null>(null)
const stats = ref<{ total: number; today: number; last7Days: number } | null>(null)
const showDeleteConfirm = ref(false)
const itemToDelete = ref<number | null>(null)

const todayCount = computed(() => stats.value?.today ?? 0)
const last7DaysCount = computed(() => stats.value?.last7Days ?? 0)

const outcomeOptions = [
  { label: 'Не ответил(а)', value: 'no_answer' },
  { label: 'Заинтересован(а)', value: 'interested' },
  { label: 'Не интересно', value: 'not_interested' },
  { label: 'Нужен перезвон', value: 'follow_up' },
] as const

const pagination = reactive({
  page: 1,
  pageSize: 10,
  pageSizes: [10, 20, 50],
  showSizePicker: true,
  onChange: (page: number) => {
    pagination.page = page
  },
  onUpdatePageSize: (size: number) => {
    pagination.pageSize = size
    pagination.page = 1
  },
})

const columns: DataTableColumns<CallLog> = [
  {
    title: 'Дата',
    key: 'datetime',
    width: 160,
    sorter: 'default',
    render(row) {
      const dt = typeof row.datetime === 'string' ? new Date(row.datetime) : row.datetime
      return dt.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
  {
    title: 'Имя',
    key: 'firstName',
    render(row) {
      return `${row.firstName} ${row.lastName}`.trim()
    },
  },
  {
    title: 'Телефон',
    key: 'phone',
    width: 140,
  },
  {
    title: 'Результат',
    key: 'outcome',
    width: 150,
    render(row) {
      const map: Record<Outcome, string> = {
        no_answer: 'Не ответил(а)',
        interested: 'Заинтересован(а)',
        not_interested: 'Не интересно',
        follow_up: 'Нужен перезвон',
      }
      return map[row.outcome] || row.outcome
    },
  },
  {
    title: 'Заметки',
    key: 'notes',
    ellipsis: {
      tooltip: true,
    },
    render(row) {
      return row.notes || '—'
    },
  },
  {
    title: 'Действия',
    key: 'actions',
    align: 'right',
    width: 100,
    render(row) {
      return h('div', { style: 'display: flex; justify-content: flex-end; gap: 8px;' }, [
        h(
          NButton,
          {
            quaternary: true,
            circle: true,
            size: 'small',
            type: 'error',
            onClick: (e: Event) => {
              e.stopPropagation()
              handleDelete(row.id)
            },
          },
          { icon: () => h(NIcon, null, { default: () => h(TrashIcon) }) }
        ),
      ])
    },
  },
]

const filteredLogs = computed(() => {
  let list = [...logs.value]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((log) => {
      const fullName = `${log.firstName} ${log.lastName}`.toLowerCase()
      return (
        fullName.includes(q) ||
        (log.phone || '').toLowerCase().includes(q)
      )
    })
  }

  if (dateRange.value) {
    const [start, end] = dateRange.value
    list = list.filter((log) => {
      const dt = typeof log.datetime === 'string' ? new Date(log.datetime).getTime() : log.datetime.getTime()
      return dt >= start && dt <= end
    })
  }

  if (outcomeFilter.value) {
    list = list.filter((log) => log.outcome === outcomeFilter.value)
  }

  return list
})

const sortedFilteredLogs = computed(() =>
  [...filteredLogs.value].sort((a, b) => {
    const dtA = typeof a.datetime === 'string' ? new Date(a.datetime).getTime() : a.datetime.getTime()
    const dtB = typeof b.datetime === 'string' ? new Date(b.datetime).getTime() : b.datetime.getTime()
    return dtB - dtA
  }),
)

const rowProps = (row: CallLog) => ({
  style: 'cursor: pointer;',
  onClick: () => navigateTo(`/cabinet/sales/${row.id}`),
})

const handleDelete = (id: number) => {
  itemToDelete.value = id
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!itemToDelete.value) return
  try {
    await remove(itemToDelete.value)
    message.success('Запись удалена')
    await loadLogs()
    await loadStats()
  } catch (err: any) {
    console.error('Delete error:', err)
    message.error('Не удалось удалить запись')
  } finally {
    showDeleteConfirm.value = false
    itemToDelete.value = null
  }
}

async function loadLogs() {
  loading.value = true
  try {
    const params: any = {}
    if (dateRange.value) {
      const [start, end] = dateRange.value
      params.dateFrom = new Date(start).toISOString().split('T')[0]
      params.dateTo = new Date(end).toISOString().split('T')[0]
    }
    if (outcomeFilter.value) {
      params.outcome = outcomeFilter.value
    }
    logs.value = await getAll(params)
  } catch (err: any) {
    console.error('Load sales calls error:', err)
    message.error('Не удалось загрузить данные')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    stats.value = await getStats()
  } catch (err: any) {
    console.error('Load stats error:', err)
  }
}

watch([dateRange, outcomeFilter], () => {
  loadLogs()
})

onMounted(async () => {
  await Promise.all([loadLogs(), loadStats()])
})
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

@media (min-width: 768px) {
  .page-header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

.page-header__title {
  margin: 0 0 8px;
  font-weight: 700;
}

.page-header__subtitle {
  margin: 0;
  color: var(--n-text-color-3);
}

.sales-summary {
  margin-bottom: 16px;
}

.sales-summary__card {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 640px) {
  .sales-summary__card {
    grid-template-columns: 1fr;
  }
}

.sales-summary__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sales-summary__label {
  font-size: 0.875rem;
  color: var(--n-text-color-3);
}

.sales-summary__value {
  font-size: 1.5rem;
  font-weight: 700;
}

.cabinet-card {
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-card {
  margin-bottom: 24px;
  padding: 8px;
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
  white-space: nowrap !important;
}

:deep(.n-data-table-td) {
  padding: 16px 24px !important;
  font-size: 0.9375rem;
}

:deep(.n-data-table-tr:hover .n-data-table-td) {
  background-color: #f9fafb !important;
}
</style>
