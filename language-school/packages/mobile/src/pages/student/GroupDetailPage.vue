<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/student/dashboard" />
        </ion-buttons>
        <ion-title>{{ group?.name || 'Детали группы' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding group-detail-content">
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner />
      </div>

      <div v-else id="group-detail-content-area">
        <!-- Tabs -->
        <ion-segment v-model="activeTab" mode="md" class="custom-segment">
          <ion-segment-button value="lessons">
            <ion-label>Уроки</ion-label>
          </ion-segment-button>
          <ion-segment-button value="grades">
            <ion-label>Оценки</ion-label>
          </ion-segment-button>
          <ion-segment-button value="games">
            <ion-label>Игры</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Lessons Tab -->
        <div v-if="activeTab === 'lessons'" class="tab-content">
          <div v-if="attendance.length === 0" class="empty-tab">
            <ion-icon :icon="calendarOutline" />
            <p>Уроков пока нет</p>
          </div>
          <div v-else class="lessons-list">
            <div
              v-for="item in attendance"
              :key="item.lesson_id"
              class="lesson-item"
              :class="itemStatusClass(item)"
              @click="$router.push(`/student/groups/${groupId}/lessons/${item.lesson_id}`)"
            >
              <div class="lesson-date-col">
                <span class="day">{{ getDay(item.lesson_date) }}</span>
                <span class="month">{{ getMonth(item.lesson_date) }}</span>
              </div>
              <div class="lesson-info-col">
                <h4 class="lesson-title">{{ item.lesson_title }}</h4>
                <div class="lesson-status-badge" v-if="item.statusLabel !== '—'">
                  {{ item.statusLabel }}
                </div>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="arrow-icon" />
            </div>
          </div>
        </div>

        <!-- Grades Tab -->
        <div v-if="activeTab === 'grades'" class="tab-content">
          <div v-if="!examData?.scheme" class="empty-tab">
            <ion-icon :icon="schoolOutline" />
            <p>Схема оценивания не назначена</p>
          </div>
          <div v-else class="grades-container">
            <!-- Certificate Score -->
            <div class="cert-card">
              <div class="cert-info">
                <span class="cert-label">Балл сертификата</span>
                <h2 class="cert-score">{{ examData.certificateScore.toFixed(1) }} <small>/ 100</small></h2>
                <p class="cert-status">{{ certLabel }}</p>
              </div>
              <div class="cert-progress">
                <div class="circular-progress" :style="certProgressStyle">
                  <span>{{ Math.round(examData.certificateScore) }}%</span>
                </div>
              </div>
            </div>

            <!-- Exams -->
            <div class="exams-list">
              <div v-for="exam in examData.items" :key="exam.id" class="exam-item">
                <div class="exam-header">
                  <span class="exam-name">{{ exam.examTypeName }}</span>
                  <span class="exam-weight">вес {{ exam.weightPercentage }}%</span>
                </div>
                <div v-if="exam.grade" class="exam-body">
                  <div class="exam-total">
                    {{ exam.grade.totalScore }} / {{ exam.totalMax }} б.
                  </div>
                  <div class="skills-grid">
                    <div v-for="skill in getSkills(exam)" :key="skill.label" class="skill-row">
                      <span class="skill-label">{{ skill.label }}</span>
                      <div class="skill-bar-wrap">
                        <div class="skill-bar-fill" :style="{ width: (skill.score/skill.max*100) + '%' }"></div>
                      </div>
                      <span class="skill-score">{{ skill.score }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="exam-pending">Ожидает оценки</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Games Tab -->
        <div v-if="activeTab === 'games'" class="tab-content">
          <div v-if="games.length === 0" class="empty-tab">
            <ion-icon :icon="gameControllerOutline" />
            <p>Игр пока нет</p>
          </div>
          <div v-else class="games-grid">
            <div
              v-for="g in games"
              :key="g.id"
              class="game-card"
              @click="$router.push(`/student/groups/${groupId}/games/${g.id}`)"
            >
              <div class="game-icon-wrap" :class="g.game_type">
                <ion-icon :icon="getGameIcon(g.game_type)" />
              </div>
              <div class="game-info">
                <h4 class="game-title">{{ g.title }}</h4>
                <div class="game-meta">
                  <span class="game-type-label">{{ getGameTypeLabel(g.game_type) }}</span>
                  <span v-if="g.is_played" class="played-badge">Сыграно</span>
                </div>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="arrow-icon" />
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonSegment, IonSegmentButton,
  IonLabel, IonSpinner, IonIcon
} from '@ionic/vue'
import {
  calendarOutline, schoolOutline,
  gameControllerOutline, chevronForwardOutline,
  flashOutline, appsOutline, linkOutline
} from 'ionicons/icons'
import { useStudentGroups } from '@/composables/useStudentGroups'
import { useStudentLessons } from '@/composables/useStudentLessons'
import { useStudentGames } from '@/composables/useStudentGames'
import { useContextStore } from '@/stores/context'
import { api } from '@/composables/useApi'

const route = useRoute()
const contextStore = useContextStore()
const groupId = computed(() => contextStore.selectedGroupId || parseInt(route.params.id as string))
const activeTab = ref((route.query.tab as string) || 'lessons')

const { fetchGroups } = useStudentGroups()
const { attendance, loading: lessonsLoading, fetchAttendance } = useStudentLessons()
const { games, loading: gamesLoading, fetchGames } = useStudentGames()

const group = computed(() => contextStore.availableGroups.find(g => g.id === groupId.value))
const examData = ref<any>(null)
const examLoading = ref(false)

const loading = computed(() => lessonsLoading.value || gamesLoading.value || examLoading.value)

async function fetchExams() {
  if (!groupId.value) return
  examLoading.value = true
  try {
    examData.value = await api.cabinet.examResults(groupId.value)
  } catch (e) {
    console.error('Failed to fetch exams', e)
  } finally {
    examLoading.value = false
  }
}

function getDay(dateStr: string) {
  return new Date(dateStr).getDate()
}

function getMonth(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')
}

function itemStatusClass(item: any) {
  if (item.isFuture) return 'is-future'
  return `status-${item.status}`
}

function getSkills(item: any) {
  return [
    { label: 'Writing', score: Number(item.grade.writing), max: item.writingMax },
    { label: 'Listening', score: Number(item.grade.listening), max: item.listeningMax },
    { label: 'Reading', score: Number(item.grade.reading), max: item.readingMax },
    { label: 'Speaking', score: Number(item.grade.speaking), max: item.speakingMax },
  ]
}

const certLabel = computed(() => {
  if (!examData.value) return ''
  const s = examData.value.certificateScore
  if (!examData.value.allTaken) return 'В процессе обучения'
  if (s >= 60) return 'Сертификат получен!'
  return 'Не хватает баллов'
})

const certProgressStyle = computed(() => {
  if (!examData.value) return {}
  const pct = Math.min(100, examData.value.certificateScore)
  return {
    background: `conic-gradient(#18a058 ${pct * 3.6}deg, #f1f5f9 0deg)`
  }
})

function getGameIcon(type: string) {
  if (type === 'sprint') return flashOutline
  if (type === 'memory') return appsOutline
  return linkOutline
}

function getGameTypeLabel(type: string) {
  if (type === 'sprint') return 'Спринт'
  if (type === 'memory') return 'Память'
  return 'Сопоставление'
}

onMounted(async () => {
  await fetchGroups()
  if (groupId.value) {
    fetchAttendance(groupId.value)
    fetchExams()
    fetchGames(groupId.value)
  }
})

watch(() => contextStore.selectedGroupId, (newId) => {
  if (newId) {
    fetchAttendance(newId)
    fetchExams()
    fetchGames(newId)
  }
})
</script>

<style scoped>
.group-detail-content {
  --background: #f8f9fc;
}

.custom-segment {
  background: #f1f5f9;
  border-radius: 16px;
  padding: 4px;
  margin-bottom: 24px;
}

.custom-segment ion-segment-button {
  --indicator-color: white;
  --color: #64748b;
  --color-checked: #18a058;
  --border-radius: 12px;
  min-height: 40px;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

/* Lessons */
.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lesson-item {
  background: white;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.lesson-date-col {
  width: 50px;
  height: 50px;
  background: #f1f5f9;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.lesson-date-col .day { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
.lesson-date-col .month { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

.lesson-info-col { flex: 1; }
.lesson-title { font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0; }
.lesson-status-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  margin-top: 4px;
  background: #f1f5f9;
  color: #64748b;
}

.status-present .lesson-status-badge { background: #f0fdf4; color: #18a058; }
.status-absent .lesson-status-badge { background: #fef2f2; color: #ef4444; }

/* Grades */
.cert-card {
  background: linear-gradient(135deg, #18a058 0%, #0c7a43 100%);
  border-radius: 24px;
  padding: 24px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.cert-label { font-size: 0.75rem; font-weight: 700; opacity: 0.8; text-transform: uppercase; }
.cert-score { font-size: 2.5rem; font-weight: 900; margin: 4px 0; }
.cert-score small { font-size: 1rem; opacity: 0.6; }
.cert-status { font-size: 0.85rem; font-weight: 600; margin: 0; }

.circular-progress {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.circular-progress::before {
  content: '';
  position: absolute;
  width: 58px;
  height: 58px;
  background: #18a058;
  border-radius: 50%;
}

.circular-progress span {
  position: relative;
  font-weight: 800;
  font-size: 1rem;
}

.exam-item {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.exam-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
.exam-name { font-weight: 800; color: #1e293b; }
.exam-weight { font-size: 0.75rem; color: #94a3b8; font-weight: 700; }
.exam-total { font-size: 1.2rem; font-weight: 800; color: #18a058; margin-bottom: 16px; }

.skill-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.skill-label { width: 70px; font-size: 0.75rem; font-weight: 700; color: #64748b; }
.skill-bar-wrap { flex: 1; height: 6px; background: #f1f5f9; border-radius: 3px; }
.skill-bar-fill { height: 100%; background: #18a058; border-radius: 3px; }
.skill-score { font-size: 0.75rem; font-weight: 800; color: #1e293b; }

/* Games */
.games-grid { display: flex; flex-direction: column; gap: 12px; }
.game-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.game-icon-wrap {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.game-icon-wrap.sprint { background: linear-gradient(135deg, #f59e0b, #ea580c); }
.game-icon-wrap.memory { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.game-icon-wrap.matching { background: linear-gradient(135deg, #10b981, #059669); }

.game-title { font-size: 1rem; font-weight: 800; color: #1e293b; margin: 0; }
.game-meta { display: flex; gap: 8px; margin-top: 4px; }
.game-type-label { font-size: 0.7rem; color: #94a3b8; font-weight: 700; }
.played-badge { font-size: 0.65rem; color: #18a058; background: #f0fdf4; padding: 1px 6px; border-radius: 4px; font-weight: 700; }

.empty-tab {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-tab ion-icon { font-size: 3rem; opacity: 0.2; margin-bottom: 12px; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
