<template>
  <div v-if="loading" class="loading-container">
    <n-spin size="large" />
  </div>

  <div v-else-if="error" class="error-container">
    <n-alert type="error" :title="$t('common.error')">
      {{ error }}
    </n-alert>
  </div>

  <n-card v-else bordered>
    <template #header>
      <n-space align="center" justify="space-between">
        <span>{{ $t('cabinet.menu.attendance') || 'Посещаемость' }}</span>
        <n-space>
          <n-button 
            v-if="hasChanges" 
            size="small" 
            @click="resetAttendance"
          >
            {{ $t('common.cancel') || 'Отмена' }}
          </n-button>
          <n-button 
            type="primary" 
            size="small" 
            :loading="saving"
            :disabled="!hasChanges"
            @click="saveAttendanceChanges"
          >
            <template #icon><n-icon><save-icon /></n-icon></template>
            {{ $t('common.save') || 'Сохранить' }}
          </n-button>
        </n-space>
      </n-space>
    </template>

    <div class="attendance-table-wrapper">
      <table class="attendance-table">
        <thead>
          <tr>
            <th class="sticky-col first-col">{{ $t('cabinet.student.fullName') || 'ФИО студента' }}</th>
            <th v-for="lesson in matrix?.lessons" :key="lesson.id" class="lesson-header">
              <div class="lesson-date">{{ formatShortDate(lesson.date) }}</div>
              <div class="lesson-title" :title="lesson.title">{{ lesson.title }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in matrix?.students" :key="student.id">
            <td class="sticky-col first-col student-name">
              {{ student.full_name }}
            </td>
            <td 
              v-for="lesson in matrix?.lessons" 
              :key="lesson.id" 
              class="attendance-cell"
              :class="getAttendanceClass(student.id, lesson.id)"
              @click="toggleAttendance(student.id, lesson.id)"
            >
              <n-icon v-if="isStudentPresent(student.id, lesson.id)" color="#18a058" size="20">
                <checkmark-icon />
              </n-icon>
              <n-icon v-else color="#d03050" size="20">
                <close-icon />
              </n-icon>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <template #footer>
      <n-space align="center" justify="space-between">
        <n-text depth="3" size="small">
          * Нажмите на ячейку, чтобы изменить статус, затем нажмите "Сохранить"
        </n-text>
        <n-tag v-if="hasChanges" type="warning" size="small">
          Есть несохраненные изменения
        </n-tag>
      </n-space>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NSpace, NCard, NIcon, NSpin, NAlert, NButton, NTag, NText, useMessage
} from 'naive-ui'
import {
  CheckmarkOutline as CheckmarkIcon,
  CloseOutline as CloseIcon,
  SaveOutline as SaveIcon
} from '@vicons/ionicons5'
import axios from 'axios'

const route = useRoute()
const { locale } = useI18n()
const message = useMessage()
const groupId = route.params.id

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const matrix = ref<any>(null)
const localAttendance = ref<Record<string, boolean>>({})
const originalAttendance = ref<Record<string, boolean>>({})

const hasChanges = computed(() => {
  return JSON.stringify(localAttendance.value) !== JSON.stringify(originalAttendance.value)
})

const formatShortDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'tk-TM', {
    day: '2-digit',
    month: '2-digit'
  })
}

const loadAttendance = async () => {
  loading.value = true
  error.value = null
  try {
    const matrixRes = await axios.get(`/api/v1/courses/attendance/by-group/${groupId}/`)
    matrix.value = matrixRes.data
    
    const attendance: Record<string, boolean> = {}
    if (matrix.value && matrix.value.attendance) {
      Object.keys(matrix.value.attendance).forEach(key => {
        attendance[key] = matrix.value.attendance[key].is_present
      })
    }
    
    matrix.value.students.forEach((s: any) => {
      matrix.value.lessons.forEach((l: any) => {
        const key = `${s.id}_${l.id}`
        if (attendance[key] === undefined) {
          attendance[key] = false
        }
      })
    })

    localAttendance.value = { ...attendance }
    originalAttendance.value = { ...attendance }
  } catch (err: any) {
    console.error('Error loading attendance:', err)
    error.value = err.response?.data?.detail || 'Failed to load attendance'
  } finally {
    loading.value = false
  }
}

const isStudentPresent = (studentId: number, lessonId: number) => {
  const key = `${studentId}_${lessonId}`
  return localAttendance.value[key] || false
}

const getAttendanceClass = (studentId: number, lessonId: number) => {
  return isStudentPresent(studentId, lessonId) ? 'present' : 'absent'
}

const toggleAttendance = (studentId: number, lessonId: number) => {
  const key = `${studentId}_${lessonId}`
  localAttendance.value[key] = !localAttendance.value[key]
}

const resetAttendance = () => {
  localAttendance.value = { ...originalAttendance.value }
}

const saveAttendanceChanges = async () => {
  saving.value = true
  try {
    const dataToSend = Object.keys(localAttendance.value)
      .filter(key => localAttendance.value[key] !== originalAttendance.value[key])
      .map(key => {
        const [studentId, lessonId] = key.split('_')
        return {
          student_id: parseInt(studentId),
          lesson_id: parseInt(lessonId),
          is_present: localAttendance.value[key]
        }
      })

    if (dataToSend.length === 0) {
      message.info('Нет изменений для сохранения')
      return
    }

    await axios.post('/api/v1/courses/attendance/bulk-save/', {
      group_id: groupId,
      attendance: dataToSend
    })

    originalAttendance.value = { ...localAttendance.value }
    message.success('Посещаемость успешно сохранена')
  } catch (err) {
    console.error('Error saving attendance:', err)
    message.error('Ошибка при сохранении посещаемости')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadAttendance()
})
</script>

<style scoped>
.loading-container, .error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.attendance-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #efeff5;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.attendance-table th,
.attendance-table td {
  border: 1px solid #efeff5;
  padding: 12px;
  text-align: center;
}

.attendance-table th {
  background-color: #f9f9fb;
  font-weight: 600;
}

.sticky-col {
  position: sticky;
  left: 0;
  background-color: white;
  z-index: 10;
  box-shadow: 2px 0 5px rgba(0,0,0,0.05);
}

.first-col {
  text-align: left !important;
  min-width: 250px;
  max-width: 300px;
}

.lesson-header {
  min-width: 80px;
}

.lesson-date {
  font-size: 0.8rem;
  color: #18a058;
}

.lesson-title {
  font-size: 0.7rem;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.student-name {
  font-weight: 500;
}

.attendance-cell {
  cursor: pointer;
  transition: background-color 0.2s;
  width: 80px;
}

.attendance-cell:hover {
  background-color: #f3f3f5;
}

.present {
  background-color: rgba(24, 160, 88, 0.05);
}

.absent {
  background-color: rgba(208, 48, 80, 0.05);
}

.attendance-cell :deep(.n-icon) {
  vertical-align: middle;
}
</style>

