<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__top">
        <NButton circle secondary @click="navigateTo('/cabinet/head-teacher/lessons')">
          <template #icon><NIcon><component :is="ArrowBackIcon" /></NIcon></template>
        </NButton>
        <div>
          <NH2 class="page-header__title">Добавить урок</NH2>
          <p class="page-header__subtitle">Создание урока для группы</p>
        </div>
      </div>
    </header>

    <NCard bordered class="form-card" style="max-width: 800px">
      <NForm ref="formRef" :model="formData" label-placement="top" @submit.prevent="handleSubmit">
        <NFormItem label="Группа *" required>
          <NSelect v-model:value="formData.group_id" :options="groupOptions" placeholder="Выберите группу" filterable size="large" />
        </NFormItem>
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
        <NFormItem label="Материалы (JSON)">
          <NInput v-model:value="formData.materials" type="textarea" placeholder='["url1", "url2"]' :autosize="{ minRows: 2 }" size="large" />
        </NFormItem>
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
import { useCabinetGroups } from '~/composables/useCabinetGroups'
import { NCard, NButton, NInput, NSelect, NForm, NFormItem, NInputNumber, NIcon, NH2, NGrid, NGi, NDivider, NSpace, NAlert, NDatePicker } from 'naive-ui'
import { ChevronBackOutline as ArrowBackIcon, SaveOutline as SaveIcon } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })
const authStore = useAuthStore()
const message = useMessage()
const { create } = useCabinetLessons()
const { getList: getGroups } = useCabinetGroups()

const groups = ref<any[]>([])
const groupOptions = ref<{ label: string; value: number }[]>([])
const lessonDateTs = ref<number>(Date.now())

const formData = ref({
  group_id: null as number | null,
  title: '',
  description: '',
  duration_minutes: 90,
  materials: '',
  homework: '',
})

const submitting = ref(false)
const submitError = ref<string | null>(null)

async function handleSubmit() {
  if (!formData.value.group_id || !formData.value.title.trim()) {
    submitError.value = 'Группа и название обязательны'
    return
  }
  if (!lessonDateTs.value) {
    submitError.value = 'Укажите дату урока'
    return
  }
  submitting.value = true
  submitError.value = null
  try {
    let materialsArr = null
    if (formData.value.materials.trim()) {
      try {
        materialsArr = JSON.parse(formData.value.materials)
      } catch (e) {
        submitError.value = 'Некорректный формат JSON для материалов'
        return
      }
    }

    await create({
      group_id: formData.value.group_id,
      title: formData.value.title.trim(),
      description: formData.value.description.trim() || undefined,
      lesson_date: new Date(lessonDateTs.value).toISOString(),
      duration_minutes: formData.value.duration_minutes || 90,
      materials: materialsArr,
      homework: formData.value.homework.trim() || undefined,
    })
    message.success('Урок создан')
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

onMounted(async () => {
  if (!canAccess()) { navigateTo('/cabinet'); return }
  groups.value = await getGroups()
  groupOptions.value = groups.value.map((g) => ({ label: `${g.name} (${g.course_name})`, value: g.id }))
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
