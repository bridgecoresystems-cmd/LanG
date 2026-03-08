<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="parent-menu" color="light" />
        </ion-buttons>
        <ion-title>{{ $t('nav.children') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-card v-for="child in children" :key="child.id" class="child-card">
        <ion-card-content>
          <div class="child-header">
            <div class="child-avatar">{{ child.name[0] }}</div>
            <div class="child-info">
              <h3>{{ child.name }}</h3>
              <p>{{ child.group }}</p>
            </div>
            <div class="gems-wrap">
              <ion-icon :icon="diamondOutline" />
              <span>{{ child.gems }}</span>
            </div>
          </div>

          <!-- Расписание сегодня -->
          <div class="today-schedule">
            <p class="schedule-label">{{ $t('student.dashboard.todaySchedule') }}</p>
            <div v-for="lesson in child.todayLessons" :key="lesson.id" class="mini-lesson">
              <span class="mini-time">{{ lesson.time }}</span>
              <span class="mini-name">{{ lesson.name }}</span>
            </div>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonIcon,
  IonButtons, IonMenuButton,
} from '@ionic/vue'
import { diamondOutline } from 'ionicons/icons'

// TODO: загружать с API
const children = [
  {
    id: '1',
    name: 'Айгуль Мамедова',
    group: 'Английский A1',
    gems: 240,
    todayLessons: [
      { id: 1, time: '09:00', name: 'Английский язык' },
      { id: 2, time: '10:30', name: 'Чтение' },
    ],
  },
  {
    id: '2',
    name: 'Мурат Мамедов',
    group: 'Математика 3кл',
    gems: 180,
    todayLessons: [
      { id: 3, time: '11:00', name: 'Математика' },
    ],
  },
]
</script>

<style scoped>
.child-card {
  margin: 0 0 16px;
}

.child-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.child-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #0066cc;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 700;
}

.child-info {
  flex: 1;
}

.child-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.child-info p {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: #666;
}

.gems-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ff6b35;
  font-weight: 700;
  font-size: 1rem;
  gap: 2px;
}

.gems-wrap ion-icon {
  font-size: 1.4rem;
}

.today-schedule {
  background: #f5f5f5;
  border-radius: 10px;
  padding: 12px;
}

.schedule-label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 600;
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mini-lesson {
  display: flex;
  gap: 12px;
  padding: 4px 0;
}

.mini-time {
  font-size: 0.82rem;
  font-weight: 600;
  color: #0066cc;
  min-width: 44px;
}

.mini-name {
  font-size: 0.85rem;
}
</style>
