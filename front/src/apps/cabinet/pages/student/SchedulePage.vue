<template>
  <CabinetLayout>
    <n-space vertical size="large" class="schedule-page">
      <div class="schedule-header">
        <n-h1 style="margin-bottom: 4px;">{{ $t('cabinet.schedule.title') }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.schedule.description') }}</n-text>
      </div>

      <!-- Filters -->
      <n-card bordered class="schedule-filters">
        <n-grid cols="1 s:3" responsive="screen" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-space vertical size="small">
              <n-text depth="2" strong size="small">{{ $t('cabinet.schedule.daysAhead') }}</n-text>
              <n-select
                v-model:value="daysAhead"
                :options="daysOptions"
                @update:value="loadSchedule"
              />
            </n-space>
          </n-gi>
          <n-gi>
            <n-space vertical size="small">
              <n-text depth="2" strong size="small">{{ $t('cabinet.schedule.filterByCourse') }}</n-text>
              <n-select
                v-model:value="selectedCourseId"
                :options="courseOptions"
                placeholder="Выберите курс"
                clearable
                @update:value="onCourseChange"
              />
            </n-space>
          </n-gi>
          <n-gi>
            <n-space vertical size="small">
              <n-text depth="2" strong size="small">{{ $t('cabinet.schedule.filterByGroup') }}</n-text>
              <n-select
                v-model:value="selectedGroupId"
                :options="groupOptions"
                placeholder="Выберите группу"
                clearable
                @update:value="loadSchedule"
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
            <n-button @click="loadSchedule" type="primary" size="small">
              {{ $t('common.retry') }}
            </n-button>
          </n-space>
        </n-alert>
      </div>

      <div v-else-if="schedule.length === 0" class="empty-state">
        <n-empty :description="$t('cabinet.schedule.noLessons')">
          <template #extra>
            <n-space vertical align="center">
              <n-text depth="3">{{ $t('cabinet.schedule.noLessonsDescription') }}</n-text>
              <n-alert v-if="groups.length > 0" type="info" size="small">
                <p><strong>{{ $t('cabinet.schedule.activeGroups') }}:</strong> {{ groups.length }}</p>
                <n-text depth="3" size="small">{{ $t('cabinet.schedule.lessonsWillAppear') }}</n-text>
              </n-alert>
              <n-text v-else depth="3" strong>{{ $t('cabinet.schedule.noActiveGroups') }}</n-text>
            </n-space>
          </template>
        </n-empty>
      </div>

      <div v-else class="schedule-content">
        <!-- Group by Date -->
        <n-space vertical size="large">
          <div v-for="(lessons, date) in groupedSchedule" :key="date" class="schedule-day-group">
            <n-divider title-placement="left">
              <n-space align="center" size="small">
                <n-icon color="#18a058" size="20"><calendar-icon /></n-icon>
                <n-text strong size="large">{{ formatDateHeader(date) }}</n-text>
                <n-badge :value="lessons.length" type="success" :show-zero="true" />
              </n-space>
            </n-divider>

            <n-grid cols="1 m:1" :y-gap="16">
              <n-gi v-for="lesson in lessons" :key="lesson.id">
                <n-card bordered class="lesson-card" hoverable>
                  <n-space align="start" :wrap="false" size="large">
                    <div class="lesson-time-box">
                      <n-text strong class="time-start">{{ formatTime(lesson.lesson_date) }}</n-text>
                      <n-space align="center" :size="4">
                        <n-icon size="12" depth="3"><hourglass-icon /></n-icon>
                        <n-text depth="3" size="small">{{ lesson.duration_minutes }} {{ $t('cabinet.schedule.minutes') }}</n-text>
                      </n-space>
                    </div>

                    <n-space vertical size="small" style="flex: 1;">
                      <n-h3 style="margin: 0;">{{ lesson.title }}</n-h3>
                      
                      <n-space wrap>
                        <n-tag size="small" :bordered="false" type="primary">
                          <template #icon><n-icon><book-icon /></n-icon></template>
                          {{ lesson.course_name }}
                        </n-tag>
                        <n-tag size="small" :bordered="false" type="info">
                          <template #icon><n-icon><group-icon /></n-icon></template>
                          {{ lesson.group_name }}
                        </n-tag>
                        <n-tag v-if="lesson.teacher_name" size="small" :bordered="false">
                          <template #icon><n-icon><person-icon /></n-icon></template>
                          {{ lesson.teacher_name }}
                        </n-tag>
                      </n-space>

                      <n-text v-if="lesson.description" depth="3" class="lesson-description">
                        {{ lesson.description }}
                      </n-text>

                      <n-alert v-if="lesson.homework" type="warning" size="small" :bordered="false">
                        <template #icon>
                          <n-icon><homework-icon /></n-icon>
                        </template>
                        <n-text strong size="small">{{ $t('cabinet.schedule.homework') }}: </n-text>
                        <n-text size="small">{{ lesson.homework }}</n-text>
                      </n-alert>
                    </n-space>
                  </n-space>
                </n-card>
              </n-gi>
            </n-grid>
          </div>
        </n-space>
      </div>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NH3, NText, NGrid, NGi, NCard, NSelect, NIcon, 
  NAlert, NEmpty, NSpin, NButton, NDivider, NBadge, NTag
} from 'naive-ui'
import { 
  CalendarOutline as CalendarIcon,
  BookOutline as BookIcon,
  PeopleOutline as GroupIcon,
  PersonOutline as PersonIcon,
  TimeOutline as TimeIcon,
  DocumentTextOutline as HomeworkIcon,
  HourglassOutline as HourglassIcon
} from '@vicons/ionicons5'
import { useCabinetSchedule } from '@/composables/useCabinet'
import { useCabinetCourses } from '@/composables/useCabinet'

const { t, locale } = useI18n()
const { loading, error, fetchSchedule } = useCabinetSchedule()
const { fetchCourses } = useCabinetCourses()

const daysAhead = ref(7)
const selectedCourseId = ref<string | null>(null)
const selectedGroupId = ref<number | null>(null)
const schedule = ref<any[]>([])
const groups = ref<any[]>([])
const courses = ref<any[]>([])

const daysOptions = [
  { label: t('cabinet.schedule.daysOptions.week'), value: 7 },
  { label: t('cabinet.schedule.daysOptions.twoWeeks'), value: 14 },
  { label: t('cabinet.schedule.daysOptions.month'), value: 30 }
]

const courseOptions = computed(() => {
  return [
    ...courses.value.map(c => ({
      label: c.course_name,
      value: c.id
    }))
  ]
})

const groupOptions = computed(() => {
  const filtered = !selectedCourseId.value
    ? groups.value
    : groups.value.filter((group: any) => group.course_name === selectedCourseId.value)
    
  return [
    ...filtered.map(g => ({
      label: g.name,
      value: g.id
    }))
  ]
})

const groupedSchedule = computed(() => {
  const grouped: Record<string, any[]> = {}
  
  schedule.value.forEach(lesson => {
    const date = new Date(lesson.lesson_date).toISOString().split('T')[0]
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(lesson)
  })

  // Sort lessons within each day by time
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => 
      new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime()
    )
  })

  // Sort dates
  return Object.keys(grouped)
    .sort()
    .reduce((acc, date) => {
      acc[date] = grouped[date]
      return acc
    }, {} as Record<string, any[]>)
})

const formatDateHeader = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const dateLocale = locale.value === 'ru' ? 'ru-RU' : locale.value === 'tm' ? 'tk-TM' : 'en-US'
  
  // Check if it's today
  if (date.toDateString() === today.toDateString()) {
    return t('cabinet.schedule.today') + ', ' + date.toLocaleDateString(dateLocale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Check if it's tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return t('cabinet.schedule.tomorrow') + ', ' + date.toLocaleDateString(dateLocale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return date.toLocaleDateString(dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const dateLocale = locale.value === 'ru' ? 'ru-RU' : locale.value === 'tm' ? 'tk-TM' : 'en-US'
  return date.toLocaleTimeString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadGroups = async () => {
  try {
    const data = await fetchCourses(true)
    const groupsData = data.courses || []
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    groups.value = groupsData.filter((group: any) => {
      const isActive = group.is_active || group.is_active_status || false
      if (!isActive) return false
      
      if (group.start_date) {
        const startDate = new Date(group.start_date)
        startDate.setHours(0, 0, 0, 0)
        if (today < startDate) return false
      }
      
      if (group.end_date) {
        const endDate = new Date(group.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (today > endDate) return false
      }
      
      return true
    })
    
    const courseMap = new Map()
    groups.value.forEach((group: any) => {
      const courseName = group.course_name
      if (courseName && !courseMap.has(courseName)) {
        courseMap.set(courseName, {
          id: courseName,
          course_name: courseName
        })
      }
    })
    courses.value = Array.from(courseMap.values())
  } catch (err: any) {
    console.error('Error loading groups:', err)
  }
}

const onCourseChange = () => {
  selectedGroupId.value = null
  loadSchedule()
}

const loadSchedule = async () => {
  try {
    const groupId = selectedGroupId.value ? Number(selectedGroupId.value) : undefined
    const data = await fetchSchedule(daysAhead.value, groupId)
    
    let scheduleData = Array.isArray(data) ? data : []
    
    if (selectedCourseId.value && !groupId) {
      const courseGroupsIds = groups.value
        .filter((g: any) => g.course_name === selectedCourseId.value)
        .map((g: any) => g.id)
      scheduleData = scheduleData.filter((lesson: any) => 
        courseGroupsIds.includes(lesson.group)
      )
    }
    
    schedule.value = scheduleData
  } catch (err: any) {
    console.error('Error loading schedule:', err)
  }
}

onMounted(() => {
  loadGroups()
  loadSchedule()
})
</script>

<style scoped>
.schedule-page {
  max-width: 1400px;
  margin: 0 auto;
}

.lesson-card {
  border-left: 4px solid #18a058;
}

.lesson-time-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background-color: #f5f7f9;
  border-radius: 8px;
  min-width: 90px;
}

.time-start {
  font-size: 1.25rem;
  color: #18a058;
}

.lesson-description {
  line-height: 1.6;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
