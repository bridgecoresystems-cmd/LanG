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
        <n-text depth="3" style="display: block; margin-top: 10px;">{{ $t('common.loading') }}</n-text>
      </div>

      <div v-else-if="error" class="error-state">
        <n-alert type="error" :title="$t('common.error')" closable>
          <n-space vertical>
            {{ error }}
            <n-button @click="loadCourses" type="primary" size="small">
              {{ $t('common.retry') }}
            </n-button>
          </n-space>
        </n-alert>
      </div>

      <div v-else-if="filteredCourses.length === 0" class="empty-state">
        <n-empty :description="$t('cabinet.courses.noCourses')">
          <template #extra>
            <n-text depth="3">{{ $t('cabinet.courses.noCoursesDescription') }}</n-text>
          </template>
        </n-empty>
      </div>

      <n-grid v-else cols="1 s:2 l:3" responsive="screen" :x-gap="16" :y-gap="16" class="courses-grid">
        <n-gi v-for="course in filteredCourses" :key="course.id">
          <n-card
            bordered
            class="course-card"
            :class="{ 'course-completed': !course.is_active }"
            hoverable
            @click="$router.push(`/cabinet/student/courses/${course.id}`)"
            style="cursor: pointer"
          >
            <template #header-extra>
              <n-tag
                :type="course.is_active ? 'success' : 'info'"
                size="small"
                round
                :bordered="false"
              >
                <template #icon>
                  <n-icon>
                    <component :is="course.is_active ? StatusIcon : CheckmarkIcon" />
                  </n-icon>
                </template>
                {{ course.is_active ? $t('cabinet.courses.status.active') : $t('cabinet.courses.status.completed') }}
              </n-tag>
            </template>

            <n-space vertical size="large">
              <div>
                <n-h3 style="margin: 0;">{{ course.course_name }}</n-h3>
                <n-text depth="3">{{ course.name }}</n-text>
              </div>

              <n-space vertical size="small">
                <n-space align="center" size="small">
                  <n-icon color="#18a058"><person-icon /></n-icon>
                  <n-text size="small" depth="2">
                    {{ course.teacher_name || $t('cabinet.courses.noTeacher') }}
                  </n-text>
                </n-space>

                <n-space align="center" size="small">
                  <n-icon color="#18a058"><calendar-icon /></n-icon>
                  <n-text size="small" depth="3">
                    {{ $t('cabinet.courses.startDate') }}: {{ formatDate(course.start_date) }}
                  </n-text>
                </n-space>
              </n-space>

              <!-- Progress Section -->
              <div class="course-section progress-section">
                <n-space justify="space-between" align="center" style="margin-bottom: 4px;">
                  <n-text strong size="small">{{ $t('cabinet.courses.progress') }}</n-text>
                  <n-text type="primary" strong>{{ course.progress || 0 }}%</n-text>
                </n-space>
                <n-progress
                  type="line"
                  :percentage="course.progress || 0"
                  :show-indicator="false"
                  processing
                  status="success"
                />
                <n-text depth="3" size="small" style="display: block; margin-top: 4px;">
                  {{ $t('cabinet.courses.completedLessons') }}: {{ course.completed_lessons || 0 }} / {{ course.total_lessons || 0 }}
                </n-text>
              </div>

              <!-- Payment Info -->
              <div class="course-section payment-section" style="margin-top: 8px;">
                <n-space justify="space-between" align="center">
                  <n-text strong size="small">{{ $t('cabinet.payments.paid') }}</n-text>
                  <n-text type="success" strong>{{ course.total_paid || 0 }} TMT</n-text>
                </n-space>
              </div>

              <!-- Payment Info -->
              <div class="course-section payment-section">
                <n-space justify="space-between" align="center">
                  <n-text strong size="small">{{ $t('cabinet.payments.paid') }}</n-text>
                  <n-text type="success" strong>{{ course.total_paid || 0 }} TMT</n-text>
                </n-space>
              </div>

              <!-- Average Grade -->
              <n-alert
                v-if="course.average_grade !== null && course.average_grade !== undefined"
                type="warning"
                size="small"
                :bordered="false"
              >
                <template #icon>
                  <n-icon><star-icon /></n-icon>
                </template>
                {{ $t('cabinet.courses.averageGrade') }}: <strong>{{ course.average_grade }}</strong>
              </n-alert>

              <!-- Next Lesson -->
              <n-alert
                v-if="course.next_lesson && course.is_active"
                type="info"
                size="small"
                class="next-lesson-alert"
              >
                <template #icon>
                  <n-icon><time-icon /></n-icon>
                </template>
                <n-space vertical :size="4">
                  <n-text strong depth="1" size="small">{{ $t('cabinet.courses.nextLesson') }}:</n-text>
                  <n-text size="small">{{ course.next_lesson.title }}</n-text>
                  <n-text depth="3" size="small">{{ formatDateTime(course.next_lesson.date) }}</n-text>
                </n-space>
              </n-alert>
            </n-space>
          </n-card>
        </n-gi>
      </n-grid>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NH3, NText, NTabs, NTab, NGrid, NGi, NCard, NTag, NIcon, 
  NProgress, NAlert, NEmpty, NSpin, NButton
} from 'naive-ui'
import { 
  PersonOutline as PersonIcon,
  CalendarOutline as CalendarIcon,
  StarOutline as StarIcon,
  TimeOutline as TimeIcon,
  Ellipse as StatusIcon,
  CheckmarkCircleOutline as CheckmarkIcon
} from '@vicons/ionicons5'
import { useCabinetCourses } from '@/composables/useCabinet'

const { t } = useI18n()
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

const filteredCourses = computed(() => {
  if (activeTab.value === 'active') {
    return coursesData.value.courses.filter(c => c.is_active)
  } else if (activeTab.value === 'completed') {
    return coursesData.value.courses.filter(c => !c.is_active)
  }
  return coursesData.value.courses
})

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const localeValue = useI18n().locale.value === 'ru' ? 'ru-RU' : useI18n().locale.value === 'tm' ? 'tk-TM' : 'en-US'
  return date.toLocaleDateString(localeValue, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const localeValue = useI18n().locale.value === 'ru' ? 'ru-RU' : useI18n().locale.value === 'tm' ? 'tk-TM' : 'en-US'
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
    console.error('Error loading courses:', err)
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

.course-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.course-card:hover {
  transform: translateY(-4px);
}

.course-completed {
  opacity: 0.85;
}

.course-section {
  padding: 12px;
  background-color: #f5f7f9;
  border-radius: 8px;
}

.next-lesson-alert {
  border-left: 4px solid #2080f0;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
