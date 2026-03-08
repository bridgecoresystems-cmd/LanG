<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary" />
        </ion-buttons>
        <ion-title>LanG Academy</ion-title>
        <ion-buttons slot="end">
          <div class="header-gems" @click="router.push('/student/profile')">
            <ion-icon :icon="diamondOutline" color="primary" />
            <span>{{ balance }}</span>
          </div>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding dashboard-content">
      <ion-refresher slot="fixed" @ionRefresh="doRefresh">
        <ion-refresherContent />
      </ion-refresher>

      <div class="dashboard-wrapper">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <h1 class="welcome-text">Привет, {{ auth.user?.first_name || 'Студент' }}! 👋</h1>
            <p class="hero-subtitle">Твой прогресс в обучении</p>
          </div>
          <div class="hero-stats">
            <div class="stat-card">
              <span class="stat-value">{{ balance }}</span>
              <span class="stat-label">Гемов 💎</span>
            </div>
            <div class="stat-card" v-if="currentGroup">
              <span class="stat-value">{{ currentGroup.progress || 0 }}%</span>
              <span class="stat-label">Курс</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions (Context-aware) -->
        <div class="section-header">
          <h3 class="section-title">БЫСТРЫЙ ДОСТУП</h3>
        </div>
        <ion-grid class="ion-no-padding quick-actions-grid">
          <ion-row>
            <ion-col size="6">
              <div class="action-card action-card--lessons" @click="goToGroup('lessons')">
                <div class="action-icon">
                  <ion-icon :icon="calendarOutline" />
                </div>
                <span class="action-label">Уроки</span>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="action-card action-card--grades" @click="goToGroup('grades')">
                <div class="action-icon">
                  <ion-icon :icon="statsChartOutline" />
                </div>
                <span class="action-label">Оценки</span>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="action-card action-card--games" @click="goToGroup('games')">
                <div class="action-icon">
                  <ion-icon :icon="gameControllerOutline" />
                </div>
                <span class="action-label">Игры</span>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="action-card action-card--payments" @click="router.push('/student/payments')">
                <div class="action-icon">
                  <ion-icon :icon="cardOutline" />
                </div>
                <span class="action-label">Оплаты</span>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Current Group Info -->
        <div class="section-header">
          <h3 class="section-title">ТЕКУЩИЙ КУРС</h3>
        </div>
        <div v-if="currentGroup" class="current-group-card" @click="goToGroup()">
          <div class="group-info">
            <div class="group-header">
              <div class="group-icon-wrap">
                <ion-icon :icon="schoolOutline" />
              </div>
              <div class="group-titles">
                <h3 class="group-name">{{ currentGroup.name }}</h3>
                <p class="course-name">{{ currentGroup.course_name }}</p>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="arrow-icon" />
            </div>
            <div class="group-footer">
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: (currentGroup.progress || 0) + '%' }"></div>
                </div>
                <span class="progress-text">{{ currentGroup.progress || 0 }}% завершено</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-card">
          <ion-icon :icon="schoolOutline" class="empty-icon" />
          <p>У вас пока нет активных групп</p>
          <ion-button fill="clear" @click="router.push('/student/courses')">
            Посмотреть каталог
          </ion-button>
        </div>

        <!-- Today's Lessons -->
        <div class="section-header">
          <h3 class="section-title">СЕГОДНЯ</h3>
          <span class="section-subtitle">{{ todayDate }}</span>
        </div>
        <div v-if="scheduleLoading" class="loading-state">
          <ion-spinner name="crescent" color="primary" />
        </div>
        <div v-else-if="todayLessons.length === 0" class="empty-card">
          <ion-icon :icon="bookOutline" class="empty-icon" />
          <p>На сегодня занятий нет</p>
        </div>
        <div v-else class="lessons-list">
          <div v-for="lesson in todayLessons" :key="lesson.id" class="lesson-card" @click="goToGroup()">
            <div class="lesson-time">
              <span class="time-start">{{ formatTime(lesson.lessonDate) }}</span>
            </div>
            <div class="lesson-info">
              <h4 class="lesson-name">{{ lesson.title || lesson.courseName }}</h4>
              <p class="lesson-group">{{ lesson.groupName }}</p>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="lesson-arrow" />
          </div>
        </div>

        <div style="height: 20px"></div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonIcon, IonSpinner,
  IonGrid, IonRow, IonCol, IonRefresher, IonRefresherContent,
  IonButton
} from '@ionic/vue'
import {
  diamondOutline, statsChartOutline, calendarOutline,
  bookOutline, chevronForwardOutline, schoolOutline,
  gameControllerOutline, cardOutline
} from 'ionicons/icons'
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useContextStore } from '@/stores/context'
import { useSchedule } from '@/composables/useSchedule'
import { useGems } from '@/composables/useGems'
import { useStudentGroups } from '@/composables/useStudentGroups'

const auth = useAuthStore()
const contextStore = useContextStore()
const router = useRouter()
const { lessonsForDay, fetchSchedule, loading: scheduleLoading } = useSchedule()
const { groups, loading: groupsLoading, fetchGroups } = useStudentGroups()
const gems = useGems()
const balance = computed(() => gems.balance ?? 0)

const todayDate = computed(() =>
  new Date().toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
)
const todayStr = new Date().toISOString().slice(0, 10)
const todayLessons = computed(() => lessonsForDay(todayStr))

const currentGroup = computed(() => {
  return contextStore.availableGroups.find(g => g.id === contextStore.selectedGroupId) || contextStore.availableGroups[0]
})

function formatTime(dateStr: string | null) {
  if (!dateStr) return '--:--'
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function goToGroup(tab: string = 'lessons') {
  const id = contextStore.selectedGroupId || (groups.value[0]?.id)
  if (id) {
    router.push(`/student/groups/${id}?tab=${tab}`)
  } else {
    router.push('/student/courses')
  }
}

async function doRefresh(event: any) {
  await Promise.all([
    fetchSchedule(7),
    gems.fetchBalance(),
    fetchGroups()
  ])
  event.target.complete()
}

onMounted(async () => {
  await Promise.all([
    fetchSchedule(7),
    gems.fetchBalance(),
    fetchGroups()
  ])
  contextStore.setGroups(groups.value as any[])
})

watch(groups, (newGroups) => {
  contextStore.setGroups(newGroups as any[])
})
</script>

<style scoped>
.dashboard-content {
  --background: #f8f9fc;
}

.header-gems {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(24, 160, 88, 0.1);
  padding: 6px 12px;
  border-radius: 12px;
  font-weight: 700;
  color: #18a058;
}

.hero-section {
  background: linear-gradient(135deg, #18a058 0%, #0c7a43 100%);
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 24px;
  color: white;
  box-shadow: 0 10px 20px rgba(24, 160, 88, 0.2);
}

.welcome-text {
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
}

.hero-subtitle {
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 4px 0 20px;
}

.hero-stats {
  display: flex;
  gap: 12px;
}

.stat-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 12px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 800;
}

.stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
  margin-top: 2px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin: 0 4px 12px;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: #64748b;
  margin: 0;
  letter-spacing: 0.05em;
}

.section-subtitle {
  font-size: 0.8rem;
  color: #94a3b8;
}

.quick-actions-grid {
  margin-bottom: 24px;
}

.action-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.action-card--lessons .action-icon { background: #eff6ff; color: #2563eb; }
.action-card--grades .action-icon { background: #f0fdf4; color: #16a34a; }
.action-card--games .action-icon { background: #fff7ed; color: #ea580c; }
.action-card--payments .action-icon { background: #faf5ff; color: #9333ea; }

.action-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
}

.current-group-card {
  background: white;
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.group-icon-wrap {
  width: 50px;
  height: 50px;
  background: #f1f5f9;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: #18a058;
}

.group-titles {
  flex: 1;
}

.group-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.course-name {
  font-size: 0.85rem;
  color: #64748b;
  margin: 2px 0 0;
}

.arrow-icon {
  color: #cbd5e1;
  font-size: 1.2rem;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #18a058;
  border-radius: 4px;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: #18a058;
}

.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lesson-card {
  background: white;
  border-radius: 18px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.lesson-time {
  background: #f1f5f9;
  padding: 8px 10px;
  border-radius: 12px;
  min-width: 60px;
  text-align: center;
}

.time-start {
  font-size: 0.85rem;
  font-weight: 800;
  color: #1e293b;
}

.lesson-info {
  flex: 1;
}

.lesson-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.lesson-group {
  font-size: 0.75rem;
  color: #64748b;
  margin: 2px 0 0;
}

.lesson-arrow {
  color: #cbd5e1;
}

.empty-card {
  background: white;
  border-radius: 24px;
  padding: 32px 20px;
  text-align: center;
  color: #94a3b8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  margin-bottom: 24px;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.2;
  margin-bottom: 12px;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style>
