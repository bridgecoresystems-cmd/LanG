<template>
  <CabinetLayout>
    <n-space vertical size="large" class="dashboard-page">
      <div class="dashboard-header">
        <n-h1 style="margin-bottom: 4px;">{{ $t('cabinet.dashboard.title') }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.dashboard.description') }}</n-text>
      </div>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <div v-else-if="error" class="error-state">
        <n-alert type="error" :title="$t('common.error')" closable>
          {{ error }}
        </n-alert>
      </div>

      <n-space v-else vertical size="large">
        <!-- Statistics Grid -->
        <n-grid cols="1 s:2 m:4" responsive="screen" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-card class="stat-card stat-primary">
              <n-statistic :label="$t('cabinet.dashboard.stats.totalStudents')" :value="stats.totalStudents || 0">
                <template #prefix>
                  <n-icon size="24" class="stat-icon-bg"><students-icon /></n-icon>
                </template>
              </n-statistic>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card class="stat-card stat-success">
              <n-statistic :label="$t('cabinet.dashboard.stats.totalGroups')" :value="stats.totalGroups || 0">
                <template #prefix>
                  <n-icon size="24" class="stat-icon-bg"><groups-icon /></n-icon>
                </template>
              </n-statistic>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card class="stat-card stat-warning">
              <n-statistic :label="$t('cabinet.dashboard.stats.upcomingClasses')" :value="stats.upcomingClasses || 0">
                <template #prefix>
                  <n-icon size="24" class="stat-icon-bg"><calendar-icon /></n-icon>
                </template>
              </n-statistic>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card class="stat-card stat-info">
              <n-statistic :label="$t('cabinet.dashboard.stats.myBalance') + ' (' + $t('common.currencySymbol') + ')'" :value="wallet?.balance || 0">
                <template #prefix>
                  <n-icon size="24" class="stat-icon-bg"><wallet-icon /></n-icon>
                </template>
                <template #suffix>{{ $t('common.gems') }}</template>
              </n-statistic>
            </n-card>
          </n-gi>
        </n-grid>

        <!-- Main Content Grid -->
        <n-grid cols="1 m:2" responsive="screen" :x-gap="24" :y-gap="24">
          <!-- Active Groups -->
          <n-gi>
            <n-card :title="$t('cabinet.dashboard.activeGroups')" bordered>
              <template #header-extra>
                <n-button text type="primary" tag="router-link" to="/cabinet/teacher/courses">
                  {{ $t('common.viewAll') }}
                  <template #icon><n-icon><arrow-forward-icon /></n-icon></template>
                </n-button>
              </template>
              
              <div v-if="activeGroups.length === 0" class="empty-state-small">
                <n-empty :description="$t('cabinet.schedule.noActiveGroups')" />
              </div>
              <n-list v-else hoverable clickable>
                <n-list-item v-for="group in activeGroups" :key="group.id">
                  <n-thing :title="group.name" :description="group.course_name">
                    <template #suffix>
                      <n-space vertical align="end" size="small">
                        <n-space align="center" :size="4">
                          <n-icon size="14" depth="3"><students-icon /></n-icon>
                          <n-text depth="3" size="small">{{ group.students_count }} / {{ group.max_students }}</n-text>
                        </n-space>
                        <n-progress
                          type="line"
                          :percentage="group.progress || 0"
                          :show-indicator="true"
                          indicator-placement="inside"
                          processing
                          status="success"
                          style="width: 100px"
                        />
                      </n-space>
                    </template>
                  </n-thing>
                </n-list-item>
              </n-list>
            </n-card>
          </n-gi>

          <!-- Upcoming Classes -->
          <n-gi>
            <n-card :title="$t('cabinet.dashboard.upcomingSchedule')" bordered>
              <template #header-extra>
                <n-button text type="primary" tag="router-link" to="/cabinet/teacher/schedule">
                  {{ $t('common.viewAll') }}
                  <template #icon><n-icon><arrow-forward-icon /></n-icon></template>
                </n-button>
              </template>
              
              <div v-if="upcomingSchedule.length === 0" class="empty-state-small">
                <n-empty :description="$t('cabinet.dashboard.noUpcomingClasses')" />
              </div>
              <n-list v-else hoverable clickable>
                <n-list-item v-for="item in upcomingSchedule" :key="item.id">
                  <n-thing :title="item.title" :description="`${item.group_name} (${item.course_name})`">
                    <template #avatar>
                      <div class="schedule-date-box">
                        <n-text strong class="time-text">{{ formatTime(item.lesson_date) }}</n-text>
                        <n-text depth="3" class="date-text">{{ formatDateShort(item.lesson_date) }}</n-text>
                      </div>
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
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NGrid, NGi, NCard, NStatistic, NIcon, 
  NButton, NEmpty, NList, NListItem, NProgress, NThing, NSpin, NAlert
} from 'naive-ui'
import { 
  PeopleOutline as StudentsIcon,
  BriefcaseOutline as GroupsIcon,
  CalendarOutline as CalendarIcon,
  WalletOutline as WalletIcon,
  ArrowForwardOutline as ArrowForwardIcon
} from '@vicons/ionicons5'
import { useCabinetDashboard, useCabinetCourses, useCabinetSchedule } from '@/composables/useCabinet'
import { usePointsStore } from '@/stores/pointsStore'

const { t, locale } = useI18n()
const pointsStore = usePointsStore()
const { loading: dashboardLoading, error: dashboardError, fetchDashboardStats } = useCabinetDashboard()
const { fetchCourses } = useCabinetCourses()
const { fetchSchedule } = useCabinetSchedule()

const wallet = computed(() => pointsStore.wallet)
const fetchMyWallet = () => pointsStore.fetchMyWallet()

const loading = ref(false)
const error = ref<string | null>(null)

const stats = ref<any>({})
const activeGroups = ref<any[]>([])
const upcomingSchedule = ref<any[]>([])

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const [statsData, coursesData, scheduleData] = await Promise.all([
      fetchDashboardStats(),
      fetchCourses(true), // active only
      fetchSchedule(7), // next 7 days
      fetchMyWallet()
    ])
    
    stats.value = statsData
    activeGroups.value = (coursesData.courses || []).slice(0, 5)
    upcomingSchedule.value = (scheduleData || []).slice(0, 5)
  } catch (err: any) {
    error.value = err.message || t('cabinet.messages.loadError')
  } finally {
    loading.value = false
  }
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
}

const formatDateShort = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' })
}

onMounted(() => {
  loadData()
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

.stat-primary .stat-icon-bg { background-color: rgba(79, 70, 229, 0.1); color: #4f46e5; }
.stat-success .stat-icon-bg { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
.stat-warning .stat-icon-bg { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.stat-info .stat-icon-bg { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; }

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
  font-size: 1rem;
  color: #18a058;
}

.date-text {
  font-size: 0.75rem;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state-small {
  padding: 24px 0;
}
</style>
