<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="student-menu" color="light" />
        </ion-buttons>
        <ion-title>{{ $t('nav.grades') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <div v-if="loading" class="empty-state">
        <ion-spinner name="crescent" />
      </div>

      <div v-else-if="groups.length === 0" class="empty-state">
        <ion-icon :icon="statsChartOutline" class="empty-icon" />
        <p>Нет данных об оценках</p>
      </div>

      <ion-card v-else v-for="group in groups" :key="group.id" class="group-card">
        <ion-card-content>
          <div class="group-header">
            <div class="group-info">
              <h3 class="group-name">{{ group.course_name || group.name }}</h3>
              <p class="group-teacher">{{ group.teacher_name || '—' }}</p>
            </div>
            <div class="avg-badge" :class="avgClass(group.average_grade)">
              {{ group.average_grade != null ? group.average_grade.toFixed(1) : '—' }}
            </div>
          </div>

          <div class="progress-row">
            <span class="progress-label">Пройдено уроков</span>
            <span class="progress-nums">{{ group.completed_lessons }} / {{ group.total_lessons }}</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: group.progress + '%' }" />
          </div>

          <div v-if="group.tariff_price" class="payment-row">
            <span class="payment-label">Оплачено</span>
            <span class="payment-value">{{ group.total_paid.toLocaleString() }} / {{ group.tariff_price.toLocaleString() }} TMT</span>
          </div>

          <div v-if="group.next_lesson" class="next-lesson">
            <ion-icon :icon="calendarOutline" />
            <span>{{ formatDate(group.next_lesson.date) }}</span>
            <span class="next-lesson-title">{{ group.next_lesson.title }}</span>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonIcon, IonSpinner,
  IonButtons, IonMenuButton,
} from '@ionic/vue'
import { statsChartOutline, calendarOutline } from 'ionicons/icons'
import { useStudentGroups } from '@/composables/useStudentGroups'

const { groups, loading, fetchGroups } = useStudentGroups()

function avgClass(avg: number | null) {
  if (avg == null) return 'avg-none'
  if (avg >= 4.5) return 'avg-excellent'
  if (avg >= 3.5) return 'avg-good'
  return 'avg-poor'
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

onMounted(() => fetchGroups())
</script>

<style scoped>
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 0; color: #999; }
.empty-icon { font-size: 3rem; margin-bottom: 12px; opacity: 0.4; }
.group-card { margin: 0 0 14px; }
.group-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
.group-name { margin: 0; font-size: 1rem; font-weight: 600; }
.group-teacher { margin: 4px 0 0; font-size: 0.82rem; color: #666; }
.avg-badge { min-width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 700; color: white; padding: 0 8px; }
.avg-excellent { background: #2dd36f; }
.avg-good { background: #0066cc; }
.avg-poor { background: #eb445a; }
.avg-none { background: #aaaaaa; }
.progress-row { display: flex; justify-content: space-between; font-size: 0.8rem; color: #666; margin-bottom: 6px; }
.progress-bar-track { height: 6px; background: #e8e8e8; border-radius: 4px; overflow: hidden; margin-bottom: 12px; }
.progress-bar-fill { height: 100%; background: #0066cc; border-radius: 4px; }
.payment-row { display: flex; justify-content: space-between; font-size: 0.82rem; padding: 8px 0; border-top: 1px solid #f0f0f0; }
.payment-label { color: #666; }
.payment-value { font-weight: 600; color: #0066cc; }
.next-lesson { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: #ff6b35; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f0f0f0; }
.next-lesson-title { color: #333; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
