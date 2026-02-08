<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.models.news') }}</h1>
        </div>
        <div class="col-auto">
          <div class="row items-center" style="gap: 12px;">
            <q-btn
              color="positive"
              :label="$t('admin.export.excel')"
              icon="file_download"
              @click="showExportDialog = true"
            />
            <q-btn
              color="primary"
              :label="$t('admin.actions.add') + ' ' + $t('admin.models.news')"
              icon="add"
              :to="{ name: 'AdminNewsAdd' }"
            />
          </div>
        </div>
      </div>

      <!-- Filters -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
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
            <div class="col-12 col-md-2">
              <q-input
                v-model="dateFrom"
                type="date"
                :label="$t('admin.filters.dateFrom')"
                outlined
                dense
                clearable
              />
            </div>
            <div class="col-12 col-md-2">
              <q-input
                v-model="dateTo"
                type="date"
                :label="$t('admin.filters.dateTo')"
                outlined
                dense
                clearable
              />
            </div>
            <div class="col-12 col-md-2">
              <q-select
                v-model="statusFilter"
                :options="statusOptions"
                :label="$t('admin.filters.status')"
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
      <q-card v-if="!loading && !error" flat bordered>
        <q-card-section>
          <q-table
            :rows="sortedItems"
            :columns="columns"
            row-key="id"
            :loading="loading"
            v-model:pagination="pagination"
            :rows-per-page-options="[10, 20, 50, 100]"
            @row-click="(evt, row) => editItem(row.id)"
            class="cursor-pointer"
            binary-state-sort
          >
            <template v-slot:body-cell-title="props">
              <q-td :props="props" style="max-width: 300px;">
                <div class="text-weight-medium text-ellipsis" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px;">
                  {{ getTitle(props.row) }}
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="props.row.is_published ? 'positive' : 'warning'"
                  :label="props.row.is_published ? $t('admin.filters.published') : $t('admin.filters.draft')"
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
                <span>{{ $t('admin.table.noData') }}</span>
              </div>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <!-- Export Dialog -->
      <q-dialog v-model="showExportDialog">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">{{ $t('admin.export.title') }}</div>
          </q-card-section>

          <q-card-section>
            <q-select
              v-model="exportPeriod"
              :options="exportPeriodOptions"
              :label="$t('admin.export.period')"
              outlined
              emit-value
              map-options
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              :label="$t('admin.actions.cancel')"
              color="grey"
              v-close-popup
            />
            <q-btn
              :label="$t('admin.export.export')"
              color="primary"
              :loading="exporting"
              @click="handleExport"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminNews } from '@/composables/useAdminApi'
import dayjs from 'dayjs'
// @ts-ignore - xlsx will be installed via npm
import * as XLSX from 'xlsx'

const router = useRouter()
const { t, locale } = useI18n()
const { loading, error, fetchNews, deleteNews } = useAdminNews()

const searchQuery = ref('')
const statusFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const items = ref<any[]>([])
const showExportDialog = ref(false)
const exportPeriod = ref('30')
const exporting = ref(false)

const pagination = ref({
  sortBy: 'id',
  descending: false,
  page: 1,
  rowsPerPage: 20
})

const statusOptions = [
  { label: t('admin.filters.all'), value: '' },
  { label: t('admin.filters.published'), value: 'published' },
  { label: t('admin.filters.draft'), value: 'draft' }
]

const exportPeriodOptions = [
  { label: t('admin.export.periods.week'), value: '7' },
  { label: t('admin.export.periods.10days'), value: '10' },
  { label: t('admin.export.periods.month'), value: '30' },
  { label: t('admin.export.periods.quarter'), value: '90' },
  { label: t('admin.export.periods.year'), value: '365' }
]

const columns = computed(() => [
  {
    name: 'id',
    label: t('admin.table.id'),
    field: 'id',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'title',
    label: t('admin.table.title'),
    field: 'title',
    align: 'left' as const,
    sortable: true,
    style: 'max-width: 300px',
    classes: 'text-ellipsis'
  },
  {
    name: 'status',
    label: t('admin.table.status'),
    field: 'is_published',
    align: 'center' as const,
    sortable: true
  },
  {
    name: 'views',
    label: t('admin.table.views'),
    field: 'views',
    align: 'center' as const,
    sortable: true
  },
  {
    name: 'created_at',
    label: t('admin.table.createdAt'),
    field: 'created_at',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'actions',
    label: t('admin.table.actions'),
    field: 'actions',
    align: 'center' as const
  }
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
      statusFilter.value === 'published' ? item.is_published : !item.is_published
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
    
    // Handle special fields
    if (sortBy === 'title') {
      aVal = getTitle(a).toLowerCase()
      bVal = getTitle(b).toLowerCase()
    } else if (sortBy === 'status') {
      aVal = a.is_published ? 1 : 0
      bVal = b.is_published ? 1 : 0
    } else if (sortBy === 'created_at') {
      aVal = new Date(a.created_at).getTime()
      bVal = new Date(b.created_at).getTime()
    } else {
      aVal = a[sortBy]
      bVal = b[sortBy]
    }
    
    // Handle null/undefined values
    if (aVal == null) return 1
    if (bVal == null) return -1
    
    // Compare values
    if (aVal < bVal) return descending ? 1 : -1
    if (aVal > bVal) return descending ? -1 : 1
    return 0
  })
  
  return sorted
})

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY-MM-DD HH:mm')
}

const getTitle = (item: any) => {
  if (locale.value === 'tm' && item.title_tm) return item.title_tm
  if (locale.value === 'ru' && item.title_ru) return item.title_ru
  if (locale.value === 'en' && item.title_en) return item.title_en
  return item.title_tm || item.title_ru || item.title_en || '-'
}

const editItem = (id: number) => {
  router.push(`/management/landing/news/${id}/change`)
}

const handleDelete = async (id: number) => {
  const confirmed = await new Promise<boolean>((resolve) => {
    resolve(window.confirm(t('admin.confirmDelete')))
  })

  if (confirmed) {
    try {
      await deleteNews(id)
      await loadNews()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}

const loadNews = async () => {
  try {
    const params: any = { page_size: 9999 }
    if (statusFilter.value) {
      params.is_published = statusFilter.value === 'published'
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    const response = await fetchNews(params)
    items.value = Array.isArray(response) ? response : response.results || []
  } catch (err) {
    console.error('Load news error:', err)
  }
}

// Watchers
watch(() => pagination.value.rowsPerPage, () => {
  pagination.value.page = 1
})

const calculateAnalytics = (periodDays: number) => {
  const now = dayjs()
  const periodStart = now.subtract(periodDays, 'day')
  const previousPeriodStart = periodStart.subtract(periodDays, 'day')
  
  const currentPeriodItems = sortedItems.value.filter(item => {
    const itemDate = dayjs(item.created_at)
    return itemDate.isAfter(periodStart) && itemDate.isBefore(now) || itemDate.isSame(periodStart) || itemDate.isSame(now)
  })
  
  const previousPeriodItems = items.value.filter(item => {
    const itemDate = dayjs(item.created_at)
    return itemDate.isAfter(previousPeriodStart) && itemDate.isBefore(periodStart) || itemDate.isSame(previousPeriodStart) || itemDate.isSame(periodStart)
  })
  
  const currentViews = currentPeriodItems.reduce((sum, item) => sum + (item.views || 0), 0)
  const previousViews = previousPeriodItems.reduce((sum, item) => sum + (item.views || 0), 0)
  
  const difference = currentViews - previousViews
  const percentage = previousViews > 0 ? ((difference / previousViews) * 100).toFixed(2) : currentViews > 0 ? '100.00' : '0.00'
  
  return {
    currentPeriod: {
      items: currentPeriodItems.length,
      views: currentViews,
      period: `${periodStart.format('YYYY-MM-DD')} - ${now.format('YYYY-MM-DD')}`
    },
    previousPeriod: {
      items: previousPeriodItems.length,
      views: previousViews,
      period: `${previousPeriodStart.format('YYYY-MM-DD')} - ${periodStart.format('YYYY-MM-DD')}`
    },
    difference: difference,
    percentage: percentage,
    trend: difference > 0 ? 'growth' : difference < 0 ? 'decline' : 'stable'
  }
}

const handleExport = async () => {
  exporting.value = true
  
  try {
    const periodDays = parseInt(exportPeriod.value)
    const analytics = calculateAnalytics(periodDays)
    
    const wb = XLSX.utils.book_new()
    
    const tableData = sortedItems.value.map(item => ({
      ID: item.id,
      [t('admin.table.title')]: getTitle(item),
      [t('admin.table.status')]: item.is_published ? t('admin.filters.published') : t('admin.filters.draft'),
      [t('admin.table.views')]: item.views || 0,
      [t('admin.table.createdAt')]: formatDate(item.created_at)
    }))
    
    const ws1 = XLSX.utils.json_to_sheet(tableData)
    XLSX.utils.book_append_sheet(wb, ws1, t('admin.export.sheetTable'))
    
    const analyticsData = [
      { [t('admin.export.analytics.metric')]: t('admin.export.analytics.currentPeriod'), [t('admin.export.analytics.value')]: analytics.currentPeriod.period },
      { [t('admin.export.analytics.metric')]: t('admin.export.analytics.itemsCount'), [t('admin.export.analytics.value')]: analytics.currentPeriod.items },
      { [t('admin.export.analytics.metric')]: t('admin.export.analytics.viewsCount'), [t('admin.export.analytics.value')]: analytics.currentPeriod.views },
      { [t('admin.export.analytics.metric')]: '', [t('admin.export.analytics.value')]: '' },
      { [t('admin.export.analytics.metric')]: t('admin.export.analytics.previousPeriod'), [t('admin.export.analytics.value')]: analytics.previousPeriod.period },
      { [t('admin.export.analytics.metric')]: t('admin.export.analytics.itemsCount'), [t('admin.export.analytics.value')]: analytics.previousPeriod.items },
      { [t('admin.export.analytics.metric')]: t('admin.export.analytics.viewsCount'), [t('admin.export.analytics.value')]: analytics.previousPeriod.views },
      { [t('admin.export.analytics.metric')]: '', [t('admin.export.analytics.value')]: '' },
      { [t('admin.export.analytics.metric')]: t('admin.export.analytics.difference'), [t('admin.export.analytics.value')]: analytics.difference },
      { [t('admin.export.analytics.metric')]: t('admin.export.analytics.percentage'), [t('admin.export.analytics.value')]: `${analytics.percentage}%` },
      { [t('admin.export.analytics.metric')]: t('admin.export.analytics.trend'), [t('admin.export.analytics.value')]: t(`admin.export.analytics.trends.${analytics.trend}`) }
    ]
    
    const ws2 = XLSX.utils.json_to_sheet(analyticsData)
    XLSX.utils.book_append_sheet(wb, ws2, t('admin.export.sheetAnalytics'))
    
    const filename = `news_export_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
    XLSX.writeFile(wb, filename)
    
    showExportDialog.value = false
  } catch (error) {
    console.error('Export error:', error)
    alert(t('admin.export.error'))
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  loadNews()
})

watch([statusFilter, dateFrom, dateTo], () => {
  // Filtering is done client-side
})
</script>

<style scoped>
.admin-page {
  padding: 0;
}

:deep(.q-table tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

:deep(.q-table tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
</style>
