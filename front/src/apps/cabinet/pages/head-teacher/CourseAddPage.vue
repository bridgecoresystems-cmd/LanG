<template>
  <CabinetLayout>
    <n-space vertical size="large" class="head-teacher-page">
      <div class="page-header">
        <n-space align="center" size="large">
          <n-button
            circle
            secondary
            @click="$router.push('/cabinet/head-teacher/courses')"
          >
            <template #icon>
              <n-icon><arrow-back-icon /></n-icon>
            </template>
          </n-button>
          <div>
            <n-h1 style="margin: 0;">{{ $t('admin.actions.add') }} {{ $t('admin.models.courses') }}</n-h1>
            <n-text depth="3">Создание нового учебного курса</n-text>
          </div>
        </n-space>
      </div>

      <n-card bordered class="form-card">
        <n-form
          ref="formRef"
          :model="formData"
          label-placement="top"
          @submit.prevent="handleSubmit"
          style="max-width: 800px"
        >
          <n-divider title-placement="left">{{ $t('admin.forms.basicInfo') }}</n-divider>

          <n-form-item :label="$t('admin.forms.name')" required>
            <n-input
              v-model:value="formData.name"
              :placeholder="$t('admin.forms.namePlaceholder')"
            />
          </n-form-item>

          <n-grid cols="1 s:2" :x-gap="16">
            <n-gi>
              <n-form-item :label="$t('cabinet.courses.language')" required>
                <n-select
                  v-model:value="formData.language"
                  :options="languageOptions"
                  :placeholder="$t('admin.forms.selectLanguage')"
                  filterable
                  tag
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('cabinet.courses.level')" required>
                <n-select
                  v-model:value="formData.level"
                  :options="levelOptions"
                  :placeholder="$t('admin.forms.selectLevel')"
                />
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

          <n-grid cols="1 s:2" :x-gap="16">
            <n-gi>
              <n-form-item :label="`${$t('admin.courses.duration')} (${$t('admin.courses.months')})`">
                <n-input-number
                  v-model:value="formData.duration_months"
                  :min="1"
                  style="width: 100%"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="&nbsp;">
                <n-checkbox v-model:checked="formData.is_active">
                  {{ $t('admin.forms.active') }}
                </n-checkbox>
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-alert v-if="error" type="error" class="q-mb-md" closable>
            {{ error }}
          </n-alert>

          <n-divider />

          <n-space justify="end">
            <n-button
              ghost
              @click="$router.push('/cabinet/head-teacher/courses')"
            >
              {{ $t('admin.actions.cancel') }}
            </n-button>
            <n-button
              type="primary"
              attr-type="submit"
              :loading="loading"
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NCard, NInput, NSelect, NForm, NFormItem, 
  NInputNumber, NCheckbox, NButton, NIcon, NSpin, NAlert, NGrid, NGi, NDivider
} from 'naive-ui'
import { 
  ChevronBackOutline as ArrowBackIcon,
  SaveOutline as SaveIcon
} from '@vicons/ionicons5'
import { useHeadTeacherCourses } from '@/composables/useHeadTeacherApi'

const router = useRouter()
const { t } = useI18n()
const { loading, error, createCourse } = useHeadTeacherCourses()

const availableLanguages = ['English', 'Russian', 'Turkmen', 'Turkish', 'German', 'French', 'Spanish', 'Chinese']
const languageOptions = availableLanguages.map(l => ({ label: l, value: l }))

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
  is_active: true
})

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.language && formData.value.level
})

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = t('admin.forms.fillRequiredFields')
    return
  }

  try {
    const dataToSend = {
      name: formData.value.name.trim(),
      language: formData.value.language!,
      level: formData.value.level!,
      description: formData.value.description.trim() || '',
      duration_months: formData.value.duration_months || 3,
      is_active: formData.value.is_active
    }

    await createCourse(dataToSend)
    router.push('/cabinet/head-teacher/courses')
  } catch (err: any) {
    console.error('Create course error:', err)
  }
}
</script>

<style scoped>
.head-teacher-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
