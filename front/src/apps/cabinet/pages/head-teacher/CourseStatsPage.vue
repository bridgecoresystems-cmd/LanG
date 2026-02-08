<template>
  <CabinetLayout>
    <n-space vertical size="large" class="course-stats-page">
      <div class="page-header">
        <n-space justify="space-between" align="center">
          <div>
            <n-space align="center" :size="12">
              <n-button circle quaternary @click="$router.back()">
                <template #icon><n-icon><arrow-back-icon /></n-icon></template>
              </n-button>
              <div>
                <n-h1 style="margin-bottom: 4px;">{{ courseData?.name || $t('cabinet.courses.statistics') }}</n-h1>
                <n-text depth="3">
                  {{ courseData?.language }} - {{ courseData?.level }}
                </n-text>
              </div>
            </n-space>
          </div>
        </n-space>
      </div>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <div v-else-if="error" class="error-state">
        <n-alert type="error" :title="$t('common.error')" closable>
          {{ error }}
        </n-alert>
      </div>

      <div v-else-if="statsData">
        <!-- Statistics Table -->
        <n-card bordered>
          <template #header>
            <n-text strong>{{ $t('cabinet.courses.examStatistics') }}</n-text>
          </template>
          <n-data-table
            :columns="tableColumns"
            :data="statsData.groups"
            :bordered="true"
            :single-line="false"
            class="stats-table"
          />
        </n-card>


        <!-- Chart Section -->
        <n-card bordered v-if="hasChartData">
          <template #header>
            <n-text strong>{{ $t('cabinet.courses.progressChart') }}</n-text>
          </template>
          <div class="chart-container">
            <canvas ref="chartCanvas" id="progressChart"></canvas>
          </div>
        </n-card>
      </div>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, h } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NCard, NDataTable, NButton, NIcon, 
  NSpin, NAlert, DataTableColumns
} from 'naive-ui'
import { ArrowBackOutline as ArrowBackIcon } from '@vicons/ionicons5'
import { headTeacherApi } from '@/composables/useHeadTeacherApi'

const route = useRoute()
const { t } = useI18n()

const loading = ref(false)
const error = ref<string | null>(null)
const courseData = ref<any>(null)
const statsData = ref<any>(null)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: any = null

const tableColumns = computed<DataTableColumns<any>>(() => {
  const columns: DataTableColumns<any> = [
    {
      title: t('cabinet.courses.groupName'),
      key: 'name',
      width: 250,
      render(row) {
        return h(NText, { strong: true }, { default: () => row.name })
      }
    }
  ]

  // Add exam columns (1-4)
  for (let examNum = 1; examNum <= 4; examNum++) {
    columns.push({
      title: `${t('cabinet.courses.exam')} ${examNum}`,
      key: `exam_${examNum}`,
      width: 120,
      align: 'center',
      render(row) {
        const avg = row.exam_averages[examNum]
        if (avg === null || avg === undefined) {
          return h(NText, { depth: 3 }, { default: () => '—' })
        }
        return h(NText, { strong: true, style: { fontSize: '16px' } }, { 
          default: () => avg.toFixed(2) 
        })
      }
    })
  }

  return columns
})

const hasChartData = computed(() => {
  if (!statsData.value) return false
  const groupsWithData = statsData.value.groups.filter((group: any) => 
    Object.values(group.exam_averages).some((avg: any) => avg !== null && avg !== undefined)
  )
  return groupsWithData.length > 0
})

const loadStatistics = async () => {
  loading.value = true
  error.value = null
  try {
    const courseId = route.params.id as string
    const response = await headTeacherApi.get(`/courses/head-teacher/courses/${courseId}/statistics/`)
    courseData.value = response.data.course
    statsData.value = response.data
    
    // Draw chart after data is loaded
    await nextTick()
    setTimeout(() => {
      drawChart()
    }, 100)
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Failed to load statistics'
    console.error('Error loading statistics:', err)
  } finally {
    loading.value = false
  }
}

const drawChart = async () => {
  if (!chartCanvas.value || !statsData.value) {
    return
  }

  const canvas = chartCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  // Filter groups with data
  const groups = statsData.value.groups.filter((group: any) => 
    Object.values(group.exam_averages).some((avg: any) => avg !== null && avg !== undefined && avg > 0)
  )

  if (groups.length === 0) {
    return
  }

  // Wait for container to be ready
  await nextTick()
  
  // Set canvas size
  const container = canvas.parentElement
  if (!container) {
    return
  }
  
  const containerWidth = container.clientWidth || 800
  canvas.width = containerWidth
  canvas.height = 400

  const padding = { top: 40, right: 120, bottom: 60, left: 60 }
  const chartWidth = canvas.width - padding.left - padding.right
  const chartHeight = canvas.height - padding.top - padding.bottom

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw axes
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, padding.top + chartHeight)
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
  ctx.stroke()

  // Find max value for scaling
  let maxValue = 0
  groups.forEach((group: any) => {
    Object.values(group.exam_averages).forEach((avg: any) => {
      if (avg !== null && avg !== undefined && avg > maxValue) {
        maxValue = avg
      }
    })
  })
  if (maxValue === 0) maxValue = 100 // Default to 100 if no data
  maxValue = Math.ceil(maxValue / 10) * 10 // Round up to nearest 10

  // Draw Y-axis labels
  ctx.fillStyle = '#666'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= 5; i++) {
    const value = (maxValue / 5) * i
    const y = padding.top + chartHeight - (chartHeight / 5) * i
    ctx.fillText(value.toFixed(0), padding.left - 10, y)
  }

  // Draw X-axis labels (exam numbers)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const examNumbers = [1, 2, 3, 4]

  examNumbers.forEach((examNum, examIndex) => {
    const examSectionWidth = chartWidth / examNumbers.length
    const x = padding.left + (examSectionWidth * examIndex) + (examSectionWidth / 2)
    ctx.fillText(`${t('cabinet.courses.exam')} ${examNum}`, x, padding.top + chartHeight + 10)
  })

  // Draw bars (rectangles) for each group
  const colors = ['#18a058', '#2080f0', '#f0a020', '#d03050', '#722ed1', '#eb2f96']
  const barWidth = Math.min(30, (chartWidth / examNumbers.length) / (groups.length + 1))
  
  groups.forEach((group: any, groupIndex: number) => {
    const color = colors[groupIndex % colors.length]
    
    examNumbers.forEach((examNum, examIndex) => {
      const avg = group.exam_averages[examNum]
      if (avg !== null && avg !== undefined && avg > 0) {
        const examSectionWidth = chartWidth / examNumbers.length
        const groupSpacing = examSectionWidth / (groups.length + 1)
        const x = padding.left + (examSectionWidth * examIndex) + (groupSpacing * (groupIndex + 1)) - (barWidth / 2)
        const barHeight = (avg / maxValue) * chartHeight
        const y = padding.top + chartHeight - barHeight

        // Draw rectangle (bar)
        ctx.fillStyle = color
        ctx.fillRect(x, y, barWidth, barHeight)

        // Draw value on top of bar
        ctx.fillStyle = '#333'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(avg.toFixed(2), x + barWidth / 2, y - 2)
      }
    })

    // Draw legend
    const legendX = padding.left + chartWidth + 20
    const legendY = padding.top + groupIndex * 25
    ctx.fillStyle = color
    ctx.fillRect(legendX, legendY - 6, 12, 12)
    ctx.fillStyle = '#333'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(group.name, legendX + 18, legendY)
  })
}

let resizeTimeout: ReturnType<typeof setTimeout>
const handleResize = () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    drawChart()
  }, 100)
}

onMounted(() => {
  loadStatistics()
  
  // Redraw chart on window resize with debounce
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearTimeout(resizeTimeout)
  if (chartInstance) {
    chartInstance = null
  }
})
</script>

<style scoped>
.course-stats-page {
  max-width: 1400px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}

.stats-table :deep(.n-data-table-th) {
  background-color: #f5f5f5;
  font-weight: 600;
}

.stats-table :deep(.n-data-table-td) {
  padding: 16px;
}

.course-average-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.course-average-card :deep(.n-card__content) {
  color: white;
}

.course-average-card :deep(.n-statistic-label) {
  color: rgba(255, 255, 255, 0.8);
}

.course-average-card :deep(.n-statistic-value) {
  color: white;
}

.chart-container {
  width: 100%;
  height: 400px;
  position: relative;
}

#progressChart {
  width: 100%;
  height: 100%;
}
</style>
