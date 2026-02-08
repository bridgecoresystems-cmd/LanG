<template>
  <CabinetLayout>
    <n-space vertical size="large" class="head-teacher-page">
      <div class="page-header">
        <n-space justify="space-between" align="center">
          <n-space align="center" size="large">
            <n-button
              circle
              secondary
              @click="$router.push('/cabinet/head-teacher/groups')"
            >
              <template #icon>
                <n-icon><arrow-back-icon /></n-icon>
              </template>
            </n-button>
            <div>
              <n-h1 style="margin: 0;">{{ groupName || $t('admin.models.lessons') }}</n-h1>
              <n-text depth="3">Список занятий для группы</n-text>
            </div>
          </n-space>
          
          <n-space>
            <n-button 
              type="primary" 
              @click="handleAddLesson"
              class="action-button"
            >
              <template #icon><n-icon><add-icon /></n-icon></template>
              {{ $t('admin.actions.add') }}
            </n-button>
          </n-space>
        </n-space>
      </div>

      <n-card bordered class="table-card">
        <n-space vertical size="large">
          <n-space justify="space-between" align="center">
            <n-input
              v-model:value="searchQuery"
              :placeholder="$t('admin.search')"
              clearable
              style="width: 300px"
            >
              <template #prefix>
                <n-icon><search-icon /></n-icon>
              </template>
            </n-input>
            
            <n-button secondary @click="loadData" :loading="loading">
              <template #icon><n-icon><refresh-icon /></n-icon></template>
              {{ $t('admin.actions.refresh') }}
            </n-button>
          </n-space>

          <n-alert v-if="error" type="error" closable>
            {{ error }}
          </n-alert>

          <n-data-table
            :columns="columns"
            :data="filteredLessons"
            :loading="loading"
            :pagination="pagination"
            bordered
            striped
            remote
            @update:page="handlePageChange"
          />
        </n-space>
      </n-card>

      <!-- Delete Confirmation Modal -->
      <n-modal
        v-model:show="showDeleteModal"
        preset="dialog"
        type="error"
        :title="$t('admin.actions.delete')"
        :content="$t('admin.questions.areYouSure')"
        :positive-text="$t('admin.actions.delete')"
        :negative-text="$t('admin.actions.cancel')"
        @positive-click="confirmDelete"
      />
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NCard, NInput, NButton, NIcon, NDataTable, 
  NAlert, NModal, NTag, useMessage 
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { 
  SearchOutline as SearchIcon,
  AddOutline as AddIcon,
  RefreshOutline as RefreshIcon,
  CreateOutline as EditIcon,
  TrashOutline as DeleteIcon,
  ChevronBackOutline as ArrowBackIcon,
  TimeOutline as TimeIcon,
  CalendarOutline as DateIcon
} from '@vicons/ionicons5'
import { useHeadTeacherLessons, useHeadTeacherGroups } from '@/composables/useHeadTeacherApi'
import { useActivityLog } from '@/composables/useActivityLog'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const message = useMessage()
const { loading, error, fetchLessons, deleteLesson } = useHeadTeacherLessons()
const { fetchGroup } = useHeadTeacherGroups()
const { logActivity } = useActivityLog()

const lessons = ref<any[]>([])
const groupName = ref('')
const searchQuery = ref('')
const showDeleteModal = ref(false)
const lessonToDelete = ref<number | null>(null)

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

const columns: DataTableColumns = [
  {
    title: '#',
    key: 'index',
    width: 60,
    render: (_, index) => {
      return (pagination.value.page - 1) * pagination.value.pageSize + index + 1
    }
  },
  {
    title: t('admin.forms.title'),
    key: 'title',
    render: (row) => h('strong', row.title)
  },
  {
    title: t('admin.forms.date'),
    key: 'lesson_date',
    render: (row) => {
      const date = new Date(row.lesson_date)
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, null, { default: () => h(DateIcon) }),
          h('span', date.toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'tk-TM')),
          h(NIcon, null, { default: () => h(TimeIcon) }),
          h('span', date.toLocaleTimeString(locale.value === 'ru' ? 'ru-RU' : 'tk-TM', { hour: '2-digit', minute: '2-digit' }))
        ]
      })
    }
  },
  {
    title: t('admin.forms.homework'),
    key: 'homework',
    render: (row) => row.homework || h(NText, { depth: 3 }, { default: () => '—' })
  },
  {
    title: t('admin.actions.actions'),
    key: 'actions',
    width: 120,
    render: (row) => {
      return h(NSpace, { justify: 'center' }, {
        default: () => [
          h(NButton, {
            circle: true,
            quaternary: true,
            type: 'primary',
            onClick: () => handleEdit(row)
          }, {
            icon: () => h(NIcon, null, { default: () => h(EditIcon) })
          }),
          h(NButton, {
            circle: true,
            quaternary: true,
            type: 'error',
            onClick: () => handleDelete(row)
          }, {
            icon: () => h(NIcon, null, { default: () => h(DeleteIcon) })
          })
        ]
      })
    }
  }
]

const filteredLessons = computed(() => {
  if (!searchQuery.value) return lessons.value
  const query = searchQuery.value.toLowerCase()
  return lessons.value.filter(l => 
    l.title.toLowerCase().includes(query) || 
    (l.homework && l.homework.toLowerCase().includes(query))
  )
})

const loadData = async () => {
  const groupId = parseInt(route.params.groupId as string)
  try {
    const [lessonsData, groupData] = await Promise.all([
      fetchLessons(groupId),
      fetchGroup(groupId)
    ])
    lessons.value = Array.isArray(lessonsData) ? lessonsData : (lessonsData.results || [])
    groupName.value = groupData.name || ''
    pagination.value.itemCount = lessons.value.length
  } catch (err) {
    console.error('Load lessons error:', err)
  }
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
}

const handleAddLesson = () => {
  const groupId = route.params.groupId
  router.push(`/cabinet/head-teacher/lessons/add?group_id=${groupId}`)
}

const handleEdit = (lesson: any) => {
  const groupId = route.params.groupId
  router.push(`/cabinet/head-teacher/lessons/${lesson.id}/edit?group_id=${groupId}`)
}

const handleDelete = (lesson: any) => {
  lessonToDelete.value = lesson.id
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!lessonToDelete.value) return
  
  try {
    await deleteLesson(lessonToDelete.value)
    message.success(t('admin.actions.deleteSuccess'))
    
    logActivity(
      'delete',
      `Deleted lesson with ID ${lessonToDelete.value}`,
      'Lesson',
      lessonToDelete.value
    )
    
    loadData()
  } catch (err) {
    console.error('Delete lesson error:', err)
  } finally {
    showDeleteModal.value = false
    lessonToDelete.value = null
  }
}

onMounted(() => {
  logActivity('view', 'View lessons list page')
  loadData()
})
</script>

<style scoped>
.head-teacher-page {
  max-width: 1200px;
  margin: 0 auto;
}

.table-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
}

.action-button {
  height: 40px;
  padding: 0 20px;
  font-weight: 500;
}
</style>

