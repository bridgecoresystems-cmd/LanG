<template>
  <CabinetLayout>
    <n-space vertical size="large" class="teacher-page">
      <div class="page-header">
        <n-h1 style="margin-bottom: 4px;">{{ $t('cabinet.schedule.title') }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.schedule.description') }}</n-text>
      </div>

      <n-card bordered class="filters-card">
        <n-grid cols="1 s:2 m:3" responsive="screen" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-form-item :label="$t('cabinet.schedule.daysAhead')" :show-feedback="false">
              <n-select
                v-model:value="daysAhead"
                :options="daysAheadOptions"
                @update:value="loadSchedule"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item :label="$t('cabinet.schedule.filterByCourse')" :show-feedback="false">
              <n-select
                v-model:value="selectedCourseId"
                :options="courseOptions"
                :placeholder="$t('cabinet.schedule.allCourses')"
                clearable
                @update:value="onCourseChange"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item :label="$t('cabinet.schedule.filterByGroup')" :show-feedback="false">
              <n-select
                v-model:value="selectedGroupId"
                :options="groupOptions"
                :placeholder="$t('cabinet.schedule.allGroups')"
                clearable
                :disabled="!selectedCourseId"
                @update:value="loadSchedule"
              />
            </n-form-item>
          </n-gi>
        </n-grid>
      </n-card>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <n-alert v-else-if="error" type="error" closable @close="error = null">
        {{ error }}
      </n-alert>

      <n-empty
        v-else-if="schedule.length === 0"
        :description="$t('cabinet.schedule.noLessons')"
        class="empty-state"
      >
        <template #extra>
          <n-text depth="3">{{ $t('cabinet.schedule.noLessonsDescription') }}</n-text>
        </template>
      </n-empty>

      <n-space v-else vertical size="large" class="schedule-content">
        <n-card
          v-for="(lessons, date) in groupedSchedule"
          :key="date"
          bordered
          class="date-card"
        >
          <template #header>
            <n-space align="center">
              <n-icon size="24" color="#18a058"><calendar-icon /></n-icon>
              <n-h3 style="margin: 0;">{{ formatDateHeader(date) }}</n-h3>
              <n-tag type="info" round size="small">
                {{ lessons.length }} {{ $t('cabinet.schedule.lessons') }}
              </n-tag>
            </n-space>
          </template>

          <n-list hoverable bordered>
            <n-list-item v-for="lesson in lessons" :key="lesson.id">
              <n-thing :title="lesson.title">
                <template #header-extra>
                  <n-tag type="success" ghost icon-placement="left">
                    <template #icon><n-icon><time-icon /></n-icon></template>
                    {{ formatTime(lesson.lesson_date) }}
                  </n-tag>
                </template>
                <template #description>
                  <n-space vertical size="small" style="margin-top: 8px">
                    <n-space align="center" size="small">
                      <n-icon depth="3"><book-icon /></n-icon>
                      <n-text depth="3">{{ lesson.course_name }}</n-text>
                    </n-space>
                    <n-space align="center" size="small">
                      <n-icon depth="3"><group-icon /></n-icon>
                      <n-text depth="3">{{ lesson.group_name }}</n-text>
                    </n-space>
                    <div v-if="lesson.description" class="lesson-desc">
                      <n-text depth="2">{{ lesson.description }}</n-text>
                    </div>
                    <div v-if="lesson.homework" class="lesson-homework">
                      <n-text type="warning" strong>
                        <n-icon><homework-icon /></n-icon>
                        {{ $t('cabinet.schedule.homework') }}:
                      </n-text>
                      <n-text depth="2" style="display: block; margin-top: 4px">
                        {{ lesson.homework }}
                      </n-text>
                    </div>
                  </n-space>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>
      </n-space>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NH3, NText, NCard, NGrid, NGi, NSelect, NFormItem, 
  NIcon, NTag, NList, NListItem, NThing, NSpin, NAlert, NEmpty 
} from 'naive-ui'
import { 
  CalendarOutline as CalendarIcon,
  TimeOutline as TimeIcon,
  BookOutline as BookIcon,
  PeopleOutline as GroupIcon,
  DocumentTextOutline as HomeworkIcon
} from '@vicons/ionicons5'
import { useCabinetSchedule, useCabinetCourses } from '@/composables/useCabinet'

const { t, locale } = useI18n()
const { loading, error, fetchSchedule } = useCabinetSchedule()
const { fetchCourses } = useCabinetCourses()

const daysAhead = ref(7)
const selectedCourseId = ref<number | null>(null)
const selectedGroupId = ref<number | null>(null)
const schedule = ref<any[]>([])
const groups = ref<any[]>([])
const courses = ref<any[]>([])

const daysAheadOptions = computed(() => [
  { label: t('cabinet.schedule.daysOptions.week'), value: 7 },
  { label: t('cabinet.schedule.daysOptions.twoWeeks'), value: 14 },
  { label: t('cabinet.schedule.daysOptions.month'), value: 30 }
])

const courseOptions = computed(() => [
  { label: t('cabinet.schedule.allCourses'), value: null },
  ...courses.value.map(c => ({ label: c.course_name, value: c.id }))
])

const groupOptions = computed(() => {
  let filtered = groups.value
  if (selectedCourseId.value) {
    filtered = groups.value.filter((group: any) => group.course_id === selectedCourseId.value)
  }
  return [
    { label: t('cabinet.schedule.allGroups'), value: null },
    ...filtered.map(g => ({ label: g.name, value: g.id }))
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
  
  // Sort lessons within each date
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => 
      new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime()
    )
  })
  
  // Return sorted dates
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
  
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  
  const dateLocale = locale.value === 'ru' ? 'ru-RU' : 'tk-TM'
  
  if (date.toDateString() === today.toDateString()) {
    return `${t('cabinet.schedule.today')}, ${date.toLocaleDateString(dateLocale, options)}`
  }
  
  if (date.toDateString() === tomorrow.toDateString()) {
    return `${t('cabinet.schedule.tomorrow')}, ${date.toLocaleDateString(dateLocale, options)}`
  }
  
  return date.toLocaleDateString(dateLocale, options)
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString(locale.value === 'ru' ? 'ru-RU' : 'tk-TM', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const loadGroupsAndCourses = async () => {
  try {
    const data = await fetchCourses(true)
    const coursesData = data.courses || []
    
    // Extract unique courses
    const uniqueCoursesMap = new Map()
    coursesData.forEach((group: any) => {
      if (group.course_id && !uniqueCoursesMap.has(group.course_id)) {
        uniqueCoursesMap.set(group.course_id, {
          id: group.course_id,
          course_name: group.course_name
        })
      }
    })
    courses.value = Array.from(uniqueCoursesMap.values())
    
    // Store all groups
    groups.value = coursesData.map((group: any) => ({
      id: group.id,
      name: group.name,
      course_id: group.course_id
    }))
    
  } catch (err: any) {
    console.error('Error loading groups and courses:', err)
  }
}

const onCourseChange = () => {
  selectedGroupId.value = null
  loadSchedule()
}

const loadSchedule = async () => {
  try {
    const groupId = selectedGroupId.value || undefined
    const courseId = selectedCourseId.value || undefined
    
    const data = await fetchSchedule(daysAhead.value, groupId, courseId)
    schedule.value = Array.isArray(data) ? data : []
  } catch (err: any) {
    console.error('Error loading schedule:', err)
  }
}

onMounted(() => {
  loadGroupsAndCourses()
  loadSchedule()
})
</script>

<style scoped>
.teacher-page {
  max-width: 1200px;
  margin: 0 auto;
}

.filters-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.date-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.lesson-desc {
  background-color: #f8f8f8;
  padding: 12px;
  border-radius: 8px;
  margin-top: 8px;
}

.lesson-homework {
  border-left: 4px solid #f0a020;
  padding-left: 12px;
  margin-top: 12px;
}
</style>
