<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Уроки и материалы</NH1>
        <p class="page-header__subtitle">Список занятий с посещаемостью. Клик — просмотр урока</p>
      </div>
    </header>

    <div v-if="pending" class="lessons-loading">
      <NSpin size="large" />
    </div>

    <NCard v-else-if="rows.length > 0" bordered class="lessons-card" :content-style="{ padding: 0 }">
      <div class="lessons-table-scroll">
        <NDataTable
          :columns="columns"
          :data="rows"
          :bordered="true"
          :single-line="false"
          size="small"
          :scroll-x="640"
          :row-props="(row) => ({
            style: 'cursor: pointer;',
            onClick: () => navigateTo(`/cabinet/student/groups/${groupId}/lessons/${row.id}`)
          })"
          :row-key="(row) => row.id"
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
import { NH1, NIcon, NEmpty, NSpin, NCard, NDataTable, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { CalendarOutline as CalendarIcon } from '@vicons/ionicons5'
import { useCabinetLessons } from '~/composables/useCabinetLessons'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const STATUS_LABELS: Record<string, string> = {
  present: 'Присутствует',
  absent: 'Отсутствует',
  late: 'Опоздал',
  excused: 'Уважительная',
}

const route = useRoute()
const groupId = computed(() => route.params.id as string)
const lessonsApi = useCabinetLessons()
const rows = ref<any[]>([])
const pending = ref(true)

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const formatTime = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—')

const loadData = async () => {
  pending.value = true
  try {
    const attendanceRaw = await lessonsApi.getAttendance(parseInt(groupId.value)).catch(() => [])
    const attendance = Array.isArray(attendanceRaw) ? attendanceRaw : []
    const now = new Date()
    rows.value = attendance.map((a: any) => {
      const lid = a.lesson_id ?? a.lessonId
      const lessonDate = new Date(a.lesson_date ?? a.lessonDate ?? 0)
      const isFuture = lessonDate > now
      const rawStatus = a.status
      const status = (rawStatus && rawStatus !== '—' && STATUS_LABELS[rawStatus]) ? rawStatus : null
      return {
        id: lid,
        title: a.lesson_title ?? a.lessonTitle ?? '—',
        lesson_date: a.lesson_date ?? a.lessonDate,
        isFuture,
        statusLabel: isFuture ? '—' : (status ? STATUS_LABELS[status] : '—'),
        status,
        entryTime: isFuture ? '—' : formatTime(a.entry_time ?? a.entryTime ?? null),
        exitTime: isFuture ? '—' : formatTime(a.exit_time ?? a.exitTime ?? null),
        notes: isFuture ? '—' : (a.notes || '—'),
      }
    })
    if (rows.value.length === 0) {
      const lessons = await lessonsApi.getList({ group_id: parseInt(groupId.value) }).catch(() => [])
      const lessonList = Array.isArray(lessons) ? lessons : []
      rows.value = lessonList.map((l: any) => {
        const lessonDate = new Date(l.lesson_date ?? 0)
        const isFuture = lessonDate > now
        return {
          id: l.id,
          title: l.title ?? '—',
          lesson_date: l.lesson_date,
          isFuture,
          statusLabel: '—',
          status: null,
          entryTime: '—',
          exitTime: '—',
          notes: '—',
        }
      })
    }
  } catch (e) {
    console.error(e)
    rows.value = []
  } finally {
    pending.value = false
  }
}

const columns: DataTableColumns<any> = [
  {
    title: 'Урок',
    key: 'title',
    minWidth: 140,
    ellipsis: { tooltip: true },
    render: (row) => h('span', { class: 'lesson-title' }, row.title),
  },
  {
    title: 'Дата',
    key: 'lesson_date',
    width: 100,
    render: (row) => formatDate(row.lesson_date),
  },
  {
    title: 'Статус',
    key: 'statusLabel',
    width: 130,
    render: (row) => {
      const label = row.statusLabel
      if (row.status === 'present') return h(NTag, { type: 'success', size: 'small' }, () => label)
      if (row.status === 'absent') return h(NTag, { type: 'error', size: 'small' }, () => label)
      if (row.status === 'late') return h(NTag, { type: 'warning', size: 'small' }, () => label)
      if (row.status === 'excused') return h(NTag, { type: 'info', size: 'small' }, () => label)
      return h('span', { class: 'text-muted' }, label)
    },
  },
  {
    title: 'Вход',
    key: 'entryTime',
    width: 80,
    align: 'center',
    render: (row) => h('span', { class: row.isFuture ? 'text-muted' : '' }, row.entryTime),
  },
  {
    title: 'Выход',
    key: 'exitTime',
    width: 80,
    align: 'center',
    render: (row) => h('span', { class: row.isFuture ? 'text-muted' : '' }, row.exitTime),
  },
  {
    title: 'Заметка',
    key: 'notes',
    minWidth: 120,
    ellipsis: { tooltip: true },
    render: (row) => h('span', { class: row.isFuture ? 'text-muted' : '' }, row.notes),
  },
]

loadData()
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
}

.page-header {
  margin-bottom: 28px;
}

.page-header__title {
  margin: 0 0 6px;
  font-weight: 700;
  font-size: 1.5rem;
}

.page-header__subtitle {
  margin: 0;
  color: var(--n-text-color-3);
  font-size: 0.9rem;
}

.lessons-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
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
  min-width: 0;
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

.lessons-data-table :deep(.n-data-table-base-table) {
  min-width: 640px;
}

.clickable-rows :deep(.n-data-table-tr) {
  cursor: pointer;
}

.lessons-data-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: var(--n-color-hover) !important;
}

.lesson-title {
  font-weight: 600;
  color: var(--n-primary-color);
}

.lesson-title:hover {
  text-decoration: underline;
}

.text-muted {
  color: var(--n-text-color-3);
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}
</style>
