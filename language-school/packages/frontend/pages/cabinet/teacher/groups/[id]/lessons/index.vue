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

    <NCard v-else-if="lessons.length > 0" bordered class="lessons-card" :content-style="{ padding: 0 }">
      <div class="lessons-table-scroll">
        <NDataTable
          :columns="columns"
          :data="lessons"
          :bordered="true"
          :single-line="false"
          size="small"
          :scroll-x="480"
          :row-props="(row: any) => ({
            style: 'cursor: pointer;',
            onClick: (e: Event) => {
              const target = (e.target as HTMLElement).closest('.edit-btn-wrap')
              if (!target) navigateTo(`/cabinet/teacher/groups/${groupId}/lessons/${row.id}`)
            }
          })"
          :row-key="(row: any) => row.id"
          class="lessons-data-table clickable-rows"
        />
      </div>
    </NCard>

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
import { ref, computed, h } from 'vue'
import { NH1, NIcon, NEmpty, NSpin, NCard, NDataTable, NButton } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CalendarOutline as CalendarIcon, PencilOutline as EditIcon } from '@vicons/ionicons5'
import { useCabinetLessons } from '~/composables/useCabinetLessons'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const groupId = computed(() => route.params.id as string)
const lessonsApi = useCabinetLessons()
const lessons = ref<any[]>([])
const pending = ref(true)

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const columns: DataTableColumns<any> = [
  {
    title: 'Урок',
    key: 'title',
    minWidth: 200,
    ellipsis: { tooltip: true },
    render: (row) => h('span', { class: 'lesson-title' }, row.title),
  },
  {
    title: 'Дата',
    key: 'lesson_date',
    width: 110,
    render: (row) => formatDate(row.lesson_date),
  },
  {
    title: 'Действия',
    key: 'actions',
    width: 100,
    align: 'center',
    render: (row) => h('div', { class: 'edit-btn-wrap' }, [
      h(NButton, {
        circle: true,
        quaternary: true,
        size: 'small',
        onClick: (e: Event) => {
          e.stopPropagation()
          navigateTo(`/cabinet/teacher/groups/${groupId.value}/lessons/${row.id}/edit`)
        },
      }, { icon: () => h(NIcon, null, { default: () => h(EditIcon) }) }),
    ]),
  },
]

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

.lesson-title {
  font-weight: 600;
  color: var(--n-primary-color);
}

.lesson-title:hover {
  text-decoration: underline;
}

.lessons-card {
  border-radius: 12px;
  overflow: hidden;
}

.lessons-card :deep(.n-card__content) {
  padding: 0;
}

.lessons-table-scroll {
  overflow-x: auto;
}

.lessons-data-table :deep(.n-data-table-th) {
  background: var(--n-color-hover) !important;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--n-text-color-2);
  padding: 14px 20px !important;
}

.lessons-data-table :deep(.n-data-table-td) {
  font-size: 0.9rem;
  padding: 16px 20px !important;
}

.clickable-rows :deep(.n-data-table-tr) {
  cursor: pointer;
}

.lessons-data-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: var(--n-color-hover) !important;
}

.edit-btn-wrap {
  display: inline-flex;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}
</style>
