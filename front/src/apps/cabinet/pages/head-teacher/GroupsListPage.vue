<template>
  <CabinetLayout>
    <n-space vertical size="large" class="head-teacher-page">
      <div class="page-header">
        <n-space justify="space-between" align="center">
          <div>
            <n-h1 style="margin-bottom: 4px;">{{ $t('cabinet.groups.title') }}</n-h1>
            <n-text depth="3">Управление учебными группами</n-text>
          </div>
          <n-button type="primary" round @click="$router.push('/cabinet/head-teacher/groups/add')">
            <template #icon><n-icon><add-icon /></n-icon></template>
            {{ $t('admin.actions.add') }} {{ $t('cabinet.groups.group') }}
          </n-button>
        </n-space>
      </div>

      <n-card bordered class="filters-card">
        <n-grid cols="1 s:3" responsive="screen" :x-gap="16" :y-gap="16">
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
              <n-text depth="2" strong size="small">{{ $t('cabinet.groups.allCourses') }}</n-text>
              <n-select
                v-model:value="courseFilter"
                :options="courseOptions"
                :placeholder="$t('cabinet.groups.allCourses')"
                clearable
                @update:value="loadGroups"
              />
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
                @update:value="loadGroups"
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
          :data="filteredItems"
          :pagination="pagination"
          :bordered="false"
          scroll-x="1200"
          :row-props="rowProps"
          class="clickable-rows"
        />
      </n-card>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NCard, NInput, NSelect, NDataTable, NTag, 
  NButton, NIcon, NSpin, NAlert, NGrid, NGi, DataTableColumns
} from 'naive-ui'
import { 
  AddOutline as AddIcon,
  SearchOutline as SearchIcon,
  PencilOutline as EditIcon,
  TrashOutline as DeleteIcon,
  PersonOutline as TeacherIcon,
  TimeOutline as TimeIcon,
  CalendarOutline as DayIcon,
  PeopleOutline as StudentsIcon
} from '@vicons/ionicons5'
import { useHeadTeacherGroups, useHeadTeacherCourses } from '@/composables/useHeadTeacherApi'

const router = useRouter()
const { t } = useI18n()
const { loading, error, fetchGroups, deleteGroup } = useHeadTeacherGroups()
const { fetchCourses } = useHeadTeacherCourses()

const searchQuery = ref('')
const courseFilter = ref<number | null>(null)
const statusFilter = ref<string | null>(null)
const items = ref<any[]>([])
const courses = ref<any[]>([])

const courseOptions = computed(() => courses.value.map(c => ({ label: c.name, value: c.id })))
const statusOptions = [
  { label: t('admin.filters.active'), value: 'active' },
  { label: t('admin.filters.inactive'), value: 'inactive' }
]

const columns: DataTableColumns<any> = [
  {
    title: t('admin.table.id'),
    key: 'id',
    width: 70,
    sorter: 'default'
  },
  {
    title: t('cabinet.groups.name'),
    key: 'name',
    sorter: 'default',
    render(row) {
      return h(NText, { strong: true }, { default: () => row.name })
    }
  },
  {
    title: t('cabinet.groups.course'),
    key: 'course_name',
    sorter: 'default'
  },
  {
    title: t('cabinet.groups.teacher'),
    key: 'teacher_name',
    render(row) {
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, { color: '#18a058' }, { default: () => h(TeacherIcon) }),
          h(NText, null, { default: () => row.teacher_name || '-' })
        ]
      })
    }
  },
  {
    title: t('cabinet.groups.timeSlot'),
    key: 'time_slot_display',
    render(row) {
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, { color: '#18a058' }, { default: () => h(TimeIcon) }),
          h(NText, { size: 'small' }, { default: () => row.time_slot_display || '-' })
        ]
      })
    }
  },
  {
    title: t('cabinet.groups.weekDays'),
    key: 'week_days_display',
    render(row) {
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, { color: '#18a058' }, { default: () => h(DayIcon) }),
          h(NText, { size: 'small' }, { default: () => row.week_days_display || '-' })
        ]
      })
    }
  },
  {
    title: t('cabinet.groups.students'),
    key: 'students_count',
    render(row) {
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, { color: '#18a058' }, { default: () => h(StudentsIcon) }),
          h(NText, null, { default: () => `${row.students_count} / ${row.max_students}` })
        ]
      })
    }
  },
  {
    title: t('admin.table.status'),
    key: 'status',
    render(row) {
      const status = getGroupStatus(row)
      return h(NTag, {
        type: status === 'active' ? 'success' : 'error',
        round: true,
        size: 'small',
        bordered: false
      }, { default: () => getGroupStatusText(row) })
    }
  },
  {
    title: t('admin.table.actions'),
    key: 'actions',
    width: 100,
    render(row) {
      return h(NSpace, { justify: 'end' }, {
        default: () => [
          h(NButton, {
            size: 'small',
            circle: true,
            quaternary: true,
            type: 'info',
            onClick: (e: Event) => {
              e.stopPropagation()
              editItem(row.id)
            }
          }, {
            icon: () => h(NIcon, null, { default: () => h(EditIcon) })
          }),
          h(NButton, {
            size: 'small',
            circle: true,
            quaternary: true,
            type: 'error',
            onClick: (e: Event) => {
              e.stopPropagation()
              handleDelete(row.id)
            }
          }, {
            icon: () => h(NIcon, null, { default: () => h(DeleteIcon) })
          })
        ]
      })
    }
  }
]

const pagination = ref({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  onChange: (page: number) => {
    pagination.value.page = page
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.value.pageSize = pageSize
    pagination.value.page = 1
  }
})

const getGroupStatus = (group: any): 'active' | 'inactive' => {
  if (!group.is_active) return 'inactive'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (group.start_date && today < new Date(group.start_date)) return 'inactive'
  if (group.end_date && today > new Date(group.end_date)) return 'inactive'
  return 'active'
}

const getGroupStatusText = (group: any): string => {
  const status = getGroupStatus(group)
  if (status === 'inactive') {
    if (!group.is_active) return t('admin.filters.inactive')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (group.start_date && today < new Date(group.start_date)) return t('cabinet.groups.notStarted') || 'Not Started'
    if (group.end_date && today > new Date(group.end_date)) return t('cabinet.groups.completed') || 'Completed'
    return t('admin.filters.inactive')
  }
  return t('admin.filters.active')
}

const filteredItems = computed(() => {
  let filtered = items.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.course_name && item.course_name.toLowerCase().includes(query)) ||
      (item.teacher_name && item.teacher_name.toLowerCase().includes(query))
    )
  }
  if (statusFilter.value) {
    filtered = filtered.filter(item => {
      const status = getGroupStatus(item)
      return statusFilter.value === 'active' ? status === 'active' : status === 'inactive'
    })
  }
  return filtered
})

const rowProps = (row: any) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      viewGroup(row.id)
    }
  }
}

const viewGroup = (id: number) => {
  router.push(`/cabinet/head-teacher/groups/${id}`)
}

const editItem = (id: number) => {
  router.push(`/cabinet/head-teacher/groups/${id}/change`)
}

const handleDelete = async (id: number) => {
  if (confirm(t('admin.confirmDelete'))) {
    try {
      await deleteGroup(id)
      await loadGroups()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}

const loadCourses = async () => {
  try {
    const response = await fetchCourses({ is_active: 'true' })
    courses.value = Array.isArray(response) ? response : response.results || []
  } catch (err) {
    console.error('Load courses error:', err)
  }
}

const loadGroups = async () => {
  try {
    const params: any = {}
    if (courseFilter.value) params.course = courseFilter.value
    if (statusFilter.value === 'active') params.is_active = 'true'
    else if (statusFilter.value === 'inactive') params.is_active = 'false'
    const response = await fetchGroups(params)
    items.value = Array.isArray(response) ? response : response.results || []
  } catch (err) {
    console.error('Load groups error:', err)
  }
}

onMounted(() => {
  loadCourses()
  loadGroups()
})
</script>

<style scoped>
.head-teacher-page {
  max-width: 1400px;
  margin: 0 auto;
}

.clickable-rows :deep(.n-data-table-tr) {
  cursor: pointer;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
