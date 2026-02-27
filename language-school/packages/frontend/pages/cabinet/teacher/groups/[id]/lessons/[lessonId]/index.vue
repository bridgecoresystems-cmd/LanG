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
      <NButton type="primary" @click="goToEdit">
        <template #icon>
          <NIcon><component :is="EditIcon" /></NIcon>
        </template>
        Редактировать
      </NButton>
    </header>

    <div v-if="pending" class="loading-state">
      <NSpin size="large" />
    </div>

    <NCard v-else-if="lesson" bordered class="lesson-detail" :content-style="{ padding: 0 }">
      <div class="lesson-table-scroll">
        <table class="lesson-info-table">
          <thead>
            <tr>
              <th class="lesson-info-table__field">Поле</th>
              <th class="lesson-info-table__value">Значение</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="lesson-info-table__field">Название</td>
              <td class="lesson-info-table__value">{{ lesson.title || '—' }}</td>
            </tr>
            <tr>
              <td class="lesson-info-table__field">Дата</td>
              <td class="lesson-info-table__value">{{ formatDate(lesson.lesson_date) }}</td>
            </tr>
            <tr>
              <td class="lesson-info-table__field">Длительность</td>
              <td class="lesson-info-table__value">{{ lesson.duration_minutes || 90 }} мин</td>
            </tr>
            <tr>
              <td class="lesson-info-table__field">О чём урок</td>
              <td class="lesson-info-table__value pre-wrap">{{ lesson.description || '—' }}</td>
            </tr>
            <tr>
              <td class="lesson-info-table__field">Домашнее задание</td>
              <td class="lesson-info-table__value pre-wrap">{{ lesson.homework || '—' }}</td>
            </tr>
            <tr>
              <td class="lesson-info-table__field">Конспект</td>
              <td class="lesson-info-table__value pre-wrap">{{ lesson.lesson_plan || '—' }}</td>
            </tr>
            <tr>
              <td class="lesson-info-table__field">Заметки учителя</td>
              <td class="lesson-info-table__value pre-wrap">{{ lesson.lesson_notes || '—' }}</td>
            </tr>
            <tr>
              <td class="lesson-info-table__field">Материалы</td>
              <td class="lesson-info-table__value pre-wrap">{{ lesson.materials || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </NCard>

    <NEmpty v-else description="Урок не найден" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NH1, NButton, NIcon, NCard, NEmpty, NSpin } from 'naive-ui'
import { ChevronBackOutline as BackIcon, PencilOutline as EditIcon } from '@vicons/ionicons5'
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

const goBack = () => navigateTo(`/cabinet/teacher/groups/${groupId.value}/lessons`)
const goToEdit = () => navigateTo(`/cabinet/teacher/groups/${groupId.value}/lessons/${lessonId.value}/edit`)

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
  overflow: hidden;
}

.lesson-table-scroll {
  overflow-x: auto;
}

.lesson-info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.lesson-info-table th,
.lesson-info-table td {
  padding: 16px 20px;
  text-align: left;
  border-bottom: 1px solid var(--n-border-color);
  vertical-align: top;
}

.lesson-info-table tbody tr:last-child td {
  border-bottom: none;
}

.lesson-info-table tbody tr:hover td {
  background: var(--n-color-hover);
}

.lesson-info-table__field {
  width: 200px;
  min-width: 160px;
  font-weight: 600;
  color: var(--n-text-color-2);
  background: var(--n-color-hover);
}

.lesson-info-table__value {
  color: var(--n-text-color-1);
  line-height: 1.6;
}

.pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
