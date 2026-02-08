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
            <n-h1 style="margin: 0;">{{ $t('admin.actions.edit') }} {{ $t('cabinet.groups.group') }}</n-h1>
            <n-text depth="3">{{ $t('cabinet.groups.editDescription') }}</n-text>
          </div>
        </n-space>
      </div>

      <n-tabs type="line" animated>
        <!-- Basic Info Tab -->
        <n-tab-pane name="info" :tab="$t('admin.forms.basicInfo')">
          <n-card bordered class="form-card">
            <n-form
              ref="formRef"
              :model="formData"
              label-placement="top"
              @submit.prevent="handleSubmit"
              style="max-width: 800px"
            >
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
        </n-tab-pane>

        <!-- Students Tab -->
        <n-tab-pane name="students" :tab="$t('cabinet.groups.students')">
          <n-card bordered class="form-card">
            <n-space vertical size="large">
              <div>
                <n-h3>{{ $t('cabinet.groups.currentStudents') }} ({{ currentStudents.length }} / {{ formData.max_students }})</n-h3>
                <n-data-table
                  :columns="studentColumns"
                  :data="currentStudents"
                  bordered
                  striped
                  size="small"
                />
              </div>

              <n-divider />

              <div>
                <n-h3>{{ $t('cabinet.groups.addStudents') }}</n-h3>
                <n-space align="end">
                  <n-form-item :label="$t('cabinet.groups.selectStudents')" style="min-width: 400px; margin-bottom: 0">
                    <n-select
                      v-model:value="selectedStudentsToGroup"
                      multiple
                      :options="availableStudentOptions"
                      :placeholder="$t('cabinet.groups.selectStudentsPlaceholder')"
                      filterable
                    />
                  </n-form-item>
                  <n-button
                    type="primary"
                    @click="handleAddStudentsToGroup"
                    :disabled="selectedStudentsToGroup.length === 0"
                    :loading="loading"
                  >
                    <template #icon><n-icon><add-icon /></n-icon></template>
                    {{ $t('cabinet.groups.add') }}
                  </n-button>
                </n-space>
              </div>
            </n-space>
          </n-card>
        </n-tab-pane>
      </n-tabs>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NH3, NText, NCard, NInput, NSelect, NForm, NFormItem, 
  NInputNumber, NCheckbox, NButton, NIcon, NAlert, NGrid, NGi, NDivider, 
  NDatePicker, NTabs, NTabPane, NDataTable, useMessage 
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { 
  ChevronBackOutline as ArrowBackIcon,
  SaveOutline as SaveIcon,
  AddOutline as AddIcon,
  TrashOutline as DeleteIcon
} from '@vicons/ionicons5'
import api from '@/services/api'
import { useHeadTeacherGroups, useHeadTeacherCourses } from '@/composables/useHeadTeacherApi'
import { useAdminTeachers, useAdminStudents } from '@/composables/useAdminApi'
import { useActivityLog } from '@/composables/useActivityLog'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const message = useMessage()
const { loading, error, fetchGroup, updateGroup, addStudents, removeStudents } = useHeadTeacherGroups()
const { fetchCourses } = useHeadTeacherCourses()
const { fetchTeachers } = useAdminTeachers()
const { fetchStudents } = useAdminStudents()
const { logActivity } = useActivityLog()

const courses = ref<any[]>([])
const teachers = ref<any[]>([])
const examSchemes = ref<any[]>([])
const availableStudents = ref<any[]>([])
const currentStudents = ref<any[]>([])
const selectedStudentsToGroup = ref<number[]>([])

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

const studentColumns: DataTableColumns = [
  { title: t('admin.forms.name'), key: 'full_name' },
  { title: t('common.username'), key: 'username' },
  { title: t('common.email'), key: 'email' },
  {
    title: t('admin.actions.actions'),
    key: 'actions',
    width: 80,
    render: (row: any) => h(NButton, {
      circle: true,
      quaternary: true,
      type: 'error',
      onClick: () => handleRemoveStudent(row.id)
    }, {
      icon: () => h(NIcon, null, { default: () => h(DeleteIcon) })
    })
  }
]

const availableStudentOptions = computed(() => {
  const currentIds = currentStudents.value.map(s => s.id)
  return availableStudents.value
    .filter(s => !currentIds.includes(s.user_id))
    .map(s => ({
      label: `${s.full_name || s.username} (${s.email})`,
      value: s.user_id
    }))
})

const loadData = async () => {
  try {
    const [coursesRes, teachersRes, studentsRes, schemesRes] = await Promise.all([
      fetchCourses({ is_active: 'true' }),
      fetchTeachers({ is_active: 'true' }),
      fetchStudents({ is_active: 'true' }),
      api.get('/courses/exam-schemes/')
    ])
    courses.value = Array.isArray(coursesRes) ? coursesRes : coursesRes.results || []
    teachers.value = Array.isArray(teachersRes) ? teachersRes : teachersRes.results || []
    availableStudents.value = Array.isArray(studentsRes) ? studentsRes : studentsRes.results || []
    examSchemes.value = Array.isArray(schemesRes.data) ? schemesRes.data : schemesRes.data.results || []
    
    await loadGroup()
  } catch (err) {
    console.error('Load data error:', err)
  }
}

const loadGroup = async () => {
  try {
    const id = parseInt(route.params.id as string)
    const group = await fetchGroup(id)
    
    formData.value = {
      name: group.name || '',
      course: group.course || null,
      teacher: group.teacher || null,
      exam_scheme: group.exam_scheme || null,
      time_slot: group.time_slot || '',
      week_days: group.week_days || '',
      start_date: group.start_date || '',
      end_date: group.end_date || '',
      max_students: group.max_students || 15,
      is_active: group.is_active !== false
    }
    
    if (group.start_date) startDateTs.value = new Date(group.start_date).getTime()
    if (group.end_date) endDateTs.value = new Date(group.end_date).getTime()
    
    currentStudents.value = group.students || []
  } catch (err) {
    console.error('Load group error:', err)
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
  if (!isFormValid.value) return

  try {
    const id = parseInt(route.params.id as string)
    await updateGroup(id, formData.value)
    message.success(t('admin.actions.saveSuccess'))
    
    logActivity(
      'update',
      `Updated group "${formData.value.name}"`,
      'Group',
      id,
      formData.value.name
    )
  } catch (err: any) {
    console.error('Update group error:', err)
  }
}

const handleAddStudentsToGroup = async () => {
  if (selectedStudentsToGroup.value.length === 0) return
  
  try {
    const id = parseInt(route.params.id as string)
    await addStudents(id, selectedStudentsToGroup.value)
    message.success(t('cabinet.groups.addSuccess'))
    selectedStudentsToGroup.value = []
    await loadGroup()
  } catch (err: any) {
    console.error('Add students error:', err)
  }
}

const handleRemoveStudent = async (studentId: number) => {
  try {
    const id = parseInt(route.params.id as string)
    await removeStudents(id, [studentId])
    message.success(t('cabinet.groups.removeSuccess'))
    await loadGroup()
  } catch (err: any) {
    console.error('Remove student error:', err)
  }
}

onMounted(() => {
  logActivity('view', 'View group edit page')
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
