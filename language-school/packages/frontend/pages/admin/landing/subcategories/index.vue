<template>
  <div class="admin-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Подкатегории курсов</h1>
      <q-btn color="primary" icon="add" label="Добавить подкатегорию" to="/admin/landing/subcategories/add" />
    </div>

    <q-card flat bordered class="q-mb-md admin-table-card">
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

    <q-card flat bordered class="admin-table-card">
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
          <template v-slot:body-cell-category="props">
            <q-td :props="props">{{ getCategoryName(props.row) }}</q-td>
          </template>
          <template v-slot:body-cell-name="props">
            <q-td :props="props">{{ getName(props.row) }}</q-td>
          </template>
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.row.is_active ? 'positive' : 'grey'">
                {{ props.row.is_active ? 'Активна' : 'Неактивна' }}
              </q-badge>
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
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const { pagination, rowsPerPageOptions, resetPage, savePagination } = useAdminPagination('subcategories')
const { locale } = useI18n()

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
  { name: 'category', label: 'Категория', field: 'category_name', align: 'left' as const, sortable: true },
  { name: 'name', label: 'Название', field: 'name', align: 'left' as const, sortable: true },
  { name: 'order', label: 'Порядок', field: 'order', align: 'center' as const, sortable: true },
  { name: 'status', label: 'Статус', field: 'is_active', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Действия', field: 'actions', align: 'right' as const }
]

const filteredItems = computed(() => {
  let filtered = items.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(i =>
      (i.name_tm?.toLowerCase().includes(q)) || (i.name_ru?.toLowerCase().includes(q)) || (i.name_en?.toLowerCase().includes(q))
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
    let aVal: any = sortBy === 'name' ? getName(a).toLowerCase() : sortBy === 'category' ? getCategoryName(a).toLowerCase() : sortBy === 'status' ? (a.is_active ? 1 : 0) : a[sortBy]
    let bVal: any = sortBy === 'name' ? getName(b).toLowerCase() : sortBy === 'category' ? getCategoryName(b).toLowerCase() : sortBy === 'status' ? (b.is_active ? 1 : 0) : b[sortBy]
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (aVal < bVal) return descending ? 1 : -1
    if (aVal > bVal) return descending ? -1 : 1
    return 0
  })
  return sorted
})

const getName = (i: any) => (locale.value === 'tm' && i.name_tm) ? i.name_tm : (locale.value === 'ru' && i.name_ru) ? i.name_ru : (locale.value === 'en' && i.name_en) ? i.name_en : i.name_tm || i.name_ru || i.name_en || '-'
const getCategoryName = (i: any) => (locale.value === 'tm' && i.category_name_tm) ? i.category_name_tm : (locale.value === 'ru' && i.category_name_ru) ? i.category_name_ru : (locale.value === 'en' && i.category_name_en) ? i.category_name_en : i.category_name_tm || i.category_name_ru || i.category_name_en || '-'

const editItem = (id: number) => navigateTo(`/admin/landing/subcategories/${id}`)

const handleDelete = async (id: number) => {
  if (!confirm('Удалить подкатегорию?')) return
  try {
    await $fetch(`${apiBase}/admin/subcategories/${id}`, { method: 'DELETE', credentials: 'include' })
    await loadItems()
  } catch (e) {
    console.error(e)
  }
}

const loadItems = async () => {
  loading.value = true
  try {
    items.value = await $fetch<any[]>(`${apiBase}/admin/subcategories`, { credentials: 'include' })
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch([searchQuery, statusFilter], resetPage)

onMounted(() => loadItems())
</script>
