<template>
  <CabinetLayout>
    <n-space vertical size="large" class="head-teacher-page">
      <!-- Header -->
      <div class="page-header">
        <n-space align="center" size="large">
          <n-button
            circle
            secondary
            @click="$router.push('/cabinet/head-teacher/mailing')"
          >
            <template #icon>
              <n-icon><arrow-back-icon /></n-icon>
            </template>
          </n-button>
          <div>
            <n-h1 style="margin: 0;">{{ $t('cabinet.mailing.create.title') }}</n-h1>
            <n-text depth="3">{{ $t('cabinet.mailing.create.description') }}</n-text>
          </div>
        </n-space>
      </div>

      <n-grid cols="1 m:12" responsive="screen" :x-gap="24" :y-gap="24">
        <!-- Main Form -->
        <n-gi span="1 m:8">
          <n-card bordered class="form-card">
            <n-form
              ref="formRef"
              :model="formData"
              label-placement="top"
              @submit.prevent="handleSubmit"
            >
              <n-form-item
                :label="$t('cabinet.mailing.create.titleField')"
                :validation-status="errors.title ? 'error' : undefined"
                :feedback="errors.title"
                required
              >
                <n-input
                  v-model:value="formData.title"
                  :placeholder="$t('cabinet.mailing.create.titlePlaceholder')"
                />
              </n-form-item>

              <n-form-item
                :label="$t('cabinet.mailing.create.content')"
                :validation-status="errors.content ? 'error' : undefined"
                :feedback="errors.content"
                required
              >
                <n-input
                  v-model:value="formData.content"
                  type="textarea"
                  :placeholder="$t('cabinet.mailing.create.contentPlaceholder')"
                  :autosize="{ minRows: 6 }"
                />
              </n-form-item>

              <n-grid cols="1 s:2" :x-gap="16">
                <n-gi>
                  <n-form-item
                    :label="$t('cabinet.mailing.create.recipientType')"
                    :validation-status="errors.recipient_type ? 'error' : undefined"
                    :feedback="errors.recipient_type"
                    required
                  >
                    <n-select
                      v-model:value="formData.recipient_type"
                      :options="recipientTypeOptions"
                      :placeholder="$t('cabinet.mailing.create.selectRecipientType')"
                      @update:value="handleRecipientTypeChange"
                    />
                  </n-form-item>
                </n-gi>
                <n-gi>
                  <n-form-item
                    :label="$t('cabinet.mailing.create.scheduledAt')"
                  >
                    <n-date-picker
                      v-model:value="scheduledAtTs"
                      type="datetime"
                      clearable
                      :placeholder="$t('cabinet.mailing.create.scheduledAtPlaceholder')"
                      :is-date-disabled="(ts) => ts < Date.now() - 86400000"
                      style="width: 100%"
                    />
                  </n-form-item>
                </n-gi>
              </n-grid>

              <!-- Groups MultiSelect -->
              <n-form-item
                v-if="formData.recipient_type === 'groups' || formData.recipient_type === 'group_teachers'"
                :label="$t('cabinet.mailing.create.selectGroups')"
                :validation-status="errors.group_ids ? 'error' : undefined"
                :feedback="errors.group_ids"
                required
              >
                <n-select
                  v-model:value="formData.group_ids"
                  multiple
                  :options="groupOptions"
                  :placeholder="$t('cabinet.mailing.create.selectGroupsPlaceholder')"
                  :loading="loadingGroups"
                  filterable
                />
              </n-form-item>

              <n-alert v-if="error" type="error" class="q-mb-md" closable>
                {{ error }}
              </n-alert>

              <n-divider />

              <n-space justify="end">
                <n-button
                  ghost
                  @click="$router.push('/cabinet/head-teacher/mailing')"
                >
                  {{ $t('common.cancel') }}
                </n-button>
                <n-button
                  type="primary"
                  attr-type="submit"
                  :loading="submitting"
                  :disabled="!isFormValid"
                >
                  <template #icon><n-icon><send-icon /></n-icon></template>
                  {{ $t('cabinet.mailing.create.send') }}
                </n-button>
              </n-space>
            </n-form>
          </n-card>
        </n-gi>

        <!-- Preview Panel -->
        <n-gi span="1 m:4">
          <div class="preview-panel">
            <n-card bordered :title="$t('cabinet.mailing.create.preview')" size="small">
              <template #header-extra>
                <n-icon size="18" depth="3"><eye-icon /></n-icon>
              </template>

              <div class="preview-bubble">
                <n-space vertical size="medium">
                  <n-h3 style="margin: 0; color: #18a058;">{{ formData.title || '...' }}</n-h3>
                  <n-text style="white-space: pre-wrap; display: block; min-height: 100px;">
                    {{ formData.content || '...' }}
                  </n-text>
                  <n-divider dashed />
                  <n-space align="center" size="small">
                    <n-icon depth="3"><users-icon /></n-icon>
                    <n-text depth="3" size="small">{{ getRecipientPreview() }}</n-text>
                  </n-space>
                </n-space>
              </div>
            </n-card>
          </div>
        </n-gi>
      </n-grid>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '@/apps/cabinet/layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NH3, NText, NCard, NInput, NSelect, NForm, NFormItem, 
  NDatePicker, NButton, NIcon, NSpin, NAlert, NGrid, NGi, NDivider, NBadge
} from 'naive-ui'
import { 
  ChevronBackOutline as ArrowBackIcon,
  SendOutline as SendIcon,
  EyeOutline as EyeIcon,
  PeopleOutline as UsersIcon
} from '@vicons/ionicons5'
import { useMailingApi, type CreateMessageData } from '@/composables/useMailingApi'
import { useHeadTeacherGroups } from '@/composables/useHeadTeacherApi'

const router = useRouter()
const { t } = useI18n()
const mailingApi = useMailingApi()
const groupsApi = useHeadTeacherGroups()

const formData = ref<CreateMessageData & { group_ids?: number[] }>({
  title: '',
  content: '',
  recipient_type: 'all',
  scheduled_at: null,
  group_ids: [],
})

const scheduledAtTs = ref<number | null>(null)

watch(scheduledAtTs, (newVal) => {
  formData.value.scheduled_at = newVal ? new Date(newVal).toISOString() : null
})

const groups = ref<Array<{ id: number; name: string; course_name: string }>>([])
const loadingGroups = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)
const errors = ref<Record<string, string>>({})

const groupOptions = computed(() => groups.value.map(g => ({
  label: `${g.name} (${g.course_name})`,
  value: g.id
})))

const recipientTypeOptions = [
  { label: t('cabinet.mailing.create.recipientTypes.all'), value: 'all' },
  { label: t('cabinet.mailing.create.recipientTypes.students'), value: 'students' },
  { label: t('cabinet.mailing.create.recipientTypes.teachers'), value: 'teachers' },
  { label: t('cabinet.mailing.create.recipientTypes.directors'), value: 'directors' },
  { label: t('cabinet.mailing.create.recipientTypes.headTeachers'), value: 'head_teachers' },
  { label: t('cabinet.mailing.create.recipientTypes.groups'), value: 'groups' },
  { label: t('cabinet.mailing.create.recipientTypes.groupTeachers'), value: 'group_teachers' },
]

const isFormValid = computed(() => {
  return (
    formData.value.title.trim() !== '' &&
    formData.value.content.trim() !== '' &&
    formData.value.recipient_type !== '' &&
    (formData.value.recipient_type !== 'groups' && formData.value.recipient_type !== 'group_teachers'
      ? true
      : (formData.value.group_ids?.length || 0) > 0)
  )
})

const loadGroups = async () => {
  try {
    loadingGroups.value = true
    const response = await groupsApi.fetchGroups()
    const data = Array.isArray(response) ? response : (response.results || [])
    groups.value = data.map((group: any) => ({
      id: group.id,
      name: group.name,
      course_name: group.course?.name || '',
    }))
  } catch (err: any) {
    console.error('Failed to load groups:', err)
  } finally {
    loadingGroups.value = false
  }
}

const handleRecipientTypeChange = () => {
  if (formData.value.recipient_type !== 'groups' && formData.value.recipient_type !== 'group_teachers') {
    formData.value.group_ids = []
  }
  errors.value.group_ids = ''
}

const getRecipientPreview = (): string => {
  const type = formData.value.recipient_type
  const typeLabels: Record<string, string> = {
    all: t('cabinet.mailing.create.recipientTypes.all'),
    students: t('cabinet.mailing.create.recipientTypes.students'),
    teachers: t('cabinet.mailing.create.recipientTypes.teachers'),
    directors: t('cabinet.mailing.create.recipientTypes.directors'),
    head_teachers: t('cabinet.mailing.create.recipientTypes.headTeachers'),
    groups: t('cabinet.mailing.create.recipientTypes.groups'),
    group_teachers: t('cabinet.mailing.create.recipientTypes.groupTeachers'),
  }
  
  if (type === 'groups' || type === 'group_teachers') {
    const selectedGroups = groups.value.filter(g => formData.value.group_ids?.includes(g.id))
    if (selectedGroups.length > 0) {
      return `${typeLabels[type]} (${selectedGroups.map(g => g.name).join(', ')})`
    }
    return typeLabels[type]
  }
  
  return typeLabels[type] || ''
}

const validateForm = (): boolean => {
  errors.value = {}
  if (!formData.value.title.trim()) errors.value.title = t('cabinet.mailing.create.errors.titleRequired')
  if (!formData.value.content.trim()) errors.value.content = t('cabinet.mailing.create.errors.contentRequired')
  if (!formData.value.recipient_type) errors.value.recipient_type = t('cabinet.mailing.create.errors.recipientTypeRequired')
  if ((formData.value.recipient_type === 'groups' || formData.value.recipient_type === 'group_teachers') &&
      (!formData.value.group_ids || formData.value.group_ids.length === 0)) {
    errors.value.group_ids = t('cabinet.mailing.create.errors.groupsRequired')
  }
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    submitting.value = true
    error.value = null
    
    const dataToSend: CreateMessageData = {
      title: formData.value.title.trim(),
      content: formData.value.content.trim(),
      recipient_type: formData.value.recipient_type,
      scheduled_at: formData.value.scheduled_at,
    }
    
    if (formData.value.group_ids && formData.value.group_ids.length > 0) {
      dataToSend.group_ids = formData.value.group_ids
    }
    
    await mailingApi.createMessage(dataToSend)
    router.push('/cabinet/head-teacher/mailing')
  } catch (err: any) {
    error.value = err.message || t('cabinet.mailing.create.errors.submitFailed')
    if (err.response?.data) {
      const data = err.response.data
      if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) errors.value[key] = data[key][0]
          else if (typeof data[key] === 'string') errors.value[key] = data[key]
        })
      }
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadGroups()
})
</script>

<style scoped>
.head-teacher-page {
  max-width: 1200px;
  margin: 0 auto;
}

.preview-panel {
  position: sticky;
  top: 24px;
}

.preview-bubble {
  padding: 16px;
  background-color: white;
  border-radius: 12px;
}
</style>
