<template>
  <div class="admin-page-content">
    <!-- Page Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <h1 class="text-h4 q-ma-none">Новости</h1>
      </div>
      <div class="col-auto">
        <div class="row items-center q-gutter-sm">
          <q-btn
            color="positive"
            label="Экспорт в Excel"
            icon="file_download"
            @click="showExportDialog = true"
          />
          <q-btn
            color="primary"
            label="Добавить новость"
            icon="add"
            to="/admin/landing/news/add"
          />
        </div>
      </div>
    </div>

    <!-- Filters -->
    <q-card flat bordered class="q-mb-md admin-table-card">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="searchQuery"
              placeholder="Поиск"
              outlined
              dense
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-2">
            <q-input
              v-model="dateFrom"
              type="date"
              label="Дата от"
              outlined
              dense
              clearable
            />
          </div>
          <div class="col-12 col-md-2">
            <q-input
              v-model="dateTo"
              type="date"
              label="Дата до"
              outlined
              dense
              clearable
            />
          </div>
          <div class="col-12 col-md-2">
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

    <!-- Loading State -->
    <q-inner-loading :showing="loading">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>

    <!-- Error State -->
    <q-banner v-if="error" class="bg-negative text-white q-mb-md">
      {{ error }}
    </q-banner>

    <!-- News Table -->
    <q-card v-if="!loading && !error" flat bordered class="admin-table-card">
      <q-card-section>
        <q-table
          :rows="sortedItems"
          :columns="columns"
          row-key="id"
          :loading="loading"
          v-model:pagination="pagination"
          :rows-per-page-options="rowsPerPageOptions"
          @update:pagination="savePagination"
          @row-click="(_evt, row) => editItem(row.id)"
          class="cursor-pointer"
          binary-state-sort
        >
          <template v-slot:body-cell-title="props">
            <q-td :props="props" style="max-width: 300px">
              <div class="text-weight-medium text-ellipsis" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px">
                {{ getTitle(props.row) }}
              </div>
            </q-td>
          </template>

            <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.is_featured ? 'positive' : 'grey'"
                :label="props.row.is_featured ? 'Главная' : 'Обычная'"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-views="props">
            <q-td :props="props">
              <div class="row items-center">
                <q-icon name="visibility" size="16px" class="q-mr-xs" />
                <span>{{ props.row.views || 0 }}</span>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" @click.stop>
              <q-btn
                flat
                round
                dense
                icon="edit"
                color="primary"
                @click="editItem(props.row.id)"
                class="q-mr-xs"
              />
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                @click.stop="handleDelete(props.row.id)"
              />
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

    <!-- Export Dialog -->
    <q-dialog v-model="showExportDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Экспорт в Excel</div>
        </q-card-section>

        <q-card-section>
          <q-select
            v-model="exportPeriod"
            :options="exportPeriodOptions"
            label="Период"
            outlined
            emit-value
            map-options
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="grey" v-close-popup />
          <q-btn label="Экспорт" color="primary" :loading="exporting" @click="handleExport" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const router = useRouter()
const { locale } = useI18n()
const { loading, error, fetchNews, deleteNews } = useAdminNews()
const { pagination, rowsPerPageOptions, resetPage, savePagination } = useAdminPagination('news')

const searchQuery = ref('')
const statusFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const items = ref<any[]>([])
const showExportDialog = ref(false)
const exportPeriod = ref('30')
const exporting = ref(false)

const statusOptions = [
  { label: 'Все', value: '' },
  { label: 'Главные', value: 'featured' },
  { label: 'Обычные', value: 'normal' }
]

const exportPeriodOptions = [
  { label: 'Неделя', value: '7' },
  { label: '10 дней', value: '10' },
  { label: 'Месяц', value: '30' },
  { label: 'Квартал', value: '90' },
  { label: 'Год', value: '365' }
]

const columns = computed(() => [
  { name: 'id', label: 'ID', field: 'id', sortable: true },
  { name: 'title', label: 'Заголовок', field: 'title', sortable: true, style: 'max-width: 300px', classes: 'text-ellipsis' },
  { name: 'status', label: 'Статус', field: 'is_featured', sortable: true },
  { name: 'views', label: 'Просмотры', field: 'views', sortable: true },
  { name: 'created_at', label: 'Дата создания', field: 'created_at', sortable: true },
  { name: 'actions', label: 'Действия', field: 'actions' }
])

const filteredItems = computed(() => {
  let filtered = items.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      (item.title_tm && item.title_tm.toLowerCase().includes(query)) ||
      (item.title_ru && item.title_ru.toLowerCase().includes(query)) ||
      (item.title_en && item.title_en.toLowerCase().includes(query))
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(item =>
      statusFilter.value === 'featured' ? item.is_featured : !item.is_featured
    )
  }

  if (dateFrom.value) {
    const fromDate = new Date(dateFrom.value)
    fromDate.setHours(0, 0, 0, 0)
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.created_at)
      itemDate.setHours(0, 0, 0, 0)
      return itemDate >= fromDate
    })
  }

  if (dateTo.value) {
    const toDate = new Date(dateTo.value)
    toDate.setHours(23, 59, 59, 999)
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.created_at)
      return itemDate <= toDate
    })
  }

  return filtered
})

const sortedItems = computed(() => {
  let sorted = [...filteredItems.value]
  const sortBy = pagination.value.sortBy
  const descending = pagination.value.descending

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

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

const getTitle = (item: any) => {
  if (locale.value === 'tm' && item.title_tm) return item.title_tm
  if (locale.value === 'ru' && item.title_ru) return item.title_ru
  if (locale.value === 'en' && item.title_en) return item.title_en
  return item.title_tm || item.title_ru || item.title_en || '-'
}

const editItem = (id: number) => {
  router.push(`/admin/landing/news/${id}`)
}

const handleDelete = async (id: number) => {
  if (!confirm('Вы уверены, что хотите удалить эту новость?')) return
  try {
    await deleteNews(id)
    await loadNews()
  } catch (err) {
    console.error('Delete error:', err)
  }
}

const loadNews = async () => {
  try {
    const params: any = { page_size: 9999 }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    const response = await fetchNews(params)
    items.value = Array.isArray(response) ? response : response?.results || []
  } catch (err) {
    console.error('Load news error:', err)
  }
}

watch(() => pagination.value.rowsPerPage, resetPage)

watch([searchQuery, statusFilter, dateFrom, dateTo], resetPage)

const calculateAnalytics = (periodDays: number) => {
  const now = Date.now()
  const periodStart = now - periodDays * 24 * 60 * 60 * 1000
  const previousPeriodStart = periodStart - periodDays * 24 * 60 * 60 * 1000

  const currentPeriodItems = sortedItems.value.filter(item => {
    const itemTime = new Date(item.created_at).getTime()
    return itemTime >= periodStart && itemTime <= now
  })

  const previousPeriodItems = items.value.filter(item => {
    const itemTime = new Date(item.created_at).getTime()
    return itemTime >= previousPeriodStart && itemTime < periodStart
  })

  const currentViews = currentPeriodItems.reduce((sum, item) => sum + (item.views || 0), 0)
  const previousViews = previousPeriodItems.reduce((sum, item) => sum + (item.views || 0), 0)
  const difference = currentViews - previousViews
  const percentage = previousViews > 0 ? ((difference / previousViews) * 100).toFixed(2) : currentViews > 0 ? '100.00' : '0.00'

  return {
    currentPeriod: { items: currentPeriodItems.length, views: currentViews, period: `${new Date(periodStart).toLocaleDateString()} - ${new Date(now).toLocaleDateString()}` },
    previousPeriod: { items: previousPeriodItems.length, views: previousViews, period: `${new Date(previousPeriodStart).toLocaleDateString()} - ${new Date(periodStart).toLocaleDateString()}` },
    difference,
    percentage,
    trend: difference > 0 ? 'рост' : difference < 0 ? 'падение' : 'стабильность'
  }
}

const handleExport = async () => {
  exporting.value = true
  try {
    const periodDays = parseInt(exportPeriod.value)
    const analytics = calculateAnalytics(periodDays)

    const { utils, writeFile } = await import('xlsx')
    const wb = utils.book_new()

    const tableData = sortedItems.value.map(item => ({
      ID: item.id,
      Заголовок: getTitle(item),
      Статус: item.is_featured ? 'Главная' : 'Обычная',
      Просмотры: item.views || 0,
      Дата_создания: formatDate(item.created_at)
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
      { Показатель: 'Тренд', Значение: analytics.trend }
    ]
    const ws2 = utils.json_to_sheet(analyticsData)
    utils.book_append_sheet(wb, ws2, 'Аналитика')

    const filename = `news_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`
    writeFile(wb, filename)

    showExportDialog.value = false
  } catch (err) {
    console.error('Export error:', err)
    alert('Ошибка при экспорте')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  loadNews()
})
</script>
