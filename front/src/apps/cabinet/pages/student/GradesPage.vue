<template>
  <CabinetLayout>
    <n-space vertical size="large" class="grades-page">
      <div class="grades-header">
        <n-h1 style="margin-bottom: 4px;">{{ $t('cabinet.grades.title') }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.grades.description') }}</n-text>
      </div>

      <!-- Statistics Cards -->
      <n-grid v-if="!loading && !error && examGrades.length > 0" cols="1 s:2 m:4" responsive="screen" :x-gap="16" :y-gap="16">
        <n-gi>
          <n-card class="stat-card stat-primary">
            <n-statistic :label="$t('cabinet.grades.totalGrades')" :value="stats.total || 0">
              <template #prefix>
                <n-icon size="24" class="stat-icon-bg"><star-icon /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card class="stat-card stat-success">
            <n-statistic :label="$t('cabinet.grades.activeCourses')" :value="stats.activeCoursesGrades || 0">
              <template #prefix>
                <n-icon size="24" class="stat-icon-bg"><book-icon /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
      </n-grid>

      <!-- Filters -->
      <n-card bordered class="grades-filters">
        <n-grid cols="1 s:3" responsive="screen" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-space vertical size="small">
              <n-text depth="2" strong size="small">{{ $t('cabinet.grades.filterByCourse') }}</n-text>
              <n-select
                v-model:value="selectedCourseId"
                :options="courseOptions"
                placeholder="Все курсы"
                clearable
                @update:value="loadGrades"
              />
            </n-space>
          </n-gi>
          <n-gi>
            <n-space vertical size="small">
              <n-text depth="2" strong size="small">{{ $t('cabinet.grades.filterByGroup') }}</n-text>
              <n-select
                v-model:value="selectedGroupId"
                :options="groupOptions"
                placeholder="Все группы"
                clearable
                @update:value="loadGrades"
              />
            </n-space>
          </n-gi>
          <n-gi>
            <n-space vertical size="small">
              <n-text depth="2" strong size="small">{{ $t('cabinet.grades.filterByStatus') }}</n-text>
              <n-select
                v-model:value="selectedStatus"
                :options="statusOptions"
                placeholder="Все статусы"
                clearable
                @update:value="loadGrades"
              />
            </n-space>
          </n-gi>
        </n-grid>
      </n-card>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
        <n-text depth="3" style="display: block; margin-top: 10px;">{{ $t('common.loading') }}</n-text>
      </div>

      <div v-else-if="error" class="error-state">
        <n-alert type="error" :title="$t('common.error')" closable>
          <n-space vertical>
            {{ error }}
            <n-button @click="loadGrades" type="primary" size="small">
              {{ $t('common.retry') }}
            </n-button>
          </n-space>
        </n-alert>
      </div>

      <div v-else-if="examGrades.length === 0" class="empty-state">
        <n-empty :description="$t('cabinet.grades.noGrades')">
          <template #extra>
            <n-space vertical align="center">
              <n-text depth="3">{{ $t('cabinet.grades.noGradesDescription') }}</n-text>
              <n-text v-if="stats.total === 0" depth="3" strong>
                {{ $t('cabinet.grades.noGradesYet') }}
              </n-text>
            </n-space>
          </template>
        </n-empty>
      </div>

      <div v-else class="grades-content">
        <n-collapse :default-expanded-names="[]">
          <n-collapse-item
            v-for="examGroup in examGrades"
            :key="`exam-${examGroup.group_id}`"
            :name="`group-${examGroup.group_id}`"
            :title="`${examGroup.course_name} - ${examGroup.group_name}`"
          >
            <template #header-extra>
              <n-space align="center">
                <n-text v-if="examGroup.total_grade !== null && examGroup.total_grade !== undefined" strong type="primary" size="large">
                  {{ $t('cabinet.grades.totalGrade') }}: 
                  <n-tag :type="getGradeType(examGroup.total_grade)" size="large" strong round style="margin-left: 8px;">
                    {{ examGroup.total_grade }}
                  </n-tag>
                </n-text>
              </n-space>
                  </template>

            <n-card bordered>
              <n-data-table
                :columns="examColumns"
                :data="examGroup.exams"
                :pagination="false"
                :bordered="false"
              />
                </n-card>
          </n-collapse-item>
        </n-collapse>
      </div>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NH3, NText, NGrid, NGi, NCard, NStatistic, NIcon, 
  NSelect, NAlert, NEmpty, NSpin, NButton, NDivider, NTag, NCollapse, NCollapseItem, NDataTable
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { 
  StarOutline as StarIcon,
  BookOutline as BookIcon
} from '@vicons/ionicons5'
import { useCabinetGrades } from '@/composables/useCabinet'
import { useCabinetCourses } from '@/composables/useCabinet'

const { t } = useI18n()
const { loading: gradesLoading, error: gradesError, fetchGrades } = useCabinetGrades()
const { fetchCourses } = useCabinetCourses()

const selectedCourseId = ref<number | null>(null)
const selectedGroupId = ref<number | null>(null)
const selectedStatus = ref<string | null>(null)
const examGrades = ref<any[]>([])
const stats = ref<any>({})
const courses = ref<any[]>([])
const groups = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const courseOptions = computed(() => courses.value.map(c => ({ label: c.course_name, value: c.id })))
const groupOptions = computed(() => groups.value.map(g => ({ label: g.name, value: g.id })))
const statusOptions = [
  { label: t('cabinet.grades.active'), value: 'true' },
  { label: t('cabinet.grades.completed'), value: 'false' }
]

const getGradeType = (grade: number | string | null) => {
  if (grade === null || grade === undefined) return 'default'
  const numGrade = typeof grade === 'string' ? parseFloat(grade) : grade
  if (isNaN(numGrade)) return 'default'
  if (numGrade >= 90) return 'success'
  if (numGrade >= 80) return 'info'
  if (numGrade >= 70) return 'warning'
  return 'error'
}

const getExamAverage = (exam: any): string => {
  const values = [exam.writing, exam.listening, exam.reading, exam.speaking]
    .filter(v => v !== null && v !== undefined)
    .map(v => typeof v === 'string' ? parseFloat(v) : v) as number[]
  
  if (values.length === 0) return '—'
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length
  return avg.toFixed(1)
}

const examColumns: DataTableColumns<any> = [
  {
    title: t('cabinet.grades.exam'),
    key: 'exam_number',
    width: 80,
    render: (row) => `${row.exam_number} ${t('cabinet.grades.exam')}`
  },
  {
    title: t('cabinet.grades.writing'),
    key: 'writing',
    width: 100,
    align: 'center',
    render: (row) => row.writing !== null && row.writing !== undefined 
      ? h(NTag, { type: getGradeType(row.writing), bordered: false, round: true, size: 'small' }, { default: () => row.writing })
      : '—'
  },
  {
    title: t('cabinet.grades.listening'),
    key: 'listening',
    width: 100,
    align: 'center',
    render: (row) => row.listening !== null && row.listening !== undefined
      ? h(NTag, { type: getGradeType(row.listening), bordered: false, round: true, size: 'small' }, { default: () => row.listening })
      : '—'
  },
  {
    title: t('cabinet.grades.reading'),
    key: 'reading',
    width: 100,
    align: 'center',
    render: (row) => row.reading !== null && row.reading !== undefined
      ? h(NTag, { type: getGradeType(row.reading), bordered: false, round: true, size: 'small' }, { default: () => row.reading })
      : '—'
  },
  {
    title: t('cabinet.grades.speaking'),
    key: 'speaking',
    width: 100,
    align: 'center',
    render: (row) => row.speaking !== null && row.speaking !== undefined
      ? h(NTag, { type: getGradeType(row.speaking), bordered: false, round: true, size: 'small' }, { default: () => row.speaking })
      : '—'
  },
  {
    title: t('cabinet.grades.average'),
    key: 'average',
    width: 100,
    align: 'center',
    render: (row) => {
      const avg = row.average !== null && row.average !== undefined ? row.average : getExamAverage(row)
      return h(NText, { type: 'primary', strong: true }, { default: () => avg })
    }
  },
  {
    title: t('cabinet.grades.totalGrade'),
    key: 'total_grade',
    width: 120,
    align: 'center',
    render: (row) => row.total_grade !== null && row.total_grade !== undefined
      ? h(NTag, { type: getGradeType(row.total_grade), size: 'medium', strong: true, round: true }, { default: () => row.total_grade })
      : '—'
  }
]

const loadCoursesAndGroups = async () => {
  try {
    const data = await fetchCourses()
    courses.value = data.courses || []
    groups.value = data.courses || []
  } catch (err) {
    console.error('Error loading courses:', err)
  }
}

const loadGrades = async () => {
  loading.value = true
  error.value = null
  
  try {
    const params: any = {}
    if (selectedCourseId.value) params.courseId = selectedCourseId.value
    if (selectedGroupId.value) params.groupId = selectedGroupId.value
    if (selectedStatus.value !== null) params.isActive = selectedStatus.value === 'true'

    const data = await fetchGrades(params)
    
    if (!data) {
      examGrades.value = []
      stats.value = { total: 0, activeCoursesGrades: 0, completedCoursesGrades: 0 }
      return
    }
    
    examGrades.value = Array.isArray(data.exam_grades) ? data.exam_grades : []
    
    const totalExamGrades = examGrades.value.reduce((sum, group) => sum + group.exams.filter((e: any) => 
      e.writing !== null || e.listening !== null || e.reading !== null || e.speaking !== null
    ).length, 0)
    
    stats.value = {
      total: totalExamGrades,
      activeCoursesGrades: examGrades.value.length,
      completedCoursesGrades: 0,
    }
  } catch (err: any) {
    error.value = err.response?.data?.detail || err.message || 'Failed to load grades'
    examGrades.value = []
    stats.value = { total: 0, activeCoursesGrades: 0, completedCoursesGrades: 0 }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCoursesAndGroups()
  loadGrades()
})
</script>

<style scoped>
.grades-page {
  max-width: 1400px;
  margin: 0 auto;
}

.stat-icon-bg {
  padding: 8px;
  border-radius: 8px;
  margin-right: 8px;
}

.stat-primary .stat-icon-bg { background-color: rgba(102, 126, 234, 0.1); color: #667eea; }
.stat-success .stat-icon-bg { background-color: rgba(67, 233, 123, 0.1); color: #43e97b; }

.grade-component {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 8px;
  background-color: #f5f7f9;
  border-radius: 8px;
}

.exam-card {
  height: 100%;
  transition: transform 0.2s ease;
}

.exam-card:hover {
  transform: translateY(-4px);
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
