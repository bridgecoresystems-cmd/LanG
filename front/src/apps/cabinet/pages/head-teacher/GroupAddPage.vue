<template>
  <CabinetLayout>
    <n-space vertical size="large" class="head-teacher-page">
      <div class="page-header">
        <n-space align="center" size="large">
          <n-button
            circle
            secondary
            @click="$router.push('/cabinet/head-teacher/groups')"
          >
            <template #icon>
              <n-icon><arrow-back-icon /></n-icon>
            </template>
          </n-button>
          <div>
            <n-h1 style="margin: 0;">{{ $t('admin.actions.add') }} {{ $t('cabinet.groups.group') }}</n-h1>
            <n-text depth="3">{{ $t('cabinet.groups.addDescription') }}</n-text>
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

          <n-form-item :label="$t('cabinet.groups.name')" required>
            <n-input
              v-model:value="formData.name"
              :placeholder="$t('cabinet.groups.namePlaceholder')"
            />
          </n-form-item>

          <n-grid cols="1 s:2" :x-gap="16">
            <n-gi>
              <n-form-item :label="$t('cabinet.groups.course')" required>
                <n-select
                  v-model:value="formData.course"
                  :options="courseOptions"
                  :placeholder="$t('admin.forms.selectCourse')"
                  filterable
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('cabinet.examSettings.examScheme')">
                <n-select
                  v-model:value="formData.exam_scheme"
                  :options="examSchemeOptions"
                  :placeholder="$t('cabinet.examSettings.selectExamScheme')"
                  clearable
                  filterable
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-grid cols="1 s:2" :x-gap="16">
            <n-gi>
              <n-form-item :label="$t('cabinet.groups.teacher')" required>
                <n-select
                  v-model:value="formData.teacher"
                  :options="teacherOptions"
                  :placeholder="$t('admin.forms.selectTeacher')"
                  filterable
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-divider title-placement="left">{{ $t('cabinet.groups.schedule') }}</n-divider>

          <n-grid cols="1 s:2" :x-gap="16">
            <n-gi>
              <n-form-item :label="$t('cabinet.groups.timeSlot')" required>
                <n-select
                  v-model:value="formData.time_slot"
                  :options="timeSlotOptions"
                  :placeholder="$t('admin.forms.selectTimeSlot')"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('cabinet.groups.weekDays')" required>
                <n-select
                  v-model:value="formData.week_days"
                  :options="weekDayOptions"
                  :placeholder="$t('admin.forms.selectWeekDays')"
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-grid cols="1 s:2" :x-gap="16">
            <n-gi>
              <n-form-item :label="$t('cabinet.groups.startDate')" required>
                <n-date-picker
                  v-model:value="startDateTs"
                  type="date"
                  style="width: 100%"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('cabinet.groups.endDate')">
                <n-date-picker
                  v-model:value="endDateTs"
                  type="date"
                  clearable
                  style="width: 100%"
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-grid cols="1 s:2" :x-gap="16">
            <n-gi>
              <n-form-item :label="$t('cabinet.groups.maxStudents')">
                <n-input-number
                  v-model:value="formData.max_students"
                  :min="1"
                  :max="50"
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
              @click="$router.push('/cabinet/head-teacher/groups')"
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NCard, NInput, NSelect, NForm, NFormItem, 
  NInputNumber, NCheckbox, NButton, NIcon, NAlert, NGrid, NGi, NDivider, NDatePicker, useMessage
} from 'naive-ui'
import { 
  ChevronBackOutline as ArrowBackIcon,
  SaveOutline as SaveIcon
} from '@vicons/ionicons5'
import api from '@/services/api'
import { useHeadTeacherGroups, useHeadTeacherCourses } from '@/composables/useHeadTeacherApi'
import { useAdminTeachers } from '@/composables/useAdminApi'
import { useActivityLog } from '@/composables/useActivityLog'

const router = useRouter()
const { t } = useI18n()
const message = useMessage()
const { loading, error, createGroup } = useHeadTeacherGroups()
const { fetchCourses } = useHeadTeacherCourses()
const { fetchTeachers } = useAdminTeachers()
const { logActivity } = useActivityLog()

const courses = ref<any[]>([])
const teachers = ref<any[]>([])
const examSchemes = ref<any[]>([])
const startDateTs = ref<number>(Date.now())
const endDateTs = ref<number | null>(null)

const formData = ref({
  name: '',
  course: null as number | null,
  teacher: null as number | null,
  exam_scheme: null as number | null,
  time_slot: '',
  week_days: '',
  start_date: '',
  end_date: '',
  max_students: 15,
  is_active: true
})

watch(startDateTs, (newVal) => {
  formData.value.start_date = newVal ? new Date(newVal).toISOString().split('T')[0] : ''
})

watch(endDateTs, (newVal) => {
  formData.value.end_date = newVal ? new Date(newVal).toISOString().split('T')[0] : ''
})

const courseOptions = computed(() => courses.value.map(c => ({
  label: `${c.name} (${c.language} - ${c.level})`,
  value: c.id
})))

const teacherOptions = computed(() => teachers.value.map(t => ({
  label: t.full_name || t.username,
  value: t.user_id
})))

const examSchemeOptions = computed(() => examSchemes.value.map(s => ({
  label: s.name,
  value: s.id
})))

const timeSlotOptions = [
  { label: 'A: 08:00 - 11:00', value: 'A' },
  { label: 'B: 13:00 - 17:00', value: 'B' },
  { label: 'C: 17:00 - 19:00', value: 'C' },
]

const weekDayOptions = [
  { label: `1: ${t('cabinet.groups.monWedFri')}`, value: '1' },
  { label: `2: ${t('cabinet.groups.tueThuSat')}`, value: '2' },
]

const loadData = async () => {
  try {
    const [coursesRes, teachersRes, schemesRes] = await Promise.all([
      fetchCourses({ is_active: 'true' }),
      fetchTeachers({ is_active: 'true' }),
      api.get('/courses/exam-schemes/')
    ])
    courses.value = Array.isArray(coursesRes) ? coursesRes : coursesRes.results || []
    teachers.value = Array.isArray(teachersRes) ? teachersRes : teachersRes.results || []
    examSchemes.value = Array.isArray(schemesRes.data) ? schemesRes.data : schemesRes.data.results || []
    
    // Set initial start date string
    formData.value.start_date = new Date(startDateTs.value).toISOString().split('T')[0]
  } catch (err) {
    console.error('Load data error:', err)
  }
}

const isFormValid = computed(() => {
  return (
    formData.value.name.trim() !== '' &&
    formData.value.course &&
    formData.value.teacher &&
    formData.value.time_slot &&
    formData.value.week_days &&
    formData.value.start_date
  )
})

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = t('admin.forms.fillRequiredFields')
    return
  }

  try {
    const dataToSend = {
      ...formData.value,
      max_students: formData.value.max_students || 15
    }

    await createGroup(dataToSend)
    message.success(t('admin.actions.addSuccess'))
    
    logActivity(
      'create',
      `Created group "${dataToSend.name}"`,
      'Group',
      undefined,
      dataToSend.name
    )
    
    router.push('/cabinet/head-teacher/groups')
  } catch (err: any) {
    console.error('Create group error:', err)
  }
}

onMounted(() => {
  logActivity('view', 'View group add page')
  loadData()
})
</script>

<style scoped>
.head-teacher-page {
  max-width: 1200px;
  margin: 0 auto;
}

.form-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
}
</style>
