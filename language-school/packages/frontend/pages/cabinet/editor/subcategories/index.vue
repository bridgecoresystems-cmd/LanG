<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Подкатегории курсов (Редактор)</NH2>
      </div>
      <div class="page-header__actions">
        <NButton type="primary" size="large" @click="navigateTo('/cabinet/editor/subcategories/add')">
          <template #icon>
            <NIcon><component :is="AddIcon" /></NIcon>
          </template>
          Добавить подкатегорию
        </NButton>
      </div>
    </header>

    <NCard class="cabinet-card search-card">
      <NSpace align="center" :size="24">
        <div style="flex: 1; min-width: 200px;">
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
        <div style="width: 150px">
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
import { ref, computed, onMounted, h, reactive, watch } from 'vue'
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
  AddOutline as AddIcon,
  SearchOutline as SearchIcon,
  PencilOutline as EditIcon,
  TrashOutline as TrashIcon,
} from '@vicons/ionicons5'
import { useAdminSubcategories } from '~/composables/useAdminSubcategories'
import { useAdminPagination } from '~/composables/useAdminPagination'
import { useI18n } from 'vue-i18n'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const { locale } = useI18n()
const message = useMessage()
const { getAll, remove } = useAdminSubcategories()
const { pagination, savePagination, resetPage } = useAdminPagination('subcategories')

const items = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref<string | null>(null)

const statusOptions = [
  { label: 'Все', value: null },
  { label: 'Активные', value: 'active' },
  { label: 'Неактивные', value: 'inactive' },
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

const getName = (i: any) =>
  (locale.value === 'tm' && i.name_tm)
    ? i.name_tm
    : (locale.value === 'ru' && i.name_ru)
      ? i.name_ru
      : (locale.value === 'en' && i.name_en)
        ? i.name_en
        : i.name_tm || i.name_ru || i.name_en || '-'

const getCategoryName = (i: any) =>
  (locale.value === 'tm' && i.category_name_tm)
    ? i.category_name_tm
    : (locale.value === 'ru' && i.category_name_ru)
      ? i.category_name_ru
      : (locale.value === 'en' && i.category_name_en)
        ? i.category_name_en
        : i.category_name_tm || i.category_name_ru || i.category_name_en || '-'

const columns: DataTableColumns<any> = [
  {
    title: 'ID',
    key: 'id',
    width: 90,
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'id' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
  },
  {
    title: 'Категория',
    key: 'category',
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'category' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
    render(row) {
      return getCategoryName(row)
    },
  },
  {
    title: 'Название',
    key: 'name',
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'name' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
    render(row) {
      return h('div', { style: 'font-weight: 600;' }, getName(row))
    },
  },
  {
    title: 'Порядок',
    key: 'order',
    align: 'center',
    width: 130,
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'order' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
  },
  {
    title: 'Статус',
    key: 'is_active',
    align: 'center',
    width: 120,
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'status' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
    render(row) {
      return h(
        NBadge,
        {
          type: row.is_active ? 'success' : 'default',
          value: row.is_active ? 'Активна' : 'Неактивна',
        }
      )
    },
  },
  {
    title: 'Действия',
    key: 'actions',
    align: 'right',
    width: 120,
    render(row) {
      return h('div', { style: 'display: flex; justify-content: flex-end; gap: 8px;' }, [
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
        (i.name_tm?.toLowerCase().includes(q)) ||
        (i.name_ru?.toLowerCase().includes(q)) ||
        (i.name_en?.toLowerCase().includes(q))
    )
  }
  if (statusFilter.value) {
    filtered = filtered.filter((i) => (statusFilter.value === 'active' ? i.is_active : !i.is_active))
  }
  return filtered
})

const sortedItems = computed(() => {
  let sorted = [...filteredItems.value]
  const { sortBy, descending } = pagination.value
  if (!sortBy) return sorted
  sorted.sort((a, b) => {
    let aVal: any =
      sortBy === 'name'
        ? getName(a).toLowerCase()
        : sortBy === 'category'
          ? getCategoryName(a).toLowerCase()
          : sortBy === 'status'
            ? (a.is_active ? 1 : 0)
            : a[sortBy]
    let bVal: any =
      sortBy === 'name'
        ? getName(b).toLowerCase()
        : sortBy === 'category'
          ? getCategoryName(b).toLowerCase()
          : sortBy === 'status'
            ? (b.is_active ? 1 : 0)
            : b[sortBy]
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

const editItem = (row: any) => navigateTo(`/cabinet/editor/subcategories/${row.id}`)

const handleDelete = async (id: number) => {
  if (!confirm('Удалить подкатегорию?')) return
  try {
    await remove(id)
    message.success('Подкатегория удалена')
    await loadItems()
  } catch (e) {
    console.error(e)
    message.error('Ошибка при удалении')
  }
}

const loadItems = async () => {
  loading.value = true
  try {
    items.value = await getAll()
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
