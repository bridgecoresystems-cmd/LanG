<template>
  <div v-if="loading" class="loading-container">
    <n-spin size="large" />
  </div>

  <div v-else-if="error" class="error-container">
    <n-alert type="error" :title="$t('common.error')">
      {{ error }}
    </n-alert>
  </div>

  <n-space v-else vertical size="large">
    <n-card bordered>
      <template #header>
        <n-space align="center" justify="space-between">
          <n-space align="center">
            <span>{{ $t('cabinet.grades.examGrades') || 'Экзаменационные оценки' }}</span>
            <n-tag type="info" :bordered="false" size="small">
              {{ groupName }}
            </n-tag>
          </n-space>
          <n-space>
            <n-button 
              v-if="hasChanges" 
              size="small" 
              @click="resetGrades"
            >
              {{ $t('common.cancel') || 'Отмена' }}
            </n-button>
            <n-button 
              type="primary" 
              size="small" 
              :loading="saving"
              :disabled="!hasChanges"
              @click="saveGrades"
            >
              <template #icon><n-icon><save-icon /></n-icon></template>
              {{ $t('common.save') || 'Сохранить всё' }}
            </n-button>
          </n-space>
        </n-space>
      </template>

      <div class="grades-table-wrapper">
        <table class="grades-table">
          <thead>
            <tr>
              <th rowspan="2" class="sticky-col first-col">{{ $t('cabinet.student.fullName') }}</th>
              <th v-for="(exam, idx) in examTemplate" :key="idx" colspan="5" class="exam-header">
                {{ $t('cabinet.examSettings.exam') }} {{ idx + 1 }} ({{ exam.weight }}%)
              </th>
              <th rowspan="2" class="total-header">Total</th>
            </tr>
            <tr>
              <template v-for="(exam, idx) in examTemplate" :key="`comp-${idx}`">
                <th class="comp-header">W ({{ exam.writing_max }})</th>
                <th class="comp-header">L ({{ exam.listening_max }})</th>
                <th class="comp-header">R ({{ exam.reading_max }})</th>
                <th class="comp-header">S ({{ exam.speaking_max }})</th>
                <th class="comp-header general-header">G</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.id">
              <td class="sticky-col first-col student-name">
                {{ student.full_name }}
              </td>
              <template v-for="(exam, eIdx) in student.exams" :key="`exam-${eIdx}`">
                <td class="grade-cell"><input v-model.number="exam.writing" type="number" min="0" :max="exam.writing_max" class="grade-input" @input="markChanged" /></td>
                <td class="grade-cell"><input v-model.number="exam.listening" type="number" min="0" :max="exam.listening_max" class="grade-input" @input="markChanged" /></td>
                <td class="grade-cell"><input v-model.number="exam.reading" type="number" min="0" :max="exam.reading_max" class="grade-input" @input="markChanged" /></td>
                <td class="grade-cell"><input v-model.number="exam.speaking" type="number" min="0" :max="exam.speaking_max" class="grade-input" @input="markChanged" /></td>
                <td class="grade-cell general-cell">{{ (exam.writing || 0) + (exam.listening || 0) + (exam.reading || 0) + (exam.speaking || 0) }}</td>
              </template>
              <td class="total-cell" :class="getTotalClass(student.total_grade)">
                {{ student.total_grade || '0' }} / 100
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <n-space size="small" vertical>
          <n-text depth="3" size="small">
            * W - Writing, L - Listening, R - Reading, S - Speaking
          </n-text>
          <n-text depth="3" size="small">
            * {{ $t('cabinet.examSettings.totalWeight') }}: 100%
          </n-text>
        </n-space>
      </template>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  NSpace, NCard, NIcon, NSpin, NAlert, NButton, NTag, NText, useMessage
} from 'naive-ui'
import {
  SaveOutline as SaveIcon
} from '@vicons/ionicons5'
import api from '@/services/api'

const route = useRoute()
const message = useMessage()
const groupId = route.params.id

const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const students = ref<any[]>([])
const examTemplate = ref<any[]>([])
const groupName = ref('')
const hasChanges = ref(false)
let originalData = ''

const markChanged = () => {
  hasChanges.value = true
}

const loadGrades = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`/courses/exam-grades/by-group/${groupId}/`)
    students.value = res.data.students
    groupName.value = res.data.group_name
    // Extract template from first student if exists, otherwise it should be in response
    if (res.data.students.length > 0) {
      examTemplate.value = res.data.students[0].exams.map((e: any) => ({
        name: e.name,
        writing_max: e.writing_max,
        listening_max: e.listening_max,
        reading_max: e.reading_max,
        speaking_max: e.speaking_max,
        weight: e.weight
      }))
    }
    originalData = JSON.stringify(res.data.students)
    hasChanges.value = false
  } catch (err: any) {
    console.error('Error loading grades:', err)
    error.value = err.response?.data?.detail || 'Не удалось загрузить оценки'
  } finally {
    loading.value = false
  }
}

const resetGrades = () => {
  students.value = JSON.parse(originalData)
  hasChanges.value = false
}

const saveGrades = async () => {
  saving.value = true
  try {
    const payload = {
      group_id: parseInt(groupId as string),
      grades: students.value.map(s => ({
        student_id: s.id,
        exams: s.exams.map((e: any) => ({
          writing: e.writing || null,
          listening: e.listening || null,
          reading: e.reading || null,
          speaking: e.speaking || null
        }))
      }))
    }

    await api.post('/courses/exam-grades/bulk-update/', payload)
    message.success('Оценки успешно сохранены')
    await loadGrades() // Refresh to get updated totals
  } catch (err) {
    console.error('Error saving grades:', err)
    message.error('Ошибка при сохранении оценок')
  } finally {
    saving.value = false
  }
}

const getTotalClass = (total: number) => {
  if (!total) return ''
  if (total >= 70) return 'pass'
  if (total < 50) return 'fail'
  return 'warning'
}

onMounted(() => {
  loadGrades()
})
</script>

<script lang="ts">
export default {
  name: 'GradesTab'
}
</script>

<style scoped>
.loading-container, .error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.grades-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #efeff5;
}

.grades-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  background: white;
}

.grades-table th,
.grades-table td {
  border: 1px solid #efeff5;
  padding: 8px;
  text-align: center;
}

.grades-table th {
  background-color: #f9f9fb;
  font-weight: 600;
  white-space: nowrap;
}

.exam-header {
  background-color: #f0f7ff !important;
  color: #1890ff;
  border-bottom: 2px solid #1890ff;
}

.comp-header {
  font-size: 0.7rem;
  color: #888;
  width: 40px;
}

.general-header {
  background-color: #e6f7ff !important;
  color: #0050b3 !important;
  font-weight: 700 !important;
}

.general-cell {
  background-color: #fafafa;
  font-weight: 600;
  color: #18a058;
}

.total-header {
  background-color: #fff1f0 !important;
  color: #cf1322 !important;
  font-weight: 700 !important;
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
  min-width: 200px;
}

.student-name {
  font-weight: 500;
}

.grade-input {
  width: 45px;
  border: 1px solid transparent;
  text-align: center;
  padding: 4px 2px;
  border-radius: 4px;
  transition: all 0.2s;
  background: #f9f9fb;
}

.grade-input:focus {
  outline: none;
  border-color: #18a058;
  background: white;
  box-shadow: 0 0 0 2px rgba(24, 160, 88, 0.1);
}

/* Remove arrows from number input */
.grade-input::-webkit-inner-spin-button,
.grade-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.total-cell {
  font-weight: 700;
  background-color: #fafafa;
  min-width: 60px;
}

.total-cell.pass { color: #18a058; background-color: rgba(24, 160, 88, 0.05); }
.total-cell.fail { color: #d03050; background-color: rgba(208, 48, 80, 0.05); }
.total-cell.warning { color: #f0a020; background-color: rgba(240, 160, 32, 0.05); }

.grade-cell {
  padding: 4px !important;
  width: 50px;
}
</style>
