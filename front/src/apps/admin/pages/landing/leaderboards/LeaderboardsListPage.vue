<template>
  <AdminLayout>
    <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <h1 class="text-h4 q-my-none">Управление Лидербордами</h1>
      <q-btn color="primary" icon="add" label="Добавить слот" @click="showAddDialog" />
    </div>

    <q-card flat bordered>
      <q-table
        :rows="items"
        :columns="columns"
        row-key="id"
        :loading="loading"
        flat
      >
        <template v-slot:body-cell-is_active="props">
          <q-td :props="props">
            <q-toggle
              v-model="props.row.is_active"
              @update:model-value="toggleActive(props.row)"
              color="green"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props" class="q-gutter-sm">
            <q-btn flat round color="primary" icon="edit" @click="editItem(props.row)" />
            <q-btn flat round color="negative" icon="delete" @click="confirmDelete(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialog for Add/Edit -->
    <q-dialog v-model="dialog.show" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ dialog.isEdit ? 'Редактировать слот' : 'Добавить новый слот' }}</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-select
            v-model="dialog.formData.course"
            :options="courseOptions"
            label="Курс *"
            emit-value
            map-options
            option-label="name"
            option-value="id"
            required
          />
          <q-select
            v-model="dialog.formData.exam_type"
            :options="examTypeOptions"
            label="Тип экзамена *"
            emit-value
            map-options
            option-label="name"
            option-value="id"
            required
          />
          
          <div class="text-subtitle2 q-mt-md">Заголовки (необязательно)</div>
          <q-input v-model="dialog.formData.title_tm" label="Заголовок (TM)" />
          <q-input v-model="dialog.formData.title_ru" label="Заголовок (RU)" />
          <q-input v-model="dialog.formData.title_en" label="Заголовок (EN)" />
          
          <q-input v-model.number="dialog.formData.order" type="number" label="Порядок" />
          <q-toggle v-model="dialog.formData.is_active" label="Активен" color="green" />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn flat label="Сохранить" @click="saveItem" :loading="dialogLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useQuasar } from 'quasar'
import { useAdminLeaderboards } from '@/composables/useAdminApi'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import api from '@/services/api' // Use centralized api for courses/exam-types

const $q = useQuasar()
const { loading, error, fetchLeaderboards, createLeaderboard, updateLeaderboard, deleteLeaderboard } = useAdminLeaderboards()

const items = ref([])
const courses = ref([])
const examTypes = ref([])
const courseOptions = ref([])
const examTypeOptions = ref([])

const columns = [
  { name: 'order', align: 'left', label: 'Порядок', field: 'order', sortable: true },
  { name: 'course_name', align: 'left', label: 'Курс', field: 'course_name', sortable: true },
  { name: 'exam_type_name', align: 'left', label: 'Экзамен', field: 'exam_type_name', sortable: true },
  { name: 'title_ru', align: 'left', label: 'Заголовок (RU)', field: 'title_ru' },
  { name: 'is_active', align: 'center', label: 'Активен', field: 'is_active' },
  { name: 'actions', align: 'right', label: 'Действия', field: 'id' }
]

const dialog = reactive({
  show: false,
  isEdit: false,
  formData: {
    id: null,
    course: null,
    exam_type: null,
    title_tm: '',
    title_ru: '',
    title_en: '',
    order: 0,
    is_active: true
  }
})

const dialogLoading = ref(false)

const loadData = async () => {
  try {
    const data = await fetchLeaderboards()
    // Ensure items is always an array
    items.value = Array.isArray(data) ? data : (data.results || [])
  } catch (err) {
    console.error('Error loading leaderboards:', err)
    items.value = [] // Set empty array on error
    if ($q && $q.notify) {
      $q.notify({ type: 'negative', message: 'Ошибка при загрузке данных' })
    }
  }
}

const loadOptions = async () => {
  try {
    // Fetch courses and exam types for select options
    const coursesRes = await api.get('/courses/courses/', {
      params: { page_size: 1000 } // Get all courses
    })
    const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data.results || []
    courseOptions.value = coursesData.map((c: any) => ({
      id: c.id,
      name: c.name || `${c.language} - ${c.level}` // Fallback if name is missing
    }))
    
    const examTypesRes = await api.get('/courses/exam-types/', {
      params: { page_size: 1000 } // Get all exam types
    })
    const examTypesData = Array.isArray(examTypesRes.data) ? examTypesRes.data : examTypesRes.data.results || []
    examTypeOptions.value = examTypesData.map((et: any) => ({
      id: et.id,
      name: et.name
    }))
  } catch (err) {
    console.error('Error loading options:', err)
    if ($q && $q.notify) {
      $q.notify({ type: 'negative', message: 'Ошибка при загрузке курсов и типов экзаменов' })
    }
  }
}

const showAddDialog = () => {
  dialog.isEdit = false
  dialog.formData = {
    id: null,
    course: null,
    exam_type: null,
    title_tm: '',
    title_ru: '',
    title_en: '',
    order: items.value.length,
    is_active: true
  }
  dialog.show = true
}

const editItem = (item: any) => {
  dialog.isEdit = true
  dialog.formData = {
    id: item.id,
    course: item.course || item.course_id,
    exam_type: item.exam_type || item.exam_type_id,
    title_tm: item.title_tm || '',
    title_ru: item.title_ru || '',
    title_en: item.title_en || '',
    order: item.order || 0,
    is_active: item.is_active !== undefined ? item.is_active : true
  }
  dialog.show = true
}

const toggleActive = async (item: any) => {
  try {
    await updateLeaderboard(item.id, { is_active: item.is_active })
    if ($q && $q.notify) {
      $q.notify({ type: 'positive', message: 'Статус обновлен' })
    }
  } catch (err) {
    item.is_active = !item.is_active
    if ($q && $q.notify) {
      $q.notify({ type: 'negative', message: 'Ошибка при обновлении' })
    }
  }
}

const confirmDelete = (item: any) => {
  if ($q && $q.dialog) {
    $q.dialog({
      title: 'Подтверждение',
      message: `Удалить слот для курса "${item.course_name}"?`,
      cancel: true,
      persistent: true
    }).onOk(async () => {
      try {
        await deleteLeaderboard(item.id)
        await loadData()
        if ($q && $q.notify) {
          $q.notify({ type: 'positive', message: 'Слот удален' })
        }
      } catch (err) {
        if ($q && $q.notify) {
          $q.notify({ type: 'negative', message: 'Ошибка при удалении' })
        }
      }
    })
  }
}

const saveItem = async () => {
  if (!dialog.formData.course || !dialog.formData.exam_type) {
    if ($q && $q.notify) {
      $q.notify({ type: 'warning', message: 'Выберите курс и тип экзамена' })
    }
    return
  }

  dialogLoading.value = true
  try {
    if (dialog.isEdit) {
      await updateLeaderboard(dialog.formData.id, dialog.formData)
      if ($q && $q.notify) {
        $q.notify({ type: 'positive', message: 'Слот обновлен' })
      }
    } else {
      await createLeaderboard(dialog.formData)
      if ($q && $q.notify) {
        $q.notify({ type: 'positive', message: 'Слот создан' })
      }
    }
    dialog.show = false
    await loadData()
  } catch (err) {
    console.error('Error saving leaderboard:', err)
    if ($q && $q.notify) {
      $q.notify({ type: 'negative', message: 'Ошибка при сохранении' })
    }
  } finally {
    dialogLoading.value = false
  }
}

onMounted(() => {
  loadData()
  loadOptions()
})
</script>

