<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t('nav.schedule') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Выбор дня -->
      <div class="week-selector">
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="day-chip"
          :class="{ active: selectedDay === day.date }"
          @click="selectedDay = day.date"
        >
          <span class="day-name">{{ day.label }}</span>
          <span class="day-num">{{ day.num }}</span>
        </div>
      </div>

      <div class="ion-padding">
        <div v-if="loading" class="empty-day">
          <ion-spinner name="crescent" />
        </div>
        <template v-else>
          <div
            v-for="lesson in filteredLessons"
            :key="lesson.id"
            class="lesson-card"
          >
            <div class="time-col">
              <span class="time-start">{{ formatTime(lesson.lessonDate) }}</span>
              <div class="time-line" />
              <span class="time-end">{{ formatEndTime(lesson.lessonDate, lesson.durationMinutes) }}</span>
            </div>
            <div class="lesson-body">
              <h3>{{ lesson.title || lesson.courseName || lesson.groupName }}</h3>
              <p class="teacher">{{ lesson.groupName }}</p>
              <div v-if="lesson.homework" class="homework-badge">
                📝 {{ lesson.homework }}
              </div>
            </div>
          </div>

          <div v-if="filteredLessons.length === 0" class="empty-day">
            <ion-icon :icon="calendarOutline" class="empty-icon" />
            <p>{{ $t('student.schedule.noLessons') }}</p>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonIcon, IonSpinner,
} from '@ionic/vue'
import { calendarOutline } from 'ionicons/icons'
import { useSchedule } from '@/composables/useSchedule'

const { loading, fetchSchedule, lessonsForDay } = useSchedule()

const today = new Date()
const selectedDay = ref(today.toISOString().slice(0, 10))

// 14 дней: 7 назад + сегодня + 7 вперёд
const weekDays = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(today)
  d.setDate(today.getDate() - 6 + i)
  return {
    date: d.toISOString().slice(0, 10),
    label: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
    num: d.getDate(),
  }
})

const filteredLessons = computed(() => lessonsForDay(selectedDay.value))

function formatTime(dateStr: string | null) {
  if (!dateStr) return '--:--'
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatEndTime(dateStr: string | null, duration: number | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setMinutes(d.getMinutes() + (duration ?? 90))
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => fetchSchedule(14))
</script>

<style scoped>
.week-selector {
  display: flex;
  overflow-x: auto;
  padding: 12px 16px;
  gap: 8px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  scrollbar-width: none;
}

.week-selector::-webkit-scrollbar {
  display: none;
}

.day-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 44px;
  padding: 8px 6px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.day-chip.active {
  background: #0066cc;
  color: white;
}

.day-name {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 600;
  opacity: 0.75;
}

.day-num {
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 2px;
}

.lesson-card {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 44px;
}

.time-start, .time-end {
  font-size: 0.78rem;
  font-weight: 600;
  color: #0066cc;
}

.time-line {
  flex: 1;
  width: 2px;
  background: #0066cc;
  margin: 4px 0;
  border-radius: 2px;
  opacity: 0.3;
}

.lesson-body {
  flex: 1;
}

.lesson-body h3 {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 600;
}

.teacher {
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 8px;
}

.lesson-meta {
  display: flex;
  gap: 8px;
}

.empty-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  color: #999;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.4;
}

.homework-badge {
  margin-top: 6px;
  font-size: 0.8rem;
  color: #666;
  background: #fff8f0;
  border-left: 3px solid #ff6b35;
  padding: 4px 8px;
  border-radius: 0 6px 6px 0;
}
</style>
