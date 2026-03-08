<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="student-menu" color="light" />
        </ion-buttons>
        <ion-title>{{ $t('student.dashboard.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- Приветствие + баланс -->
      <div class="greeting-card">
        <div class="greeting-info">
          <p class="greeting-text">{{ $t('student.dashboard.greeting') }},</p>
          <h2 class="student-name">{{ auth.fullName }}</h2>
        </div>
        <div class="gems-badge">
          <ion-icon :icon="diamondOutline" class="gems-icon" />
          <span class="gems-count">{{ gemsLoading ? '…' : gems.balance }}</span>
        </div>
      </div>

      <!-- Расписание сегодня -->
      <ion-card class="section-card">
        <ion-card-header>
          <ion-card-title>{{ $t('student.dashboard.todaySchedule') }}</ion-card-title>
          <ion-card-subtitle>{{ todayDate }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <div v-if="scheduleLoading" class="empty-text">
            <ion-spinner name="crescent" />
          </div>
          <div v-else-if="todayLessons.length === 0" class="empty-text">
            {{ $t('student.dashboard.noLessons') }}
          </div>
          <div v-else v-for="lesson in todayLessons" :key="lesson.id" class="lesson-item">
            <div class="lesson-time">{{ formatTime(lesson.lessonDate) }}</div>
            <div class="lesson-info">
              <p class="lesson-name">{{ lesson.title || lesson.courseName }}</p>
              <p class="lesson-teacher">{{ lesson.groupName }}</p>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Быстрые действия -->
      <ion-card class="section-card">
        <ion-card-header>
          <ion-card-title>{{ $t('student.dashboard.quickActions') }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <div class="quick-action" router-link="/student/grades" @click="$router.push('/student/grades')">
                  <ion-icon :icon="statsChartOutline" class="qa-icon" color="primary" />
                  <p>{{ $t('nav.grades') }}</p>
                </div>
              </ion-col>
              <ion-col size="6">
                <div class="quick-action" @click="$router.push('/student/schedule')">
                  <ion-icon :icon="calendarOutline" class="qa-icon" color="primary" />
                  <p>{{ $t('nav.schedule') }}</p>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButtons, IonMenuButton, IonIcon, IonSpinner,
  IonGrid, IonRow, IonCol,
} from '@ionic/vue'
import { diamondOutline, statsChartOutline, calendarOutline } from 'ionicons/icons'
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSchedule } from '@/composables/useSchedule'
import { useGems } from '@/composables/useGems'

const auth = useAuthStore()
const { lessonsForDay, fetchSchedule, loading: scheduleLoading } = useSchedule()
const gems = useGems()
const gemsLoading = gems.loading

const todayDate = computed(() =>
  new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
)
const todayStr = new Date().toISOString().slice(0, 10)
const todayLessons = computed(() => lessonsForDay(todayStr))

function formatTime(dateStr: string | null) {
  if (!dateStr) return '--:--'
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchSchedule(7)
  gems.fetchBalance()
})
</script>

<style scoped>
.greeting-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #0066cc, #004499);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  color: white;
}

.greeting-text {
  font-size: 0.9rem;
  opacity: 0.85;
  margin: 0;
}

.student-name {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 4px 0 0;
}

.gems-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 10px 14px;
}

.gems-icon {
  font-size: 1.6rem;
  color: #ff6b35;
}

.gems-count {
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 2px;
}

.section-card {
  margin: 0 0 16px;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.lesson-item:last-child {
  border-bottom: none;
}

.lesson-time {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0066cc;
  min-width: 44px;
}

.lesson-info {
  flex: 1;
}

.lesson-name {
  font-weight: 600;
  margin: 0;
  font-size: 0.95rem;
}

.lesson-teacher {
  font-size: 0.8rem;
  color: #666;
  margin: 2px 0 0;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 16px 8px;
  cursor: pointer;
}

.qa-icon {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.quick-action p {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
}

.empty-text {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  padding: 16px 0;
}
</style>
