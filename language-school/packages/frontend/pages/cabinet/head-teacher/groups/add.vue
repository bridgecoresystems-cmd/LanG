<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__top">
        <NButton circle secondary @click="navigateTo('/cabinet/head-teacher/groups')">
          <template #icon><NIcon><component :is="ArrowBackIcon" /></NIcon></template>
        </NButton>
        <div>
          <NH2 class="page-header__title">Добавить группу</NH2>
          <p class="page-header__subtitle">Создание учебной группы</p>
        </div>
      </div>
    </header>

    <NCard bordered class="form-card" style="max-width: 800px">
      <NForm ref="formRef" :model="formData" label-placement="top" @submit.prevent="handleSubmit">
        <NDivider title-placement="left">Основные данные</NDivider>
        <NFormItem label="Название *" required>
          <NInput v-model:value="formData.name" placeholder="Название группы" size="large" />
        </NFormItem>
        <NGrid cols="1 s:2" :x-gap="16">
          <NGi><NFormItem label="Курс *" required><NSelect v-model:value="formData.course_id" :options="courseOptions" placeholder="Выберите курс" filterable size="large" /></NFormItem></NGi>
          <NGi><NFormItem label="Учитель"><NSelect v-model:value="formData.teacher_id" :options="teacherOptions" placeholder="Выберите учителя" clearable filterable size="large" /></NFormItem></NGi>
        </NGrid>
        <NDivider title-placement="left">Расписание</NDivider>
        <NGrid cols="1 s:2" :x-gap="16">
          <NGi><NFormItem label="Время"><NSelect v-model:value="formData.time_slot" :options="timeSlotOptions" placeholder="Слот" clearable size="large" /></NFormItem></NGi>
          <NGi><NFormItem label="Дни недели"><NSelect v-model:value="formData.week_days" :options="weekDayOptions" placeholder="Дни" clearable size="large" /></NFormItem></NGi>
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
        <NDivider />
        <NSpace justify="end">
          <NButton ghost @click="navigateTo('/cabinet/head-teacher/groups')">Отмена</NButton>
          <NButton type="primary" attr-type="submit" :loading="submitting"><template #icon><NIcon><component :is="SaveIcon" /></NIcon></template>Сохранить</NButton>
        </NSpace>
      </NForm>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useCabinetGroups, useCabinetTeachers } from '~/composables/useCabinetGroups'
import { useCabinetCourses } from '~/composables/useCabinetCourses'
import { NCard, NButton, NInput, NSelect, NForm, NFormItem, NInputNumber, NCheckbox, NIcon, NH2, NGrid, NGi, NDivider, NSpace, NAlert, NDatePicker } from 'naive-ui'
import { ChevronBackOutline as ArrowBackIcon, SaveOutline as SaveIcon } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })
const authStore = useAuthStore()
const message = useMessage()
const { create, getExamSchemes } = useCabinetGroups()
const { getList: getCourses } = useCabinetCourses()
const { getList: getTeachers } = useCabinetTeachers()

const courses = ref<any[]>([])
const teachers = ref<any[]>([])
const examSchemes = ref<any[]>([])
const courseOptions = ref<{ label: string; value: number }[]>([])
const teacherOptions = ref<{ label: string; value: string }[]>([])
const examSchemeOptions = ref<{ label: string; value: number }[]>([])
const startDateTs = ref<number>(Date.now())
const endDateTs = ref<number | null>(null)

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

watch(startDateTs, (v) => { formData.value = { ...formData.value } })
watch(endDateTs, (v) => { formData.value = { ...formData.value } })

const submitting = ref(false)
const submitError = ref<string | null>(null)

async function handleSubmit() {
  if (!formData.value.name.trim() || !formData.value.course_id) {
    submitError.value = 'Название и курс обязательны'
    return
  }
  submitting.value = true
  submitError.value = null
  try {
    await create({
      name: formData.value.name.trim(),
      course_id: formData.value.course_id,
      teacher_id: formData.value.teacher_id || undefined,
      exam_scheme_id: formData.value.exam_scheme_id || undefined,
      max_students: formData.value.max_students || 15,
      time_slot: formData.value.time_slot || undefined,
      week_days: formData.value.week_days || undefined,
      start_date: startDateTs.value ? new Date(startDateTs.value).toISOString().slice(0, 10) : undefined,
      end_date: endDateTs.value ? new Date(endDateTs.value).toISOString().slice(0, 10) : undefined,
      is_active: formData.value.is_active,
    })
    message.success('Группа создана')
    navigateTo('/cabinet/head-teacher/groups')
  } catch (e: any) {
    submitError.value = e?.message || 'Ошибка'
    message.error(submitError.value)
  } finally {
    submitting.value = false
  }
}

async function loadData() {
  const [cList, tList, schemesList] = await Promise.all([
    getCourses(),
    getTeachers(),
    getExamSchemes()
  ])
  courses.value = cList
  teachers.value = tList
  examSchemes.value = schemesList
  courseOptions.value = courses.value.map((c) => ({ 
    label: c.tariff_name ? `${c.name} (${c.tariff_price} TMT)` : c.name, 
    value: c.id 
  }))
  teacherOptions.value = teachers.value.map((t) => ({ label: t.full_name, value: t.id }))
  examSchemeOptions.value = examSchemes.value.map((s) => ({ label: s.name, value: s.id }))
}

function canAccess() {
  const u = authStore.user
  return u && (u.role === 'HEAD_TEACHER' || (u.additional_roles || []).includes('HEAD_TEACHER') || u.role === 'SUPERUSER')
}

onMounted(async () => {
  if (!canAccess()) { navigateTo('/cabinet'); return }
  await loadData()
})
</script>

<style scoped>
.cabinet-page { padding-bottom: 40px; }
.page-header { margin-bottom: 32px; }
.page-header__top { display: flex; align-items: center; gap: 20px; }
.page-header__title { margin: 0 0 8px; font-weight: 700; font-size: 1.5rem; }
.page-header__subtitle { margin: 0; color: var(--n-text-color-3); }
.form-card { border-radius: 16px; }
</style>
