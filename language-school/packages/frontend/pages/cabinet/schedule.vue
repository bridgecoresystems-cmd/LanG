<template>
  <div class="schedule-page">
    <div class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Расписание</NH1>
        <p class="page-header__subtitle">Предстоящие уроки по вашим курсам</p>
      </div>
    </div>

    <NCard bordered class="schedule-filters">
      <NSpace align="center" :size="16" wrap>
        <NSpace align="center" size="small">
          <NText depth="2" strong size="small">Период</NText>
          <NSelect
            v-model:value="daysAhead"
            :options="daysOptions"
            style="min-width: 120px"
            @update:value="loadSchedule"
          />
        </NSpace>
        <NSpace align="center" size="small">
          <NText depth="2" strong size="small">Курс</NText>
          <NSelect
            v-model:value="selectedCourseId"
            :options="courseOptions"
            placeholder="Все курсы"
            clearable
            style="min-width: 140px"
            @update:value="onCourseChange"
          />
        </NSpace>
        <NSpace align="center" size="small">
          <NText depth="2" strong size="small">Группа</NText>
          <NSelect
            v-model:value="selectedGroupId"
            :options="groupOptions"
            placeholder="Все группы"
            clearable
            style="min-width: 140px"
            @update:value="loadSchedule"
          />
        </NSpace>
      </NSpace>
    </NCard>

    <div v-if="pending" class="loading-state mt-8">
      <NSpin size="large" />
      <NText depth="3" class="mt-2">Загрузка...</NText>
    </div>

    <div v-else-if="schedule.length === 0" class="empty-state mt-8">
      <NEmpty description="Нет уроков в выбранном периоде">
        <template #extra>
          <NSpace vertical align="center">
            <NText depth="3">Уроки появятся после того, как завуч сгенерирует расписание для групп.</NText>
            <NAlert v-if="groups.length > 0" type="info" size="small">
              <p><strong>Активных групп:</strong> {{ groups.length }}</p>
            </NAlert>
            <NText v-else depth="3" strong>У вас пока нет активных групп</NText>
          </NSpace>
        </template>
      </NEmpty>
    </div>

    <div v-else class="schedule-content mt-8">
      <NSpace vertical size="large">
        <div v-for="(lessons, date) in groupedSchedule" :key="date" class="schedule-day-group">
          <NDivider title-placement="left">
            <NSpace align="center" size="small">
              <NIcon color="#18a058" size="20"><component :is="CalendarIcon" /></NIcon>
              <NText strong size="large">{{ formatDateHeader(date) }}</NText>
              <NBadge :value="lessons.length" type="success" :show-zero="true" />
            </NSpace>
          </NDivider>

          <NGrid cols="1" :y-gap="16">
            <NGi v-for="lesson in lessons" :key="lesson.id">
              <NCard bordered class="lesson-card" hoverable>
                <NSpace align="start" :wrap="false" size="large">
                  <div class="lesson-time-box">
                    <NText strong class="time-start">{{ formatTime(lesson.lesson_date) }}</NText>
                    <NSpace align="center" :size="4">
                      <NIcon size="12" depth="3"><component :is="HourglassIcon" /></NIcon>
                      <NText depth="3" size="small">{{ lesson.duration_minutes }} мин</NText>
                    </NSpace>
                  </div>

                  <NSpace vertical size="small" style="flex: 1;">
                    <NH3 style="margin: 0;">{{ lesson.title }}</NH3>

                    <NSpace wrap>
                      <NTag size="small" :bordered="false" type="primary">
                        <template #icon><NIcon><component :is="BookIcon" /></NIcon></template>
                        {{ lesson.course_name }}
                      </NTag>
                      <NTag size="small" :bordered="false" type="info">
                        <template #icon><NIcon><component :is="GroupIcon" /></NIcon></template>
                        {{ lesson.group_name }}
                      </NTag>
                      <NTag v-if="lesson.teacher_name" size="small" :bordered="false">
                        <template #icon><NIcon><component :is="PersonIcon" /></NIcon></template>
                        {{ lesson.teacher_name }}
                      </NTag>
                    </NSpace>

                    <NText v-if="lesson.description" depth="3" class="lesson-description">
                      {{ lesson.description }}
                    </NText>

                    <NAlert v-if="lesson.homework" type="warning" size="small" :bordered="false">
                      <template #icon>
                        <NIcon><component :is="HomeworkIcon" /></NIcon>
                      </template>
                      <NText strong size="small">ДЗ: </NText>
                      <NText size="small">{{ lesson.homework }}</NText>
                    </NAlert>
                  </NSpace>
                </NSpace>
              </NCard>
            </NGi>
          </NGrid>
        </div>
      </NSpace>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NH1, NH3, NText, NGrid, NGi, NCard, NSelect, NIcon, NAlert, NEmpty, NSpin,
  NDivider, NBadge, NTag, NSpace
} from 'naive-ui'
import {
  CalendarOutline as CalendarIcon,
  BookOutline as BookIcon,
  PeopleOutline as GroupIcon,
  PersonOutline as PersonIcon,
  DocumentTextOutline as HomeworkIcon,
  HourglassOutline as HourglassIcon
} from '@vicons/ionicons5'
import { useCabinetSchedule } from '~/composables/useCabinetSchedule'
import { useCabinetProfile } from '~/composables/useCabinetProfile'

definePageMeta({
  layout: 'cabinet',
  middleware: 'cabinet-auth'
})

const scheduleApi = useCabinetSchedule()
const profileApi = useCabinetProfile()

const daysAhead = ref(7)
const selectedCourseId = ref<string | null>(null)
const selectedGroupId = ref<number | null>(null)
const schedule = ref<any[]>([])
const groups = ref<any[]>([])
const pending = ref(true)

const daysOptions = [
  { label: 'Неделя', value: 7 },
  { label: '2 недели', value: 14 },
  { label: 'Месяц', value: 30 }
]

const courseOptions = computed(() => {
  const courseMap = new Map<string, string>()
  groups.value.forEach((g: any) => {
    const name = g.course_name || g.courseName
    if (name && !courseMap.has(name)) courseMap.set(name, name)
  })
  return Array.from(courseMap.entries()).map(([value, label]) => ({ label, value }))
})

const groupOptions = computed(() => {
  let filtered = groups.value
  if (selectedCourseId.value) {
    filtered = filtered.filter((g: any) => (g.course_name || g.courseName) === selectedCourseId.value)
  }
  return filtered.map((g: any) => ({ label: g.name, value: g.id }))
})

const groupedSchedule = computed(() => {
  const grouped: Record<string, any[]> = {}
  schedule.value.forEach((lesson) => {
    const date = new Date(lesson.lesson_date).toISOString().split('T')[0]
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(lesson)
  })
  Object.keys(grouped).forEach((date) => {
    grouped[date].sort((a, b) => new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime())
  })
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

  if (date.toDateString() === today.toDateString()) {
    return 'Сегодня, ' + date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Завтра, ' + date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  return date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadGroups = async () => {
  try {
    const data = await profileApi.getStudentCourses()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    groups.value = (data || []).filter((g: any) => {
      if (!(g.is_active ?? true)) return false
      if (g.start_date) {
        const start = new Date(g.start_date)
        start.setHours(0, 0, 0, 0)
        if (today < start) return false
      }
      if (g.end_date) {
        const end = new Date(g.end_date)
        end.setHours(0, 0, 0, 0)
        if (today > end) return false
      }
      return true
    })
  } catch (e) {
    console.error('Error loading groups', e)
  }
}

const onCourseChange = () => {
  selectedGroupId.value = null
  loadSchedule()
}

const loadSchedule = async () => {
  pending.value = true
  try {
    const groupId = selectedGroupId.value ? Number(selectedGroupId.value) : undefined
    let data = await scheduleApi.fetchSchedule(daysAhead.value, groupId)

    if (selectedCourseId.value && !groupId) {
      const courseGroupIds = groups.value
        .filter((g: any) => (g.course_name || g.courseName) === selectedCourseId.value)
        .map((g: any) => g.id)
      data = data.filter((l: any) => courseGroupIds.includes(l.group))
    }

    schedule.value = data
  } catch (e) {
    console.error('Error loading schedule', e)
    schedule.value = []
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  loadGroups().then(() => loadSchedule())
})
</script>

<style scoped>
.schedule-page {
  padding-bottom: 40px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header__title {
  margin: 0 0 8px;
  font-weight: 700;
}

.page-header__subtitle {
  margin: 0;
  color: var(--n-text-color-3);
}

.schedule-filters {
  border-radius: 16px;
}

.lesson-card {
  border-left: 4px solid #18a058;
  border-radius: 16px;
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
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
