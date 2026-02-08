<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.models.courses') }}</h1>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            :label="$t('admin.actions.add') + ' ' + $t('admin.models.courses')"
            icon="add"
            :to="{ name: 'AdminCourseAdd' }"
          />
        </div>
      </div>

      <!-- Filters -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
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
            <div class="col-12 col-md-4">
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

      <!-- Courses Table -->
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

            <template v-slot:body-cell-category="props">
              <q-td :props="props">
                {{ getCategoryName(props.row) }}
              </q-td>
            </template>

            <template v-slot:body-cell-subcategory="props">
              <q-td :props="props">
                {{ getSubCategoryName(props.row) }}
              </q-td>
            </template>

            <template v-slot:body-cell-price="props">
              <q-td :props="props">
                <div class="price-cell">
                  <span v-if="props.row.discount_price" class="text-grey-7 text-strike" style="font-size: 0.85rem;">
                    {{ props.row.price }} 💎
                  </span>
                  <span :class="{ 'text-negative text-weight-bold': props.row.discount_price }">
                    {{ props.row.discount_price || props.row.price }} 💎
                  </span>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge :color="props.row.is_active ? 'positive' : 'negative'">
                  {{ props.row.is_active ? $t('admin.filters.active') : $t('admin.filters.inactive') }}
                </q-badge>
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
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminCourses } from '@/composables/useAdminApi'

const router = useRouter()
const { t, locale } = useI18n()
const { loading, error, fetchCourses, deleteCourse } = useAdminCourses()

const searchQuery = ref('')
const statusFilter = ref('')
const items = ref<any[]>([])

const pagination = ref({
  sortBy: 'id',
  descending: false,
  page: 1,
  rowsPerPage: 20
})

const statusOptions = [
  { label: t('admin.filters.all'), value: '' },
  { label: t('admin.filters.active'), value: 'active' },
  { label: t('admin.filters.inactive'), value: 'inactive' }
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
    name: 'category',
    label: t('admin.courses.category'),
    field: 'category_name',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'subcategory',
    label: t('admin.courses.subcategory'),
    field: 'subcategory_name',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'price',
    label: t('admin.courses.price'),
    field: 'price',
    align: 'right' as const,
    sortable: true
  },
  {
    name: 'status',
    label: t('admin.table.status'),
    field: 'is_active',
    align: 'center' as const,
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
      statusFilter.value === 'active' ? item.is_active : !item.is_active
    )
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
    } else if (sortBy === 'category') {
      aVal = getCategoryName(a).toLowerCase()
      bVal = getCategoryName(b).toLowerCase()
    } else if (sortBy === 'subcategory') {
      aVal = getSubCategoryName(a).toLowerCase()
      bVal = getSubCategoryName(b).toLowerCase()
    } else if (sortBy === 'price') {
      aVal = parseFloat(a.discount_price || a.price || 0)
      bVal = parseFloat(b.discount_price || b.price || 0)
    } else if (sortBy === 'status') {
      aVal = a.is_active ? 1 : 0
      bVal = b.is_active ? 1 : 0
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

const getTitle = (item: any) => {
  if (locale.value === 'tm' && item.title_tm) return item.title_tm
  if (locale.value === 'ru' && item.title_ru) return item.title_ru
  if (locale.value === 'en' && item.title_en) return item.title_en
  return item.title_tm || item.title_ru || item.title_en || '-'
}

const getCategoryName = (item: any) => {
  if (locale.value === 'tm' && item.category_name_tm) return item.category_name_tm
  if (locale.value === 'ru' && item.category_name_ru) return item.category_name_ru
  if (locale.value === 'en' && item.category_name_en) return item.category_name_en
  return item.category_name_tm || item.category_name_ru || item.category_name_en || '-'
}

const getSubCategoryName = (item: any) => {
  if (locale.value === 'tm' && item.subcategory_name_tm) return item.subcategory_name_tm
  if (locale.value === 'ru' && item.subcategory_name_ru) return item.subcategory_name_ru
  if (locale.value === 'en' && item.subcategory_name_en) return item.subcategory_name_en
  return item.subcategory_name_tm || item.subcategory_name_ru || item.subcategory_name_en || '-'
}

const editItem = (id: number) => {
  router.push(`/management/landing/courses/${id}/change`)
}

const handleDelete = async (id: number) => {
  const confirmed = await new Promise<boolean>((resolve) => {
    resolve(window.confirm(t('admin.confirmDelete')))
  })

  if (confirmed) {
    try {
      await deleteCourse(id)
      await loadCourses()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}

const loadCourses = async () => {
  try {
    const params: any = { page_size: 9999 }
    if (statusFilter.value === 'active') {
      params.is_active = true
    } else if (statusFilter.value === 'inactive') {
      params.is_active = false
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    const response = await fetchCourses(params)
    items.value = Array.isArray(response) ? response : response.results || []
  } catch (err) {
    console.error('Load courses error:', err)
  }
}

// Watchers
watch(() => pagination.value.rowsPerPage, () => {
  pagination.value.page = 1
})

onMounted(() => {
  loadCourses()
})

watch([statusFilter], () => {
  loadCourses()
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

.price-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
