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
    <n-card bordered :title="$t('cabinet.grades.examGrades') || 'Мои результаты экзаменов'">
      <div class="grades-table-wrapper">
        <table class="grades-table">
          <thead>
            <tr>
              <th v-for="(exam, idx) in examTemplate" :key="idx" colspan="5" class="exam-header">
                {{ $t('cabinet.examSettings.exam') }} {{ idx + 1 }} ({{ exam.weight }}%)
              </th>
              <th rowspan="2" class="total-header">Итого</th>
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
            <tr v-if="myData">
              <template v-for="(exam, eIdx) in myData.exams" :key="`exam-${eIdx}`">
                <td class="grade-cell">{{ exam.writing ?? '—' }}</td>
                <td class="grade-cell">{{ exam.listening ?? '—' }}</td>
                <td class="grade-cell">{{ exam.reading ?? '—' }}</td>
                <td class="grade-cell">{{ exam.speaking ?? '—' }}</td>
                <td class="grade-cell general-cell">{{ (exam.writing || 0) + (exam.listening || 0) + (exam.reading || 0) + (exam.speaking || 0) }}</td>
              </template>
              <td class="total-cell" :class="getTotalClass(myData.total_grade)">
                {{ myData.total_grade || '0' }} / 100
              </td>
            </tr>
            <tr v-else>
              <td :colspan="(examTemplate.length * 5) + 1">
                <n-empty description="Данные об оценках пока отсутствуют" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <n-space size="small" vertical>
          <n-text depth="3" size="small">
            * W - Writing (Письмо), L - Listening (Аудирование), R - Reading (Чтение), S - Speaking (Говорение)
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NSpace, NCard, NSpin, NAlert, NText, NEmpty
} from 'naive-ui'
import api from '@/services/api'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const authStore = useAuthStore()
const groupId = route.params.id

const loading = ref(true)
const error = ref<string | null>(null)
const myData = ref<any>(null)
const examTemplate = ref<any[]>([])

const loadGrades = async () => {
  loading.value = true
  error.value = null
  try {
    // We use the same teacher endpoint but we'll find our data there
    // Alternatively, we can use a student-specific endpoint if we have one
    const res = await api.get(`/courses/exam-grades/by-group/${groupId}/`)
    const studentId = authStore.user?.id
    myData.value = res.data.students.find((s: any) => s.id === studentId)
    
    // Extract template from first student if exists
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
  } catch (err: any) {
    console.error('Error loading grades:', err)
    error.value = 'Не удалось загрузить оценки'
  } finally {
    loading.value = false
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

<style scoped>
.loading-container, .error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.grades-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #efeff5;
}

.grades-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  background: white;
}

.grades-table th,
.grades-table td {
  border: 1px solid #efeff5;
  padding: 12px 8px;
  text-align: center;
}

.grades-table th {
  background-color: #f9f9fb;
  font-weight: 600;
}

.exam-header {
  background-color: #f0f7ff !important;
  color: #1890ff;
}

.comp-header {
  font-size: 0.75rem;
  color: #888;
}

.general-header {
  background-color: #e6f7ff !important;
  color: #0050b3 !important;
  font-weight: 700 !important;
}

.general-cell {
  background-color: #f6ffed;
  font-weight: 600;
  color: #18a058;
}

.total-header {
  background-color: #fff1f0 !important;
  color: #cf1322 !important;
  font-weight: 700 !important;
}

.total-cell {
  font-weight: 700;
  font-size: 1.1rem;
  background-color: #fafafa;
}

.total-cell.pass { color: #18a058; background-color: rgba(24, 160, 88, 0.05); }
.total-cell.fail { color: #d03050; background-color: rgba(208, 48, 80, 0.05); }
.total-cell.warning { color: #f0a020; background-color: rgba(240, 160, 32, 0.05); }

.grade-cell {
  min-width: 40px;
}
</style>
