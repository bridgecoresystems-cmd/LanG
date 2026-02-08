<template>
  <CabinetLayout>
    <n-space vertical size="large" class="head-teacher-page">
      <div class="page-header">
        <n-space justify="space-between" align="center">
          <div>
            <n-h1 style="margin-bottom: 4px;">{{ $t('admin.models.courses') }}</n-h1>
            <n-text depth="3">Управление курсами в системе</n-text>
          </div>
          <n-button type="primary" round @click="$router.push('/cabinet/head-teacher/courses/add')">
            <template #icon><n-icon><add-icon /></n-icon></template>
            {{ $t('admin.actions.add') }} {{ $t('admin.models.courses') }}
          </n-button>
        </n-space>
      </div>

      <n-card bordered class="filters-card">
        <n-grid cols="1 m:2" responsive="screen" :x-gap="16" :y-gap="16">
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
          scroll-x="800"
          :row-props="rowProps"
          class="clickable-rows"
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
import { 
  NSpace, NH1, NText, NCard, NInput, NSelect, NDataTable, NTag, 
  NButton, NIcon, NSpin, NAlert, NGrid, NGi, DataTableColumns
} from 'naive-ui'
import { 
  AddOutline as AddIcon,
  SearchOutline as SearchIcon,
  PencilOutline as EditIcon,
  TrashOutline as DeleteIcon
} from '@vicons/ionicons5'
import { useHeadTeacherCourses } from '@/composables/useHeadTeacherApi'

const router = useRouter()
const { t } = useI18n()
const { loading, error, fetchCourses, deleteCourse } = useHeadTeacherCourses()

const searchQuery = ref('')
const statusFilter = ref<string | null>(null)
const items = ref<any[]>([])

const statusOptions = [
  { label: t('admin.filters.active'), value: 'active' },
  { label: t('admin.filters.inactive'), value: 'inactive' }
]

const columns: DataTableColumns<any> = [
  {
    title: t('admin.table.id'),
    key: 'id',
    width: 80,
    sorter: 'default'
  },
  {
    title: t('admin.table.title'),
    key: 'name',
    sorter: 'default',
    render(row) {
      return h(NText, { strong: true }, { default: () => row.name })
    }
  },
  {
    title: t('cabinet.courses.language'),
    key: 'language',
    sorter: 'default'
  },
  {
    title: t('cabinet.courses.level'),
    key: 'level',
    sorter: 'default'
  },
  {
    title: t('admin.table.status'),
    key: 'is_active',
    render(row) {
      return h(NTag, {
        type: row.is_active ? 'success' : 'error',
        round: true,
        size: 'small',
        bordered: false
      }, { default: () => row.is_active ? t('admin.filters.active') : t('admin.filters.inactive') })
    }
  },
  {
    title: t('admin.table.actions'),
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

const filteredItems = computed(() => {
  let filtered = items.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.language && item.language.toLowerCase().includes(query)) ||
      (item.level && item.level.toLowerCase().includes(query))
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(item =>
      statusFilter.value === 'active' ? item.is_active : !item.is_active
    )
  }

  return filtered
})

const rowProps = (row: any) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      viewStats(row.id)
    }
  }
}

const editItem = (id: number) => {
  router.push(`/cabinet/head-teacher/courses/${id}/change`)
}

const viewStats = (id: number) => {
  router.push(`/cabinet/head-teacher/courses/${id}/statistics`)
}

const handleDelete = async (id: number) => {
  if (confirm(t('admin.confirmDelete'))) {
    try {
      await deleteCourse(id)
      await loadCourses()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}

const loadCourses = async () => {
  try {
    const params: any = {}
    if (statusFilter.value === 'active') {
      params.is_active = 'true'
    } else if (statusFilter.value === 'inactive') {
      params.is_active = 'false'
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    const response = await fetchCourses(params)
    items.value = Array.isArray(response) ? response : response.results || []
  } catch (err) {
    console.error('Load courses error:', err)
  }
}

onMounted(() => {
  loadCourses()
})

watch([statusFilter], () => {
  loadCourses()
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
