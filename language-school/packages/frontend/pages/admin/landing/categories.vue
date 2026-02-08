<template>
  <div class="admin-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Категории курсов</h1>
      <q-btn color="primary" icon="add" label="Добавить категорию" @click="showAddDialog = true" />
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
          @row-click="(evt, row) => editCategory(row)"
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
              <q-btn flat round color="primary" icon="edit" @click="editCategory(props.row)" />
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

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ isEditing ? 'Редактировать' : 'Добавить' }} категорию</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input v-model="form.name_ru" label="Название (RU)" filled :rules="[val => !!val || 'Обязательно']" />
          <q-input v-model="form.name_tm" label="Название (TM)" filled />
          <q-input v-model="form.name_en" label="Название (EN)" filled />

          <div class="row items-center q-gutter-md">
            <q-img
              v-if="form.image"
              :src="form.image"
              style="width: 100px; height: 100px"
              fit="cover"
              class="rounded-borders"
            />
            <q-file
              v-model="fileToUpload"
              label="Загрузить изображение"
              filled
              accept="image/*"
              @update:model-value="handleFileUpload"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
          </div>

          <q-input v-model.number="form.order" type="number" label="Порядок" filled />
          <q-toggle v-model="form.is_active" label="Активна" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup @click="resetForm" />
          <q-btn flat label="Сохранить" color="primary" @click="saveCategory" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
const { pagination, rowsPerPageOptions, resetPage, savePagination } = useAdminPagination('categories')

const categories = ref<any[]>([])
const loading = ref(false)
const showAddDialog = ref(false)
const showDeleteConfirm = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const categoryToDelete = ref<any>(null)
const fileToUpload = ref<File | null>(null)
const searchQuery = ref('')

const form = ref({
  id: null as number | null,
  name_ru: '',
  name_tm: '',
  name_en: '',
  image: '',
  order: 0,
  is_active: true
})

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

const handleFileUpload = async (file: File) => {
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const data = await $fetch<any>(`${apiBase}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    form.value.image = data.url
  } catch (e) {
    console.error('Upload error:', e)
  }
}

const editCategory = (category: any) => {
  isEditing.value = true
  form.value = { ...category }
  showAddDialog.value = true
}

const confirmDelete = (category: any) => {
  categoryToDelete.value = category
  showDeleteConfirm.value = true
}

const resetForm = () => {
  isEditing.value = false
  form.value = {
    id: null,
    name_ru: '',
    name_tm: '',
    name_en: '',
    image: '',
    order: 0,
    is_active: true
  }
  fileToUpload.value = null
}

const saveCategory = async () => {
  saving.value = true
  try {
    const payload = {
      name: form.value.name_ru,
      name_ru: form.value.name_ru,
      name_tm: form.value.name_tm,
      name_en: form.value.name_en,
      image: form.value.image,
      order: form.value.order,
      is_active: form.value.is_active
    }

    if (isEditing.value) {
      await $fetch(`${apiBase}/admin/categories/${form.value.id}`, {
        method: 'PATCH',
        body: payload,
        credentials: 'include'
      })
    } else {
      await $fetch(`${apiBase}/admin/categories`, {
        method: 'POST',
        body: payload,
        credentials: 'include'
      })
    }

    showAddDialog.value = false
    resetForm()
    await fetchCategories()
  } catch (e) {
    console.error('Save error:', e)
  } finally {
    saving.value = false
  }
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
