<template>
  <div class="admin-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Школы</h1>
      <q-btn color="primary" icon="add" label="Добавить школу" to="/admin/schools/add" />
    </div>

    <q-card flat bordered class="q-mb-md admin-table-card">
      <q-card-section>
        <q-input v-model="searchQuery" placeholder="Поиск по названию, адресу" outlined dense clearable>
          <template v-slot:prepend><q-icon name="search" /></template>
        </q-input>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="admin-table-card">
      <q-card-section>
        <q-table
          :rows="filteredItems"
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
          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <span class="text-weight-medium">{{ props.row.name || props.row.name_ru || props.row.name_tm || `Школа #${props.row.id}` }}</span>
            </q-td>
          </template>
          <template v-slot:body-cell-is_active="props">
            <q-td :props="props">
              <q-badge :color="props.row.is_active ? 'positive' : 'grey'">{{ props.row.is_active ? 'Активна' : 'Неактивна' }}</q-badge>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" @click.stop>
              <q-btn flat round dense icon="edit" color="primary" @click="editItem(props.row.id)" class="q-mr-xs" />
              <q-btn flat round dense icon="delete" color="negative" @click.stop="handleDelete(props.row)" />
            </q-td>
          </template>
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
              <q-icon name="school" size="2em" />
              <span>Нет школ</span>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Удалить школу?</div>
          <p class="q-mt-sm q-mb-none text-body2">{{ schoolToDelete?.name || schoolToDelete?.name_ru || `Школа #${schoolToDelete?.id}` }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn flat label="Удалить" color="negative" :loading="deleting" @click="confirmDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const $q = useQuasar()
const { fetchSchools, deleteSchool: deleteSchoolApi } = useAdminSchools()
const { pagination, rowsPerPageOptions, resetPage, savePagination } = useAdminPagination('schools')

const items = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const showDeleteConfirm = ref(false)
const schoolToDelete = ref<any>(null)
const deleting = ref(false)

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const, sortable: true },
  { name: 'name', label: 'Название', field: 'name', align: 'left' as const, sortable: true },
  { name: 'address', label: 'Адрес', field: 'address', align: 'left' as const },
  { name: 'phone', label: 'Телефон', field: 'phone', align: 'left' as const },
  { name: 'is_active', label: 'Статус', field: 'is_active', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Действия', field: 'actions', align: 'right' as const }
]

const filteredItems = computed(() => {
  if (!searchQuery.value?.trim()) return items.value
  const s = searchQuery.value.trim().toLowerCase()
  return items.value.filter(
    r =>
      r.name?.toLowerCase().includes(s) ||
      r.name_ru?.toLowerCase().includes(s) ||
      r.name_tm?.toLowerCase().includes(s) ||
      r.address?.toLowerCase().includes(s) ||
      r.phone?.toLowerCase().includes(s)
  )
})

const editItem = (id: number) => navigateTo(`/admin/schools/${id}`)

const handleDelete = (row: any) => {
  schoolToDelete.value = row
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!schoolToDelete.value) return
  deleting.value = true
  try {
    await deleteSchoolApi(schoolToDelete.value.id)
    await loadItems()
    showDeleteConfirm.value = false
    schoolToDelete.value = null
  } catch (e) {
    console.error(e)
  } finally {
    deleting.value = false
  }
}

const loadItems = async () => {
  loading.value = true
  try {
    items.value = await fetchSchools()
  } catch (e: any) {
    const msg = e?.data?.error || e?.message || 'Ошибка загрузки'
    console.error('Schools load error:', msg)
    $q.notify({ type: 'negative', message: msg })
  } finally {
    loading.value = false
  }
}

watch(searchQuery, resetPage)

onMounted(() => loadItems())
</script>
