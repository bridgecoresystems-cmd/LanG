<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Уроки</NH2>
        <p class="page-header__subtitle">Управление уроками групп</p>
      </div>
      <div class="page-header__actions">
        <NButton type="primary" size="large" @click="navigateTo('/cabinet/head-teacher/lessons/add')">
          <template #icon><NIcon><component :is="AddIcon" /></NIcon></template>
          Добавить урок
        </NButton>
      </div>
    </header>

    <NCard class="cabinet-card search-card">
      <NSelect v-model:value="groupFilter" :options="groupOptions" placeholder="Все группы" clearable size="large" style="max-width: 300px" @update:value="load" />
    </NCard>

    <div v-if="loading" class="loading-state"><NSpin size="large" /></div>
    <NAlert v-else-if="error" type="error" closable>{{ error }}</NAlert>
    <NCard v-else class="cabinet-card table-card" :content-style="{ padding: 0 }">
      <NDataTable
        :columns="columns"
        :data="items"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
        :row-props="(row) => ({ style: 'cursor: pointer;', onClick: () => navigateTo(`/cabinet/head-teacher/lessons/${row.id}`) })"
        :row-key="(row) => row.id"
        class="cabinet-data-table clickable-rows"
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCabinetLessons } from '~/composables/useCabinetLessons'
import { useCabinetGroups } from '~/composables/useCabinetGroups'
import { NCard, NButton, NInput, NSelect, NIcon, NH2, NDataTable, NSpin, NAlert } from 'naive-ui'
import { AddOutline as AddIcon, PencilOutline as EditIcon, TrashOutline as DeleteIcon } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })
const authStore = useAuthStore()
const message = useMessage()
const { getList, remove } = useCabinetLessons()
const { getList: getGroups } = useCabinetGroups()

const items = ref<any[]>([])
const groups = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const groupFilter = ref<number | null>(null)

const groupOptions = computed(() => groups.value.map((g) => ({ label: `${g.name} (${g.course_name})`, value: g.id })))

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 70 },
  { title: 'Название', key: 'title', render: (r) => r.title },
  { title: 'Группа', key: 'group_name' },
  { title: 'Дата', key: 'lesson_date', width: 180, render: (r) => (r.lesson_date ? new Date(r.lesson_date).toLocaleString('ru-RU') : '—') },
  { title: 'Длительность (мин)', key: 'duration_minutes', width: 130 },
  {
    title: '',
    key: 'actions',
    width: 90,
    align: 'right',
    render: (row) =>
      h('div', { class: 'flex justify-end gap-1' }, [
        h(NButton, { size: 'small', circle: true, quaternary: true, type: 'info', onClick: (e: Event) => { e.stopPropagation(); navigateTo(`/cabinet/head-teacher/lessons/${row.id}`) } }, { icon: () => h(EditIcon) }),
        h(NButton, { size: 'small', circle: true, quaternary: true, type: 'error', onClick: (e: Event) => { e.stopPropagation(); handleDelete(row.id) } }, { icon: () => h(DeleteIcon) }),
      ]),
  },
]

async function handleDelete(id: number) {
  if (!confirm('Удалить урок?')) return
  try {
    await remove(id)
    message.success('Урок удалён')
    await load()
  } catch (e: any) {
    message.error(e?.message || 'Ошибка')
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    items.value = await getList(groupFilter.value ? { group_id: groupFilter.value } : undefined)
    if (groups.value.length === 0) groups.value = await getGroups()
  } catch (e: any) {
    error.value = e?.message || 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
}

watch(groupFilter, load)

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
</style>
