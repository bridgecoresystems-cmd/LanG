<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Группы</NH2>
        <p class="page-header__subtitle">Управление учебными группами</p>
      </div>
      <div class="page-header__actions">
        <NButton type="primary" size="large" @click="navigateTo('/cabinet/head-teacher/groups/add')">
          <template #icon><NIcon><component :is="AddIcon" /></NIcon></template>
          Добавить группу
        </NButton>
      </div>
    </header>

    <NCard class="cabinet-card search-card">
      <NGrid cols="1 s:3" :x-gap="16" :y-gap="16">
        <NGi><NInput v-model:value="searchQuery" placeholder="Поиск..." clearable size="large"><template #prefix><NIcon><component :is="SearchIcon" /></NIcon></template></NInput></NGi>
        <NGi><NSelect v-model:value="courseFilter" :options="courseOptions" placeholder="Все курсы" clearable size="large" /></NGi>
        <NGi><NSelect v-model:value="statusFilter" :options="statusOptions" placeholder="Статус" clearable size="large" /></NGi>
      </NGrid>
    </NCard>

    <div v-if="loading" class="loading-state"><NSpin size="large" /></div>
    <NAlert v-else-if="error" type="error" closable>{{ error }}</NAlert>
    <NCard v-else class="cabinet-card table-card" :content-style="{ padding: 0 }">
      <NDataTable
        :columns="columns"
        :data="filteredItems"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
        :row-props="(row) => ({ style: 'cursor: pointer;', onClick: () => navigateTo(`/cabinet/head-teacher/groups/${row.id}`) })"
        :row-key="(row) => row.id"
        class="cabinet-data-table clickable-rows"
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useCabinetGroups } from '~/composables/useCabinetGroups'
import { useCabinetCourses } from '~/composables/useCabinetCourses'
import { NCard, NButton, NInput, NSelect, NIcon, NH2, NDataTable, NTag, NSpin, NAlert, NGrid, NGi } from 'naive-ui'
import { AddOutline as AddIcon, SearchOutline as SearchIcon, PencilOutline as EditIcon, TrashOutline as DeleteIcon, PeopleOutline as PeopleIcon, BarChartOutline as ChartIcon } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })
const authStore = useAuthStore()
const message = useMessage()
const { getList, remove } = useCabinetGroups()
const { getList: getCourses } = useCabinetCourses()

const items = ref<any[]>([])
const courses = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const courseFilter = ref<number | null>(null)
const statusFilter = ref<string | null>(null)

const courseOptions = computed(() => courses.value.map((c) => ({ label: c.name, value: c.id })))
const statusOptions = [{ label: 'Активные', value: 'active' }, { label: 'Неактивные', value: 'inactive' }]

const filteredItems = computed(() => {
  let f = items.value
  const q = searchQuery.value?.trim().toLowerCase()
  if (q) f = f.filter((r) => r.name?.toLowerCase().includes(q) || r.course_name?.toLowerCase().includes(q) || r.teacher_name?.toLowerCase().includes(q))
  if (courseFilter.value) f = f.filter((r) => r.course_id === courseFilter.value)
  if (statusFilter.value === 'active') f = f.filter((r) => r.is_active)
  if (statusFilter.value === 'inactive') f = f.filter((r) => !r.is_active)
  return f
})

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 70 },
  { title: 'Название', key: 'name', render: (r) => h('span', { class: 'font-semibold' }, r.name) },
  { title: 'Курс', key: 'course_name' },
  { title: 'Учитель', key: 'teacher_name', render: (r) => r.teacher_name || '—' },
  { title: 'Макс. учеников', key: 'max_students', width: 120 },
  { title: 'Расписание', key: 'time_slot', width: 120, render: (r) => r.time_slot ? ({ A: '08:00-11:00', B: '13:00-17:00', C: '17:00-19:00' }[r.time_slot] || r.time_slot) : '—' },
  { title: 'Статус', key: 'is_active', width: 100, render: (r) => h(NTag, { type: r.is_active ? 'success' : 'error', round: true, size: 'small' }, () => (r.is_active ? 'Активна' : 'Неактивна')) },
  {
    title: 'Статистика',
    key: 'stats',
    width: 100,
    render: (row) => h(NButton, {
      size: 'small',
      quaternary: true,
      type: 'primary',
      onClick: (e: Event) => {
        e.stopPropagation()
        navigateTo(`/cabinet/head-teacher/courses/stats/${row.course_id}`)
      }
    }, { icon: () => h(ChartIcon) })
  },
  {
    title: '',
    key: 'actions',
    width: 100,
    align: 'right',
    render: (row) =>
      h('div', { class: 'flex justify-end gap-1' }, [
        h(NButton, { size: 'small', circle: true, quaternary: true, type: 'info', onClick: (e: Event) => { e.stopPropagation(); navigateTo(`/cabinet/head-teacher/groups/${row.id}`) } }, { icon: () => h(EditIcon) }),
        h(NButton, { size: 'small', circle: true, quaternary: true, type: 'error', onClick: (e: Event) => { e.stopPropagation(); handleDelete(row.id) } }, { icon: () => h(DeleteIcon) }),
      ]),
  },
]

async function handleDelete(id: number) {
  if (!confirm('Удалить группу?')) return
  try {
    await remove(id)
    message.success('Группа удалена')
    await load()
  } catch (e: any) {
    message.error(e?.message || 'Ошибка')
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const params: any = {}
    if (courseFilter.value) params.course = courseFilter.value
    if (statusFilter.value === 'active') params.is_active = 'true'
    else if (statusFilter.value === 'inactive') params.is_active = 'false'
    items.value = await getList(params)
    courses.value = await getCourses()
  } catch (e: any) {
    error.value = e?.message || 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
}

watch([courseFilter, statusFilter], load)

function canAccess() {
  const u = authStore.user
  return u && (u.role === 'HEAD_TEACHER' || (u.additional_roles || []).includes('HEAD_TEACHER') || u.role === 'SUPERUSER')
}

onMounted(() => {
  if (!canAccess()) { navigateTo('/cabinet'); return }
  load()
})
</script>

<style scoped>
.cabinet-page { padding-bottom: 40px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
.page-header__title { margin: 0 0 8px; font-weight: 700; }
.page-header__subtitle { margin: 0; color: var(--n-text-color-3); }
.search-card { margin-bottom: 24px; }
.loading-state { text-align: center; padding: 4rem 2rem; }
.table-card { border-radius: 16px; }
.clickable-rows :deep(.n-data-table-tr) { cursor: pointer; }
.clickable-rows :deep(.n-data-table-tr:hover) { background-color: rgba(24, 160, 88, 0.05) !important; }
</style>
