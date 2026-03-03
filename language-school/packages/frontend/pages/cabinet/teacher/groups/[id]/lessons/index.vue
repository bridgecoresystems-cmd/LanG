<template>
  <div class="lessons-page">
    <!-- Header -->
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Уроки и материалы</NH1>
        <p class="page-header__subtitle">Журнал занятий группы — нажмите на урок для просмотра</p>
      </div>
    </header>

    <!-- Stats bar -->
    <div v-if="!pending && lessons.length > 0" class="stats-bar">
      <div class="stat-card">
        <span class="stat-card__value">{{ lessons.length }}</span>
        <span class="stat-card__label">Всего уроков</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value stat-card__value--green">{{ pastLessons }}</span>
        <span class="stat-card__label">Проведено</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value stat-card__value--blue">{{ upcomingLessons }}</span>
        <span class="stat-card__label">Предстоит</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value stat-card__value--orange">{{ avgAttendance }}</span>
        <span class="stat-card__label">Ср. посещаемость</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="lessons-loading">
      <NSpin size="large" />
    </div>

    <!-- Table -->
    <NCard v-else-if="lessons.length > 0" :content-style="{ padding: 0 }" class="lessons-card">
      <NDataTable
        :columns="columns"
        :data="lessons"
        :bordered="false"
        :single-line="false"
        size="medium"
        :scroll-x="640"
        :row-props="rowProps"
        :row-key="(row: any) => row.id"
        :row-class-name="(row: any) => getLessonStatus(row.lesson_date) === 'past' ? 'row-past' : 'row-future'"
        class="lessons-table"
      />
    </NCard>

    <!-- Empty -->
    <div v-else class="empty-state">
      <NEmpty description="Уроков пока не запланировано">
        <template #icon>
          <NIcon size="48"><component :is="CalendarIcon" /></NIcon>
        </template>
      </NEmpty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NH1, NIcon, NEmpty, NSpin, NCard, NDataTable, NButton, NTag, NProgress, NTooltip, NEllipsis
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import {
  CalendarOutline as CalendarIcon,
  PencilOutline as EditIcon,
  TimeOutline as TimeIcon,
} from '@vicons/ionicons5'
import { useCabinetLessons } from '~/composables/useCabinetLessons'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const groupId = computed(() => route.params.id as string)
const lessonsApi = useCabinetLessons()
const lessons = ref<any[]>([])
const pending = ref(true)

// --- Stats ---
const today = new Date()
today.setHours(0, 0, 0, 0)

const pastLessons = computed(() =>
  lessons.value.filter(l => new Date(l.lesson_date) < today).length
)
const upcomingLessons = computed(() =>
  lessons.value.filter(l => new Date(l.lesson_date) >= today).length
)
const avgAttendance = computed(() => {
  const withData = lessons.value.filter(
    l => l.attended_count !== null && l.total_students > 0
  )
  if (!withData.length) return '—'
  const avg = withData.reduce((acc, l) => acc + (l.attended_count / l.total_students) * 100, 0) / withData.length
  return `${Math.round(avg)}%`
})

// --- Helpers ---
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const formatDuration = (minutes: number) => {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}ч ${m}м`
  if (h) return `${h}ч`
  return `${m}м`
}

type LessonStatus = 'past' | 'today' | 'upcoming'
const getLessonStatus = (dateStr: string): LessonStatus => {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  if (d.getTime() === t.getTime()) return 'today'
  if (d < t) return 'past'
  return 'upcoming'
}

const statusConfig: Record<LessonStatus, { label: string; type: 'success' | 'info' | 'warning' }> = {
  past:     { label: 'Проведён',   type: 'success' },
  today:    { label: 'Сегодня',    type: 'warning' },
  upcoming: { label: 'Предстоит',  type: 'info' },
}

const getAttendanceColor = (attended: number, total: number): string => {
  if (!total) return '#999'
  const pct = attended / total
  if (pct >= 0.8) return '#18a058'
  if (pct >= 0.5) return '#f0a020'
  return '#d03050'
}

// --- Columns ---
const columns: DataTableColumns<any> = [
  {
    title: '#',
    key: 'index',
    width: 52,
    align: 'center',
    render: (_row, index) => h('span', { class: 'col-index' }, String(index + 1)),
  },
  {
    title: 'Урок',
    key: 'title',
    minWidth: 180,
    render: (row) => h(NEllipsis, { style: 'max-width: 280px', class: 'col-title' }, { default: () => row.title }),
  },
  {
    title: 'Домашнее задание',
    key: 'homework',
    minWidth: 160,
    render: (row) => row.homework
      ? h(NTooltip, null, {
          trigger: () => h(NEllipsis, { style: 'max-width: 240px', class: 'col-hw' }, { default: () => row.homework }),
          default: () => row.homework,
        })
      : h('span', { class: 'col-hw--empty' }, '—'),
  },
  {
    title: 'Дата',
    key: 'lesson_date',
    width: 120,
    render: (row) => h('div', { class: 'col-date' }, [
      h(NIcon, { size: 14, class: 'col-date__icon' }, { default: () => h(CalendarIcon) }),
      h('span', null, formatDate(row.lesson_date)),
    ]),
  },
  {
    title: 'Длит.',
    key: 'duration_minutes',
    width: 90,
    align: 'center',
    render: (row) => h('div', { class: 'col-duration' }, [
      h(NIcon, { size: 13, class: 'col-date__icon' }, { default: () => h(TimeIcon) }),
      h('span', null, formatDuration(row.duration_minutes)),
    ]),
  },
  {
    title: 'Статус',
    key: 'status',
    width: 110,
    align: 'center',
    render: (row) => {
      const s = getLessonStatus(row.lesson_date)
      const cfg = statusConfig[s]
      return h(NTag, { type: cfg.type, size: 'small', round: true, bordered: false }, { default: () => cfg.label })
    },
  },
  {
    title: 'Посещаемость',
    key: 'attendance',
    width: 140,
    align: 'center',
    render: (row) => {
      const attended = row.attended_count
      const total = row.total_students ?? 0
      if (attended === null || !total) {
        return h('span', { class: 'col-attendance--empty' }, `— / ${total || '?'}`)
      }
      const color = getAttendanceColor(attended, total)
      const pct = Math.round((attended / total) * 100)
      return h(NTooltip, null, {
        trigger: () => h('div', { class: 'col-attendance' }, [
          h('span', { class: 'col-attendance__label', style: `color: ${color}` }, `${attended} / ${total}`),
          h(NProgress, {
            type: 'line',
            percentage: pct,
            color,
            railColor: 'var(--n-border-color)',
            height: 4,
            showIndicator: false,
            style: 'margin-top: 4px',
          }),
        ]),
        default: () => `${attended} из ${total} присутствовали (${pct}%)`,
      })
    },
  },
  {
    title: '',
    key: 'actions',
    width: 56,
    align: 'center',
    render: (row) => h('div', { class: 'edit-btn-wrap' }, [
      h(NButton, {
        circle: true,
        quaternary: true,
        size: 'small',
        title: 'Редактировать',
        onClick: (e: Event) => {
          e.stopPropagation()
          navigateTo(`/cabinet/teacher/groups/${groupId.value}/lessons/${row.id}/edit`)
        },
      }, { icon: () => h(NIcon, null, { default: () => h(EditIcon) }) }),
    ]),
  },
]

const rowProps = (row: any) => ({
  style: 'cursor: pointer;',
  onClick: (e: Event) => {
    if ((e.target as HTMLElement).closest('.edit-btn-wrap')) return
    navigateTo(`/cabinet/teacher/groups/${groupId.value}/lessons/${row.id}`)
  },
})

// --- Load ---
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
.lessons-page {
  padding-bottom: 48px;
}

/* Header */
.page-header {
  margin-bottom: 24px;
}
.page-header__title {
  margin: 0 0 6px;
  font-weight: 700;
}
.page-header__subtitle {
  margin: 0;
  color: var(--n-text-color-3);
  font-size: 0.875rem;
}

/* Stats */
.stats-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.stat-card {
  flex: 1;
  min-width: 100px;
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 10px;
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-card__value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--n-text-color-1);
}
.stat-card__value--green  { color: #18a058; }
.stat-card__value--blue   { color: #2080f0; }
.stat-card__value--orange { color: #f0a020; }
.stat-card__label {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  font-weight: 500;
}

/* Card */
.lessons-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* Table overrides — как у студента */
.lessons-table :deep(.n-data-table-th) {
  background: #f8fafc !important;
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  padding: 12px 16px !important;
  white-space: nowrap;
  border-bottom: 1px solid #e2e8f0;
}
.lessons-table :deep(.n-data-table-td) {
  padding: 14px 16px !important;
  font-size: 0.875rem;
  border-bottom: 1px solid #f1f5f9;
}
.lessons-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: #f8fafc !important;
}
.lessons-table :deep(.n-data-table-tr) {
  cursor: pointer;
  transition: background 0.15s ease;
}

/* Прошедшие уроки — мягкий тёплый оттенок */
.lessons-table :deep(.row-past .n-data-table-td) {
  background: #fffbeb !important;
}
.lessons-table :deep(.row-past:hover .n-data-table-td) {
  background: #fef3c7 !important;
}

/* Предстоящие уроки — мягкий прохладный оттенок */
.lessons-table :deep(.row-future .n-data-table-td) {
  background: #f0fdf4 !important;
}
.lessons-table :deep(.row-future:hover .n-data-table-td) {
  background: #dcfce7 !important;
}

/* Columns */
.col-index {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  font-weight: 600;
}

.col-title {
  font-weight: 600;
  color: var(--n-text-color-1);
}

.col-hw {
  color: var(--n-text-color-2);
  font-size: 0.85rem;
}
.col-hw--empty {
  color: var(--n-text-color-3);
  font-size: 0.85rem;
}

.col-date,
.col-duration {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--n-text-color-2);
}
.col-date__icon {
  opacity: 0.55;
  flex-shrink: 0;
}

.col-attendance {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}
.col-attendance__label {
  font-weight: 700;
  font-size: 0.875rem;
  line-height: 1;
}
.col-attendance--empty {
  color: var(--n-text-color-3);
  font-size: 0.85rem;
}

.edit-btn-wrap {
  display: inline-flex;
}

/* Loading / Empty */
.lessons-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}
.empty-state {
  padding: 80px 0;
  text-align: center;
}

/* Dark mode */
.dark .lessons-table :deep(.n-data-table-th) {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #94a3b8;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.dark .lessons-table :deep(.row-past .n-data-table-td) {
  background: rgba(251, 191, 36, 0.08) !important;
}

.dark .lessons-table :deep(.row-past:hover .n-data-table-td) {
  background: rgba(251, 191, 36, 0.12) !important;
}

.dark .lessons-table :deep(.row-future .n-data-table-td) {
  background: rgba(34, 197, 94, 0.08) !important;
}

.dark .lessons-table :deep(.row-future:hover .n-data-table-td) {
  background: rgba(34, 197, 94, 0.12) !important;
}
</style>
