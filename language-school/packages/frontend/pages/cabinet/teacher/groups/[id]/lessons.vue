<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Уроки и материалы</NH1>
        <p class="page-header__subtitle">Список занятий и учебные материалы группы</p>
      </div>
      <div class="page-header__actions">
        <NButton
          v-if="isTeacher"
          type="primary"
          size="large"
          @click="isAddModalOpen = true"
        >
          <template #icon>
            <NIcon><component :is="AddIcon" /></NIcon>
          </template>
          Добавить урок
        </NButton>
      </div>
    </header>

    <div v-if="pending" class="grid grid-cols-1 gap-6">
      <NSkeleton v-for="i in 3" :key="i" :height="120" :sharp="false" />
    </div>

    <div v-else-if="lessons.length > 0" class="grid grid-cols-1 gap-6">
      <NCard
        v-for="lesson in lessons"
        :key="lesson.id"
        class="cabinet-card lesson-card"
        hoverable
      >
        <div class="lesson-card__content">
          <div class="lesson-card__main">
            <div class="lesson-card__date">
              <NBadge type="info" :value="formatDate(lesson.lesson_date)" />
              <span class="lesson-card__duration">{{ lesson.duration_minutes }} мин</span>
            </div>
            <h3 class="lesson-card__title">{{ lesson.title }}</h3>
            <p class="lesson-card__desc">{{ lesson.description }}</p>
          </div>
          
          <div class="lesson-card__actions">
            <NSpace>
              <NButton
                v-if="lesson.homework"
                type="warning"
                secondary
                @click="showHomework(lesson)"
              >
                <template #icon>
                  <NIcon><component :is="HomeIcon" /></NIcon>
                </template>
                ДЗ
              </NButton>
              <NButton
                v-if="isTeacher"
                circle
                quaternary
                @click="editLesson(lesson)"
              >
                <template #icon>
                  <NIcon><component :is="EditIcon" /></NIcon>
                </template>
              </NButton>
            </NSpace>
          </div>
        </div>
      </NCard>
    </div>

    <div v-else class="empty-state">
      <NEmpty description="Уроков пока не запланировано">
        <template #icon>
          <NIcon><component :is="CalendarIcon" /></NIcon>
        </template>
      </NEmpty>
    </div>

    <!-- Модалка ДЗ -->
    <NModal v-model:show="isHomeworkModalOpen" preset="card" style="width: 500px;" title="Домашнее задание">
      <template #header-extra>
        <NIcon size="20" class="text-warning"><component :is="HomeIcon" /></NIcon>
      </template>
      <div class="homework-content">
        <div class="homework-title">{{ selectedLesson?.title }}</div>
        <div class="homework-text">{{ selectedLesson?.homework }}</div>
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  NH1, NButton, NIcon, NCard, NBadge, NSpace, NModal, NEmpty, NSkeleton 
} from 'naive-ui'
import { 
  AddOutline as AddIcon, 
  CalendarOutline as CalendarIcon,
  HomeOutline as HomeIcon,
  PencilOutline as EditIcon
} from '@vicons/ionicons5'
import { useCabinetLessons } from '~/composables/useCabinetLessons'
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ 
  layout: 'cabinet', 
  middleware: 'cabinet-auth' 
})

const route = useRoute()
const groupId = computed(() => parseInt(route.params.id as string))
const lessonsApi = useCabinetLessons()
const authStore = useAuthStore()

const isTeacher = computed(() => authStore.user?.role === 'TEACHER')
const lessons = ref<any[]>([])
const pending = ref(true)
const isHomeworkModalOpen = ref(false)
const selectedLesson = ref<any>(null)
const isAddModalOpen = ref(false)

const loadLessons = async () => {
  pending.value = true
  try {
    const all = await lessonsApi.getList({ group_id: groupId.value })
    lessons.value = all
  } catch (e) {
    console.error(e)
  } finally {
    pending.value = false
  }
}

const showHomework = (lesson: any) => {
  selectedLesson.value = lesson
  isHomeworkModalOpen.value = true
}

const editLesson = (lesson: any) => {
  // Логика редактирования
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

loadLessons()
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.page-header__title {
  margin: 0 0 8px;
  font-weight: 700;
}

.page-header__subtitle {
  margin: 0;
  color: var(--n-text-color-3);
}

.cabinet-card {
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.lesson-card__content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
}

.lesson-card__date {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.lesson-card__duration {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.lesson-card__title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--n-text-color-1);
}

.lesson-card__desc {
  margin: 0;
  color: var(--n-text-color-2);
  font-size: 0.95rem;
}

.homework-content {
  padding: 8px;
}

.homework-title {
  font-weight: 700;
  margin-bottom: 12px;
  font-size: 1.1rem;
}

.homework-text {
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--n-text-color-2);
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}
</style>
