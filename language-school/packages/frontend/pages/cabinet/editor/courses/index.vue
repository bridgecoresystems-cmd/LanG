<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Курсы (Редактор)</NH2>
        <p class="page-header__subtitle">Управление списком курсов, ценами и статусами.</p>
      </div>
      <div class="page-header__actions">
        <NButton type="primary" size="large" @click="navigateTo('/cabinet/editor/courses/add')">
          <template #icon>
            <NIcon><component :is="AddIcon" /></NIcon>
          </template>
          Добавить курс
        </NButton>
      </div>
    </header>

    <NCard class="cabinet-card search-card">
      <NSpace align="center" :size="24">
        <div style="flex: 1; min-width: 300px;">
          <NInput
            v-model:value="searchQuery"
            placeholder="Поиск по названию..."
            clearable
            size="large"
          >
            <template #prefix>
              <NIcon><component :is="SearchIcon" /></NIcon>
            </template>
          </NInput>
        </div>
        <div style="width: 200px">
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

    <!-- Delete Confirm Modal -->
    <NModal
      v-model:show="showDeleteConfirm"
      preset="dialog"
      title="Удалить курс?"
      content="Это действие необратимо. Курс будет полностью удален из базы данных."
      positive-text="Удалить"
      negative-text="Отмена"
      @positive-click="confirmDelete"
      @negative-click="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, reactive } from 'vue'
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
  NModal,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import {
  AddOutline as AddIcon,
  SearchOutline as SearchIcon,
  PencilOutline as EditIcon,
  TrashOutline as TrashIcon,
  BookOutline as BookIcon
} from '@vicons/ionicons5'
import { useAdminCourses } from '~/composables/useAdminCourses'
import { useAdminPagination } from '~/composables/useAdminPagination'
import { useI18n } from 'vue-i18n'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const { locale } = useI18n()
const message = useMessage()
const { getAll, remove } = useAdminCourses()
const { pagination, savePagination, resetPage } = useAdminPagination('courses')

const items = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const itemToDelete = ref<number | null>(null)

const statusOptions = [
  { label: 'Активные', value: 'active' },
  { label: 'Неактивные', value: 'inactive' }
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
  }
})

const columns: DataTableColumns<any> = [
  {
    title: 'ID',
    key: 'id',
    width: 90,
    sorter: true,
    sortOrder: computed(() => pagination.value.sortBy === 'id' ? (pagination.value.descending ? 'descend' : 'ascend') : false) as any
  },
  {
    title: 'Название',
    key: 'title',
    sorter: true,
    sortOrder: computed(() => pagination.value.sortBy === 'title' ? (pagination.value.descending ? 'descend' : 'ascend') : false) as any,
    render(row) {
      return h('div', { class: 'font-bold' }, getTitle(row))
    }
  },
  {
    title: 'Категория',
    key: 'category',
    render(row) {
      return getCategoryName(row)
    }
  },
  {
    title: 'Цена',
    key: 'price',
    align: 'right',
    render(row) {
      if (row.discount_price) {
        return h('div', [
          h('div', { class: 'text-xs text-neutral-400 line-through' }, `${row.price} 💎`),
          h('div', { class: 'text-emerald-600 font-bold' }, `${row.discount_price} 💎`)
        ])
      }
      return h('div', { class: 'font-bold' }, `${row.price} 💎`)
    }
  },
  {
    title: 'Статус',
    key: 'is_active',
    align: 'center',
    render(row) {
      return h(
        NBadge,
        {
          type: row.is_active ? 'success' : 'default',
          value: row.is_active ? 'Активен' : 'Неактивен'
        }
      )
    }
  },
  {
    title: 'Действия',
    key: 'actions',
    align: 'right',
    render(row) {
      return h(NSpace, { justify: 'end' }, {
        default: () => [
          h(
            NButton,
            {
              quaternary: true,
              circle: true,
              size: 'small',
              onClick: (e: Event) => {
                e.stopPropagation()
                editItem(row)
              }
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
              }
            },
            { icon: () => h(NIcon, null, { default: () => h(TrashIcon) }) }
          )
        ]
      })
    }
  }
]

const getTitle = (i: any) => (locale.value === 'tm' && i.title_tm) ? i.title_tm : (locale.value === 'ru' && i.title_ru) ? i.title_ru : (locale.value === 'en' && i.title_en) ? i.title_en : i.title_tm || i.title_ru || i.title_en || '-'
const getCategoryName = (i: any) => (locale.value === 'tm' && i.category_name_tm) ? i.category_name_tm : (locale.value === 'ru' && i.category_name_ru) ? i.category_name_ru : (locale.value === 'en' && i.category_name_en) ? i.category_name_en : i.category_name_tm || i.category_name_ru || i.category_name_en || '-'

const filteredItems = computed(() => {
  let filtered = items.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(i =>
      getTitle(i).toLowerCase().includes(q) ||
      getCategoryName(i).toLowerCase().includes(q)
    )
  }
  if (statusFilter.value) {
    filtered = filtered.filter(i => statusFilter.value === 'active' ? i.is_active : !i.is_active)
  }
  return filtered
})

const sortedItems = computed(() => {
  let sorted = [...filteredItems.value]
  const { sortBy, descending } = pagination.value
  if (!sortBy) return sorted
  sorted.sort((a, b) => {
    let aVal: any = sortBy === 'title' ? getTitle(a).toLowerCase() : sortBy === 'price' ? parseFloat(a.discount_price || a.price || 0) : a[sortBy]
    let bVal: any = sortBy === 'title' ? getTitle(b).toLowerCase() : sortBy === 'price' ? parseFloat(b.discount_price || b.price || 0) : b[sortBy]
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (aVal < bVal) return descending ? 1 : -1
    if (aVal > bVal) return descending ? -1 : 1
    return 0
  })
  return sorted
})

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

const editItem = (row: any) => navigateTo(`/cabinet/editor/courses/${row.id}`)

const handleDelete = (id: number) => {
  itemToDelete.value = id
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!itemToDelete.value) return
  try {
    await remove(itemToDelete.value)
    message.success('Курс удален')
    await loadItems()
  } catch (e) {
    console.error(e)
    message.error('Ошибка при удалении')
  } finally {
    showDeleteConfirm.value = false
    itemToDelete.value = null
  }
}

const loadItems = async () => {
  loading.value = true
  try {
    items.value = await getAll() as any[]
  } catch (e) {
    console.error(e)
    message.error('Ошибка загрузки данных')
  } finally {
    loading.value = false
  }
}

watch([searchQuery, statusFilter], resetPage)
onMounted(() => loadItems())
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

.cursor-pointer {
  cursor: pointer;
}
</style>
