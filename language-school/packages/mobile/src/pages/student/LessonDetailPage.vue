<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/student/dashboard" />
        </ion-buttons>
        <ion-title>{{ lesson?.title || 'Урок' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding lesson-detail-content">
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner />
      </div>

      <div v-else-if="lesson" class="lesson-detail-wrapper">
        <div class="lesson-hero">
          <div class="lesson-date-badge">
            <ion-icon :icon="calendarOutline" />
            <span>{{ formatDate(lesson.lesson_date) }}</span>
          </div>
          <h1 class="lesson-title">{{ lesson.title }}</h1>
        </div>

        <div class="detail-card">
          <div class="detail-section">
            <h3 class="section-label">О ЧЕМ УРОК</h3>
            <p class="section-text">{{ lesson.description || 'Описание отсутствует' }}</p>
          </div>

          <div class="detail-section">
            <h3 class="section-label">ДОМАШНЕЕ ЗАДАНИЕ</h3>
            <div class="homework-box">
              <p class="section-text pre-wrap">{{ lesson.homework || 'Домашнее задание не задано' }}</p>
            </div>
          </div>

          <div v-if="lesson.materials" class="detail-section">
            <h3 class="section-label">МАТЕРИАЛЫ</h3>
            <div class="materials-box">
              <pre class="materials-text">{{ lesson.materials }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ion-icon :icon="bookOutline" class="empty-icon" />
        <p>Урок не найден</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonSpinner, IonIcon
} from '@ionic/vue'
import { calendarOutline, bookOutline } from 'ionicons/icons'
import { api } from '@/composables/useApi'

const route = useRoute()
const lesson = ref<any>(null)
const loading = ref(true)

async function loadLesson() {
  const lessonId = parseInt(route.params.lessonId as string)
  if (!lessonId || isNaN(lessonId)) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    lesson.value = await api.cabinet.lessonById(lessonId)
  } catch (e) {
    console.error('Failed to load lesson', e)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

onMounted(loadLesson)
</script>

<style scoped>
.lesson-detail-content {
  --background: #f8f9fc;
}

.lesson-hero {
  padding: 20px 4px;
  margin-bottom: 20px;
}

.lesson-date-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(24, 160, 88, 0.1);
  color: #18a058;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.lesson-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
}

.detail-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.detail-section {
  margin-bottom: 32px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.section-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #334155;
  margin: 0;
}

.pre-wrap {
  white-space: pre-wrap;
}

.homework-box {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  padding: 16px;
  border-radius: 0 12px 12px 0;
}

.materials-box {
  background: #f1f5f9;
  padding: 16px;
  border-radius: 12px;
  overflow-x: auto;
}

.materials-text {
  font-family: monospace;
  font-size: 0.9rem;
  color: #475569;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.2;
  margin-bottom: 12px;
}
</style>
