<template>
  <div class="cabinet-page">
    <header class="page-header">
      <NButton quaternary circle @click="goBack">
        <template #icon>
          <NIcon><component :is="BackIcon" /></NIcon>
        </template>
      </NButton>
      <div class="page-header__text">
        <NH1 class="page-header__title">{{ lesson?.title || 'Урок' }}</NH1>
        <p class="page-header__meta">
          {{ formatDate(lesson?.lesson_date) }} · {{ lesson?.duration_minutes || 90 }} мин
        </p>
      </div>
    </header>

    <div v-if="pending" class="loading-state">
      <NSpin size="large" />
    </div>

    <NCard v-else-if="lesson" bordered class="lesson-detail">
      <div class="detail-section">
        <h3 class="detail-label">О чём урок</h3>
        <p class="detail-value">{{ lesson.description || '—' }}</p>
      </div>

      <div class="detail-section">
        <h3 class="detail-label">Домашнее задание</h3>
        <p class="detail-value pre-wrap">{{ lesson.homework || '—' }}</p>
      </div>

      <div v-if="lesson.materials" class="detail-section">
        <h3 class="detail-label">Материалы</h3>
        <pre class="detail-value">{{ lesson.materials }}</pre>
      </div>
    </NCard>

    <NEmpty v-else description="Урок не найден" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NH1, NButton, NIcon, NCard, NEmpty, NSpin } from 'naive-ui'
import { ChevronBackOutline as BackIcon } from '@vicons/ionicons5'
import { useCabinetLessons } from '~/composables/useCabinetLessons'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth', key: (route) => route.fullPath })

const route = useRoute()
const groupId = computed(() => route.params.id as string)
const lessonId = computed(() => parseInt(route.params.lessonId as string))
const lessonsApi = useCabinetLessons()

const lesson = ref<any>(null)
const pending = ref(true)

const loadLesson = async () => {
  pending.value = true
  try {
    lesson.value = await lessonsApi.getById(lessonId.value)
  } catch (e) {
    console.error(e)
    lesson.value = null
  } finally {
    pending.value = false
  }
}

const goBack = () => navigateTo(`/cabinet/student/groups/${groupId.value}/lessons`)

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

onMounted(loadLesson)
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.page-header__text {
  flex: 1;
}

.page-header__title {
  margin: 0 0 4px;
  font-weight: 700;
}

.page-header__meta {
  margin: 0;
  font-size: 0.95rem;
  color: var(--n-text-color-3);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.lesson-detail {
  border-radius: 12px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-label {
  margin: 0 0 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--n-text-color-2);
}

.detail-value {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
}

.pre-wrap {
  white-space: pre-wrap;
}
</style>
