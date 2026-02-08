<template>
  <CabinetLayout>
    <n-space vertical size="large" class="courses-page">
      <div class="courses-header">
        <n-h1 style="margin-bottom: 4px;">{{ $t('cabinet.courses.title') }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.courses.description') }}</n-text>
      </div>

      <!-- Filter Tabs -->
      <n-tabs
        type="line"
        v-model:value="activeTab"
        size="large"
        class="filter-tabs"
      >
        <n-tab name="all">
          {{ $t('cabinet.courses.tabs.all') }} ({{ coursesData.total || 0 }})
        </n-tab>
        <n-tab name="active">
          {{ $t('cabinet.courses.tabs.active') }} ({{ coursesData.active || 0 }})
        </n-tab>
        <n-tab name="completed">
          {{ $t('cabinet.courses.tabs.completed') }} ({{ coursesData.completed || 0 }})
        </n-tab>
      </n-tabs>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <div v-else-if="error" class="error-state">
        <n-alert type="error" :title="$t('common.error')" closable>
          {{ error }}
        </n-alert>
      </div>

      <div v-else-if="filteredGroups.length === 0" class="empty-state">
        <n-empty :description="$t('cabinet.courses.noCourses')">
          <template #extra>
            <n-text depth="3">{{ $t('cabinet.courses.noCoursesDescription') }}</n-text>
          </template>
        </n-empty>
      </div>

      <n-card v-else bordered>
        <n-data-table
          :columns="columns"
          :data="filteredGroups"
          :loading="loading"
          :pagination="{ pageSize: 15 }"
          :row-props="rowProps"
          class="courses-table"
        />
      </n-card>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import CabinetLayout from '../../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NTabs, NTab, NCard, NIcon, 
  NProgress, NEmpty, NSpin, NDataTable
} from 'naive-ui'
import { 
  PeopleOutline as PeopleIcon,
  CalendarOutline as CalendarIcon,
  TimeOutline as TimeIcon
} from '@vicons/ionicons5'
import { useCabinetCourses } from '@/composables/useCabinet'

const { t, locale } = useI18n()
const router = useRouter()
const { loading, error, fetchCourses } = useCabinetCourses()

const activeTab = ref<'all' | 'active' | 'completed'>('all')
const coursesData = ref<{
  courses: any[]
  total: number
  active: number
  completed: number
}>({
  courses: [],
  total: 0,
  active: 0,
  completed: 0,
})

const filteredGroups = computed(() => {
  if (activeTab.value === 'active') {
    return coursesData.value.courses.filter(c => c.is_active_status)
  } else if (activeTab.value === 'completed') {
    return coursesData.value.courses.filter(c => !c.is_active_status)
  }
  return coursesData.value.courses
})

// Row props для клика на строку
const rowProps = (row: any) => {
  return {
    style: { cursor: 'pointer' },
    onClick: () => {
      router.push(`/cabinet/teacher/courses/${row.id}`)
    }
  }
}

// Определение колонок таблицы
const columns = computed(() => [
  {
    title: t('cabinet.courses.courseName') || 'Course',
    key: 'course_name',
    width: 150,
    render(row: any) {
      return h('div', [
        h(NText, { strong: true }, { default: () => row.course_name || '—' }),
        h('br'),
        h(NText, { depth: 3, size: 'small' }, { default: () => row.name || '' })
      ])
    }
  },
  {
    title: t('cabinet.courses.level') || 'Level',
    key: 'name',
    width: 180,
    render(row: any) {
      return h(NText, { depth: 2 }, { default: () => row.name || '—' })
    }
  },
  {
    title: t('cabinet.menu.students'),
    key: 'students',
    width: 140,
    render(row: any) {
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, { color: '#18a058', size: 16 }, { default: () => h(PeopleIcon) }),
          h(NText, { size: 'small' }, { 
            default: () => `${row.students_count || 0} / ${row.max_students || 0}` 
          })
        ]
      })
    }
  },
  {
    title: t('cabinet.courses.dates') || 'Dates',
    key: 'dates',
    width: 200,
    render(row: any) {
      const startDate = row.start_date ? formatDateShort(row.start_date) : '—'
      const endDate = row.end_date ? formatDateShort(row.end_date) : '—'
      return h(NSpace, { vertical: true, size: 'small' }, {
        default: () => [
          h(NSpace, { align: 'center', size: 'small' }, {
            default: () => [
              h(NIcon, { color: '#18a058', size: 14 }, { default: () => h(CalendarIcon) }),
              h(NText, { size: 'small', depth: 3 }, { default: () => startDate })
            ]
          }),
          h(NSpace, { align: 'center', size: 'small' }, {
            default: () => [
              h(NIcon, { color: '#18a058', size: 14 }, { default: () => h(CalendarIcon) }),
              h(NText, { size: 'small', depth: 3 }, { default: () => endDate })
            ]
          })
        ]
      })
    }
  },
  {
    title: t('cabinet.courses.progress'),
    key: 'progress',
    width: 200,
    render(row: any) {
      const progress = row.progress || 0
      return h('div', { style: 'width: 100%;' }, [
        h(NSpace, { justify: 'space-between', align: 'center', style: 'margin-bottom: 4px;' }, {
          default: () => [
            h(NText, { strong: true, size: 'small' }, { default: () => `${progress}%` }),
            h(NText, { depth: 3, size: 'small' }, { 
              default: () => `${row.completed_lessons || 0} / ${row.total_lessons || 0}` 
            })
          ]
        }),
        h(NProgress, {
          type: 'line',
          percentage: progress,
          showIndicator: false,
          processing: true,
          status: 'success',
          style: 'margin-bottom: 4px;'
        })
      ])
    }
  },
  {
    title: t('cabinet.courses.nextLesson') || 'Next Lesson',
    key: 'next_lesson',
    width: 220,
    render(row: any) {
      if (!row.next_lesson || !row.is_active_status) {
        return h(NText, { depth: 3, size: 'small' }, { default: () => '—' })
      }
      return h(NSpace, { vertical: true, size: 'small' }, {
        default: () => [
          h(NSpace, { align: 'center', size: 'small' }, {
            default: () => [
              h(NIcon, { size: 14 }, { default: () => h(TimeIcon) }),
              h(NText, { strong: true, size: 'small' }, { default: () => row.next_lesson.title })
            ]
          }),
          h(NText, { depth: 3, size: 'small' }, { 
            default: () => formatDateTime(row.next_lesson.date) 
          })
        ]
      })
    }
  }
])

const formatDateShort = (dateString: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const localeValue = locale.value === 'ru' ? 'ru-RU' : locale.value === 'tm' ? 'tk-TM' : 'en-US'
  return date.toLocaleDateString(localeValue, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const localeValue = locale.value === 'ru' ? 'ru-RU' : locale.value === 'tm' ? 'tk-TM' : 'en-US'
  return date.toLocaleString(localeValue, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadCourses = async () => {
  try {
    const data = await fetchCourses()
    coursesData.value = {
      courses: data.courses || [],
      total: data.total || 0,
      active: data.active || 0,
      completed: data.completed || 0,
    }
  } catch (err) {
    console.error('Error loading groups:', err)
  }
}

onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.courses-page {
  max-width: 1400px;
  margin: 0 auto;
}

.courses-table {
  width: 100%;
}

.courses-table :deep(.n-data-table-tr) {
  transition: background-color 0.2s ease;
}

.courses-table :deep(.n-data-table-tr:hover) {
  background-color: #f5f7f9;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
