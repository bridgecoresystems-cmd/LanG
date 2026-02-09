<template>
  <div class="admin-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Категории курсов</h1>
      <q-btn color="primary" icon="add" label="Добавить категорию" to="/admin/landing/categories/add" />
    </div>

    <!-- Filters -->
    <q-card flat bordered class="q-mb-md admin-table-card">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
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
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="admin-table-card">
      <q-card-section>
        <q-table
          :rows="filteredCategories"
          :columns="columns"
          row-key="id"
          v-model:pagination="pagination"
          :rows-per-page-options="rowsPerPageOptions"
          @update:pagination="savePagination"
          flat
          bordered
          :loading="loading"
          @row-click="(evt, row) => router.push(`/admin/landing/categories/${row.id}`)"
          class="cursor-pointer"
          binary-state-sort
        >
          <template v-slot:body-cell-image="props">
            <q-td :props="props">
              <q-img
                v-if="props.row.image"
                :src="props.row.image.startsWith('http') ? props.row.image : props.row.image"
                style="width: 50px; height: 50px"
                fit="cover"
                class="rounded-borders"
              />
              <q-icon v-else name="image_not_supported" size="md" color="grey" />
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" @click.stop class="q-gutter-xs">
              <q-btn flat round color="primary" icon="edit" @click="router.push(`/admin/landing/categories/${props.row.id}`)" />
              <q-btn flat round color="negative" icon="delete" @click="confirmDelete(props.row)" />
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

    <!-- Delete Confirmation -->
    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Вы уверены, что хотите удалить категорию "{{ categoryToDelete?.name_ru }}"?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn flat label="Удалить" color="negative" @click="deleteCategory" :loading="deleting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const router = useRouter()
const { pagination, rowsPerPageOptions, resetPage, savePagination } = useAdminPagination('categories')

const categories = ref<any[]>([])
const loading = ref(false)
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const categoryToDelete = ref<any>(null)
const searchQuery = ref('')

const columns = [
  { name: 'image', label: 'Фото', field: 'image', align: 'left' },
  { name: 'name_ru', label: 'Название (RU)', field: 'name_ru', align: 'left', sortable: true },
  { name: 'order', label: 'Порядок', field: 'order', align: 'center', sortable: true },
  { name: 'is_active', label: 'Статус', field: 'is_active', align: 'center', format: (val: boolean) => val ? 'Активна' : 'Неактивна' },
  { name: 'actions', label: 'Действия', field: 'actions', align: 'right' }
]

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const q = searchQuery.value.toLowerCase()
  return categories.value.filter(c =>
    (c.name_ru && c.name_ru.toLowerCase().includes(q)) ||
    (c.name_tm && c.name_tm.toLowerCase().includes(q)) ||
    (c.name_en && c.name_en.toLowerCase().includes(q))
  )
})

const fetchCategories = async () => {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${apiBase}/admin/categories`, { credentials: 'include' })
    categories.value = data
  } catch (e) {
    console.error('Fetch error:', e)
  } finally {
    loading.value = false
  }
}

const confirmDelete = (category: any) => {
  categoryToDelete.value = category
  showDeleteConfirm.value = true
}

const deleteCategory = async () => {
  if (!categoryToDelete.value) return
  deleting.value = true
  try {
    await $fetch(`${apiBase}/admin/categories/${categoryToDelete.value.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    showDeleteConfirm.value = false
    await fetchCategories()
  } catch (e) {
    console.error('Delete error:', e)
  } finally {
    deleting.value = false
  }
}

watch(searchQuery, resetPage)

onMounted(() => {
  fetchCategories()
})
</script>
