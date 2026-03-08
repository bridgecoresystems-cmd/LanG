<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary" />
        </ion-buttons>
        <ion-title>Расписание</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="schedule-content">
      <div class="schedule-wrapper">
        <!-- Week Selector -->
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
          <div v-if="loading" class="ion-text-center ion-padding">
            <ion-spinner />
          </div>
          <template v-else>
            <div v-if="filteredLessons.length === 0" class="empty-state">
              <ion-icon :icon="calendarOutline" class="empty-icon" />
              <p>На этот день занятий нет</p>
            </div>
            <div v-else class="lessons-list">
              <div
                v-for="lesson in filteredLessons"
                :key="lesson.id"
                class="lesson-card"
              >
                <div class="time-col">
                  <span class="time-start">{{ formatTime(lesson.lessonDate) }}</span>
                  <div class="time-line"></div>
                  <span class="time-end">{{ formatEndTime(lesson.lessonDate, lesson.durationMinutes) }}</span>
                </div>
                <div class="lesson-body">
                  <h3 class="lesson-title">{{ lesson.title || lesson.courseName }}</h3>
                  <p class="group-name">{{ lesson.groupName }}</p>
                  <div v-if="lesson.homework" class="homework-box">
                    <span class="homework-label">ДЗ:</span> {{ lesson.homework }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonIcon, IonSpinner
} from '@ionic/vue'
import { calendarOutline } from 'ionicons/icons'
import { useSchedule } from '@/composables/useSchedule'

const { loading, fetchSchedule, lessonsForDay } = useSchedule()

const today = new Date()
const selectedDay = ref(today.toISOString().slice(0, 10))

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
.schedule-content {
  --background: #f8f9fc;
}

.week-selector {
  display: flex;
  overflow-x: auto;
  padding: 16px;
  gap: 10px;
  background: white;
  scrollbar-width: none;
}

.week-selector::-webkit-scrollbar { display: none; }

.day-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
  padding: 10px 8px;
  border-radius: 16px;
  background: #f1f5f9;
  transition: all 0.2s;
}

.day-chip.active {
  background: #18a058;
  color: white;
  box-shadow: 0 4px 12px rgba(24, 160, 88, 0.3);
}

.day-name { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; opacity: 0.7; }
.day-num { font-size: 1.1rem; font-weight: 800; margin-top: 2px; }

.lessons-list { display: flex; flex-direction: column; gap: 16px; }

.lesson-card {
  background: white;
  border-radius: 24px;
  padding: 20px;
  display: flex;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.time-start, .time-end { font-size: 0.8rem; font-weight: 800; color: #18a058; }
.time-line { flex: 1; width: 2px; background: #18a058; opacity: 0.2; margin: 4px 0; border-radius: 1px; }

.lesson-body { flex: 1; }
.lesson-title { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0; }
.group-name { font-size: 0.85rem; color: #94a3b8; font-weight: 600; margin: 4px 0 12px; }

.homework-box {
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
  padding: 8px 12px;
  border-radius: 0 8px 8px 0;
  font-size: 0.85rem;
  color: #334155;
}

.homework-label { font-weight: 800; color: #f59e0b; }

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-icon { font-size: 3rem; opacity: 0.2; margin-bottom: 12px; }
</style>
