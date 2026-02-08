<template>
  <CabinetLayout>
    <n-space vertical size="large" class="head-teacher-page">
      <div class="page-header">
        <n-space justify="space-between" align="center">
          <div>
            <n-h1 style="margin-bottom: 4px;">{{ $t('admin.models.teachers') }}</n-h1>
            <n-text depth="3">{{ $t('cabinet.mailing.list.description') }}</n-text>
          </div>
          <n-button type="primary" round @click="$router.push('/cabinet/head-teacher/teachers/add')">
            <template #icon><n-icon><add-icon /></n-icon></template>
            {{ $t('admin.actions.add') }} {{ $t('admin.models.teachers') }}
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
          :row-key="(row) => row.id"
          :row-props="rowProps"
          scroll-x="1000"
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
import UserAvatar from '@/components/UserAvatar.vue'
import { 
  NSpace, NH1, NText, NCard, NInput, NDataTable, NAvatar, NTag, 
  NButton, NIcon, NSpin, NAlert, DataTableColumns,
  NGrid, NGi, NSelect
} from 'naive-ui'
import { 
  AddOutline as AddIcon,
  SearchOutline as SearchIcon,
  PencilOutline as EditIcon,
  TrashOutline as DeleteIcon,
  PersonOutline as UserIcon,
  BriefcaseOutline as BriefcaseIcon,
  TimeOutline as HistoryIcon
} from '@vicons/ionicons5'
import { useAdminTeachers } from '@/composables/useAdminApi'

const router = useRouter()
const { t } = useI18n()
const { loading, error, fetchTeachers, deleteTeacher } = useAdminTeachers()

// Ключ для хранения настроек в LocalStorage
const SETTINGS_KEY = 'ht_teachers_table_settings'

// Загружаем сохраненные настройки
const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')

const searchQuery = ref('')
const items = ref<any[]>([])

// Функция сохранения настроек
const saveSettings = () => {
  const settings = {
    pageSize: pagination.value.pageSize,
    page: pagination.value.page
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

const rowProps = (row: any) => {
  return {
    style: 'cursor: pointer;',
    onClick: (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.n-data-table-expand-trigger') || target.closest('.n-button')) {
        return
      }
      editItem(row.id)
    }
  }
}

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
    type: 'expand',
    renderExpand: (row) => {
      return h(NSpace, { vertical: true, size: 'large', style: 'padding: 16px;' }, {
        default: () => [
          h(NText, { strong: true, depth: 3, uppercase: true }, { default: () => t('admin.teachers.details') }),
          h(NSpace, { size: 'large' }, {
            default: () => [
              h(NSpace, { vertical: true, size: 4 }, {
                default: () => [
                  h(NText, { depth: 3, size: 'small' }, { default: () => t('admin.table.id') }),
                  h(NText, { strong: true }, { default: () => row.id })
                ]
              }),
              h(NSpace, { vertical: true, size: 4 }, {
                default: () => [
                  h(NText, { depth: 3, size: 'small' }, { default: () => t('admin.table.email') }),
                  h(NText, { strong: true }, { default: () => row.email || '-' })
                ]
              }),
              h(NSpace, { vertical: true, size: 4 }, {
                default: () => [
                  h(NText, { depth: 3, size: 'small' }, { default: () => t('admin.teachers.hireDate') }),
                  h(NText, { strong: true }, { default: () => row.hire_date || '-' })
                ]
              })
            ]
          })
        ]
      })
    }
  },
  {
    title: t('admin.table.fullName'),
    key: 'full_name',
    sorter: 'default',
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
              h(NText, { strong: true }, { default: () => row.full_name }),
              h(NText, { depth: 3, size: 'small', style: 'color: #18a058' }, { default: () => row.username })
            ]
          })
        ]
      })
    }
  },
  {
    title: t('admin.teachers.specialization'),
    key: 'specialization',
    render(row) {
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, { color: '#18a058' }, { default: () => h(BriefcaseIcon) }),
          h(NText, null, { default: () => row.specialization || '-' })
        ]
      })
    }
  },
  {
    title: t('admin.teachers.experience'),
    key: 'experience_years',
    render(row) {
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, { color: '#18a058' }, { default: () => h(HistoryIcon) }),
          h(NText, null, { default: () => `${row.experience_years} ${t('admin.teachers.years')}` })
        ]
      })
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

const filteredItems = computed(() => {
  let filtered = items.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      (item.username && item.username.toLowerCase().includes(query)) ||
      (item.full_name && item.full_name.toLowerCase().includes(query))
    )
  }
  return filtered
})

const editItem = (id: number) => {
  router.push(`/cabinet/head-teacher/teachers/${id}/change`)
}

const handleDelete = async (id: number) => {
  if (confirm(t('admin.confirmDelete') || 'Are you sure?')) {
    try {
      await deleteTeacher(id)
      await loadTeachers()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}

const loadTeachers = async () => {
  try {
    const params: any = { page_size: 1000 }
    const response = await fetchTeachers(params)
    items.value = Array.isArray(response) ? response : response.results || []
  } catch (err) {
    console.error('Load teachers error:', err)
  }
}

onMounted(() => {
  loadTeachers()
})

// При изменении поиска сбрасываем страницу
import { watch } from 'vue'
watch([searchQuery], () => {
  pagination.value.page = 1
  saveSettings()
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
