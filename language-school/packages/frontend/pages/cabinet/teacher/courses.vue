<template>
  <div class="teacher-courses-page">
    <div class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Мои курсы</NH1>
        <p class="page-header__subtitle">Просмотр всех ваших курсов, активных и завершённых</p>
      </div>
    </div>

    <NTabs
      type="line"
      v-model:value="activeTab"
      size="large"
      class="filter-tabs"
    >
      <NTab name="all">
        Все ({{ coursesData.total || 0 }})
      </NTab>
      <NTab name="active">
        Активные ({{ coursesData.active || 0 }})
      </NTab>
      <NTab name="completed">
        Завершённые ({{ coursesData.completed || 0 }})
      </NTab>
    </NTabs>

    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      <NSkeleton v-for="i in 3" :key="i" :height="280" :sharp="false" />
    </div>

    <div v-else-if="filteredCourses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      <NCard
        v-for="course in filteredCourses"
        :key="course.id"
        class="course-card"
        :class="{ 'course-completed': !course.is_active }"
        hoverable
        @click="goToCourse(course.id)"
      >
        <template #header-extra>
          <NTag
            :type="course.is_active ? 'success' : 'info'"
            size="small"
            round
            :bordered="false"
          >
            {{ course.is_active ? 'Активен' : 'Завершён' }}
          </NTag>
        </template>

        <div class="course-card__content">
          <div class="course-card__header">
            <h3 class="course-card__title">{{ course.course_name || course.courseName }}</h3>
            <div class="course-card__group-name">{{ course.name }}</div>
          </div>

          <NSpace vertical size="small" class="mt-4">
            <div class="info-item">
              <NIcon><component :is="PeopleIcon" /></NIcon>
              <span>Учеников: {{ course.students_count ?? 0 }} / {{ course.max_students ?? 15 }}</span>
            </div>
            <div class="info-item">
              <NIcon><component :is="CalendarIcon" /></NIcon>
              <span>Начало: {{ formatDate(course.start_date) || '—' }}</span>
            </div>
            <div class="info-item" v-if="course.end_date">
              <NIcon><component :is="CalendarIcon" /></NIcon>
              <span>Окончание: {{ formatDate(course.end_date) || '—' }}</span>
            </div>
            <div class="info-item" v-if="course.time_slot || course.week_days">
              <NIcon><component :is="TimeIcon" /></NIcon>
              <span>{{ formatTimeSlot(course.time_slot) }} · {{ formatWeekDays(course.week_days) }}</span>
            </div>
          </NSpace>

          <!-- Прогресс -->
          <div class="course-section progress-section mt-4">
            <div class="info-row">
              <span class="info-label">Прогресс</span>
              <span class="info-value">{{ course.progress || 0 }}%</span>
            </div>
            <NProgress
              type="line"
              :percentage="course.progress || 0"
              :show-indicator="false"
              status="success"
            />
            <div class="info-hint mt-1">
              Уроков: {{ course.completed_lessons || 0 }} / {{ course.total_lessons || 0 }}
            </div>
          </div>

          <!-- Следующий урок -->
          <NAlert
            v-if="course.next_lesson && course.is_active"
            type="info"
            size="small"
            :bordered="false"
            class="next-lesson-alert mt-3"
          >
            <template #icon>
              <NIcon><component :is="TimeIcon" /></NIcon>
            </template>
            <div class="next-lesson-content">
              <div class="next-lesson-label">Следующий урок:</div>
              <div class="next-lesson-title">{{ course.next_lesson.title }}</div>
              <div class="next-lesson-date">{{ formatDateTime(course.next_lesson.date) }}</div>
            </div>
          </NAlert>

          <div class="course-card__footer mt-4">
            <NButton type="primary" secondary block>
              Журнал / Уроки
            </NButton>
          </div>
        </div>
      </NCard>
    </div>

    <div v-else class="empty-state mt-12">
      <NEmpty description="У вас пока нет групп">
        <template #icon>
          <NIcon><component :is="BookIcon" /></NIcon>
        </template>
      </NEmpty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  NH1, NTabs, NTab, NCard, NTag, NIcon, NButton, NEmpty, NSkeleton, NProgress, NAlert, NSpace
} from 'naive-ui'
import {
  CalendarOutline as CalendarIcon,
  TimeOutline as TimeIcon,
  BookOutline as BookIcon,
  PeopleOutline as PeopleIcon
} from '@vicons/ionicons5'
import { useCabinetProfile } from '~/composables/useCabinetProfile'
import { useContextStore } from '~/stores/contextStore'

definePageMeta({
  layout: 'cabinet',
  middleware: 'cabinet-auth'
})

const profileApi = useCabinetProfile()
const contextStore = useContextStore()
const activeTab = ref<'all' | 'active' | 'completed'>('all')
const pending = ref(true)

const coursesData = ref({
  courses: [] as any[],
  total: 0,
  active: 0,
  completed: 0
})

const filteredCourses = computed(() => {
  if (activeTab.value === 'active') {
    return coursesData.value.courses.filter((c: any) => c.is_active)
  } else if (activeTab.value === 'completed') {
    return coursesData.value.courses.filter((c: any) => !c.is_active)
  }
  return coursesData.value.courses
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTimeSlot = (slot: string | null) => {
  if (!slot) return '—'
  const map: Record<string, string> = {
    A: '08:00–11:00',
    B: '13:00–17:00',
    C: '17:00–19:00'
  }
  return map[slot] || slot
}

const formatWeekDays = (days: string | null) => {
  if (!days) return '—'
  const map: Record<string, string> = {
    '1': 'Пн, Ср, Пт',
    '2': 'Вт, Чт, Сб'
  }
  return map[days] || days
}

const syncFromContext = () => {
  const groups = contextStore.availableGroups
  if (!Array.isArray(groups) || groups.length === 0) return false
  coursesData.value = {
    courses: groups,
    total: groups.length,
    active: groups.filter((c: any) => c.is_active).length,
    completed: groups.filter((c: any) => !c.is_active).length
  }
  return true
}

const loadCourses = async () => {
  pending.value = true
  try {
    if (syncFromContext()) {
      pending.value = false
      return
    }
    const data = await profileApi.getMyGroups()
    const courses = Array.isArray(data) ? data : []
    contextStore.setGroups(courses.map((g: any) => ({ ...g, course_name: g.course_name ?? g.courseName })))
    syncFromContext()
  } catch (e) {
    console.error('Failed to load teacher courses', e)
  } finally {
    pending.value = false
  }
}

watch(() => contextStore.availableGroups, (groups) => {
  if (Array.isArray(groups) && groups.length > 0) {
    syncFromContext()
    pending.value = false
  }
}, { deep: true, immediate: true })

const goToCourse = (id: number) => {
  nextTick(() => {
    contextStore.setSelectedGroup(id)
    navigateTo(`/cabinet/teacher/groups/${id}/lessons`)
  })
}

onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.teacher-courses-page {
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

.course-card {
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.course-card__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.course-card__group-name {
  color: var(--n-text-color-3);
  font-size: 0.9rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--n-text-color-2);
}

.course-section {
  padding: 12px;
  background-color: #f5f7f9;
  border-radius: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.info-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 600;
  color: var(--n-primary-color);
}

.info-hint {
  font-size: 0.85rem;
  color: var(--n-text-color-3);
}

.next-lesson-alert {
  border-left: 4px solid #2080f0;
}

.next-lesson-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.next-lesson-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.next-lesson-title {
  font-size: 0.95rem;
}

.next-lesson-date {
  font-size: 0.85rem;
  color: var(--n-text-color-3);
}

.course-completed {
  opacity: 0.85;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
}
</style>
