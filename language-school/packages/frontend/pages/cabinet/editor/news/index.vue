<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Новости (Редактор)</NH2>
        <p class="page-header__subtitle">Управление новостями и публикациями.</p>
      </div>
      <div class="page-header__actions">
        <NButton 
          v-if="canExportExcel"
          type="default" 
          @click="showExportDialog = true"
        >
          <template #icon>
            <NIcon><component :is="DownloadIcon" /></NIcon>
          </template>
          Экспорт в Excel
        </NButton>
        <NButton type="primary" size="large" @click="navigateTo('/cabinet/editor/news/add')">
          <template #icon>
            <NIcon><component :is="AddIcon" /></NIcon>
          </template>
          Добавить новость
        </NButton>
      </div>
    </header>

    <NCard class="cabinet-card search-card">
      <NSpace align="center" :size="24">
        <div style="flex: 1; min-width: 200px;">
          <NInput
            v-model:value="searchQuery"
            placeholder="Поиск по заголовку..."
            clearable
            size="large"
          >
            <template #prefix>
              <NIcon><component :is="SearchIcon" /></NIcon>
            </template>
          </NInput>
        </div>
        <div style="width: 180px">
          <NInput
            v-model:value="dateFrom"
            type="date"
            clearable
            size="large"
            placeholder=""
          />
          <div style="font-size: 12px; color: var(--n-text-color-3); margin-top: 4px;">Дата от</div>
        </div>
        <div style="width: 180px">
          <NInput
            v-model:value="dateTo"
            type="date"
            clearable
            size="large"
            placeholder=""
          />
          <div style="font-size: 12px; color: var(--n-text-color-3); margin-top: 4px;">Дата до</div>
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

    <!-- Export Dialog -->
    <NModal v-model:show="showExportDialog" preset="card" title="Экспорт в Excel" style="width: 400px;">
      <NForm label-placement="top">
        <NFormItem label="Период">
          <NSelect
            v-model:value="exportPeriod"
            :options="exportPeriodOptions"
            placeholder="Выберите период"
          />
        </NFormItem>
        <div class="export-actions">
          <NButton type="default" @click="showExportDialog = false">Отмена</NButton>
          <NButton type="primary" :loading="exporting" @click="handleExport">Экспорт</NButton>
        </div>
      </NForm>
    </NModal>
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
  NModal,
  NForm,
  NFormItem,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import {
  AddOutline as AddIcon,
  SearchOutline as SearchIcon,
  PencilOutline as EditIcon,
  TrashOutline as TrashIcon,
  DownloadOutline as DownloadIcon,
  EyeOutline as EyeIcon,
} from '@vicons/ionicons5'
import { useAdminNews } from '~/composables/useAdminNews'
import { useAdminPagination } from '~/composables/useAdminPagination'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const { locale } = useI18n()
const message = useMessage()
const authStore = useAuthStore()
const { loading, error, getAll, remove } = useAdminNews()
const { pagination, savePagination, resetPage } = useAdminPagination('news')

const canExportExcel = computed(() => {
  return authStore.user?.can_export_excel === true
})

const items = ref<any[]>([])
const searchQuery = ref('')
const statusFilter = ref<string | null>(null)
const dateFrom = ref('')
const dateTo = ref('')
const showExportDialog = ref(false)
const exportPeriod = ref('30')
const exporting = ref(false)

const statusOptions = [
  { label: 'Все', value: null },
  { label: 'Главные', value: 'featured' },
  { label: 'Обычные', value: 'normal' },
]

const exportPeriodOptions = [
  { label: 'Неделя', value: '7' },
  { label: '10 дней', value: '10' },
  { label: 'Месяц', value: '30' },
  { label: 'Квартал', value: '90' },
  { label: 'Год', value: '365' },
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

const getTitle = (item: any) => {
  if (locale.value === 'tm' && item.title_tm) return item.title_tm
  if (locale.value === 'ru' && item.title_ru) return item.title_ru
  if (locale.value === 'en' && item.title_en) return item.title_en
  return item.title_tm || item.title_ru || item.title_en || '-'
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

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
    title: 'Заголовок',
    key: 'title',
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'title' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
    render(row) {
      return h('div', { style: 'font-weight: 600; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' }, getTitle(row))
    },
  },
  {
    title: 'Статус',
    key: 'is_featured',
    align: 'center',
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'is_featured' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
    render(row) {
      return h(
        NBadge,
        {
          type: row.is_featured ? 'success' : 'default',
          value: row.is_featured ? 'Главная' : 'Обычная',
        }
      )
    },
  },
  {
    title: 'Просмотры',
    key: 'views',
    align: 'center',
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'views' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
    render(row) {
      return h('div', { style: 'display: flex; align-items: center; justify-content: center; gap: 4px;' }, [
        h(NIcon, { size: 16 }, { default: () => h(EyeIcon) }),
        h('span', String(row.views || 0)),
      ])
    },
  },
  {
    title: 'Дата создания',
    key: 'created_at',
    sorter: true,
    sortOrder: computed(() =>
      pagination.value.sortBy === 'created_at' ? (pagination.value.descending ? 'descend' : 'ascend') : false
    ) as any,
    render(row) {
      return formatDate(row.created_at)
    },
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
        ],
      })
    },
  },
]

const filteredItems = computed(() => {
  let filtered = items.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((item) =>
      (item.title_tm && item.title_tm.toLowerCase().includes(query)) ||
      (item.title_ru && item.title_ru.toLowerCase().includes(query)) ||
      (item.title_en && item.title_en.toLowerCase().includes(query))
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter((item) =>
      statusFilter.value === 'featured' ? item.is_featured : !item.is_featured
    )
  }

  if (dateFrom.value) {
    const fromDate = new Date(dateFrom.value)
    fromDate.setHours(0, 0, 0, 0)
    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.created_at)
      itemDate.setHours(0, 0, 0, 0)
      return itemDate >= fromDate
    })
  }

  if (dateTo.value) {
    const toDate = new Date(dateTo.value)
    toDate.setHours(23, 59, 59, 999)
    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.created_at)
      return itemDate <= toDate
    })
  }

  return filtered
})

const sortedItems = computed(() => {
  let sorted = [...filteredItems.value]
  const { sortBy, descending } = pagination.value
  if (!sortBy) return sorted

  sorted.sort((a, b) => {
    let aVal: any
    let bVal: any

    if (sortBy === 'title') {
      aVal = getTitle(a).toLowerCase()
      bVal = getTitle(b).toLowerCase()
    } else if (sortBy === 'is_featured') {
      aVal = a.is_featured ? 1 : 0
      bVal = b.is_featured ? 1 : 0
    } else if (sortBy === 'created_at') {
      aVal = new Date(a.created_at).getTime()
      bVal = new Date(b.created_at).getTime()
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

const editItem = (row: any) => navigateTo(`/cabinet/editor/news/${row.id}`)

const handleDelete = async (id: number) => {
  if (!confirm('Вы уверены, что хотите удалить эту новость?')) return
  try {
    await remove(id)
    message.success('Новость удалена')
    await loadNews()
  } catch (e) {
    console.error(e)
    message.error('Ошибка при удалении')
  }
}

const loadNews = async () => {
  try {
    const params: any = { page_size: 9999 }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    const response = await getAll(params)
    items.value = Array.isArray(response) ? response : (response as any)?.results || []
  } catch (err) {
    console.error('Load news error:', err)
    message.error('Ошибка загрузки данных')
  }
}

const calculateAnalytics = (periodDays: number) => {
  const now = Date.now()
  const periodStart = now - periodDays * 24 * 60 * 60 * 1000
  const previousPeriodStart = periodStart - periodDays * 24 * 60 * 60 * 1000

  const currentPeriodItems = sortedItems.value.filter((item) => {
    const itemTime = new Date(item.created_at).getTime()
    return itemTime >= periodStart && itemTime <= now
  })

  const previousPeriodItems = items.value.filter((item) => {
    const itemTime = new Date(item.created_at).getTime()
    return itemTime >= previousPeriodStart && itemTime < periodStart
  })

  const currentViews = currentPeriodItems.reduce((sum, item) => sum + (item.views || 0), 0)
  const previousViews = previousPeriodItems.reduce((sum, item) => sum + (item.views || 0), 0)
  const difference = currentViews - previousViews
  const percentage =
    previousViews > 0
      ? ((difference / previousViews) * 100).toFixed(2)
      : currentViews > 0
        ? '100.00'
        : '0.00'

  return {
    currentPeriod: {
      items: currentPeriodItems.length,
      views: currentViews,
      period: `${new Date(periodStart).toLocaleDateString()} - ${new Date(now).toLocaleDateString()}`,
    },
    previousPeriod: {
      items: previousPeriodItems.length,
      views: previousViews,
      period: `${new Date(previousPeriodStart).toLocaleDateString()} - ${new Date(periodStart).toLocaleDateString()}`,
    },
    difference,
    percentage,
    trend: difference > 0 ? 'рост' : difference < 0 ? 'падение' : 'стабильность',
  }
}

const handleExport = async () => {
  exporting.value = true
  try {
    const periodDays = parseInt(exportPeriod.value)
    const analytics = calculateAnalytics(periodDays)

    const { utils, writeFile } = await import('xlsx')
    const wb = utils.book_new()

    const tableData = sortedItems.value.map((item) => ({
      ID: item.id,
      Заголовок: getTitle(item),
      Статус: item.is_featured ? 'Главная' : 'Обычная',
      Просмотры: item.views || 0,
      Дата_создания: formatDate(item.created_at),
    }))

    const ws1 = utils.json_to_sheet(tableData)
    utils.book_append_sheet(wb, ws1, 'Таблица')

    const analyticsData = [
      { Показатель: 'Текущий период', Значение: analytics.currentPeriod.period },
      { Показатель: 'Количество новостей', Значение: analytics.currentPeriod.items },
      { Показатель: 'Количество просмотров', Значение: analytics.currentPeriod.views },
      { Показатель: '', Значение: '' },
      { Показатель: 'Предыдущий период', Значение: analytics.previousPeriod.period },
      { Показатель: 'Количество новостей', Значение: analytics.previousPeriod.items },
      { Показатель: 'Количество просмотров', Значение: analytics.previousPeriod.views },
      { Показатель: '', Значение: '' },
      { Показатель: 'Разница', Значение: analytics.difference },
      { Показатель: 'Процент', Значение: `${analytics.percentage}%` },
      { Показатель: 'Тренд', Значение: analytics.trend },
    ]
    const ws2 = utils.json_to_sheet(analyticsData)
    utils.book_append_sheet(wb, ws2, 'Аналитика')

    const filename = `news_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`
    writeFile(wb, filename)

    message.success('Экспорт завершён')
    showExportDialog.value = false
  } catch (err) {
    console.error('Export error:', err)
    message.error('Ошибка при экспорте')
  } finally {
    exporting.value = false
  }
}

watch([searchQuery, statusFilter, dateFrom, dateTo], resetPage)
onMounted(() => loadNews())
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

.page-header__actions {
  display: flex;
  gap: 12px;
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

.export-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--n-border-color);
}
</style>
