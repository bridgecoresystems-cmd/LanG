<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Сообщения (Редактор)</NH2>
        <p class="page-header__subtitle">Управление отзывами и обращениями с формы контактов</p>
      </div>
      <div class="page-header__actions">
        <NBadge v-if="wsConnected" type="success" :value="'В реальном времени'" />
      </div>
    </header>

    <NCard class="cabinet-card search-card">
      <NSpace align="center" :size="24">
        <div style="flex: 1; min-width: 300px;">
          <NInput
            v-model:value="searchQuery"
            placeholder="Поиск по имени, почте или сообщению"
            clearable
            size="large"
          >
            <template #prefix>
              <NIcon><component :is="SearchIcon" /></NIcon>
            </template>
          </NInput>
        </div>
        <div style="width: 180px">
          <NSelect
            v-model:value="statusFilter"
            :options="statusOptions"
            placeholder="Статус"
            clearable
            size="large"
          />
        </div>
      </NSpace>
    </NCard>

    <NCard class="cabinet-card table-card" :content-style="{ padding: 0 }">
      <NDataTable
        remote
        ref="tableRef"
        :columns="columns"
        :data="sortedItems"
        :loading="loading"
        :pagination="naivePagination"
        :row-key="(row) => row.id"
        @update:sorter="handleUpdateSorter"
        :row-props="rowProps"
        class="cabinet-data-table"
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, reactive, watch, onUnmounted } from 'vue'
import {
  NCard,
  NButton,
  NInput,
  NDataTable,
  NIcon,
  NH2,
  NSpace,
  NSelect,
  NBadge,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import {
  SearchOutline as SearchIcon,
  PencilOutline as EditIcon,
  TrashOutline as TrashIcon,
  ThumbsUpOutline as ThumbsUpIcon,
  CheckmarkOutline as CheckIcon,
  CloseOutline as CloseIcon,
} from '@vicons/ionicons5'
import { useAdminContact } from '~/composables/useAdminContact'
import { useAdminPagination } from '~/composables/useAdminPagination'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const message = useMessage()
const { getAll, remove, toggleApproval, likeMessage: likeMessageApi } = useAdminContact()
const { pagination, savePagination, resetPage } = useAdminPagination('contact-messages')

const items = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref<string | null>(null)
const likesMap = ref(new Map<number, number>())
const wsConnected = ref(false)

const statusOptions = [
  { label: 'Все', value: null },
  { label: 'Одобрено', value: 'approved' },
  { label: 'Ожидает', value: 'pending' },
  { label: 'Отклонено', value: 'rejected' },
]

const naivePagination = reactive({
  page: pagination.value.page,
  pageSize: pagination.value.rowsPerPage,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  onUpdatePage: (page: number) => {
    naivePagination.page = page
    pagination.value.page = page
  },
  onUpdatePageSize: (pageSize: number) => {
    naivePagination.pageSize = pageSize
    pagination.value.rowsPerPage = pageSize
    naivePagination.page = 1
    pagination.value.page = 1
  },
})

const truncate = (s: string, len: number) => (s ? (s.length > len ? s.slice(0, len) + '…' : s) : '—')
const statusLabel = (s: string) => (s === 'approved' ? 'Одобрено' : s === 'rejected' ? 'Отклонено' : 'Ожидает')

const columns: DataTableColumns<any> = [
  {
    title: 'ID',
    key: 'id',
    width: 70,
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'id' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
  },
  {
    title: 'Имя',
    key: 'name',
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'name' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
  },
  {
    title: 'Сообщение',
    key: 'message',
    width: 300,
    render(row) {
      return h('div', { style: 'max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' }, truncate(row.message, 60))
    },
  },
  {
    title: 'Статус',
    key: 'status',
    align: 'center',
    width: 120,
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'status' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
    render(row) {
      const type = row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'error' : 'warning'
      return h(NBadge, { type, value: statusLabel(row.status) })
    },
  },
  {
    title: 'Лайки',
    key: 'likes',
    align: 'center',
    width: 100,
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'likes' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
    render(row) {
      const likes = likesMap.value.get(row.id) ?? row.likes ?? 0
      return h('div', { style: 'display: flex; align-items: center; justify-content: center; gap: 4px;' }, [
        h(NIcon, { size: 16, color: '#ff9800' }, { default: () => h(ThumbsUpIcon) }),
        h('span', { style: 'font-weight: 600;' }, String(likes)),
      ])
    },
  },
  {
    title: 'Дата',
    key: 'created_at',
    width: 180,
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'created_at' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
    render(row) {
      return formatDate(row.created_at)
    },
  },
  {
    title: '',
    key: 'actions',
    align: 'right',
    width: 200,
    render(row) {
      return h('div', { style: 'display: flex; justify-content: flex-end; gap: 4px;' }, [
        h(
          NButton,
          {
            quaternary: true,
            circle: true,
            size: 'small',
            onClick: (e: Event) => {
              e.stopPropagation()
              handleLike(row.id)
            },
          },
          { icon: () => h(NIcon, { color: '#ff9800' }, { default: () => h(ThumbsUpIcon) }) }
        ),
        h(
          NButton,
          {
            quaternary: true,
            circle: true,
            size: 'small',
            type: row.status === 'approved' ? 'error' : 'success',
            onClick: (e: Event) => {
              e.stopPropagation()
              handleToggleApproval(row.id)
            },
          },
          { icon: () => h(NIcon, null, { default: () => h(row.status === 'approved' ? CloseIcon : CheckIcon) }) }
        ),
        h(
          NButton,
          {
            quaternary: true,
            circle: true,
            size: 'small',
            onClick: (e: Event) => {
              e.stopPropagation()
              editItem(row)
            },
          },
          { icon: () => h(NIcon, null, { default: () => h(EditIcon) }) }
        ),
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

const filteredItems = computed(() => {
  let filtered = items.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (i) =>
        (i.name?.toLowerCase().includes(q)) ||
        (i.email?.toLowerCase().includes(q)) ||
        (i.phone?.toLowerCase().includes(q)) ||
        (i.message?.toLowerCase().includes(q))
    )
  }
  if (statusFilter.value) {
    filtered = filtered.filter((i) => i.status === statusFilter.value)
  }
  return filtered
})

const sortedItems = computed(() => {
  let sorted = [...filteredItems.value]
  const { sortBy, descending } = pagination.value
  if (!sortBy) return sorted
  sorted.sort((a, b) => {
    let aVal: any =
      sortBy === 'created_at'
        ? new Date(a.created_at).getTime()
        : sortBy === 'likes'
          ? likesMap.value.get(a.id) ?? a.likes ?? 0
          : a[sortBy]
    let bVal: any =
      sortBy === 'created_at'
        ? new Date(b.created_at).getTime()
        : sortBy === 'likes'
          ? likesMap.value.get(b.id) ?? b.likes ?? 0
          : b[sortBy]
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
    minute: '2-digit',
  })
}

const handleUpdateSorter = (sorter: any) => {
  if (sorter) {
    pagination.value.sortBy = sorter.columnKey
    pagination.value.descending = sorter.order === 'descend'
  } else {
    pagination.value.sortBy = 'id'
    pagination.value.descending = false
  }
}

const rowProps = (row: any) => {
  return {
    style: 'cursor: pointer;',
    onClick: (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.n-button')) {
        return
      }
      editItem(row)
    }
  }
}

const editItem = (row: any) => navigateTo(`/cabinet/editor/contact/${row.id}`)

const handleLike = async (id: number) => {
  const item = items.value.find((m) => m.id === id)
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
  const item = items.value.find((m) => m.id === id)
  if (!item) return
  const oldStatus = item.status
  item.status = oldStatus === 'approved' ? 'pending' : 'approved'
  try {
    const res = await toggleApproval(id)
    if ((res as any)?.status) item.status = (res as any).status
    message.success('Статус обновлён')
  } catch (e) {
    item.status = oldStatus
    message.error('Ошибка обновления статуса')
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Удалить сообщение?')) return
  try {
    await remove(id)
    message.success('Сообщение удалено')
    items.value = items.value.filter((i) => i.id !== id)
  } catch (e) {
    console.error(e)
    message.error('Ошибка при удалении')
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
    items.value.forEach((i) => {
      if (i.likes !== undefined) map.set(i.id, i.likes)
    })
    likesMap.value = map
  } catch (e) {
    console.error(e)
    message.error('Ошибка загрузки данных')
  } finally {
    loading.value = false
  }
}

const { connect: connectWs, disconnect: disconnectWs } = useContactWs('admin', (data) => {
  if (data.type === 'new_message' && data.message) {
    const m = data.message
    if (!items.value.some((x) => x.id === m.id)) {
      items.value = [m, ...items.value]
      likesMap.value.set(m.id, m.likes ?? 0)
      likesMap.value = new Map(likesMap.value)
    }
  }
  wsConnected.value = true
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
