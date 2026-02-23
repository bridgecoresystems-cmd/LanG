<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__top">
        <NButton circle secondary @click="navigateTo('/cabinet/head-teacher/groups')">
          <template #icon><NIcon><component :is="ArrowBackIcon" /></NIcon></template>
        </NButton>
        <div>
          <NH2 class="page-header__title">Редактировать группу</NH2>
          <p class="page-header__subtitle">{{ group?.name }}</p>
        </div>
      </div>
    </header>

    <div v-if="loading && !group" class="loading-state"><NSpin size="large" /></div>
    <NCard v-else-if="group" bordered class="form-card" style="max-width: 800px">
      <NTabs type="line" animated>
        <NTabPane name="main" tab="Основные данные">
          <NForm ref="formRef" :model="formData" label-placement="top" @submit.prevent="handleSubmit">
            <NFormItem label="Название *" required>
              <NInput v-model:value="formData.name" placeholder="Название группы" size="large" />
            </NFormItem>
            <NGrid cols="1 s:2" :x-gap="16">
              <NGi><NFormItem label="Курс *" required><NSelect v-model:value="formData.course_id" :options="courseOptions" placeholder="Курс" size="large" /></NFormItem></NGi>
              <NGi><NFormItem label="Учитель"><NSelect v-model:value="formData.teacher_id" :options="teacherOptions" placeholder="Учитель" clearable size="large" /></NFormItem></NGi>
            </NGrid>
            <NGrid cols="1 s:2" :x-gap="16">
              <NGi><NFormItem label="Время"><NSelect v-model:value="formData.time_slot" :options="timeSlotOptions" placeholder="Слот" clearable size="large" /></NFormItem></NGi>
              <NGi><NFormItem label="Дни"><NSelect v-model:value="formData.week_days" :options="weekDayOptions" placeholder="Дни" clearable size="large" /></NFormItem></NGi>
            </NGrid>
            <NFormItem label="Схема экзаменов">
              <NSelect v-model:value="formData.exam_scheme_id" :options="examSchemeOptions" placeholder="Выберите схему" clearable size="large" />
            </NFormItem>
            <NGrid cols="1 s:2" :x-gap="16">
              <NGi><NFormItem label="Дата начала"><NDatePicker v-model:value="startDateTs" type="date" style="width: 100%" size="large" /></NFormItem></NGi>
              <NGi><NFormItem label="Дата окончания"><NDatePicker v-model:value="endDateTs" type="date" clearable style="width: 100%" size="large" /></NFormItem></NGi>
            </NGrid>
            <NGrid cols="1 s:2" :x-gap="16">
              <NGi><NFormItem label="Макс. учеников"><NInputNumber v-model:value="formData.max_students" :min="1" :max="50" style="width: 100%" size="large" /></NFormItem></NGi>
              <NGi><NFormItem label=" "><NCheckbox v-model:checked="formData.is_active">Активна</NCheckbox></NFormItem></NGi>
            </NGrid>
            <NAlert v-if="submitError" type="error" closable @close="submitError = null">{{ submitError }}</NAlert>
            <NSpace justify="end" style="margin-top: 16px">
              <NButton ghost @click="navigateTo('/cabinet/head-teacher/groups')">Отмена</NButton>
              <NButton type="primary" attr-type="submit" :loading="submitting"><template #icon><NIcon><component :is="SaveIcon" /></NIcon></template>Сохранить</NButton>
            </NSpace>
          </NForm>
        </NTabPane>
        <NTabPane name="students" tab="Ученики">
          <div class="students-tab">
            <div class="students-tab__header">
              <span class="students-tab__count">{{ studentsInGroup.length }} / {{ formData.max_students }}</span>
              <NButton type="primary" size="medium" :loading="loadingAvailable" :disabled="studentsInGroup.length >= formData.max_students" @click="openAddModal">
                <template #icon><NIcon><component :is="PersonAddIcon" /></NIcon></template>
                Добавить учеников
              </NButton>
            </div>
            <div v-if="studentsInGroup.length === 0" class="students-empty">
              Нет учеников в группе. Нажмите «Добавить учеников», чтобы выбрать.
            </div>
            <NDataTable
              v-else
              :columns="studentColumns"
              :data="studentsInGroup"
              :bordered="false"
              :single-line="false"
              size="small"
            />
          </div>
        </NTabPane>
      </NTabs>
    </NCard>

    <NModal v-model:show="showAddModal" preset="card" title="Добавить учеников" style="max-width: 500px" :mask-closable="false">
      <p class="add-modal-hint">Ученики из другой группы того же курса будут автоматически переведены (оценки сохранятся).</p>
      <NSelect
        v-model:value="selectedStudentIds"
        :options="availableStudentOptions"
        placeholder="Выберите учеников"
        filterable
        multiple
        clearable
        max-tag-count="responsive"
        size="large"
        :loading="loadingAvailable"
      />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showAddModal = false">Отмена</NButton>
          <NButton type="primary" :loading="addingStudents" :disabled="selectedStudentIds.length === 0" @click="handleAddStudents">
            Добавить ({{ selectedStudentIds.length }})
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useCabinetGroups, useCabinetTeachers } from '~/composables/useCabinetGroups'
import { useCabinetCourses } from '~/composables/useCabinetCourses'
import { useCabinetHeadTeacher } from '~/composables/useCabinetHeadTeacher'
import {
  NCard,
  NButton,
  NInput,
  NSelect,
  NForm,
  NFormItem,
  NInputNumber,
  NCheckbox,
  NIcon,
  NH2,
  NGrid,
  NGi,
  NSpace,
  NAlert,
  NSpin,
  NDatePicker,
  NTabs,
  NTabPane,
  NDataTable,
  NModal,
  useMessage,
  type DataTableColumns,
} from 'naive-ui'
import { ChevronBackOutline as ArrowBackIcon, SaveOutline as SaveIcon, PersonAddOutline as PersonAddIcon, TrashOutline as TrashIcon } from '@vicons/ionicons5'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })
const route = useRoute()
const authStore = useAuthStore()
const message = useMessage()
const { getById, update, addStudents, removeStudents, getAvailableStudents, getExamSchemes } = useCabinetGroups()
const { getList: getCourses } = useCabinetCourses()
const { getList: getTeachers } = useCabinetTeachers()
const { getUsers } = useCabinetHeadTeacher()

const group = ref<any>(null)
const courses = ref<any[]>([])
const teachers = ref<any[]>([])
const examSchemes = ref<any[]>([])
const allUsers = ref<any[]>([])
const availableStudents = ref<{ id: string; full_name: string; username: string; current_group_name: string | null }[]>([])
const loading = ref(true)
const loadingAvailable = ref(false)
const submitting = ref(false)
const addingStudents = ref(false)
const submitError = ref<string | null>(null)
const showAddModal = ref(false)
const selectedStudentIds = ref<string[]>([])

const courseOptions = computed(() => courses.value.map((c) => ({ label: c.name, value: c.id })))
const teacherOptions = computed(() => teachers.value.map((t) => ({ label: t.full_name, value: t.id })))
const examSchemeOptions = computed(() => examSchemes.value.map((s) => ({ label: s.name, value: s.id })))

const timeSlotOptions = [
  { label: '08:00 - 11:00', value: 'A' },
  { label: '13:00 - 17:00', value: 'B' },
  { label: '17:00 - 19:00', value: 'C' },
]
const weekDayOptions = [
  { label: 'Пн, Ср, Пт', value: '1' },
  { label: 'Вт, Чт, Сб', value: '2' },
]

const formData = ref({
  name: '',
  course_id: null as number | null,
  teacher_id: null as string | null,
  exam_scheme_id: null as number | null,
  max_students: 15,
  time_slot: null as string | null,
  week_days: null as string | null,
  is_active: true,
})

const startDateTs = ref<number | null>(null)
const endDateTs = ref<number | null>(null)

const studentsInGroup = computed(() => {
  const ids = group.value?.student_ids || []
  return ids.map((id: string) => {
    const u = allUsers.value.find((x) => x.id === id && x.role === 'STUDENT')
    return { id, full_name: u?.full_name || id, username: u?.username || '' }
  })
})

const availableStudentOptions = computed(() =>
  availableStudents.value.map((s) => ({
    label: s.current_group_name ? `${s.full_name} (сейчас: ${s.current_group_name})` : s.full_name,
    value: s.id,
  }))
)

const studentColumns: DataTableColumns<any> = [
  { title: 'Имя', key: 'full_name' },
  { title: 'Логин', key: 'username', width: 150 },
  {
    title: '',
    key: 'actions',
    width: 80,
    align: 'right',
    render: (row) =>
      h(NButton, {
        size: 'small',
        quaternary: true,
        type: 'error',
        onClick: () => handleRemoveStudent(row.id),
      }, { icon: () => h(TrashIcon) }),
  },
]

async function loadGroup() {
  const id = parseInt(route.params.id as string)
  if (!id) return
  loading.value = true
  try {
    const [g, cList, tList, usersList, schemesList] = await Promise.all([
      getById(id),
      getCourses(),
      getTeachers(),
      getUsers(),
      getExamSchemes(),
    ])
    group.value = g
    courses.value = cList
    teachers.value = tList
    allUsers.value = usersList as any[]
    examSchemes.value = schemesList
    formData.value = {
      name: g.name || '',
      course_id: g.course_id,
      teacher_id: g.teacher_id || null,
      exam_scheme_id: g.exam_scheme_id || null,
      max_students: g.max_students ?? 15,
      time_slot: g.time_slot || null,
      week_days: g.week_days || null,
      is_active: g.is_active !== false,
    }
    startDateTs.value = g.start_date ? new Date(g.start_date).getTime() : null
    endDateTs.value = g.end_date ? new Date(g.end_date).getTime() : null
  } catch (e) {
    message.error('Ошибка загрузки')
    navigateTo('/cabinet/head-teacher/groups')
  } finally {
    loading.value = false
  }
}

async function loadAvailableStudents() {
  const id = parseInt(route.params.id as string)
  if (!id) return
  loadingAvailable.value = true
  try {
    availableStudents.value = await getAvailableStudents(id)
  } catch (e) {
    message.error('Ошибка загрузки списка учеников')
  } finally {
    loadingAvailable.value = false
  }
}

function openAddModal() {
  selectedStudentIds.value = []
  loadAvailableStudents()
  showAddModal.value = true
}

async function handleAddStudents() {
  if (selectedStudentIds.value.length === 0) return
  addingStudents.value = true
  try {
    await addStudents(parseInt(route.params.id as string), selectedStudentIds.value)
    message.success('Ученики добавлены')
    showAddModal.value = false
    await loadGroup()
  } catch (e: any) {
    message.error(e?.message || 'Ошибка')
  } finally {
    addingStudents.value = false
  }
}

async function handleRemoveStudent(userId: string) {
  if (!confirm('Удалить ученика из группы?')) return
  try {
    await removeStudents(parseInt(route.params.id as string), [userId])
    message.success('Ученик удалён из группы')
    await loadGroup()
  } catch (e: any) {
    message.error(e?.message || 'Ошибка')
  }
}

async function handleSubmit() {
  if (!formData.value.name.trim() || !formData.value.course_id) {
    submitError.value = 'Название и курс обязательны'
    return
  }
  submitting.value = true
  submitError.value = null
  try {
    await update(parseInt(route.params.id as string), {
      name: formData.value.name.trim(),
      course_id: formData.value.course_id,
      teacher_id: formData.value.teacher_id,
      exam_scheme_id: formData.value.exam_scheme_id,
      max_students: formData.value.max_students,
      time_slot: formData.value.time_slot,
      week_days: formData.value.week_days,
      start_date: startDateTs.value ? new Date(startDateTs.value).toISOString().slice(0, 10) : null,
      end_date: endDateTs.value ? new Date(endDateTs.value).toISOString().slice(0, 10) : null,
      is_active: formData.value.is_active,
    })
    message.success('Сохранено')
    await loadGroup()
  } catch (e: any) {
    submitError.value = e?.message || 'Ошибка'
    message.error(submitError.value)
  } finally {
    submitting.value = false
  }
}

function canAccess() {
  const u = authStore.user
  return u && (u.role === 'HEAD_TEACHER' || (u.additional_roles || []).includes('HEAD_TEACHER') || u.role === 'SUPERUSER')
}

onMounted(() => {
  if (!canAccess()) { navigateTo('/cabinet'); return }
  loadGroup()
})
</script>

<style scoped>
.cabinet-page { padding-bottom: 40px; }
.page-header { margin-bottom: 32px; }
.page-header__top { display: flex; align-items: center; gap: 20px; }
.page-header__title { margin: 0 0 8px; font-weight: 700; font-size: 1.5rem; }
.page-header__subtitle { margin: 0; color: var(--n-text-color-3); }
.loading-state { text-align: center; padding: 4rem 2rem; }
.form-card { border-radius: 16px; }
.students-tab { padding: 8px 0; }
.students-tab__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.students-tab__count { color: var(--n-text-color-3); font-size: 14px; }
.students-empty { padding: 32px; text-align: center; color: var(--n-text-color-3); background: var(--n-color-embedded); border-radius: 8px; }
.add-modal-hint { margin-bottom: 16px; color: var(--n-text-color-3); font-size: 13px; }
</style>
