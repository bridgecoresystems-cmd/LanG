<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__top">
        <NButton circle secondary @click="navigateTo('/cabinet/head-teacher/lessons')">
          <template #icon><NIcon><component :is="ArrowBackIcon" /></NIcon></template>
        </NButton>
        <div>
          <NH2 class="page-header__title">Редактировать урок</NH2>
          <p class="page-header__subtitle">{{ lesson?.title }}</p>
        </div>
      </div>
    </header>

    <div v-if="loading && !lesson" class="loading-state"><NSpin size="large" /></div>
    <NCard v-else-if="lesson" bordered class="form-card" style="max-width: 800px">
      <NForm ref="formRef" :model="formData" label-placement="top" @submit.prevent="handleSubmit">
        <NFormItem label="Название *" required>
          <NInput v-model:value="formData.title" placeholder="Название урока" size="large" />
        </NFormItem>
        <NFormItem label="Описание">
          <NInput v-model:value="formData.description" type="textarea" placeholder="Описание" :autosize="{ minRows: 3 }" size="large" />
        </NFormItem>
        <NGrid cols="1 s:2" :x-gap="16">
          <NGi><NFormItem label="Дата и время *" required><NDatePicker v-model:value="lessonDateTs" type="datetime" style="width: 100%" size="large" /></NFormItem></NGi>
          <NGi><NFormItem label="Длительность (мин)"><NInputNumber v-model:value="formData.duration_minutes" :min="30" style="width: 100%" size="large" /></NFormItem></NGi>
        </NGrid>
        <NFormItem label="Домашнее задание"><NInput v-model:value="formData.homework" type="textarea" placeholder="ДЗ" :autosize="{ minRows: 2 }" size="large" /></NFormItem>
        <NAlert v-if="submitError" type="error" closable @close="submitError = null">{{ submitError }}</NAlert>
        <NDivider />
        <NSpace justify="end">
          <NButton ghost @click="navigateTo('/cabinet/head-teacher/lessons')">Отмена</NButton>
          <NButton type="primary" attr-type="submit" :loading="submitting"><template #icon><NIcon><component :is="SaveIcon" /></NIcon></template>Сохранить</NButton>
        </NSpace>
      </NForm>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCabinetLessons } from '~/composables/useCabinetLessons'
import { NCard, NButton, NInput, NForm, NFormItem, NInputNumber, NIcon, NH2, NGrid, NGi, NDivider, NSpace, NAlert, NSpin, NDatePicker } from 'naive-ui'
import { ChevronBackOutline as ArrowBackIcon, SaveOutline as SaveIcon } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })
const route = useRoute()
const authStore = useAuthStore()
const message = useMessage()
const { getById, update } = useCabinetLessons()

const lesson = ref<any>(null)
const loading = ref(true)
const submitting = ref(false)
const submitError = ref<string | null>(null)
const lessonDateTs = ref<number | null>(null)

const formData = ref({
  title: '',
  description: '',
  duration_minutes: 90,
  homework: '',
})

async function loadLesson() {
  const id = parseInt(route.params.id as string)
  if (!id) return
  loading.value = true
  try {
    const l = await getById(id)
    lesson.value = l
    formData.value = {
      title: l.title || '',
      description: l.description || '',
      duration_minutes: l.duration_minutes ?? 90,
      homework: l.homework || '',
    }
    lessonDateTs.value = l.lesson_date ? new Date(l.lesson_date).getTime() : null
  } catch (e) {
    message.error('Ошибка загрузки')
    navigateTo('/cabinet/head-teacher/lessons')
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!formData.value.title.trim()) {
    submitError.value = 'Название обязательно'
    return
  }
  if (!lessonDateTs.value) {
    submitError.value = 'Укажите дату урока'
    return
  }
  submitting.value = true
  submitError.value = null
  try {
    await update(parseInt(route.params.id as string), {
      title: formData.value.title.trim(),
      description: formData.value.description.trim() || undefined,
      lesson_date: new Date(lessonDateTs.value).toISOString(),
      duration_minutes: formData.value.duration_minutes,
      homework: formData.value.homework.trim() || undefined,
    })
    message.success('Сохранено')
    navigateTo('/cabinet/head-teacher/lessons')
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
  loadLesson()
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
</style>
