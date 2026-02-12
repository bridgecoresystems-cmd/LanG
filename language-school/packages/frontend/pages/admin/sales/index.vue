<template>
  <div class="admin-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Sales дневник</h1>
      <q-btn color="primary" icon="add" label="Добавить звонок" to="/admin/sales/add" />
    </div>

    <!-- Summary -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <div class="text-caption text-grey-7">Звонков сегодня</div>
            <div class="text-h5 q-mt-xs">{{ todayCount }}</div>
          </div>
          <div class="col-12 col-md-4">
            <div class="text-caption text-grey-7">Звонков за 7 дней</div>
            <div class="text-h5 q-mt-xs">{{ last7DaysCount }}</div>
          </div>
          <div class="col-12 col-md-4">
            <div class="text-caption text-grey-7">Всего контактов</div>
            <div class="text-h5 q-mt-xs">{{ logs.length }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Filters -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="searchQuery"
              placeholder="Поиск по имени, фамилии или телефону"
              outlined
              dense
              clearable
              debounce="300"
            >
              <template v-slot:prepend><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="salesManagerFilter"
              :options="salesManagerOptions"
              label="Менеджер"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="outcomeFilter"
              :options="outcomeOptions"
              label="Результат"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>
          <div class="col-12 col-md-2">
            <q-btn color="primary" outline label="Сбросить" @click="resetFilters" icon="refresh" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Table -->
    <q-card flat bordered>
      <q-card-section>
        <q-table
          :rows="sortedFilteredLogs"
          :columns="columns"
          row-key="id"
          v-model:pagination="pagination"
          :rows-per-page-options="rowsPerPageOptions"
          flat
          bordered
          :loading="loading"
          @row-click="(_evt, row) => editItem(row.id)"
          class="cursor-pointer"
          binary-state-sort
        >
          <template v-slot:body-cell-datetime="props">
            <q-td :props="props">
              {{ formatDateTime(props.row.datetime) }}
            </q-td>
          </template>
          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              {{ props.row.firstName }} {{ props.row.lastName }}
            </q-td>
          </template>
          <template v-slot:body-cell-outcome="props">
            <q-td :props="props">
              <q-badge :color="getOutcomeColor(props.row.outcome)">
                {{ getOutcomeLabel(props.row.outcome) }}
              </q-badge>
            </q-td>
          </template>
          <template v-slot:body-cell-sales_manager="props">
            <q-td :props="props">
              {{ props.row.sales_manager_name }} {{ props.row.sales_manager_surname }}
            </q-td>
          </template>
          <template v-slot:body-cell-notes="props">
            <q-td :props="props">
              {{ props.row.notes || '—' }}
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                @click.stop="handleDelete(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Delete Confirm Dialog -->
    <q-dialog v-model="showDeleteConfirm">
      <q-card>
        <q-card-section>
          <div class="text-h6">Удалить запись о звонке?</div>
        </q-card-section>
        <q-card-section>
          Это действие необратимо. Запись будет полностью удалена.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn flat label="Удалить" color="negative" @click="confirmDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAdminSales } from '~/composables/useAdminSales'
import { useAdminUsers } from '~/composables/useAdminUsers'
import { useQuasar } from 'quasar'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
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
  salesManagerId: string
  sales_manager_name?: string
  sales_manager_surname?: string
}

const $q = useQuasar()
const { getAll, remove, getStats } = useAdminSales()
const { getAll: getAllUsers } = useAdminUsers()

const logs = ref<CallLog[]>([])
const loading = ref(false)
const searchQuery = ref('')
const salesManagerFilter = ref<string | null>(null)
const outcomeFilter = ref<Outcome | null>(null)
const stats = ref<{ total: number; today: number; last7Days: number } | null>(null)
const showDeleteConfirm = ref(false)
const itemToDelete = ref<number | null>(null)
const salesManagers = ref<any[]>([])

const todayCount = computed(() => stats.value?.today ?? 0)
const last7DaysCount = computed(() => stats.value?.last7Days ?? 0)

const outcomeOptions = [
  { label: 'Не ответил(а)', value: 'no_answer' },
  { label: 'Заинтересован(а)', value: 'interested' },
  { label: 'Не интересно', value: 'not_interested' },
  { label: 'Нужен перезвон', value: 'follow_up' },
]

const salesManagerOptions = computed(() =>
  salesManagers.value.map((u) => ({
    label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
    value: u.id,
  }))
)

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  sortBy: 'datetime',
  descending: true,
})

const rowsPerPageOptions = [10, 20, 50]

const columns = [
  {
    name: 'datetime',
    label: 'Дата',
    field: 'datetime',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'name',
    label: 'Имя',
    field: 'firstName',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'phone',
    label: 'Телефон',
    field: 'phone',
    align: 'left' as const,
  },
  {
    name: 'outcome',
    label: 'Результат',
    field: 'outcome',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'sales_manager',
    label: 'Менеджер',
    field: 'salesManagerId',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'notes',
    label: 'Заметки',
    field: 'notes',
    align: 'left' as const,
  },
  {
    name: 'actions',
    label: 'Действия',
    field: 'actions',
    align: 'right' as const,
  },
]

const formatDateTime = (dt: string | Date) => {
  const date = typeof dt === 'string' ? new Date(dt) : dt
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getOutcomeLabel = (outcome: Outcome) => {
  const map: Record<Outcome, string> = {
    no_answer: 'Не ответил(а)',
    interested: 'Заинтересован(а)',
    not_interested: 'Не интересно',
    follow_up: 'Нужен перезвон',
  }
  return map[outcome] || outcome
}

const getOutcomeColor = (outcome: Outcome) => {
  const map: Record<Outcome, string> = {
    no_answer: 'grey',
    interested: 'positive',
    not_interested: 'negative',
    follow_up: 'warning',
  }
  return map[outcome] || 'grey'
}

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

  if (salesManagerFilter.value) {
    list = list.filter((log) => log.salesManagerId === salesManagerFilter.value)
  }

  if (outcomeFilter.value) {
    list = list.filter((log) => log.outcome === outcomeFilter.value)
  }

  return list
})

const sortedFilteredLogs = computed(() => {
  let sorted = [...filteredLogs.value]
  const { sortBy, descending } = pagination.value
  if (!sortBy) return sorted

  sorted.sort((a, b) => {
    let aVal: any
    let bVal: any

    if (sortBy === 'datetime') {
      aVal = typeof a.datetime === 'string' ? new Date(a.datetime).getTime() : a.datetime.getTime()
      bVal = typeof b.datetime === 'string' ? new Date(b.datetime).getTime() : b.datetime.getTime()
    } else if (sortBy === 'firstName') {
      aVal = `${a.firstName} ${a.lastName}`.toLowerCase()
      bVal = `${b.firstName} ${b.lastName}`.toLowerCase()
    } else {
      aVal = a[sortBy as keyof CallLog]
      bVal = b[sortBy as keyof CallLog]
    }

    if (aVal == null) return 1
    if (bVal == null) return -1
    if (aVal < bVal) return descending ? 1 : -1
    if (aVal > bVal) return descending ? -1 : 1
    return 0
  })

  return sorted
})

const editItem = (id: number) => {
  navigateTo(`/admin/sales/${id}`)
}

const handleDelete = (id: number) => {
  itemToDelete.value = id
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!itemToDelete.value) return
  try {
    await remove(itemToDelete.value)
    $q.notify({
      type: 'positive',
      message: 'Запись удалена',
    })
    await loadLogs()
    await loadStats()
  } catch (err: any) {
    console.error('Delete error:', err)
    $q.notify({
      type: 'negative',
      message: 'Не удалось удалить запись',
    })
  } finally {
    showDeleteConfirm.value = false
    itemToDelete.value = null
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  salesManagerFilter.value = null
  outcomeFilter.value = null
}

async function loadLogs() {
  loading.value = true
  try {
    const params: any = {}
    if (salesManagerFilter.value) {
      params.salesManagerId = salesManagerFilter.value
    }
    if (outcomeFilter.value) {
      params.outcome = outcomeFilter.value
    }
    logs.value = await getAll(params)
  } catch (err: any) {
    console.error('Load sales calls error:', err)
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить данные',
    })
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

async function loadSalesManagers() {
  try {
    const users = await getAllUsers()
    salesManagers.value = (users as any[]).filter((u: any) => u.role === 'SALES')
  } catch (err: any) {
    console.error('Load sales managers error:', err)
  }
}

watch([salesManagerFilter, outcomeFilter], () => {
  loadLogs()
})

onMounted(async () => {
  await Promise.all([loadLogs(), loadStats(), loadSalesManagers()])
})
</script>

<style scoped>
.admin-page-content {
  padding: 24px;
}
</style>
