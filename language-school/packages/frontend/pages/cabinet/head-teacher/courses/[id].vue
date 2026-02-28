<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__top">
        <NButton circle secondary @click="navigateTo('/cabinet/head-teacher/courses')">
          <template #icon>
            <NIcon><component :is="ArrowBackIcon" /></NIcon>
          </template>
        </NButton>
        <div>
          <NH2 class="page-header__title">Редактировать курс</NH2>
          <p class="page-header__subtitle">Редактирование учебного курса</p>
        </div>
      </div>
    </header>

    <div v-if="loading && !formData.name" class="loading-state">
      <NSpin size="large" />
    </div>

    <NCard v-else bordered class="form-card" style="max-width: 800px">
      <NForm ref="formRef" :model="formData" label-placement="top" @submit.prevent="handleSubmit">
        <NDivider title-placement="left">Основные данные</NDivider>
        <NFormItem label="Название *" required>
          <NInput v-model:value="formData.name" placeholder="Название курса" size="large" />
        </NFormItem>
        <NGrid cols="1 s:2" :x-gap="16">
          <NGi>
            <NFormItem label="Язык *" required>
              <NSelect
                v-model:value="formData.language"
                :options="languageOptions"
                placeholder="Выберите язык"
                filterable
                tag
                size="large"
              />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="Уровень *" required>
              <NSelect
                v-model:value="formData.level"
                :options="levelOptions"
                placeholder="Выберите уровень"
                size="large"
              />
            </NFormItem>
          </NGi>
        </NGrid>
        <NFormItem label="Описание">
          <NInput
            v-model:value="formData.description"
            type="textarea"
            placeholder="Описание курса"
            :autosize="{ minRows: 3 }"
            size="large"
          />
        </NFormItem>
        <NGrid cols="1 s:2" :x-gap="16">
          <NGi>
            <NFormItem label="Длительность (месяцев)">
              <NInputNumber v-model:value="formData.duration_months" :min="1" style="width: 100%" size="large" />
            </NFormItem>
          </NGi>
          <NGi>
            <NFormItem label="Тариф (Стоимость)">
              <NSelect
                v-model:value="formData.tariff_id"
                :options="tariffOptions"
                :loading="tariffsLoading"
                placeholder="Выберите тариф"
                clearable
                size="large"
              />
            </NFormItem>
          </NGi>
        </NGrid>
        <NFormItem>
          <NCheckbox v-model:checked="formData.is_active">Активен</NCheckbox>
        </NFormItem>
        <NAlert v-if="submitError" type="error" closable @close="submitError = null">{{ submitError }}</NAlert>
        <NDivider />
        <NSpace justify="end">
          <NButton ghost @click="navigateTo('/cabinet/head-teacher/courses')">Отмена</NButton>
          <NButton type="primary" attr-type="submit" :loading="submitting">
            <template #icon><NIcon><component :is="SaveIcon" /></NIcon></template>
            Сохранить
          </NButton>
        </NSpace>
      </NForm>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCabinetCourses } from '~/composables/useCabinetCourses'
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
  NDivider,
  NSpace,
  NAlert,
  NSpin,
} from 'naive-ui'
import { ChevronBackOutline as ArrowBackIcon, SaveOutline as SaveIcon } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import { useEden } from '~/composables/useEden'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const authStore = useAuthStore()
const message = useMessage()
const { getById, update } = useCabinetCourses()
const api = useEden()

const availableLanguages = ref(['English', 'Russian', 'Turkmen', 'Turkish', 'German', 'French', 'Spanish', 'Chinese'])
const languageOptions = computed(() => availableLanguages.value.map((l) => ({ label: l, value: l })))
const levelOptions = [
  { label: 'A1 (Beginner)', value: 'A1' },
  { label: 'A2 (Elementary)', value: 'A2' },
  { label: 'B1 (Intermediate)', value: 'B1' },
  { label: 'B2 (Upper Intermediate)', value: 'B2' },
  { label: 'C1 (Advanced)', value: 'C1' },
  { label: 'C2 (Proficient)', value: 'C2' },
]

const formData = ref({
  name: '',
  language: null as string | null,
  level: null as string | null,
  description: '',
  duration_months: 3,
  tariff_id: null as number | null,
  is_active: true,
})

const tariffsLoading = ref(false)
const tariffOptions = ref<{ label: string, value: number }[]>([])

async function loadTariffs() {
  tariffsLoading.value = true
  try {
    const { data } = await api.api.v1.cabinet.tariffs.get()
    if (data) {
      tariffOptions.value = data.map((t: any) => ({
        label: `${t.name} (${t.price} TMT)`,
        value: t.id
      }))
    }
  } catch (e) {
    console.error(e)
  } finally {
    tariffsLoading.value = false
  }
}

const loading = ref(true)
const submitting = ref(false)
const submitError = ref<string | null>(null)

async function loadCourse() {
  const id = parseInt(route.params.id as string)
  if (!id) return
  loading.value = true
  try {
    const course = await getById(id)
    formData.value = {
      name: course.name || '',
      language: course.language || null,
      level: course.level || null,
      description: course.description || '',
      duration_months: course.duration_months ?? 3,
      tariff_id: course.tariff_id || null,
      is_active: course.is_active !== false,
    }
    if (course.language && !availableLanguages.value.includes(course.language)) {
      availableLanguages.value.push(course.language)
    }
  } catch (e) {
    message.error('Ошибка загрузки')
    navigateTo('/cabinet/head-teacher/courses')
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!formData.value.name.trim() || !formData.value.language || !formData.value.level) {
    submitError.value = 'Заполните обязательные поля'
    return
  }
  submitting.value = true
  submitError.value = null
  try {
    await update(parseInt(route.params.id as string), {
      name: formData.value.name.trim(),
      language: formData.value.language,
      level: formData.value.level,
      description: formData.value.description.trim() || undefined,
      duration_months: formData.value.duration_months || 3,
      tariff_id: formData.value.tariff_id || null,
      is_active: formData.value.is_active,
    })
    message.success('Сохранено')
    navigateTo('/cabinet/head-teacher/courses')
  } catch (e: any) {
    submitError.value = e?.message || 'Ошибка при сохранении'
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
  if (!canAccess()) {
    navigateTo('/cabinet')
    return
  }
  loadTariffs()
  loadCourse()
})
</script>

<style scoped>
.cabinet-page { padding-bottom: 40px; }
.page-header { margin-bottom: 32px; }
.page-header__top { display: flex; align-items: center; gap: 20px; }
.page-header__title { margin: 0 0 8px; font-weight: 700; font-size: 1.5rem; }
.page-header__subtitle { margin: 0; color: var(--n-text-color-3); }
.loading-state { text-align: center; padding: 4rem 2rem; }
.form-card { border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
</style>
