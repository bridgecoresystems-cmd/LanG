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

    <div v-if="pending" class="loading-state mt-8">
      <NSpin size="large" />
    </div>

    <NCard v-else-if="filteredCourses.length > 0" bordered class="courses-table-card mt-6">
      <div class="table-wrapper">
        <table class="courses-table">
          <thead>
            <tr>
              <th>Название курса</th>
              <th>Уровень</th>
              <th>Студенты</th>
              <th>Даты</th>
              <th>Прогресс</th>
              <th>Следующий урок</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="course in filteredCourses"
              :key="course.id"
              class="course-row"
              @click="goToCourse(course.id)"
            >
              <td>
                <div class="cell-title">{{ course.course_name || course.courseName || '—' }}</div>
                <div class="cell-subtitle">{{ course.name || '' }}</div>
              </td>
              <td>{{ course.name || '—' }}</td>
              <td>
                <span class="cell-with-icon">
                  <NIcon size="16" class="cell-icon"><component :is="PeopleIcon" /></NIcon>
                  {{ course.students_count ?? 0 }} / {{ course.max_students ?? 15 }}
                </span>
              </td>
              <td>
                <div class="cell-dates">
                  <span class="cell-with-icon">
                    <NIcon size="14" class="cell-icon"><component :is="CalendarIcon" /></NIcon>
                    {{ formatDateShort(course.start_date) }}
                  </span>
                  <span class="cell-with-icon">
                    <NIcon size="14" class="cell-icon"><component :is="CalendarIcon" /></NIcon>
                    {{ formatDateShort(course.end_date) }}
                  </span>
                </div>
              </td>
              <td>
                <div class="cell-progress">
                  <div class="progress-header">
                    <span>{{ course.progress || 0 }}%</span>
                    <span class="progress-hint">{{ course.completed_lessons || 0 }} / {{ course.total_lessons || 0 }}</span>
                  </div>
                  <NProgress
                    type="line"
                    :percentage="course.progress || 0"
                    :show-indicator="false"
                    status="success"
                  />
                </div>
              </td>
              <td>
                <template v-if="course.next_lesson && course.is_active">
                  <span class="cell-with-icon">
                    <NIcon size="14" class="cell-icon"><component :is="TimeIcon" /></NIcon>
                    {{ course.next_lesson.title }}
                  </span>
                  <div class="cell-subtitle">{{ formatDateTime(course.next_lesson.date) }}</div>
                </template>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </NCard>

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
  NH1, NTabs, NTab, NCard, NIcon, NEmpty, NProgress, NSpin
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

const formatDateShort = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
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
    navigateTo(`/cabinet/teacher/groups/${id}/students`)
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

.loading-state {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.table-wrapper {
  overflow-x: auto;
}

.courses-table {
  width: 100%;
  border-collapse: collapse;
}

.courses-table th,
.courses-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--n-border-color);
  vertical-align: top;
}

.courses-table th {
  font-weight: 600;
  color: var(--n-text-color-2);
  white-space: nowrap;
}

.course-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.course-row:hover {
  background-color: var(--n-color-hover);
}

.cell-title {
  font-weight: 600;
}

.cell-subtitle {
  font-size: 0.85rem;
  color: var(--n-text-color-3);
  margin-top: 2px;
}

.cell-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.cell-with-icon .cell-icon {
  color: #18a058;
  flex-shrink: 0;
}

.cell-dates {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell-progress {
  min-width: 140px;
}

.cell-progress .progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.cell-progress .progress-hint {
  font-size: 0.8rem;
  color: var(--n-text-color-3);
}

.empty-state {
  text-align: center;
  padding: 80px 0;
}
</style>
