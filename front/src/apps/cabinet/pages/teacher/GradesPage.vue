<template>
  <CabinetLayout>
    <n-space vertical size="large" class="grades-page">
      <div class="grades-header">
        <n-h1 style="margin-bottom: 4px;">{{ $t('cabinet.grades.title') }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.grades.description') }}</n-text>
      </div>

      <!-- Filter -->
      <n-card bordered class="filters-card">
        <n-space justify="space-between" align="end" wrap>
          <n-space vertical size="small" style="min-width: 300px; flex: 1;">
            <n-text depth="2" strong size="small">{{ $t('cabinet.grades.filterByGroup') }}</n-text>
            <n-select
              v-model:value="selectedGroupId"
              :options="groupOptions"
              :placeholder="$t('cabinet.grades.allGroups')"
              clearable
              @update:value="onFilterChange"
            />
          </n-space>
          <n-button
            type="primary"
            :disabled="!selectedGroupId || saving"
            :loading="saving"
            @click="saveAllGrades"
          >
            <template #icon>
              <n-icon><save-icon /></n-icon>
            </template>
            {{ $t('admin.actions.save') }}
          </n-button>
        </n-space>
      </n-card>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <div v-else-if="error" class="error-state">
        <n-alert type="error" :title="$t('common.error')" closable>
          {{ error }}
        </n-alert>
      </div>

      <n-card bordered v-else content-style="padding: 0; overflow: hidden;">
        <div v-if="studentsWithGrades.length === 0" class="empty-state">
          <n-empty :description="$t('cabinet.grades.noStudents')" />
        </div>
        
        <div v-else class="grades-table-wrapper">
          <table class="grades-table">
            <thead>
              <tr>
                <th class="student-name-col">{{ $t('admin.table.fullName') }}</th>
                <th 
                  v-for="examNum in 4" 
                  :key="examNum"
                  class="exam-header"
                  :class="{ 'expanded': expandedExam === examNum }"
                  @click="toggleExam(examNum)"
                >
                  <n-space justify="center" align="center" size="small">
                    <span>{{ examNum }} {{ $t('cabinet.grades.exam') }}</span>
                    <n-icon size="14">
                      <component :is="expandedExam === examNum ? ChevronUpIcon : ChevronDownIcon" />
                    </n-icon>
                  </n-space>
                  <div v-if="expandedExam === examNum" class="exam-subheaders">
                    <div class="exam-subheader">{{ $t('cabinet.grades.writing') }}</div>
                    <div class="exam-subheader">{{ $t('cabinet.grades.listening') }}</div>
                    <div class="exam-subheader">{{ $t('cabinet.grades.reading') }}</div>
                    <div class="exam-subheader">{{ $t('cabinet.grades.speaking') }}</div>
                  </div>
                </th>
                <th class="total-grade-col">{{ $t('cabinet.grades.totalGrade') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in studentsWithGrades" :key="student.id">
                <td class="student-name-cell">
                  <n-text strong>{{ student.full_name }}</n-text>
                </td>
                <td 
                  v-for="examNum in 4" 
                  :key="examNum"
                  class="exam-cell"
                  :class="{ 'expanded': expandedExam === examNum }"
                >
                  <template v-if="expandedExam === examNum">
                    <div class="exam-components">
                      <n-input-number
                        v-model:value="student.exams[examNum - 1].writing"
                        :min="0"
                        :max="100"
                        size="small"
                        placeholder="W"
                        :show-button="false"
                      />
                      <n-input-number
                        v-model:value="student.exams[examNum - 1].listening"
                        :min="0"
                        :max="100"
                        size="small"
                        placeholder="L"
                        :show-button="false"
                      />
                      <n-input-number
                        v-model:value="student.exams[examNum - 1].reading"
                        :min="0"
                        :max="100"
                        size="small"
                        placeholder="R"
                        :show-button="false"
                      />
                      <n-input-number
                        v-model:value="student.exams[examNum - 1].speaking"
                        :min="0"
                        :max="100"
                        size="small"
                        placeholder="S"
                        :show-button="false"
                      />
                    </div>
                  </template>
                  <template v-else>
                    <div class="exam-average" @click.stop="toggleExam(examNum)">
                      <n-text strong>{{ getExamAverage(student.exams[examNum - 1]) }}</n-text>
                    </div>
                  </template>
                </td>
                <td class="total-grade-cell">
                  <n-text type="primary" strong size="large">{{ calculateTotalGrade(student) }}</n-text>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </n-card>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NGrid, NGi, NCard, NSelect, NButton, NIcon, 
  NInputNumber, NSpin, NAlert, NEmpty, NDivider
} from 'naive-ui'
import { 
  SaveOutline as SaveIcon,
  ChevronDownOutline as ChevronDownIcon,
  ChevronUpOutline as ChevronUpIcon
} from '@vicons/ionicons5'
import { useCabinetCourses, useTeacherCabinet } from '@/composables/useCabinet'
import { useActivityLog } from '@/composables/useActivityLog'

const route = useRoute()
const { t } = useI18n()
const { fetchCourses } = useCabinetCourses()
const { fetchTeacherStudents, fetchExamGrades, saveExamGrades } = useTeacherCabinet()
const { logActivity } = useActivityLog()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const groups = ref<any[]>([])
const selectedGroupId = ref<number | null>(null)
const students = ref<any[]>([])
const expandedExam = ref<number | null>(null)

interface ExamGrade {
  writing: number | null
  listening: number | null
  reading: number | null
  speaking: number | null
}

interface StudentWithGrades {
  id: number
  full_name: string
  exams: ExamGrade[]
}

const studentsWithGrades = ref<StudentWithGrades[]>([])

const groupOptions = computed(() => groups.value.map(g => ({ label: g.name, value: g.id })))

const initializeStudentExams = (student: any): StudentWithGrades => {
  const fullName = student.full_name || 
                   `${student.first_name || ''} ${student.last_name || ''}`.trim() || 
                   student.username || 
                   `Student ${student.id}`
  
  return {
    id: student.id,
    full_name: fullName,
    exams: [
      { writing: null, listening: null, reading: null, speaking: null },
      { writing: null, listening: null, reading: null, speaking: null },
      { writing: null, listening: null, reading: null, speaking: null },
      { writing: null, listening: null, reading: null, speaking: null }
    ]
  }
}

const toggleExam = (examNum: number) => {
  if (expandedExam.value === examNum) {
    expandedExam.value = null
  } else {
    expandedExam.value = examNum
  }
}

const getExamAverage = (exam: ExamGrade): string => {
  const values = [exam.writing, exam.listening, exam.reading, exam.speaking].filter(v => v !== null) as number[]
  if (values.length === 0) return '—'
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length
  return avg.toFixed(1)
}

const calculateTotalGrade = (student: StudentWithGrades): string => {
  const exam1 = getExamAverage(student.exams[0])
  const exam2 = getExamAverage(student.exams[1])
  const exam3 = getExamAverage(student.exams[2])
  const exam4 = getExamAverage(student.exams[3])
  
  if (exam1 === '—' && exam2 === '—' && exam3 === '—' && exam4 === '—') {
    return '—'
  }
  
  let total = 0
  if (exam1 !== '—') total += parseFloat(exam1) * 0.2
  if (exam2 !== '—') total += parseFloat(exam2) * 0.2
  if (exam3 !== '—') total += parseFloat(exam3) * 0.2
  if (exam4 !== '—') total += parseFloat(exam4) * 0.4
  
  return total.toFixed(1)
}

const saveAllGrades = async () => {
  if (!selectedGroupId.value || studentsWithGrades.value.length === 0) return
  
  saving.value = true
  error.value = null
  
  try {
    const gradesData = studentsWithGrades.value.map(student => ({
      student_id: student.id,
      exams: student.exams.map(exam => ({
        writing: exam.writing,
        listening: exam.listening,
        reading: exam.reading,
        speaking: exam.speaking
      }))
    }))
    
    await saveExamGrades(selectedGroupId.value, gradesData)
    
    const groupName = groups.value.find(g => g.id === selectedGroupId.value)?.name || 'group'
    logActivity(
      'update',
      `Saved exam grades for group "${groupName}"`,
      'Group',
      selectedGroupId.value,
      groupName
    )
  } catch (err) {
    console.error('Failed to save grades:', err)
    error.value = 'Failed to save grades. Please try again.'
  } finally {
    saving.value = false
  }
}

const loadGroups = async () => {
  try {
    const data = await fetchCourses(true)
    groups.value = data.courses || []
  } catch (err) {
    console.error('Failed to load groups:', err)
    error.value = 'Failed to load groups'
  }
}

const onFilterChange = async () => {
  if (!selectedGroupId.value) {
    students.value = []
    studentsWithGrades.value = []
    return
  }

  loading.value = true
  error.value = null
  
  try {
    const studentsData = await fetchTeacherStudents(selectedGroupId.value)
    const studentsList = Array.isArray(studentsData) ? studentsData : (studentsData.students || studentsData.results || [])
    
    if (!Array.isArray(studentsList) || studentsList.length === 0) {
      students.value = []
      studentsWithGrades.value = []
      return
    }
    
    students.value = studentsList
    
    let examGradesData: any = null
    try {
      examGradesData = await fetchExamGrades(selectedGroupId.value)
    } catch (gradesErr: any) {
      examGradesData = null
    }
    
    const gradesByStudent = new Map<number, any>()
    
    if (examGradesData && examGradesData.students && Array.isArray(examGradesData.students)) {
      examGradesData.students.forEach((studentData: any) => {
        if (studentData.id) {
          gradesByStudent.set(studentData.id, studentData)
        }
      })
    }
    
    studentsWithGrades.value = studentsList.map((student: any) => {
      const studentGrades = gradesByStudent.get(student.id)
      
      if (studentGrades && studentGrades.exams && Array.isArray(studentGrades.exams) && studentGrades.exams.length === 4) {
        return {
          id: student.id,
          full_name: student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username,
          exams: studentGrades.exams.map((exam: any) => ({
            writing: exam.writing !== null && exam.writing !== undefined ? Number(exam.writing) : null,
            listening: exam.listening !== null && exam.listening !== undefined ? Number(exam.listening) : null,
            reading: exam.reading !== null && exam.reading !== undefined ? Number(exam.reading) : null,
            speaking: exam.speaking !== null && exam.speaking !== undefined ? Number(exam.speaking) : null
          }))
        }
      } else {
        return initializeStudentExams(student)
      }
    })
  } catch (err: any) {
    console.error('Error loading data:', err)
    error.value = err.response?.data?.detail || err.message || 'Failed to load data'
    students.value = []
    studentsWithGrades.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  logActivity('view', 'View grades page')
  if (route.query.group_id) {
    selectedGroupId.value = parseInt(route.query.group_id as string)
  }
  await loadGroups()
  if (selectedGroupId.value) {
    await onFilterChange()
  }
})
</script>

<style scoped>
.grades-page {
  max-width: 1400px;
  margin: 0 auto;
}

.grades-table-wrapper {
  overflow-x: auto;
  width: 100%;
}

.grades-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.grades-table thead {
  background-color: #f9fafb;
}

.grades-table th {
  padding: 12px 16px;
  text-align: center;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: #666;
  border-bottom: 2px solid #efeff5;
}

.grades-table td {
  padding: 12px 16px;
  text-align: center;
  border-bottom: 1px solid #efeff5;
}

.student-name-col, .student-name-cell {
  min-width: 200px;
  text-align: left !important;
  position: sticky;
  left: 0;
  background: white;
  z-index: 5;
}

.exam-header {
  min-width: 120px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.exam-header:hover {
  background-color: #f3f3f5;
}

.exam-subheaders {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #efeff5;
}

.exam-subheader {
  font-size: 0.65rem;
  color: #999;
}

.exam-cell.expanded {
  min-width: 240px;
}

.exam-average {
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}

.exam-average:hover {
  background-color: #f3f3f5;
}

.exam-components {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.total-grade-col, .total-grade-cell {
  min-width: 100px;
  background-color: #f9fafb;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
