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
    <div class="attendance-table-wrapper">
      <table class="attendance-table">
        <thead>
          <tr>
            <th v-for="lesson in matrix?.lessons" :key="lesson.id" class="lesson-header">
              <div class="lesson-date">{{ formatShortDate(lesson.date) }}</div>
              <div class="lesson-title" :title="lesson.title">{{ lesson.title }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td 
              v-for="lesson in matrix?.lessons" 
              :key="lesson.id" 
              class="attendance-cell read-only"
              :class="getAttendanceClass(lesson.id)"
            >
              <n-icon v-if="isStudentPresent(lesson.id)" color="#18a058" size="20">
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
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NCard, NIcon, NSpin, NAlert
} from 'naive-ui'
import {
  CheckmarkOutline as CheckmarkIcon,
  CloseOutline as CloseIcon
} from '@vicons/ionicons5'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const { locale } = useI18n()
const authStore = useAuthStore()
const groupId = route.params.id

const loading = ref(true)
const error = ref<string | null>(null)
const matrix = ref<any>(null)
const myAttendance = ref<Record<string, boolean>>({})

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
    const studentId = authStore.user?.id
    if (!studentId) throw new Error('User not found')

    const matrixRes = await axios.get(`/api/v1/courses/attendance/by-group/${groupId}/`)
    matrix.value = matrixRes.data
    
    const attendance: Record<string, boolean> = {}
    if (matrix.value && matrix.value.attendance) {
      Object.keys(matrix.value.attendance).forEach(key => {
        const [sId, lId] = key.split('_')
        if (parseInt(sId) === studentId) {
          attendance[lId] = matrix.value.attendance[key].is_present
        }
      })
    }
    myAttendance.value = attendance
  } catch (err: any) {
    console.error('Error loading attendance:', err)
    error.value = err.response?.data?.detail || 'Failed to load attendance'
  } finally {
    loading.value = false
  }
}

const isStudentPresent = (lessonId: number) => {
  return myAttendance.value[lessonId.toString()] || false
}

const getAttendanceClass = (lessonId: number) => {
  return isStudentPresent(lessonId) ? 'present' : 'absent'
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
  max-width: 100px;
}

.present {
  background-color: rgba(24, 160, 88, 0.05);
}

.absent {
  background-color: rgba(208, 48, 80, 0.05);
}
</style>

