<template>
  <CabinetLayout>
    <n-space vertical size="large" class="head-teacher-page">
      <div class="page-header">
        <n-space align="center" size="large">
          <n-button
            circle
            secondary
            @click="$router.push(`/cabinet/head-teacher/lessons?group_id=${$route.query.group_id}`)"
          >
            <template #icon>
              <n-icon><arrow-back-icon /></n-icon>
            </template>
          </n-button>
          <div>
            <n-h1 style="margin: 0;">{{ $t('admin.actions.edit') }} {{ $t('admin.models.lesson') }}</n-h1>
            <n-text depth="3">Редактирование занятия</n-text>
          </div>
        </n-space>
      </div>

      <div v-if="loading && !formData.title" class="loading-state">
        <n-spin size="large" />
      </div>

      <n-card bordered v-else class="form-card">
        <n-form
          ref="formRef"
          :model="formData"
          label-placement="top"
          @submit.prevent="handleSubmit"
          style="max-width: 800px"
        >
          <n-divider title-placement="left">{{ $t('admin.forms.basicInfo') }}</n-divider>

          <n-form-item :label="$t('admin.forms.title')" required>
            <n-input
              v-model:value="formData.title"
              :placeholder="$t('admin.forms.titlePlaceholder')"
            />
          </n-form-item>

          <n-grid cols="1 s:2" :x-gap="16">
            <n-gi>
              <n-form-item :label="$t('admin.forms.date')" required>
                <n-date-picker
                  v-model:value="formData.date"
                  type="datetime"
                  style="width: 100%"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('admin.forms.duration')">
                <n-input-number
                  v-model:value="formData.duration_minutes"
                  :min="1"
                  :step="5"
                  style="width: 100%"
                >
                  <template #suffix>мин</template>
                </n-input-number>
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-form-item :label="$t('admin.forms.description')">
            <n-input
              v-model:value="formData.description"
              type="textarea"
              :placeholder="$t('admin.forms.descriptionPlaceholder')"
              :autosize="{ minRows: 3 }"
            />
          </n-form-item>

          <n-form-item :label="$t('admin.forms.homework')">
            <n-input
              v-model:value="formData.homework"
              type="textarea"
              :placeholder="$t('admin.forms.homeworkPlaceholder')"
              :autosize="{ minRows: 3 }"
            />
          </n-form-item>

          <n-alert v-if="error" type="error" class="q-mb-md" closable>
            {{ error }}
          </n-alert>

          <n-divider />

          <n-space justify="end">
            <n-button
              ghost
              @click="$router.push(`/cabinet/head-teacher/lessons?group_id=${$route.query.group_id}`)"
            >
              {{ $t('admin.actions.cancel') }}
            </n-button>
            <n-button
              type="primary"
              attr-type="submit"
              :loading="loading"
              :disabled="!isFormValid"
            >
              <template #icon><n-icon><save-icon /></n-icon></template>
              {{ $t('admin.actions.save') }}
            </n-button>
          </n-space>
        </n-form>
      </n-card>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NCard, NInput, NDatePicker, NForm, NFormItem, 
  NInputNumber, NButton, NIcon, NAlert, NGrid, NGi, NDivider, NSpin, useMessage
} from 'naive-ui'
import { 
  ChevronBackOutline as ArrowBackIcon,
  SaveOutline as SaveIcon
} from '@vicons/ionicons5'
import { useHeadTeacherLessons } from '@/composables/useHeadTeacherApi'
import { useActivityLog } from '@/composables/useActivityLog'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const message = useMessage()
const { loading, error, fetchLesson, updateLesson } = useHeadTeacherLessons()
const { logActivity } = useActivityLog()

const formData = ref({
  title: '',
  date: Date.now(),
  duration_minutes: 60,
  description: '',
  homework: '',
  group: null as number | null
})

const loadLesson = async () => {
  try {
    const id = parseInt(route.params.id as string)
    const lesson = await fetchLesson(id)
    
    formData.value = {
      title: lesson.title || '',
      date: lesson.lesson_date ? new Date(lesson.lesson_date).getTime() : Date.now(),
      duration_minutes: lesson.duration_minutes || 60,
      description: lesson.description || '',
      homework: lesson.homework || '',
      group: lesson.group || null
    }
  } catch (err) {
    console.error('Load lesson error:', err)
  }
}

const isFormValid = computed(() => {
  return formData.value.title.trim() !== '' && formData.value.date
})

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = t('admin.forms.fillRequiredFields')
    return
  }

  const groupId = parseInt(route.query.group_id as string)
  if (!groupId) {
    error.value = 'Group ID is missing'
    return
  }

  try {
    const id = parseInt(route.params.id as string)
    const dataToSend = {
      title: formData.value.title.trim(),
      lesson_date: new Date(formData.value.date).toISOString(),
      duration_minutes: formData.value.duration_minutes || 60,
      description: formData.value.description.trim() || '',
      homework: formData.value.homework.trim() || '',
      group: groupId
    }

    await updateLesson(id, dataToSend)
    message.success(t('admin.actions.saveSuccess'))
    
    logActivity(
      'update',
      `Updated lesson "${dataToSend.title}"`,
      'Lesson',
      id,
      dataToSend.title
    )
    
    router.push(`/cabinet/head-teacher/lessons?group_id=${groupId}`)
  } catch (err: any) {
    console.error('Update lesson error:', err)
  }
}

onMounted(() => {
  logActivity('view', 'View lesson edit page')
  loadLesson()
})
</script>

<style scoped>
.head-teacher-page {
  max-width: 1200px;
  margin: 0 auto;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.form-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
}
</style>

