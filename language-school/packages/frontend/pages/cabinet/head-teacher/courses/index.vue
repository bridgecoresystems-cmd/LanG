<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Курсы</NH2>
        <p class="page-header__subtitle">Управление учебными курсами</p>
      </div>
      <div class="page-header__actions">
        <NButton type="primary" size="large" @click="navigateTo('/cabinet/head-teacher/courses/add')">
          <template #icon>
            <NIcon><component :is="AddIcon" /></NIcon>
          </template>
          Добавить курс
        </NButton>
      </div>
    </header>

    <NCard class="cabinet-card search-card">
      <NGrid cols="1 m:2" :x-gap="16" :y-gap="16">
        <NGi>
          <NInput v-model:value="searchQuery" placeholder="Поиск..." clearable size="large">
            <template #prefix>
              <NIcon><component :is="SearchIcon" /></NIcon>
            </template>
          </NInput>
        </NGi>
        <NGi>
          <NSelect
            v-model:value="statusFilter"
            :options="statusOptions"
            placeholder="Статус"
            clearable
            size="large"
          />
        </NGi>
      </NGrid>
    </NCard>

    <div v-if="loading" class="loading-state">
      <NSpin size="large" />
    </div>

    <NAlert v-else-if="error" type="error" closable>{{ error }}</NAlert>

    <NCard v-else class="cabinet-card table-card" :content-style="{ padding: 0 }">
      <NDataTable
        :columns="columns"
        :data="filteredItems"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
        :row-props="(row) => ({ style: 'cursor: pointer;', onClick: () => onRowClick(row) })"
        :row-key="(row) => row.id"
        class="cabinet-data-table clickable-rows"
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useCabinetCourses, type HtCourse } from '~/composables/useCabinetCourses'
import {
  NCard,
  NButton,
  NInput,
  NSelect,
  NIcon,
  NH2,
  NDataTable,
  NTag,
  NSpin,
  NAlert,
  NGrid,
  NGi,
  type DataTableColumns,
} from 'naive-ui'
import { AddOutline as AddIcon, SearchOutline as SearchIcon, PencilOutline as EditIcon, TrashOutline as DeleteIcon, BarChartOutline as ChartIcon } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const authStore = useAuthStore()
const message = useMessage()
const { getList, remove } = useCabinetCourses()

const items = ref<HtCourse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const statusFilter = ref<string | null>(null)

const statusOptions = [
  { label: 'Активные', value: 'active' },
  { label: 'Неактивные', value: 'inactive' },
]

const filteredItems = computed(() => {
  let filtered = items.value
  const q = searchQuery.value?.trim().toLowerCase()
  if (q) {
    filtered = filtered.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.language?.toLowerCase().includes(q) ||
        r.level?.toLowerCase().includes(q)
    )
  }
  if (statusFilter.value === 'active') filtered = filtered.filter((r) => r.is_active)
  if (statusFilter.value === 'inactive') filtered = filtered.filter((r) => !r.is_active)
  return filtered
})

const columns: DataTableColumns<HtCourse> = [
  { title: 'ID', key: 'id', width: 80 },
  {
    title: 'Название',
    key: 'name',
    render(row) {
      return h('span', { class: 'font-semibold' }, row.name)
    },
  },
  { title: 'Язык', key: 'language', width: 120 },
  { title: 'Уровень', key: 'level', width: 100 },
  {
    title: 'Тариф',
    key: 'tariff_name',
    width: 150,
    render(row) {
      return row.tariff_name 
        ? h('div', [
            h('div', { style: 'font-weight: 600' }, row.tariff_name),
            h('div', { style: 'font-size: 12px; color: #888' }, `${row.tariff_price} TMT`)
          ])
        : h('span', { style: 'color: #ccc' }, 'Не установлен')
    }
  },
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
        navigateTo(`/cabinet/head-teacher/courses/stats/${row.id}`)
      }
    }, { icon: () => h(ChartIcon) })
  },
  {
    title: 'Статус',
    key: 'is_active',
    width: 110,
    render(row) {
      return h(NTag, {
        type: row.is_active ? 'success' : 'error',
        round: true,
        size: 'small',
      }, () => (row.is_active ? 'Активен' : 'Неактивен'))
    },
  },
  {
    title: '',
    key: 'actions',
    width: 100,
    align: 'right',
    render(row) {
      return h('div', { class: 'flex justify-end gap-1' }, [
        h(NButton, {
          size: 'small',
          circle: true,
          quaternary: true,
          type: 'info',
          onClick: (e: Event) => {
            e.stopPropagation()
            navigateTo(`/cabinet/head-teacher/courses/${row.id}`)
          },
        }, { icon: () => h(NIcon, null, { default: () => h(EditIcon) }) }),
        h(NButton, {
          size: 'small',
          circle: true,
          quaternary: true,
          type: 'error',
          onClick: (e: Event) => {
            e.stopPropagation()
            handleDelete(row.id)
          },
        }, { icon: () => h(NIcon, null, { default: () => h(DeleteIcon) }) }),
      ])
    },
  },
]

const onRowClick = (row: HtCourse) => {
  navigateTo(`/cabinet/head-teacher/courses/${row.id}`)
}

const handleDelete = async (id: number) => {
  if (!confirm('Удалить курс?')) return
  try {
    await remove(id)
    message.success('Курс удалён')
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
    if (statusFilter.value === 'active') params.is_active = 'true'
    else if (statusFilter.value === 'inactive') params.is_active = 'false'
    if (searchQuery.value) params.search = searchQuery.value
    items.value = await getList(params)
  } catch (e: any) {
    error.value = e?.message || 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
}

watch([statusFilter], load)

function canAccess() {
  const u = authStore.user
  if (!u) return false
  return u.role === 'HEAD_TEACHER' || (u.additional_roles || []).includes('HEAD_TEACHER') || u.role === 'SUPERUSER'
}

onMounted(() => {
  if (!canAccess()) {
    navigateTo('/cabinet')
    return
  }
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
.table-card { border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.clickable-rows :deep(.n-data-table-tr) { cursor: pointer; }
.clickable-rows :deep(.n-data-table-tr:hover) { background-color: rgba(24, 160, 88, 0.05) !important; }
:deep(.n-data-table-th) { font-weight: 600 !important; padding: 16px 24px !important; }
:deep(.n-data-table-td) { padding: 16px 24px !important; }
</style>
