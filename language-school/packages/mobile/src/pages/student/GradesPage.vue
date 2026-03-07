<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t('nav.grades') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-card v-for="subject in subjects" :key="subject.name" class="subject-card">
        <ion-card-content>
          <div class="subject-header">
            <div>
              <h3 class="subject-name">{{ subject.name }}</h3>
              <p class="subject-teacher">{{ subject.teacher }}</p>
            </div>
            <div class="avg-badge" :class="avgClass(subject.avg)">
              {{ subject.avg }}
            </div>
          </div>
          <div class="grades-row">
            <div
              v-for="(grade, i) in subject.grades"
              :key="i"
              class="grade-chip"
              :class="gradeClass(grade)"
            >
              {{ grade }}
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
  IonCard, IonCardContent,
} from '@ionic/vue'

// TODO: загружать с API
const subjects = [
  { name: 'Английский язык', teacher: 'Иванова А.Б.', grades: [5, 4, 5, 5, 4], avg: 4.6 },
  { name: 'Математика', teacher: 'Петров В.Г.', grades: [4, 3, 4, 5, 4], avg: 4.0 },
  { name: 'Чтение', teacher: 'Сидорова Н.М.', grades: [5, 5, 5, 4, 5], avg: 4.8 },
]

function avgClass(avg: number) {
  if (avg >= 4.5) return 'avg-excellent'
  if (avg >= 3.5) return 'avg-good'
  return 'avg-poor'
}

function gradeClass(grade: number) {
  if (grade === 5) return 'grade-5'
  if (grade === 4) return 'grade-4'
  if (grade === 3) return 'grade-3'
  return 'grade-low'
}
</script>

<style scoped>
.subject-card {
  margin: 0 0 12px;
}

.subject-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.subject-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.subject-teacher {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: #666;
}

.avg-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
}

.avg-excellent { background: #2dd36f; }
.avg-good { background: #0066cc; }
.avg-poor { background: #eb445a; }

.grades-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.grade-chip {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  color: white;
}

.grade-5 { background: #2dd36f; }
.grade-4 { background: #0066cc; }
.grade-3 { background: #ffc409; color: #333; }
.grade-low { background: #eb445a; }
</style>
