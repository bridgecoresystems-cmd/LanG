<template>
  <div class="cabinet-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Курсы (Редактор)</h1>
      <q-btn color="primary" icon="add" label="Добавить курс" to="/cabinet/editor/courses/add" />
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="searchQuery" placeholder="Поиск" outlined dense clearable>
              <template v-slot:prepend><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-select v-model="statusFilter" :options="statusOptions" label="Статус" outlined dense clearable emit-value map-options />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered>
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
          :loading="loading"
          @row-click="(_evt, row) => editItem(row.id)"
          class="cursor-pointer"
          binary-state-sort
        >
          <template v-slot:body-cell-title="props">
            <q-td :props="props" style="max-width: 250px">
              <div class="text-weight-medium text-ellipsis" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 250px">
                {{ getTitle(props.row) }}
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-category="props">
            <q-td :props="props">{{ getCategoryName(props.row) }}</q-td>
          </template>
          <template v-slot:body-cell-subcategory="props">
            <q-td :props="props">{{ getSubCategoryName(props.row) }}</q-td>
          </template>
          <template v-slot:body-cell-price="props">
            <q-td :props="props">
              <span v-if="props.row.discount_price" class="text-grey-7 text-strike" style="font-size: 0.85rem">{{ props.row.price }} 💎</span>
              <span :class="{ 'text-negative text-weight-bold': props.row.discount_price }">{{ props.row.discount_price || props.row.price }} 💎</span>
            </q-td>
          </template>
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.row.is_active ? 'positive' : 'grey'">{{ props.row.is_active ? 'Активен' : 'Неактивен' }}</q-badge>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" @click.stop>
              <q-btn flat round dense icon="edit" color="primary" @click="editItem(props.row.id)" class="q-mr-xs" />
              <q-btn flat round dense icon="delete" color="negative" @click.stop="handleDelete(props.row.id)" />
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
definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const { pagination, rowsPerPageOptions, resetPage, savePagination } = useAdminPagination('courses')
const { locale } = useI18n()
const { getAll, remove } = useAdminCourses()

const items = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')

const statusOptions = [
  { label: 'Все', value: '' },
  { label: 'Активные', value: 'active' },
  { label: 'Неактивные', value: 'inactive' }
]

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const, sortable: true },
  { name: 'title', label: 'Название', field: 'title', align: 'left' as const, sortable: true },
  { name: 'category', label: 'Категория', field: 'category_name', align: 'left' as const, sortable: true },
  { name: 'subcategory', label: 'Подкатегория', field: 'subcategory_name', align: 'left' as const, sortable: true },
  { name: 'price', label: 'Цена', field: 'price', align: 'right' as const, sortable: true },
  { name: 'status', label: 'Статус', field: 'is_active', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Действия', field: 'actions', align: 'right' as const }
]

const filteredItems = computed(() => {
  let filtered = items.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(i =>
      (i.title_tm?.toLowerCase().includes(q)) || (i.title_ru?.toLowerCase().includes(q)) || (i.title_en?.toLowerCase().includes(q))
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
    let aVal: any = sortBy === 'title' ? getTitle(a).toLowerCase() : sortBy === 'category' ? getCategoryName(a).toLowerCase() : sortBy === 'subcategory' ? getSubCategoryName(a).toLowerCase() : sortBy === 'price' ? parseFloat(a.discount_price || a.price || 0) : sortBy === 'status' ? (a.is_active ? 1 : 0) : a[sortBy]
    let bVal: any = sortBy === 'title' ? getTitle(b).toLowerCase() : sortBy === 'category' ? getCategoryName(b).toLowerCase() : sortBy === 'subcategory' ? getSubCategoryName(b).toLowerCase() : sortBy === 'price' ? parseFloat(b.discount_price || b.price || 0) : sortBy === 'status' ? (b.is_active ? 1 : 0) : b[sortBy]
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (aVal < bVal) return descending ? 1 : -1
    if (aVal > bVal) return descending ? -1 : 1
    return 0
  })
  return sorted
})

const getTitle = (i: any) => (locale.value === 'tm' && i.title_tm) ? i.title_tm : (locale.value === 'ru' && i.title_ru) ? i.title_ru : (locale.value === 'en' && i.title_en) ? i.title_en : i.title_tm || i.title_ru || i.title_en || '-'
const getCategoryName = (i: any) => (locale.value === 'tm' && i.category_name_tm) ? i.category_name_tm : (locale.value === 'ru' && i.category_name_ru) ? i.category_name_ru : (locale.value === 'en' && i.category_name_en) ? i.category_name_en : i.category_name_tm || i.category_name_ru || i.category_name_en || '-'
const getSubCategoryName = (i: any) => (locale.value === 'tm' && i.subcategory_name_tm) ? i.subcategory_name_tm : (locale.value === 'ru' && i.subcategory_name_ru) ? i.subcategory_name_ru : (locale.value === 'en' && i.subcategory_name_en) ? i.subcategory_name_en : i.subcategory_name_tm || i.subcategory_name_ru || i.subcategory_name_en || '-'

const editItem = (id: number) => navigateTo(`/cabinet/editor/courses/${id}`)

const handleDelete = async (id: number) => {
  if (!confirm('Удалить курс?')) return
  try {
    await remove(id)
    await loadItems()
  } catch (e) {
    console.error(e)
  }
}

const loadItems = async () => {
  loading.value = true
  try {
    items.value = await getAll()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch([searchQuery, statusFilter], resetPage)
onMounted(() => loadItems())
</script>
