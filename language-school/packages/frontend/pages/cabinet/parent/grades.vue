<template>
  <div class="parent-grades-page">

    <!-- No child selected -->
    <div v-if="!selectedChildId" class="empty-state">
      <NIcon size="64" color="#d1d5db"><component :is="PeopleIcon" /></NIcon>
      <h3>Выберите ребёнка</h3>
      <p>Выберите ребёнка в боковом меню, чтобы посмотреть успеваемость</p>
    </div>

    <!-- No group selected -->
    <div v-else-if="!selectedGroupId" class="empty-state">
      <NIcon size="64" color="#d1d5db"><component :is="BookIcon" /></NIcon>
      <h3>Выберите группу</h3>
      <p>У ребёнка нет активных групп или группа не выбрана</p>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="grades-loading">
      <NSpin size="large" />
    </div>

    <!-- No scheme -->
    <div v-else-if="!data?.scheme" class="empty-state">
      <NIcon size="64" color="#d1d5db"><component :is="SchoolIcon" /></NIcon>
      <h3>Схема оценивания не назначена</h3>
      <p>Как только завуч настроит экзамены для группы, результаты появятся здесь</p>
    </div>

    <template v-else>
      <!-- Child name header -->
      <div class="child-header" v-if="selectedChild">
        <NTag type="success" size="medium" round>
          {{ selectedChild.full_name }}
        </NTag>
        <span class="child-header__group">{{ selectedGroupName }}</span>
      </div>

      <!-- Certificate score card -->
      <NCard class="cert-card" :bordered="false">
        <div class="cert-card__body">
          <div class="cert-card__left">
            <div class="cert-card__scheme">{{ data.scheme.name }}</div>
            <div class="cert-card__label">Балл сертификата</div>
            <div class="cert-card__score" :class="certClass">
              {{ data.certificateScore.toFixed(2) }}
              <span class="cert-card__max">/ 100</span>
            </div>
            <div class="cert-card__status" :class="certClass">
              <NIcon size="16"><component :is="certIcon" /></NIcon>
              {{ certLabel }}
            </div>
          </div>
          <div class="cert-card__right">
            <NProgress
              type="circle"
              :percentage="Math.min(100, data.certificateScore)"
              :color="certColor"
              :rail-color="'#f3f4f6'"
              :stroke-width="8"
            >
              <span class="cert-card__progress-text">{{ Math.round(data.certificateScore) }}%</span>
            </NProgress>
            <div class="cert-card__min-note">Минимум для сертификата: 60 б.</div>
          </div>
        </div>
      </NCard>

      <!-- Exam results list -->
      <div class="exams-list">
        <div
          v-for="item in data.items"
          :key="item.id"
          class="exam-card"
          :class="{ 'exam-card--taken': !!item.grade, 'exam-card--pending': !item.grade }"
        >
          <div class="exam-card__header">
            <div class="exam-card__header-left">
              <NTag :type="item.grade ? 'success' : 'default'" size="small" round>
                {{ item.grade ? 'Сдан' : 'Не сдан' }}
              </NTag>
              <span class="exam-card__name">{{ item.examTypeName }}</span>
            </div>
            <div class="exam-card__header-right">
              <span class="exam-card__weight">вес {{ item.weightPercentage }}%</span>
              <span v-if="item.contribution !== null" class="exam-card__contribution">
                +{{ item.contribution }} б. в сертификат
              </span>
            </div>
          </div>

          <template v-if="item.grade">
            <div class="exam-card__skills">
              <div class="skill-bar" v-for="skill in getSkills(item)" :key="skill.label">
                <div class="skill-bar__header">
                  <span class="skill-bar__label">{{ skill.label }}</span>
                  <span class="skill-bar__score">{{ skill.score }} / {{ skill.max }}</span>
                </div>
                <NProgress
                  :percentage="skill.max > 0 ? Math.round(skill.score / skill.max * 100) : 0"
                  :color="skill.score / skill.max >= 0.6 ? '#18a058' : '#f59e0b'"
                  :rail-color="'#f3f4f6'"
                  :height="6"
                  :show-indicator="false"
                />
              </div>
            </div>
            <div class="exam-card__total">
              <span>Итого:</span>
              <strong>{{ item.grade.totalScore }} / {{ item.totalMax }} б.</strong>
              <span class="exam-card__pct">({{ totalPct(item) }}%)</span>
            </div>
          </template>

          <div v-else class="exam-card__pending">
            Экзамен ещё не выставлен учителем
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NCard, NTag, NProgress, NIcon, NSpin } from 'naive-ui'
import {
  SchoolOutline as SchoolIcon,
  CheckmarkCircleOutline as PassIcon,
  CloseCircleOutline as FailIcon,
  TimeOutline as PendingIcon,
  PeopleOutline as PeopleIcon,
  BookOutline as BookIcon,
} from '@vicons/ionicons5'
import { useContextStore } from '~/stores/contextStore'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const contextStore = useContextStore()
const config = useRuntimeConfig()
const API = config.public.apiBase as string

const selectedChildId = computed(() => contextStore.selectedChildId)
const selectedGroupId = computed(() => contextStore.selectedGroupId)

const selectedChild = computed(() =>
  contextStore.availableChildren.find(c => c.id === selectedChildId.value) ?? null
)

const selectedGroupName = computed(() => {
  const g = contextStore.childGroups.find(g => g.id === selectedGroupId.value)
  return g ? `${g.name}${g.course_name ? ' · ' + g.course_name : ''}` : ''
})

const loading = ref(false)
const data = ref<any>(null)

const certColor = computed(() => {
  if (!data.value) return '#9ca3af'
  const s = data.value.certificateScore
  if (s >= 60) return '#18a058'
  if (s >= 40) return '#f59e0b'
  return '#ef4444'
})

const certClass = computed(() => {
  if (!data.value) return ''
  const s = data.value.certificateScore
  if (s >= 60) return 'cert--pass'
  if (s >= 40) return 'cert--warn'
  return 'cert--fail'
})

const certLabel = computed(() => {
  if (!data.value) return ''
  const s = data.value.certificateScore
  if (!data.value.allTaken) return 'В процессе обучения'
  if (s >= 60) return 'Сертификат получен!'
  return 'Не хватает баллов'
})

const certIcon = computed(() => {
  if (!data.value) return PendingIcon
  const s = data.value.certificateScore
  if (!data.value.allTaken) return PendingIcon
  return s >= 60 ? PassIcon : FailIcon
})

function getSkills(item: any) {
  return [
    { label: 'Writing', score: Number(item.grade.writing), max: item.writingMax },
    { label: 'Listening', score: Number(item.grade.listening), max: item.listeningMax },
    { label: 'Reading', score: Number(item.grade.reading), max: item.readingMax },
    { label: 'Speaking', score: Number(item.grade.speaking), max: item.speakingMax },
  ]
}

function totalPct(item: any) {
  if (!item.grade || !item.totalMax) return 0
  return Math.round(Number(item.grade.totalScore) / item.totalMax * 100)
}

async function loadData() {
  const childId = selectedChildId.value
  const groupId = selectedGroupId.value
  if (!childId || !groupId) {
    data.value = null
    return
  }
  loading.value = true
  try {
    const result = await $fetch<any>(
      `${API}/cabinet/parent/children/${childId}/grades/${groupId}`,
      { credentials: 'include' }
    )
    data.value = result
  } catch (e) {
    console.error('Failed to load child grades', e)
    data.value = null
  } finally {
    loading.value = false
  }
}

watch([selectedChildId, selectedGroupId], loadData, { immediate: true })
</script>

<style scoped>
.parent-grades-page { padding-bottom: 60px; }

.child-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.child-header__group {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.grades-loading {
  display: flex;
  justify-content: center;
  padding: 80px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 40px;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
  text-align: center;
  color: #6b7280;
}
.empty-state h3 { margin: 0; font-size: 18px; color: #374151; }
.empty-state p { margin: 0; font-size: 14px; }

/* Certificate card */
.cert-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 16px;
  margin-bottom: 24px;
}
.cert-card__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.cert-card__left { flex: 1; min-width: 200px; }
.cert-card__scheme { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.cert-card__label { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
.cert-card__score {
  font-size: 48px;
  font-weight: 900;
  line-height: 1;
  color: #6b7280;
}
.cert-card__max { font-size: 20px; font-weight: 400; color: #9ca3af; }
.cert--pass { color: #15803d !important; }
.cert--warn { color: #d97706 !important; }
.cert--fail { color: #dc2626 !important; }
.cert-card__status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  margin-top: 8px;
}
.cert-card__right { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.cert-card__progress-text { font-size: 18px; font-weight: 700; color: #374151; }
.cert-card__min-note { font-size: 11px; color: #9ca3af; text-align: center; }

/* Exam cards */
.exams-list { display: flex; flex-direction: column; gap: 16px; }

.exam-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s;
}
.exam-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.exam-card--pending { opacity: 0.7; border-style: dashed; }

.exam-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.exam-card__header-left { display: flex; align-items: center; gap: 10px; }
.exam-card__name { font-size: 16px; font-weight: 700; color: #111827; }
.exam-card__header-right { display: flex; align-items: center; gap: 12px; }
.exam-card__weight { font-size: 12px; color: #6b7280; }
.exam-card__contribution { font-size: 13px; font-weight: 600; color: #15803d; background: #f0fdf4; padding: 2px 8px; border-radius: 6px; }

.exam-card__skills { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.skill-bar__header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.skill-bar__label { font-size: 13px; color: #4b5563; font-weight: 500; }
.skill-bar__score { font-size: 13px; color: #374151; font-weight: 600; }

.exam-card__total {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  font-size: 15px;
  color: #374151;
}
.exam-card__pct { font-size: 13px; color: #6b7280; }

.exam-card__pending {
  font-size: 13px;
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  padding: 12px 0;
}
</style>
