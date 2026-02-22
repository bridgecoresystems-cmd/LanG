<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Категории курсов (Редактор)</NH2>
      </div>
      <div class="page-header__actions">
        <NButton type="primary" size="large" @click="navigateTo('/cabinet/editor/categories/add')">
          <template #icon>
            <NIcon><component :is="AddIcon" /></NIcon>
          </template>
          Добавить категорию
        </NButton>
      </div>
    </header>

    <NCard class="cabinet-card search-card">
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
    </NCard>

    <NCard class="cabinet-card table-card" :content-style="{ padding: 0 }">
      <NDataTable
        remote
        ref="tableRef"
        :columns="columns"
        :data="filteredCategories"
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
      title="Удалить категорию?"
      :content="deleteConfirmMessage"
      positive-text="Удалить"
      negative-text="Отмена"
      @positive-click="deleteCategory"
      @negative-click="showDeleteConfirm = false"
    />
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
  NImage,
  NModal,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import {
  AddOutline as AddIcon,
  SearchOutline as SearchIcon,
  PencilOutline as EditIcon,
  TrashOutline as TrashIcon,
  ImageOutline as ImageIcon,
} from '@vicons/ionicons5'
import { useAdminCategories } from '~/composables/useAdminCategories'
import { useAdminPagination } from '~/composables/useAdminPagination'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const message = useMessage()
const { getAll, remove } = useAdminCategories()
const { pagination, savePagination, resetPage } = useAdminPagination('categories')

const categories = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const showDeleteConfirm = ref(false)
const categoryToDelete = ref<any>(null)

const deleteConfirmMessage = computed(() => {
  if (!categoryToDelete.value) return 'Вы уверены, что хотите удалить эту категорию?'
  return `Вы уверены, что хотите удалить категорию "${categoryToDelete.value.name_ru || categoryToDelete.value.name_tm || categoryToDelete.value.name_en || 'эту'}"?`
})

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

const columns: DataTableColumns<any> = [
  {
    title: 'Фото',
    key: 'image',
    width: 80,
    render(row) {
      if (row.image) {
        return h(NImage, {
          src: row.image,
          width: 50,
          height: 50,
          objectFit: 'cover',
          style: { borderRadius: '8px' },
        })
      }
      return h(NIcon, { size: 24, color: '#d1d5db' }, { default: () => h(ImageIcon) })
    },
  },
  {
    title: 'Название (RU)',
    key: 'name_ru',
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'name_ru' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
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
    render(row) {
      return h(
        'span',
        { style: { fontWeight: 600, color: row.is_active ? '#18a058' : '#909399' } },
        row.is_active ? 'Активна' : 'Неактивна'
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
              confirmDelete(row)
            },
          },
          { icon: () => h(NIcon, null, { default: () => h(TrashIcon) }) }
        ),
      ])
    },
  },
]

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const q = searchQuery.value.toLowerCase()
  return categories.value.filter(
    (c) =>
      (c.name_ru && c.name_ru.toLowerCase().includes(q)) ||
      (c.name_tm && c.name_tm.toLowerCase().includes(q)) ||
      (c.name_en && c.name_en.toLowerCase().includes(q))
  )
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

const editItem = (row: any) => navigateTo(`/cabinet/editor/categories/${row.id}`)

const confirmDelete = (category: any) => {
  categoryToDelete.value = category
  showDeleteConfirm.value = true
}

const deleteCategory = async () => {
  if (!categoryToDelete.value) return
  try {
    await remove(categoryToDelete.value.id)
    message.success('Категория удалена')
    showDeleteConfirm.value = false
    categoryToDelete.value = null
    await fetchCategories()
  } catch (e) {
    console.error('Delete error:', e)
    message.error('Ошибка при удалении')
  }
}

const fetchCategories = async () => {
  loading.value = true
  try {
    categories.value = await getAll()
  } catch (e) {
    console.error('Fetch error:', e)
    message.error('Ошибка загрузки данных')
  } finally {
    loading.value = false
  }
}

watch(searchQuery, resetPage)
onMounted(() => fetchCategories())
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
