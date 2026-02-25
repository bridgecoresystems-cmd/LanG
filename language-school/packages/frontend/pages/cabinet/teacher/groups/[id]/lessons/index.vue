<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Уроки и материалы</NH1>
        <p class="page-header__subtitle">Список занятий группы. Клик — просмотр, карандаш — редактирование</p>
      </div>
    </header>

    <div v-if="pending" class="lessons-loading">
      <NSpin size="large" />
    </div>

    <div v-else-if="lessons.length > 0" class="lessons-list">
      <NuxtLink
        v-for="lesson in lessons"
        :key="lesson.id"
        :to="`/cabinet/teacher/groups/${groupId}/lessons/${lesson.id}`"
        class="lesson-row"
      >
        <span class="lesson-row__title">{{ lesson.title }}</span>
        <span class="lesson-row__date">{{ formatDate(lesson.lesson_date) }}</span>
        <NuxtLink
          :to="`/cabinet/teacher/groups/${groupId}/lessons/${lesson.id}/edit`"
          class="lesson-row__edit-link"
          @click.stop
        >
          <NButton circle quaternary size="small">
            <template #icon>
              <NIcon><component :is="EditIcon" /></NIcon>
            </template>
          </NButton>
        </NuxtLink>
      </NuxtLink>
    </div>

    <div v-else class="empty-state">
      <NEmpty description="Уроков пока не запланировано">
        <template #icon>
          <NIcon><component :is="CalendarIcon" /></NIcon>
        </template>
      </NEmpty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NH1, NButton, NIcon, NEmpty, NSpin } from 'naive-ui'
import { CalendarOutline as CalendarIcon, PencilOutline as EditIcon } from '@vicons/ionicons5'
import { useCabinetLessons } from '~/composables/useCabinetLessons'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const groupId = computed(() => route.params.id as string)
const lessonsApi = useCabinetLessons()
const lessons = ref<any[]>([])
const pending = ref(true)

const loadLessons = async () => {
  pending.value = true
  try {
    lessons.value = await lessonsApi.getList({ group_id: parseInt(groupId.value) })
  } catch (e) {
    console.error(e)
  } finally {
    pending.value = false
  }
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

.lessons-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lesson-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: var(--n-color-modal);
  border-radius: 12px;
  border: 1px solid var(--n-border-color);
  cursor: pointer;
  transition: background 0.15s ease;
  text-decoration: none;
  color: inherit;
}

.lesson-row:hover {
  background: var(--n-color-hover);
}

.lesson-row__title {
  flex: 1;
  font-weight: 600;
  font-size: 1rem;
}

.lesson-row__date {
  font-size: 0.9rem;
  color: var(--n-text-color-3);
}

.lesson-row__edit-link {
  flex-shrink: 0;
  display: flex;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}
</style>
