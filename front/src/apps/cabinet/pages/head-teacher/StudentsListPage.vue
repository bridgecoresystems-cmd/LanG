<template>
  <CabinetLayout>
    <n-space vertical size="large" class="head-teacher-page">
      <div class="page-header">
        <n-space justify="space-between" align="center">
          <div>
            <n-h1 style="margin-bottom: 4px;">{{ $t('admin.models.students') }}</n-h1>
            <n-text depth="3">{{ $t('cabinet.mailing.list.description') }}</n-text>
          </div>
          <n-button type="primary" round @click="$router.push('/cabinet/head-teacher/students/add')">
            <template #icon><n-icon><add-icon /></n-icon></template>
            {{ $t('admin.actions.add') }} {{ $t('admin.models.students') }}
          </n-button>
        </n-space>
      </div>

      <n-card bordered class="filters-card">
        <n-grid cols="1 s:2 m:3" responsive="screen" :x-gap="16" :y-gap="16">
          <n-gi>
        <n-space vertical size="small">
          <n-text depth="2" strong size="small">{{ $t('admin.search') }}</n-text>
          <n-input v-model:value="searchQuery" :placeholder="$t('admin.search')" clearable>
            <template #prefix>
              <n-icon><search-icon /></n-icon>
            </template>
          </n-input>
        </n-space>
          </n-gi>
          <n-gi>
            <n-space vertical size="small">
              <n-text depth="2" strong size="small">{{ $t('admin.table.status') }}</n-text>
              <n-select
                v-model:value="statusFilter"
                :options="statusOptions"
                :placeholder="$t('admin.filters.all')"
                clearable
              />
            </n-space>
          </n-gi>
          <n-gi>
            <n-space vertical size="small">
              <n-text depth="2" strong size="small">{{ $t('cabinet.groups.group') }}</n-text>
              <n-select
                v-model:value="groupFilter"
                :options="groupOptions"
                :placeholder="$t('cabinet.groups.allGroups')"
                clearable
                filterable
              />
            </n-space>
          </n-gi>
        </n-grid>
      </n-card>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <div v-else-if="error" class="error-state">
        <n-alert type="error" :title="$t('common.error')" closable>
          {{ error }}
        </n-alert>
      </div>

      <n-card bordered v-else content-style="padding: 0;">
        <n-data-table
          :columns="columns"
          :data="sortedItems"
          :pagination="pagination"
          :bordered="false"
          :row-key="(row) => row.id"
          :row-props="rowProps"
          scroll-x="1000"
          class="clickable-rows"
          @update:sorter="handleSorterChange"
        />
      </n-card>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { 
  NSpace, NH1, NText, NCard, NInput, NDataTable, NAvatar, NTag, 
  NButton, NIcon, NSpin, NAlert, DataTableColumns, NBadge,
  NGrid, NGi, NSelect
} from 'naive-ui'
import { 
  AddOutline as AddIcon,
  SearchOutline as SearchIcon,
  PencilOutline as EditIcon,
  TrashOutline as DeleteIcon,
  PersonOutline as UserIcon,
  MailOutline as MailIcon,
  CallOutline as PhoneIcon,
  GiftOutline as PointsIcon,
  PeopleOutline as GroupsIcon
} from '@vicons/ionicons5'
import { useAdminStudents } from '@/composables/useAdminApi'
import { useHeadTeacherGroups } from '@/composables/useHeadTeacherApi'

const router = useRouter()
const { t } = useI18n()
const { loading: studentsLoading, error: studentsError, fetchStudents, deleteStudent } = useAdminStudents()
const { fetchGroups } = useHeadTeacherGroups()

const loading = computed(() => studentsLoading.value || groupsLoading.value)
const error = computed(() => studentsError.value || groupsError.value)

// Ключ для хранения настроек в LocalStorage
const SETTINGS_KEY = 'ht_students_table_settings'

// Загружаем сохраненные настройки
const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')

const searchQuery = ref('')
const statusFilter = ref<string | null>(null)
const groupFilter = ref<number | null>(null)
const items = ref<any[]>([])
const groups = ref<any[]>([])
const groupsLoading = ref(false)
const groupsError = ref<string | null>(null)

// Состояние сортировки
const sorterState = ref(savedSettings.sorter || { columnKey: 'id', order: 'ascend' })

const pagination = ref({
  page: savedSettings.page || 1,
  pageSize: savedSettings.pageSize || 20,
  showSizePicker: true,
  pageSizes: [20, 50, 100],
  onChange: (page: number) => {
    pagination.value.page = page
    saveSettings()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.value.pageSize = pageSize
    pagination.value.page = 1
    saveSettings()
  }
})

// Функция сохранения настроек
const saveSettings = () => {
  const settings = {
    pageSize: pagination.value.pageSize,
    sorter: sorterState.value,
    page: pagination.value.page
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// Обработчик изменения сортировки
const handleSorterChange = (sorter: any) => {
  sorterState.value = sorter
  saveSettings()
}

const statusOptions = [
  { label: t('admin.filters.active'), value: 'active' },
  { label: t('admin.filters.inactive'), value: 'inactive' }
]

const groupOptions = computed(() => [
  { label: t('cabinet.groups.allGroups') || 'All Groups', value: null },
  ...groups.value.map(g => ({ label: g.name, value: g.id }))
])

const columns: DataTableColumns<any> = [
  {
    title: '№',
    key: 'index',
    width: 70,
    render(_, rowIndex) {
      return (pagination.value.page - 1) * pagination.value.pageSize + rowIndex + 1
    }
  },
  {
    title: t('admin.table.fullName'),
    key: 'full_name',
    sorter: 'default',
    sortOrder: computed(() => sorterState.value?.columnKey === 'full_name' ? sorterState.value.order : false),
    render(row) {
      return h(NSpace, { align: 'center', wrap: false }, {
        default: () => [
          h(UserAvatar, {
            src: row.avatar_url || undefined,
            gender: row.gender,
            size: 'medium'
          }),
          h(NSpace, { vertical: true, size: 4 }, {
            default: () => [
              h(NText, { strong: true }, { default: () => row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() }),
              h(NText, { depth: 3, size: 'small', style: 'color: #18a058' }, { default: () => row.username })
            ]
          })
        ]
      })
    }
  },
  {
    title: t('admin.table.email'),
    key: 'email',
    sorter: 'default',
    sortOrder: computed(() => sorterState.value?.columnKey === 'email' ? sorterState.value.order : false),
    render(row) {
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, { color: '#18a058' }, { default: () => h(MailIcon) }),
          h(NText, null, { default: () => row.email || '-' })
        ]
      })
    }
  },
  {
    title: t('admin.forms.gender'),
    key: 'gender',
    width: 100,
    render(row) {
      if (!row.gender) return '-'
      const isBoy = row.gender === 'boy'
      return h(NTag, {
        type: isBoy ? 'info' : 'error',
        size: 'small',
        round: true,
        bordered: false
      }, { default: () => isBoy ? t('admin.forms.genderBoy') : t('admin.forms.genderGirl') })
    }
  },
  {
    title: t('admin.filters.status'),
    key: 'is_active',
    sorter: 'default',
    sortOrder: computed(() => sorterState.value?.columnKey === 'is_active' ? sorterState.value.order : false),
    render(row) {
      const active = row.is_active !== false
      return h(NTag, {
        type: active ? 'success' : 'error',
        size: 'small',
        round: true,
        bordered: false
      }, { default: () => active ? t('admin.filters.active') : t('admin.filters.inactive') })
    }
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 120,
    render(row) {
      return h(NSpace, { justify: 'end' }, {
        default: () => [
          h(NButton, {
            size: 'small',
            circle: true,
            quaternary: true,
            type: 'info',
            onClick: () => editItem(row.id)
          }, {
            icon: () => h(NIcon, null, { default: () => h(EditIcon) })
          }),
          h(NButton, {
            size: 'small',
            circle: true,
            quaternary: true,
            type: 'error',
            onClick: () => handleDelete(row.id)
          }, {
            icon: () => h(NIcon, null, { default: () => h(DeleteIcon) })
          })
        ]
      })
    }
  }
]

const filteredItems = computed(() => {
  let filtered = items.value
  
  // 1. Поиск по тексту (Client-side)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      (item.username && item.username.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.full_name && item.full_name.toLowerCase().includes(query)) ||
      (item.first_name && item.first_name.toLowerCase().includes(query)) ||
      (item.last_name && item.last_name.toLowerCase().includes(query))
    )
  }
  
  // 2. Фильтр по статусу (Client-side)
  if (statusFilter.value === 'active') {
    filtered = filtered.filter(item => item.is_active !== false)
  } else if (statusFilter.value === 'inactive') {
    filtered = filtered.filter(item => item.is_active === false)
  }
  
  // 3. Фильтр по группе (Client-side - для надежности, хотя мы и так грузим по группе)
  if (groupFilter.value) {
    // В items.value уже должны быть только ученики этой группы, 
    // но если мы загрузили всех (page_size=1000 без group_id), то тут можно отфильтровать.
    // Однако в текущей реализации loadStudents передает group_id бэкенду.
  }
  
  return filtered
})

const sortedItems = computed(() => {
  const sorted = [...filteredItems.value]
  const { columnKey, order } = sorterState.value
  
  if (!columnKey || !order) return sorted
  
  sorted.sort((a, b) => {
    let valA = a[columnKey]
    let valB = b[columnKey]
    
    if (columnKey === 'id') {
      const numA = Number(valA) || 0
      const numB = Number(valB) || 0
      return order === 'ascend' ? numA - numB : numB - numA
    }
    
    // Сортировка по имени - специальный случай
    if (columnKey === 'full_name') {
      valA = (a.full_name || `${a.first_name || ''} ${a.last_name || ''}`).toLowerCase()
      valB = (b.full_name || `${b.first_name || ''} ${b.last_name || ''}`).toLowerCase()
    } else {
    valA = String(valA || '').toLowerCase()
    valB = String(valB || '').toLowerCase()
    }
    
    if (valA < valB) return order === 'ascend' ? -1 : 1
    if (valA > valB) return order === 'ascend' ? 1 : -1
    return 0
  })
  
  return sorted
})

const rowProps = (row: any) => {
  return {
    style: 'cursor: pointer;',
    onClick: (e: MouseEvent) => {
      // Don't trigger if clicking on action buttons
      const target = e.target as HTMLElement
      if (target.closest('.n-button')) {
        return
      }
      editItem(row.id)
    }
  }
}

const editItem = (id: number) => {
  router.push(`/cabinet/head-teacher/students/${id}/change`)
}

const handleDelete = async (id: number) => {
  if (confirm(t('admin.confirmDelete') || 'Are you sure?')) {
    try {
      await deleteStudent(id)
      await loadStudents()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}

const loadGroups = async () => {
  groupsLoading.value = true
  groupsError.value = null
  try {
    const response = await fetchGroups({ is_active: 'true' })
    groups.value = Array.isArray(response) ? response : response.results || []
  } catch (err: any) {
    groupsError.value = 'Failed to load groups'
    console.error('Load groups error:', err)
  } finally {
    groupsLoading.value = false
  }
}

const loadStudents = async () => {
  try {
    // Мы всегда загружаем до 1000 записей и фильтруем их локально для скорости поиска
    // Но фильтр по группе оставляем на бэкенде, так как это тяжелый запрос
    const params: any = { page_size: 1000 }
    
    if (groupFilter.value) {
      params.group_id = groupFilter.value
    }
    
    const response = await fetchStudents(params)
    items.value = Array.isArray(response) ? response : response.results || []
  } catch (err) {
    console.error('Load students error:', err)
  }
}

onMounted(() => {
  loadGroups()
  loadStudents()
})

// При изменении фильтров сбрасываем страницу на первую
watch([searchQuery, statusFilter, groupFilter], () => {
  pagination.value.page = 1
  saveSettings()
  loadStudents()
})
</script>

<style scoped>
.head-teacher-page {
  max-width: 1400px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
