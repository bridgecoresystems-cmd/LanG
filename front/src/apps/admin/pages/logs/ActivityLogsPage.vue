<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.models.activityLogs') }}</h1>
        </div>
      </div>

      <!-- Filters -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-3">
              <q-input
                v-model="searchQuery"
                :placeholder="$t('admin.search')"
                outlined
                dense
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="userFilter"
                :options="users"
                option-label="full_name"
                option-value="id"
                :label="$t('admin.table.user')"
                outlined
                dense
                clearable
                emit-value
                map-options
                use-input
                hide-selected
                fill-input
                input-debounce="300"
                @filter="filterUsers"
              />
            </div>
            <div class="col-12 col-md-2">
              <q-select
                v-model="actionTypeFilter"
                :options="actionTypeOptions"
                :label="$t('admin.activityLog.actionType')"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-auto" style="min-width: 160px;">
              <q-input
                v-model="dateFrom"
                type="date"
                :label="$t('admin.filters.dateFrom')"
                outlined
                dense
                clearable
              />
            </div>
            <div class="col-12 col-md-auto" style="min-width: 160px;">
              <q-input
                v-model="dateTo"
                type="date"
                :label="$t('admin.filters.dateTo')"
                outlined
                dense
                clearable
              />
            </div>
            <div class="col-12 col-md-auto">
              <q-btn
                color="primary"
                icon="refresh"
                :label="$t('admin.actions.refresh')"
                @click="loadLogs"
                :loading="loading"
                class="full-width"
                style="min-width: 120px;"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Loading State -->
      <q-inner-loading :showing="loading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>

      <!-- Error State -->
      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <!-- Activity Logs Table -->
      <q-card v-if="!loading && !error" flat bordered>
        <q-card-section>
          <q-table
            :rows="sortedLogs"
            :columns="columns"
            row-key="id"
            :loading="loading"
            v-model:pagination="pagination"
            :rows-per-page-options="[10, 20, 50, 100]"
            class="admin-table"
            binary-state-sort
          >
            <template v-slot:body-cell-user="props">
              <q-td :props="props">
                <div>
                  <div class="text-weight-bold">{{ props.row.user_full_name || props.row.user_username || '—' }}</div>
                  <div class="text-caption text-grey-7">{{ props.row.user_role || '—' }}</div>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-timestamp="props">
              <q-td :props="props">
                {{ formatDateTime(props.row.timestamp) }}
              </q-td>
            </template>

            <template v-slot:body-cell-action="props">
              <q-td :props="props">
                <q-badge :color="getActionColor(props.row.action_type)">
                  {{ props.row.action_type_display }}
                </q-badge>
              </q-td>
            </template>

            <template v-slot:body-cell-page="props">
              <q-td :props="props">
                <div>
                  <div class="text-weight-medium">{{ props.row.page_path }}</div>
                  <div v-if="props.row.component_name" class="text-caption text-grey-7">
                    {{ props.row.component_name }}
                  </div>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-description="props">
              <q-td :props="props">
                <div v-if="props.row.action_description" class="text-ellipsis" style="max-width: 300px;">
                  {{ props.row.action_description }}
                </div>
                <span v-else class="text-grey-7">—</span>
              </q-td>
            </template>

            <template v-slot:body-cell-object="props">
              <q-td :props="props">
                <div v-if="props.row.object_name">
                  <div class="text-weight-medium">{{ props.row.object_name }}</div>
                  <div v-if="props.row.object_type" class="text-caption text-grey-7">
                    {{ props.row.object_type }}
                  </div>
                </div>
                <span v-else class="text-grey-7">—</span>
              </q-td>
            </template>

            <template v-slot:no-data>
              <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
                <q-icon name="inbox" size="2em" />
                <span>{{ $t('admin.table.noData') }}</span>
              </div>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { useAdminActivityLog } from '@/composables/useActivityLog'
import { useAdminUsers } from '@/composables/useAdminApi'
import dayjs from 'dayjs'

const { t } = useI18n()
const { loading, error, fetchActivityLogs } = useAdminActivityLog()
const { fetchUsers } = useAdminUsers()

const searchQuery = ref('')
const userFilter = ref<number | null>(null)
const actionTypeFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const logs = ref<any[]>([])
const users = ref<any[]>([])
const allUsers = ref<any[]>([])

const pagination = ref({
  sortBy: 'timestamp' as string | null,
  descending: true,
  page: 1,
  rowsPerPage: 20
})

// Сбрасываем на первую страницу при изменении количества строк на странице
watch(() => pagination.value.rowsPerPage, () => {
  pagination.value.page = 1
})

const actionTypeOptions = [
  { label: t('admin.activityLog.actionTypes.view'), value: 'view' },
  { label: t('admin.activityLog.actionTypes.create'), value: 'create' },
  { label: t('admin.activityLog.actionTypes.update'), value: 'update' },
  { label: t('admin.activityLog.actionTypes.delete'), value: 'delete' },
  { label: t('admin.activityLog.actionTypes.export'), value: 'export' },
  { label: t('admin.activityLog.actionTypes.import'), value: 'import' },
  { label: t('admin.activityLog.actionTypes.login'), value: 'login' },
  { label: t('admin.activityLog.actionTypes.logout'), value: 'logout' },
  { label: t('admin.activityLog.actionTypes.other'), value: 'other' },
]

const columns = computed(() => [
  {
    name: 'timestamp',
    label: t('admin.table.dateTime'),
    field: 'timestamp',
    align: 'left' as const,
    sortable: true,
    style: 'min-width: 180px'
  },
  {
    name: 'user',
    label: t('admin.table.user'),
    field: 'user_full_name',
    align: 'left' as const,
    sortable: true,
    style: 'min-width: 150px'
  },
  {
    name: 'action',
    label: t('admin.activityLog.actionType'),
    field: 'action_type',
    align: 'center' as const,
    sortable: true,
    style: 'min-width: 120px'
  },
  {
    name: 'page',
    label: t('admin.activityLog.page'),
    field: 'page_path',
    align: 'left' as const,
    sortable: true,
    style: 'min-width: 200px'
  },
  {
    name: 'description',
    label: t('admin.activityLog.description'),
    field: 'action_description',
    align: 'left' as const,
    sortable: false,
    style: 'min-width: 250px'
  },
  {
    name: 'object',
    label: t('admin.activityLog.object'),
    field: 'object_name',
    align: 'left' as const,
    sortable: false,
    style: 'min-width: 150px'
  },
])

// Фильтрация и сортировка логов на клиенте
const filteredLogs = computed(() => {
  let filtered = logs.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(log =>
      (log.user_full_name && log.user_full_name.toLowerCase().includes(query)) ||
      (log.user_username && log.user_username.toLowerCase().includes(query)) ||
      (log.page_path && log.page_path.toLowerCase().includes(query)) ||
      (log.action_description && log.action_description.toLowerCase().includes(query)) ||
      (log.object_name && log.object_name.toLowerCase().includes(query))
    )
  }

  if (userFilter.value) {
    filtered = filtered.filter(log => log.user === userFilter.value)
  }

  if (actionTypeFilter.value) {
    filtered = filtered.filter(log => log.action_type === actionTypeFilter.value)
  }

  if (dateFrom.value) {
    const fromDate = new Date(`${dateFrom.value}T00:00:00`)
    filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate)
  }

  if (dateTo.value) {
    const toDate = new Date(`${dateTo.value}T23:59:59`)
    filtered = filtered.filter(log => new Date(log.timestamp) <= toDate)
  }

  return filtered
})

// Сортировка логов
const sortedLogs = computed(() => {
  const sortBy = pagination.value.sortBy
  const descending = pagination.value.descending

  if (!sortBy) {
    return filteredLogs.value
  }

  const sorted = [...filteredLogs.value]
  sorted.sort((a, b) => {
    let aVal: any
    let bVal: any

    if (sortBy === 'timestamp') {
      aVal = new Date(a.timestamp).getTime()
      bVal = new Date(b.timestamp).getTime()
    } else if (sortBy === 'user_full_name') {
      aVal = (a.user_full_name || a.user_username || '').toLowerCase()
      bVal = (b.user_full_name || b.user_username || '').toLowerCase()
    } else if (sortBy === 'action_type') {
      aVal = a.action_type || ''
      bVal = b.action_type || ''
    } else if (sortBy === 'page_path') {
      aVal = (a.page_path || '').toLowerCase()
      bVal = (b.page_path || '').toLowerCase()
    } else {
      aVal = a[sortBy]
      bVal = b[sortBy]
    }

    if (aVal == null) return 1
    if (bVal == null) return -1

    if (aVal < bVal) return descending ? 1 : -1
    if (aVal > bVal) return descending ? -1 : 1
    return 0
  })

  return sorted
})

const formatDateTime = (dateString: string) => {
  if (!dateString) return '—'
  return dayjs(dateString).format('DD.MM.YYYY HH:mm')
}

const getActionColor = (actionType: string) => {
  const colors: Record<string, string> = {
    view: 'blue',
    create: 'positive',
    update: 'warning',
    delete: 'negative',
    export: 'info',
    import: 'purple',
    login: 'green',
    logout: 'grey',
    other: 'grey-7',
  }
  return colors[actionType] || 'grey-7'
}

const filterUsers = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      users.value = allUsers.value
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    users.value = allUsers.value.filter(
      (user: any) => 
        user.full_name?.toLowerCase().includes(needle) ||
        user.username?.toLowerCase().includes(needle)
    )
  })
}

const loadUsers = async () => {
  try {
    const response = await fetchUsers({ page_size: 9999 })
    allUsers.value = Array.isArray(response) ? response : response.results || []
    // Маппим пользователей для фильтра
    users.value = allUsers.value.map((user: any) => ({
      id: user.id,
      full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      username: user.username
    }))
  } catch (err) {
    console.error('Load users error:', err)
  }
}

const loadLogs = async () => {
  try {
    // Явно просим 9999 записей, чтобы бэкенд не ограничивал нас 20-ю
    const response = await fetchActivityLogs({ page_size: 9999 })
    const logsData = Array.isArray(response) ? response : response.results || []
    
    // Удаляем дубликаты по ID перед установкой
    const uniqueLogs = logsData.filter((log: any, index: number, self: any[]) => 
      index === self.findIndex((l: any) => l.id === log.id)
    )
    
    logs.value = uniqueLogs
  } catch (err) {
    console.error('Load logs error:', err)
  }
}

// Убрали onRequest - для клиентской пагинации QTable сам обрабатывает все через v-model:pagination

onMounted(async () => {
  await loadUsers()
  await loadLogs()
})

// Проверка границ страниц при изменении данных
watch(sortedLogs, (newVal) => {
  const totalPages = Math.ceil(newVal.length / pagination.value.rowsPerPage) || 1
  if (pagination.value.page > totalPages && totalPages > 0) {
    pagination.value.page = totalPages
  }
}, { flush: 'post' })

watch([searchQuery, userFilter, actionTypeFilter, dateFrom, dateTo], () => {
  // При изменении фильтров сбрасываем на первую страницу
  pagination.value.page = 1
}, { deep: false })
</script>

<style scoped>
.admin-page {
  padding: 0;
}

/* Плавные переходы для таблицы при пагинации */
.admin-table :deep(.q-table__middle) {
  transition: opacity 0.15s ease;
}

.admin-table :deep(.q-table tbody) {
  transition: opacity 0.15s ease;
}

/* Плавная анимация для пагинации */
.admin-table :deep(.q-table__bottom) {
  transition: opacity 0.2s ease;
}

/* Плавное появление строк при смене страницы */
.admin-table :deep(.q-table tbody tr) {
  animation: fadeInRow 0.2s ease-in;
}

@keyframes fadeInRow {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

