<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__top">
        <NButton circle secondary @click="$router.back()">
          <template #icon><NIcon><component :is="ArrowBackIcon" /></NIcon></template>
        </NButton>
        <div>
          <NH2 class="page-header__title">{{ courseData?.name || 'Статистика курса' }}</NH2>
          <p class="page-header__subtitle">{{ courseData?.language }} - {{ courseData?.level }}</p>
        </div>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <NSpin size="large" />
    </div>

    <NAlert v-else-if="error" type="error" closable>{{ error }}</NAlert>

    <div v-else-if="statsData" class="space-y-6">
      <!-- Statistics Table -->
      <NCard bordered class="cabinet-card">
        <template #header>
          <NText strong>Средние баллы по группам</NText>
        </template>
        <NDataTable
          :columns="tableColumns"
          :data="statsData.groups"
          :bordered="false"
          class="stats-table"
        />
      </NCard>

      <!-- Chart Section -->
      <NCard bordered class="cabinet-card" v-if="hasChartData">
        <template #header>
          <NText strong>График успеваемости</NText>
        </template>
        <div class="chart-container">
          <canvas ref="chartCanvas" id="progressChart"></canvas>
        </div>
      </NCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, h } from 'vue'
import { useRoute } from 'vue-router'
import { 
  NSpace, NH2, NText, NCard, NDataTable, NButton, NIcon, 
  NSpin, NAlert, type DataTableColumns 
} from 'naive-ui'
import { ChevronBackOutline as ArrowBackIcon } from '@vicons/ionicons5'
import { useCabinetGroups } from '~/composables/useCabinetGroups'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const groupsApi = useCabinetGroups()

const loading = ref(false)
const error = ref<string | null>(null)
const courseData = ref<any>(null)
const statsData = ref<any>(null)
const chartCanvas = ref<HTMLCanvasElement | null>(null)

const tableColumns = computed<DataTableColumns<any>>(() => {
  const columns: DataTableColumns<any> = [
    {
      title: 'Группа',
      key: 'name',
      render(row) {
        return h(NText, { strong: true }, { default: () => row.name })
      }
    },
    {
      title: 'Учитель',
      key: 'teacher',
      render(row) {
        return h(NText, { depth: 3 }, { default: () => row.teacher || '—' })
      }
    }
  ]

  // Add exam columns (1-4)
  for (let examNum = 1; examNum <= 4; examNum++) {
    columns.push({
      title: `Экзамен ${examNum}`,
      key: `exam_${examNum}`,
      align: 'center',
      render(row) {
        const avg = row.exam_averages[examNum]
        if (avg === null || avg === undefined) {
          return h(NText, { depth: 3 }, { default: () => '—' })
        }
        return h(NText, { strong: true, class: 'text-lg' }, { 
          default: () => avg.toFixed(2) 
        })
      }
    })
  }

  return columns
})

const hasChartData = computed(() => {
  if (!statsData.value) return false
  return statsData.value.groups.some((group: any) => 
    Object.values(group.exam_averages).some((avg: any) => avg !== null && avg !== undefined)
  )
})

const loadStatistics = async () => {
  loading.value = true
  error.value = null
  try {
    const courseId = route.params.id as string
    // This endpoint needs to be implemented on the backend
    // For now using a mock or assuming it will be added to cabinetRoutes
    const { data, error: apiError } = await (groupsApi as any).getCourseStats(courseId)
    if (apiError) throw apiError
    
    courseData.value = data.course
    statsData.value = data
    
    await nextTick()
    setTimeout(() => {
      drawChart()
    }, 100)
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки статистики'
  } finally {
    loading.value = false
  }
}

const drawChart = () => {
  if (!chartCanvas.value || !statsData.value) return

  const canvas = chartCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const groups = statsData.value.groups.filter((group: any) => 
    Object.values(group.exam_averages).some((avg: any) => avg !== null && avg !== undefined && avg > 0)
  )

  if (groups.length === 0) return

  const container = canvas.parentElement
  if (!container) return
  
  canvas.width = container.clientWidth
  canvas.height = 400

  const padding = { top: 40, right: 120, bottom: 60, left: 60 }
  const chartWidth = canvas.width - padding.left - padding.right
  const chartHeight = canvas.height - padding.top - padding.bottom

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Axes
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, padding.top + chartHeight)
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
  ctx.stroke()

  let maxValue = 100
  groups.forEach((group: any) => {
    Object.values(group.exam_averages).forEach((avg: any) => {
      if (avg > maxValue) maxValue = avg
    })
  })
  maxValue = Math.ceil(maxValue / 10) * 10

  // Y-axis
  ctx.fillStyle = '#666'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= 5; i++) {
    const value = (maxValue / 5) * i
    const y = padding.top + chartHeight - (chartHeight / 5) * i
    ctx.fillText(value.toFixed(0), padding.left - 10, y)
  }

  // X-axis
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const examNumbers = [1, 2, 3, 4]
  examNumbers.forEach((examNum, examIndex) => {
    const sectionWidth = chartWidth / examNumbers.length
    const x = padding.left + (sectionWidth * examIndex) + (sectionWidth / 2)
    ctx.fillText(`Экзамен ${examNum}`, x, padding.top + chartHeight + 10)
  })

  // Bars
  const colors = ['#18a058', '#2080f0', '#f0a020', '#d03050', '#722ed1', '#eb2f96']
  const barWidth = Math.min(30, (chartWidth / examNumbers.length) / (groups.length + 1))
  
  groups.forEach((group: any, groupIndex: number) => {
    const color = colors[groupIndex % colors.length]
    
    examNumbers.forEach((examNum, examIndex) => {
      const avg = group.exam_averages[examNum]
      if (avg > 0) {
        const sectionWidth = chartWidth / examNumbers.length
        const groupSpacing = sectionWidth / (groups.length + 1)
        const x = padding.left + (sectionWidth * examIndex) + (groupSpacing * (groupIndex + 1)) - (barWidth / 2)
        const barHeight = (avg / maxValue) * chartHeight
        const y = padding.top + chartHeight - barHeight

        ctx.fillStyle = color
        ctx.fillRect(x, y, barWidth, barHeight)

        ctx.fillStyle = '#333'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(avg.toFixed(1), x + barWidth / 2, y - 2)
      }
    })

    // Legend
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

onMounted(() => {
  loadStatistics()
  window.addEventListener('resize', drawChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', drawChart)
})
</script>

<style scoped>
.cabinet-page { padding-bottom: 40px; }
.page-header { margin-bottom: 32px; }
.page-header__top { display: flex; align-items: center; gap: 20px; }
.page-header__title { margin: 0 0 4px; font-weight: 700; }
.page-header__subtitle { margin: 0; color: var(--n-text-color-3); }
.cabinet-card { border-radius: 16px; }
.chart-container { width: 100%; height: 400px; margin-top: 20px; }
.loading-state { text-align: center; padding: 4rem 2rem; }
</style>
