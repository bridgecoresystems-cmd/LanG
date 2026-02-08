<template>
  <div class="admin-page-content contact-messages-page">
    <div class="page-header row items-center justify-between q-mb-lg">
      <div>
        <h1 class="text-h4 q-ma-none">Сообщения с контактов</h1>
        <p class="text-body2 text-grey-7 q-mt-xs q-mb-none">Управление отзывами и обращениями с формы контактов</p>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-badge v-if="wsConnected" color="positive" rounded class="q-px-sm">
          <q-icon name="wifi" size="14px" class="q-mr-xs" />
          Обработка в реальном времени
        </q-badge>
      </div>
    </div>

    <q-card flat bordered class="q-mb-md admin-table-card filters-card">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="searchQuery"
              placeholder="Поиск (имя, email, телефон, сообщение)"
              outlined
              dense
              clearable
            >
              <template v-slot:prepend><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              label="Статус"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-inner-loading :showing="loading">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>

    <q-card v-if="!loading" flat bordered class="admin-table-card">
      <q-card-section>
        <q-table
          :rows="sortedItems"
          :columns="columns"
          row-key="id"
          v-model:pagination="pagination"
          :rows-per-page-options="rowsPerPageOptions"
          @update:pagination="savePagination"
          flat
          bordered
          @row-click="(_evt, row) => editItem(row.id)"
          class="cursor-pointer"
          binary-state-sort
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.status === 'approved' ? 'positive' : props.row.status === 'rejected' ? 'negative' : 'warning'"
              >
                {{ statusLabel(props.row.status) }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-likes="props">
            <q-td :props="props">
              <div class="row items-center">
                <q-icon name="thumb_up" size="16px" class="q-mr-xs" />
                <span class="text-weight-bold">{{ likesMap.get(props.row.id) ?? props.row.likes ?? 0 }}</span>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">{{ formatDate(props.row.created_at) }}</q-td>
          </template>

          <template v-slot:body-cell-message="props">
            <q-td :props="props" class="message-cell">
              <span class="message-preview">{{ truncate(props.row.message, 50) }}</span>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="actions-cell" @click.stop>
              <div class="action-buttons">
                <q-btn flat round dense icon="thumb_up" color="orange-8" size="sm" @click.stop="handleLike(props.row.id)" title="Лайк" />
                <q-btn flat round dense icon="visibility" color="info" size="sm" @click.stop="viewMessage(props.row)" title="Просмотр" />
                <q-btn
                  flat round dense size="sm"
                  :icon="props.row.status === 'approved' ? 'close' : 'check'"
                  :color="props.row.status === 'approved' ? 'negative' : 'positive'"
                  @click.stop="handleToggleApproval(props.row.id)"
                  title="Одобрить/Отклонить"
                />
                <q-btn flat round dense icon="edit" color="primary" size="sm" @click="editItem(props.row.id)" />
                <q-btn flat round dense icon="delete" color="negative" size="sm" @click.stop="handleDelete(props.row.id)" />
              </div>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
              <q-icon name="inbox" size="2em" />
              <span>Нет данных</span>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const { pagination, rowsPerPageOptions, resetPage, savePagination } = useAdminPagination('contact-messages')

const items = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const likesMap = ref(new Map<number, number>())

const statusOptions = [
  { label: 'Все', value: '' },
  { label: 'Одобрено', value: 'approved' },
  { label: 'Ожидает', value: 'pending' },
  { label: 'Отклонено', value: 'rejected' }
]

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const, sortable: true },
  { name: 'name', label: 'Имя', field: 'name', align: 'left' as const, sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left' as const, sortable: true },
  { name: 'phone', label: 'Телефон', field: 'phone', align: 'left' as const, sortable: true },
  { name: 'message', label: 'Сообщение', field: 'message', align: 'left' as const },
  { name: 'status', label: 'Статус', field: 'status', align: 'center' as const, sortable: true },
  { name: 'likes', label: 'Лайки', field: 'likes', align: 'center' as const, sortable: true },
  { name: 'created_at', label: 'Дата', field: 'created_at', align: 'left' as const, sortable: true },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const }
]

const truncate = (s: string, len: number) => (s ? (s.length > len ? s.slice(0, len) + '…' : s) : '—')

const statusLabel = (s: string) => (s === 'approved' ? 'Одобрено' : s === 'rejected' ? 'Отклонено' : 'Ожидает')

const filteredItems = computed(() => {
  let filtered = items.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(i =>
      (i.name?.toLowerCase().includes(q)) ||
      (i.email?.toLowerCase().includes(q)) ||
      (i.phone?.toLowerCase().includes(q)) ||
      (i.message?.toLowerCase().includes(q))
    )
  }
  if (statusFilter.value) {
    filtered = filtered.filter(i => i.status === statusFilter.value)
  }
  return filtered
})

const sortedItems = computed(() => {
  let sorted = [...filteredItems.value]
  const { sortBy, descending } = pagination.value
  if (!sortBy) return sorted
  sorted.sort((a, b) => {
    let aVal: any = sortBy === 'created_at' ? new Date(a.created_at).getTime() : sortBy === 'likes' ? (likesMap.value.get(a.id) ?? a.likes ?? 0) : a[sortBy]
    let bVal: any = sortBy === 'created_at' ? new Date(b.created_at).getTime() : sortBy === 'likes' ? (likesMap.value.get(b.id) ?? b.likes ?? 0) : b[sortBy]
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (aVal < bVal) return descending ? 1 : -1
    if (aVal > bVal) return descending ? -1 : 1
    return 0
  })
  return sorted
})

const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const editItem = (id: number) => navigateTo(`/admin/landing/contact/${id}`)

const viewMessage = (row: any) => {
  alert(`Сообщение от ${row.name}:\n\n${row.message}`)
}

const handleLike = async (id: number) => {
  const item = items.value.find(m => m.id === id)
  if (!item) return
  const current = likesMap.value.get(id) ?? item.likes ?? 0
  likesMap.value.set(id, current + 1)
  likesMap.value = new Map(likesMap.value)
  try {
    const res = await $fetch<any>(`${apiBase}/admin/contact-messages/${id}/like`, { method: 'POST', credentials: 'include' })
    if (res?.likes !== undefined) likesMap.value.set(id, res.likes)
  } catch (e) {
    likesMap.value.set(id, current)
    likesMap.value = new Map(likesMap.value)
  }
}

const handleToggleApproval = async (id: number) => {
  const item = items.value.find(m => m.id === id)
  if (!item) return
  const oldStatus = item.status
  item.status = oldStatus === 'approved' ? 'pending' : 'approved'
  try {
    const res = await $fetch<any>(`${apiBase}/admin/contact-messages/${id}/toggle-approval`, { method: 'POST', credentials: 'include' })
    if (res?.status) item.status = res.status
  } catch (e) {
    item.status = oldStatus
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Удалить сообщение?')) return
  try {
    await $fetch(`${apiBase}/admin/contact-messages/${id}`, { method: 'DELETE', credentials: 'include' })
    items.value = items.value.filter(i => i.id !== id)
  } catch (e) {
    console.error(e)
  }
}

const loadItems = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (statusFilter.value) params.status = statusFilter.value
    const res = await $fetch<any[]>(`${apiBase}/admin/contact-messages`, { credentials: 'include', query: params })
    items.value = Array.isArray(res) ? res : []
    const map = new Map<number, number>()
    items.value.forEach(i => { if (i.likes !== undefined) map.set(i.id, i.likes) })
    likesMap.value = map
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// WebSocket: new message appears in real-time
const { connect: connectWs, disconnect: disconnectWs, connected: wsConnected } = useContactWs('admin', (data) => {
  if (data.type === 'new_message' && data.message) {
    const m = data.message
    if (!items.value.some((x) => x.id === m.id)) {
      items.value = [m, ...items.value]
      likesMap.value.set(m.id, m.likes ?? 0)
      likesMap.value = new Map(likesMap.value)
    }
  }
})

watch(() => pagination.value.rowsPerPage, resetPage)
watch(statusFilter, () => loadItems())

onMounted(() => {
  loadItems()
  connectWs()
})

onUnmounted(() => {
  disconnectWs()
})
</script>

<style scoped>
.contact-messages-page .page-header {
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.contact-messages-page .filters-card {
  border-radius: 8px;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
}

.contact-messages-page .message-cell {
  max-width: 240px;
}

.contact-messages-page .message-preview {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #555;
  font-size: 0.875rem;
}

.contact-messages-page .actions-cell {
  white-space: nowrap;
}

.contact-messages-page .action-buttons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.contact-messages-page :deep(.q-badge) {
  font-size: 0.75rem;
  padding: 4px 8px;
}

.contact-messages-page :deep(.q-table tbody tr:hover) {
  background-color: rgba(65, 118, 144, 0.04) !important;
}
</style>
