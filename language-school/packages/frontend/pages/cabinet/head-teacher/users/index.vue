<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Ученики и родители</NH2>
        <p class="page-header__subtitle">
          Создание и просмотр учеников и родителей вашей школы.
        </p>
      </div>
      <div class="page-header__actions">
        <NButton type="primary" size="large" @click="navigateTo('/cabinet/head-teacher/users/add')">
          <template #icon>
            <NIcon><component :is="AddIcon" /></NIcon>
          </template>
          Добавить
        </NButton>
      </div>
    </header>

    <NCard class="cabinet-card search-card">
      <NInput
        v-model:value="searchQuery"
        placeholder="Поиск по имени, логину, email..."
        clearable
        size="large"
        style="max-width: 400px"
      >
        <template #prefix>
          <NIcon><component :is="SearchIcon" /></NIcon>
        </template>
      </NInput>
    </NCard>

    <NCard class="cabinet-card table-card" :content-style="{ padding: 0 }">
      <NDataTable
        :columns="columns"
        :data="sortedItems"
        :loading="loading"
        :row-props="rowProps"
        :pagination="naivePagination"
        :row-key="(row) => row.id"
        :bordered="false"
        size="small"
        striped
        class="cabinet-data-table"
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, h, reactive, watch } from 'vue'
import { useCabinetHeadTeacher } from '~/composables/useCabinetHeadTeacher'
import { useAdminPagination } from '~/composables/useAdminPagination'
import {
  NCard,
  NButton,
  NInput,
  NIcon,
  NH2,
  NDataTable,
  NTag,
  NAvatar,
  type DataTableColumns,
} from 'naive-ui'
import { AddOutline as AddIcon, SearchOutline as SearchIcon } from '@vicons/ionicons5'
import { useAvatarUrl } from '~/composables/useAvatarUrl'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const authStore = useAuthStore()
const { avatarUrl } = useAvatarUrl()
const { getUsers } = useCabinetHeadTeacher()
const { pagination, resetPage } = useAdminPagination('head-teacher-users')

function canAccess() {
  const u = authStore.user
  if (!u) return false
  const hasHeadTeacher = u.role === 'HEAD_TEACHER' || (u.additional_roles || []).includes('HEAD_TEACHER')
  return hasHeadTeacher || u.role === 'SUPERUSER'
}

const items = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')

const naivePagination = reactive({
  page: pagination.value.page,
  pageSize: pagination.value.rowsPerPage,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  onUpdatePage: (page: number) => {
    naivePagination.page = page
    pagination.value.page = page
  },
  onUpdatePageSize: (pageSize: number) => {
    naivePagination.pageSize = pageSize
    pagination.value.rowsPerPage = pageSize
    naivePagination.page = 1
    pagination.value.page = 1
  },
})

watch(
  () => [pagination.value.page, pagination.value.rowsPerPage],
  () => {
    naivePagination.page = pagination.value.page
    naivePagination.pageSize = pagination.value.rowsPerPage
  },
  { immediate: true }
)

const filteredItems = computed(() => {
  const q = searchQuery.value?.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(
    (r) =>
      r.full_name?.toLowerCase().includes(q) ||
      r.username?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.first_name?.toLowerCase().includes(q) ||
      r.last_name?.toLowerCase().includes(q)
  )
})

const sortedItems = computed(() => {
  let sorted = [...filteredItems.value]
  const { sortBy, descending } = pagination.value
  if (!sortBy) return sorted
  sorted.sort((a, b) => {
    let aVal: any = a[sortBy] ?? ''
    let bVal: any = b[sortBy] ?? ''
    if (sortBy === 'full_name') {
      aVal = (a.full_name || a.username || '').toLowerCase()
      bVal = (b.full_name || b.username || '').toLowerCase()
    }
    if (aVal < bVal) return descending ? 1 : -1
    if (aVal > bVal) return descending ? -1 : 1
    return 0
  })
  return sorted
})

const columns: DataTableColumns<any> = [
  {
    title: '',
    key: 'avatar',
    width: 56,
    render(row) {
      const url = row.avatar ? avatarUrl(row.avatar) : undefined
      return h(
        NAvatar,
        { round: true, size: 36, src: url },
        { default: () => (row.first_name?.[0] || row.username?.[0] || '?').toUpperCase() }
      )
    },
  },
  { title: 'Имя', key: 'full_name', ellipsis: { tooltip: true } },
  { title: 'Логин', key: 'username', width: 140 },
  { title: 'Email', key: 'email', width: 200, ellipsis: { tooltip: true } },
  {
    title: 'Роль',
    key: 'role',
    width: 100,
    render(row) {
      const type = row.role === 'STUDENT' ? 'info' : 'success'
      const label = row.role === 'STUDENT' ? 'Ученик' : 'Родитель'
      return h(NTag, { type, size: 'small' }, () => label)
    },
  },
  { title: 'Телефон', key: 'phone', width: 140 },
]

const rowProps = (row: any) => ({
  style: 'cursor: pointer;',
  onClick: () => editItem(row),
})

const editItem = (row: any) => navigateTo(`/cabinet/head-teacher/users/${row.id}`)

async function load() {
  loading.value = true
  try {
    items.value = (await getUsers()) as any[]
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(searchQuery, resetPage)

onMounted(() => {
  if (!canAccess()) {
    navigateTo('/cabinet')
    return
  }
  load()
})
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

.page-header__actions {
  display: flex;
  gap: 12px;
}

.cabinet-card {
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-card {
  margin-bottom: 24px;
  padding: 8px;
}

.table-card {
  overflow: hidden;
}

:deep(.cabinet-data-table) {
  --n-border-radius: 16px;
}

:deep(.n-data-table-th) {
  background-color: transparent !important;
  font-weight: 600 !important;
  color: var(--n-text-color-3) !important;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 16px 24px !important;
  white-space: nowrap !important;
}

:deep(.n-data-table-td) {
  padding: 16px 24px !important;
  font-size: 0.9375rem;
}

:deep(.n-data-table-tr:hover .n-data-table-td) {
  background-color: #f9fafb !important;
}
</style>
