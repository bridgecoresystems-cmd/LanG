<template>
  <div class="cabinet-page-content contact-messages-page">
    <div class="page-header row items-center justify-between q-mb-lg">
      <div>
        <h1 class="text-h4 q-ma-none">Сообщения (Редактор)</h1>
        <p class="text-body2 text-grey-7 q-mt-xs q-mb-none">Управление отзывами и обращениями с формы контактов</p>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-badge v-if="wsConnected" color="positive" rounded class="q-px-sm">
          <q-icon name="wifi" size="14px" class="q-mr-xs" />
          В реальном времени
        </q-badge>
      </div>
    </div>

    <q-card flat bordered class="q-mb-md filters-card">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="searchQuery"
              placeholder="Поиск по имени, почте или сообщению"
              outlined
              dense
              clearable
            >
              <template v-slot:prepend><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
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

    <q-card v-if="!loading" flat bordered>
      <q-card-section class="q-pa-none">
        <q-table
          :rows="sortedItems"
          :columns="columns"
          row-key="id"
          v-model:pagination="pagination"
          :rows-per-page-options="rowsPerPageOptions"
          @update:pagination="savePagination"
          flat
          @row-click="(_evt, row) => editItem(row.id)"
          class="cabinet-table"
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
              <div class="row items-center justify-center">
                <q-icon name="thumb_up" size="16px" color="orange-8" class="q-mr-xs" />
                <span class="text-weight-bold">{{ likesMap.get(props.row.id) ?? props.row.likes ?? 0 }}</span>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">{{ formatDate(props.row.created_at) }}</q-td>
          </template>

          <template v-slot:body-cell-message="props">
            <q-td :props="props" class="message-cell">
              <div class="text-ellipsis message-preview">{{ truncate(props.row.message, 60) }}</div>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" @click.stop>
              <div class="row q-gutter-xs justify-end no-wrap">
                <q-btn flat round dense icon="thumb_up" color="orange-8" size="sm" @click.stop="handleLike(props.row.id)">
                  <q-tooltip>Лайк</q-tooltip>
                </q-btn>
                <q-btn
                  flat round dense size="sm"
                  :icon="props.row.status === 'approved' ? 'close' : 'check'"
                  :color="props.row.status === 'approved' ? 'negative' : 'positive'"
                  @click.stop="handleToggleApproval(props.row.id)"
                >
                  <q-tooltip>{{ props.row.status === 'approved' ? 'Снять с публикации' : 'Опубликовать' }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="edit" color="primary" size="sm" @click="editItem(props.row.id)" />
                <q-btn flat round dense icon="delete" color="negative" size="sm" @click.stop="handleDelete(props.row.id)" />
              </div>
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm q-pa-xl">
              <q-icon name="inbox" size="3em" />
              <span class="text-h6">Сообщений пока нет</span>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const { pagination, rowsPerPageOptions, resetPage, savePagination } = useAdminPagination('contact-messages')
const { getAll, remove, toggleApproval, likeMessage: likeMessageApi } = useAdminContact()

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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const editItem = (id: number) => navigateTo(`/cabinet/editor/contact/${id}`)

const handleLike = async (id: number) => {
  const item = items.value.find(m => m.id === id)
  if (!item) return
  const current = likesMap.value.get(id) ?? item.likes ?? 0
  likesMap.value.set(id, current + 1)
  likesMap.value = new Map(likesMap.value)
  try {
    const res = await likeMessageApi(id)
    if ((res as any)?.likes !== undefined) likesMap.value.set(id, (res as any).likes)
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
    const res = await toggleApproval(id)
    if ((res as any)?.status) item.status = (res as any).status
  } catch (e) {
    item.status = oldStatus
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Удалить сообщение?')) return
  try {
    await remove(id)
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
    const res = await getAll(params)
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
.message-cell {
  max-width: 300px;
}
.message-preview {
  color: #555;
  font-size: 0.9rem;
}
.cabinet-table {
  background: transparent;
}
.filters-card {
  background: white;
  border-radius: 12px;
}
</style>
