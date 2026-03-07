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
        <div
          v-for="lesson in filteredLessons"
          :key="lesson.id"
          class="lesson-card"
        >
          <div class="time-col">
            <span class="time-start">{{ lesson.timeStart }}</span>
            <div class="time-line" />
            <span class="time-end">{{ lesson.timeEnd }}</span>
          </div>
          <div class="lesson-body">
            <h3>{{ lesson.name }}</h3>
            <p class="teacher">{{ lesson.teacher }}</p>
            <div class="lesson-meta">
              <ion-chip color="primary" outline>
                <ion-icon :icon="locationOutline" />
                <ion-label>{{ lesson.room }}</ion-label>
              </ion-chip>
            </div>
          </div>
        </div>

        <div v-if="filteredLessons.length === 0" class="empty-day">
          <ion-icon :icon="calendarOutline" class="empty-icon" />
          <p>{{ $t('student.schedule.noLessons') }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonChip, IonIcon, IonLabel,
} from '@ionic/vue'
import { locationOutline, calendarOutline } from 'ionicons/icons'

const today = new Date()

const weekDays = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(today)
  d.setDate(today.getDate() - today.getDay() + i + 1)
  return {
    date: d.toISOString().slice(0, 10),
    label: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
    num: d.getDate(),
  }
})

const selectedDay = ref(today.toISOString().slice(0, 10))

// TODO: загружать с API
const allLessons = [
  { id: 1, date: weekDays[0]?.date, timeStart: '09:00', timeEnd: '10:20', name: 'Английский язык', teacher: 'Иванова А.Б.', room: '201' },
  { id: 2, date: weekDays[0]?.date, timeStart: '10:30', timeEnd: '11:50', name: 'Математика', teacher: 'Петров В.Г.', room: '105' },
  { id: 3, date: weekDays[1]?.date, timeStart: '09:00', timeEnd: '10:20', name: 'Чтение', teacher: 'Сидорова Н.М.', room: '301' },
]

const filteredLessons = computed(() =>
  allLessons.filter(l => l.date === selectedDay.value)
)
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
</style>
