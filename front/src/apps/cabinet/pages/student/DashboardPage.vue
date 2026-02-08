<template>
  <CabinetLayout>
    <n-space vertical size="large" class="dashboard-page">
      <div class="dashboard-header">
        <n-h1 style="margin-bottom: 4px;">{{ $t('cabinet.dashboard.title') }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.dashboard.description') }}</n-text>
      </div>

      <div v-if="loading || dashboardLoading || coursesLoading || scheduleLoading || gradesLoading" class="loading-state">
        <n-spin size="large" />
      </div>

      <div v-else-if="error || dashboardError" class="error-state">
        <n-alert type="error" :title="$t('common.error')" closable>
          {{ error || dashboardError }}
        </n-alert>
      </div>

      <n-space v-else vertical size="large">
        <!-- Statistics Grid -->
        <n-grid cols="1 s:2 m:4" responsive="screen" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-card class="stat-card stat-primary">
              <n-statistic :label="$t('cabinet.dashboard.stats.totalCourses')" :value="stats.totalCourses">
                <template #prefix>
                  <n-icon size="24" class="stat-icon-bg"><book-icon /></n-icon>
                </template>
              </n-statistic>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card class="stat-card stat-success">
              <n-statistic :label="$t('cabinet.dashboard.stats.averageGrade')" :value="stats.averageGrade || '—'">
                <template #prefix>
                  <n-icon size="24" class="stat-icon-bg"><star-icon /></n-icon>
                </template>
              </n-statistic>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card class="stat-card stat-warning">
              <n-statistic :label="$t('cabinet.dashboard.stats.myBalance') + ' (' + $t('common.currencySymbol') + ')'" :value="wallet?.balance || 0">
                <template #prefix>
                  <n-icon size="24" class="stat-icon-bg"><wallet-icon /></n-icon>
                </template>
                <template #suffix>{{ $t('common.gems') }}</template>
              </n-statistic>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card class="stat-card stat-info">
              <n-statistic :label="$t('cabinet.dashboard.stats.upcomingClasses')" :value="stats.upcomingClasses">
                <template #prefix>
                  <n-icon size="24" class="stat-icon-bg"><calendar-icon /></n-icon>
                </template>
              </n-statistic>
            </n-card>
          </n-gi>
        </n-grid>

        <!-- Main Content Grid -->
        <n-grid cols="1 m:2 l:3" responsive="screen" :x-gap="24" :y-gap="24">
          <!-- Recent Courses -->
          <n-gi>
            <n-card :title="$t('cabinet.dashboard.recentCourses')" bordered>
              <template #header-extra>
                <n-button text type="primary" tag="router-link" to="/cabinet/student/courses">
                  {{ $t('common.viewAll') }}
                  <template #icon><n-icon><arrow-forward-icon /></n-icon></template>
                </n-button>
              </template>
              
              <div v-if="recentCourses.length === 0" class="empty-state-small">
                <n-empty :description="$t('cabinet.dashboard.noCourses')" />
              </div>
              <n-list v-else hoverable clickable>
                <n-list-item v-for="course in recentCourses" :key="course.id">
                  <n-space vertical size="small">
                    <n-text strong>{{ course.name }}</n-text>
                    <n-text depth="3" size="small">{{ course.teacher || course.category }}</n-text>
                    <n-space align="center">
                      <n-progress
                        type="line"
                        :percentage="course.progress || 0"
                        :show-indicator="false"
                        processing
                        style="width: 150px"
                      />
                      <n-text size="small" depth="3">{{ course.progress || 0 }}%</n-text>
                    </n-space>
                  </n-space>
                </n-list-item>
              </n-list>
            </n-card>
          </n-gi>

          <!-- Upcoming Schedule -->
          <n-gi>
            <n-card :title="$t('cabinet.dashboard.upcomingSchedule')" bordered>
              <template #header-extra>
                <n-button text type="primary" tag="router-link" to="/cabinet/student/schedule">
                  {{ $t('common.viewAll') }}
                  <template #icon><n-icon><arrow-forward-icon /></n-icon></template>
                </n-button>
              </template>
              
              <div v-if="upcomingSchedule.length === 0" class="empty-state-small">
                <n-empty :description="$t('cabinet.dashboard.noUpcomingClasses')" />
              </div>
              <n-list v-else hoverable clickable>
                <n-list-item v-for="item in upcomingSchedule" :key="item.id">
                  <n-thing :title="item.course" :description="item.teacher">
                    <template #avatar>
                      <div class="schedule-date-box">
                        <n-text strong class="time-text">{{ item.time }}</n-text>
                        <n-text depth="3" class="date-text">{{ item.date }}</n-text>
                      </div>
                    </template>
                  </n-thing>
                </n-list-item>
              </n-list>
            </n-card>
          </n-gi>

          <!-- Recent Grades -->
          <n-gi>
            <n-card :title="$t('cabinet.dashboard.recentGrades')" bordered>
              <template #header-extra>
                <n-button text type="primary" tag="router-link" to="/cabinet/student/grades">
                  {{ $t('common.viewAll') }}
                  <template #icon><n-icon><arrow-forward-icon /></n-icon></template>
                </n-button>
              </template>
              
              <div v-if="recentGrades.length === 0" class="empty-state-small">
                <n-empty :description="$t('cabinet.dashboard.noGrades')" />
              </div>
              <n-list v-else hoverable clickable>
                <n-list-item v-for="grade in recentGrades" :key="grade.id">
                  <n-thing :title="grade.course" :description="grade.date">
                    <template #suffix>
                      <n-tag :type="getGradeType(grade.value)" size="large" strong round>
                        {{ grade.value }}
                      </n-tag>
                    </template>
                  </n-thing>
                </n-list-item>
              </n-list>
            </n-card>
          </n-gi>
        </n-grid>
      </n-space>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NGrid, NGi, NCard, NStatistic, NIcon, 
  NButton, NEmpty, NList, NListItem, NProgress, NThing, NTag, NSpin, NAlert
} from 'naive-ui'
import { 
  BookOutline as BookIcon,
  StarOutline as StarIcon,
  WalletOutline as WalletIcon,
  CalendarOutline as CalendarIcon,
  ArrowForwardOutline as ArrowForwardIcon
} from '@vicons/ionicons5'
import { useCabinetDashboard, useCabinetCourses, useCabinetSchedule, useCabinetGrades } from '@/composables/useCabinet'
import { usePointsStore } from '@/stores/pointsStore'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'

const { t, locale } = useI18n()
const pointsStore = usePointsStore()
const { loading: dashboardLoading, error: dashboardError, fetchDashboardStats } = useCabinetDashboard()

const wallet = computed(() => pointsStore.wallet)
const fetchMyWallet = () => pointsStore.fetchMyWallet()
const { loading: coursesLoading, fetchCourses } = useCabinetCourses()
const { loading: scheduleLoading, fetchSchedule } = useCabinetSchedule()
const { loading: gradesLoading, fetchGrades } = useCabinetGrades()

const loading = ref(false)
const error = ref<string | null>(null)

const stats = ref({
  totalCourses: 0,
  averageGrade: null as number | null,
  activityPoints: 0,
  upcomingClasses: 0
})

const recentCourses = ref<any[]>([])
const upcomingSchedule = ref<any[]>([])
const recentGrades = ref<any[]>([])

const getGradeType = (grade: number | string) => {
  const numGrade = typeof grade === 'string' ? parseFloat(grade) : grade
  if (numGrade >= 90) return 'success'
  if (numGrade >= 80) return 'info'
  if (numGrade >= 70) return 'warning'
  return 'error'
}

const formatTime = (dateString: string) => {
  return dayjs(dateString).format('HH:mm')
}

const formatDateShort = (dateString: string) => {
  return dayjs(dateString).format('MMM D')
}

const loadDashboardData = async () => {
  loading.value = true
  error.value = null

  try {
    const [statsData, coursesData, scheduleData, gradesData] = await Promise.all([
      fetchDashboardStats(),
      fetchCourses(true), // active courses only
      fetchSchedule(7), // next 7 days
      fetchGrades({ limit: 5, isActive: true }), // recent 5 grades from active courses
      fetchMyWallet() // wallet is handled separately via usePoints composable
    ])
    
    // Update stats from API response
    stats.value = {
      totalCourses: statsData.total_courses || statsData.totalCourses || 0,
      averageGrade: statsData.average_grade || statsData.averageGrade || null,
      activityPoints: statsData.activity_points || statsData.activityPoints || 0,
      upcomingClasses: statsData.upcoming_classes || statsData.upcomingClasses || 0
    }
    
    // Process courses data
    const courses = coursesData.courses || coursesData.results || coursesData || []
    recentCourses.value = courses.slice(0, 5).map((course: any) => ({
      id: course.id,
      name: course.name || course.title || course.course_name,
      teacher: course.teacher_name || course.teacher || course.teacher_full_name,
      category: course.category_name || course.category,
      progress: course.progress || course.completion_percentage || 0
    }))
    
    // Process schedule data
    const schedule = Array.isArray(scheduleData) ? scheduleData : (scheduleData.lessons || scheduleData.results || [])
    upcomingSchedule.value = schedule.slice(0, 5).map((item: any) => ({
      id: item.id,
      course: item.course_name || item.course || item.group?.course_name,
      teacher: item.teacher_name || item.teacher || item.group?.teacher_name,
      time: formatTime(item.start_time || item.datetime || item.date),
      date: formatDateShort(item.start_time || item.datetime || item.date)
    }))
    
    // Process grades data
    const grades = gradesData.grades || gradesData.results || gradesData || []
    recentGrades.value = grades.slice(0, 5).map((grade: any) => ({
      id: grade.id,
      course: grade.course_name || grade.course || grade.lesson?.course_name || grade.group?.course_name,
      date: dayjs(grade.date || grade.created_at || grade.timestamp).format('YYYY-MM-DD'),
      value: grade.grade || grade.value
    }))
  } catch (err: any) {
    error.value = err.message || err.response?.data?.detail || 'Failed to load dashboard data'
    console.error('Dashboard load error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard-page {
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon-bg {
  padding: 8px;
  border-radius: 8px;
  margin-right: 8px;
}

.stat-primary .stat-icon-bg { background-color: rgba(102, 126, 234, 0.1); color: #667eea; }
.stat-success .stat-icon-bg { background-color: rgba(240, 147, 251, 0.1); color: #f093fb; }
.stat-warning .stat-icon-bg { background-color: rgba(79, 172, 254, 0.1); color: #4facfe; }
.stat-info .stat-icon-bg { background-color: rgba(67, 233, 123, 0.1); color: #43e97b; }

.schedule-date-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7f9;
  padding: 8px;
  border-radius: 8px;
  min-width: 70px;
}

.time-text {
  font-size: 1.1rem;
  color: #18a058;
}

.date-text {
  font-size: 0.75rem;
}

.empty-state-small {
  padding: 24px 0;
}
</style>
