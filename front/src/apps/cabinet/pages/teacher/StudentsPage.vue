<template>
  <CabinetLayout>
    <n-space vertical size="large" class="students-page">
      <div class="students-header">
        <n-h1 style="margin-bottom: 4px;">{{ $t('cabinet.students.title') }}</n-h1>
        <n-text depth="3">{{ $t('cabinet.students.description') }}</n-text>
      </div>

      <n-card bordered class="filters-card">
        <n-grid cols="1 m:2" responsive="screen" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-space vertical size="small">
              <n-text depth="2" strong>{{ $t('cabinet.grades.filterByGroup') }}</n-text>
              <n-select
                v-model:value="selectedGroupId"
                :options="groupOptions"
                :placeholder="$t('cabinet.grades.allGroups')"
                clearable
                @update:value="loadStudents"
              />
            </n-space>
          </n-gi>
          <n-gi>
            <n-space vertical size="small">
              <n-text depth="2" strong>{{ $t('admin.search') }}</n-text>
              <n-input v-model:value="searchQuery" :placeholder="$t('admin.search')">
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
          :data="filteredStudents"
          :pagination="pagination"
          :bordered="false"
          scroll-x="800"
        />
      </n-card>

      <!-- Award Points Modal -->
      <n-modal
        v-model:show="awardDialogVisible"
        preset="card"
        style="width: 450px"
        title="Наградить студента"
      >
        <n-space vertical size="large">
          <n-thing v-if="selectedStudent">
            <template #avatar>
              <n-avatar
                round
                size="large"
                :src="selectedStudent.avatar || undefined"
              >
                <template #icon v-if="!selectedStudent.avatar">
                  <n-icon><user-icon /></n-icon>
                </template>
              </n-avatar>
            </template>
            <template #header>
              <n-text strong>{{ selectedStudent.full_name }}</n-text>
            </template>
            <template #description>
              <n-text depth="3">Баланс: {{ selectedStudent.points || 0 }} pts</n-text>
            </template>
          </n-thing>

          <n-form label-placement="top">
            <n-form-item label="Количество баллов">
              <n-input-number
                v-model:value="awardAmount"
                :min="1"
                :max="100"
                style="width: 100%"
              />
            </n-form-item>
            <n-form-item label="Комментарий">
              <n-input
                v-model:value="awardComment"
                type="textarea"
                placeholder="За что награждаем?"
                :autosize="{ minRows: 3 }"
              />
            </n-form-item>
          </n-form>

          <n-space justify="end">
            <n-button @click="awardDialogVisible = false">Отмена</n-button>
            <n-button
              type="primary"
              :loading="pointsLoading"
              @click="handleAwardPoints"
            >
              Наградить
            </n-button>
          </n-space>
        </n-space>
      </n-modal>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NGrid, NGi, NCard, NSelect, NInput, NDataTable, 
  NAvatar, NTag, NButton, NIcon, NModal, NForm, NFormItem, 
  NInputNumber, NSpin, NAlert, NBadge, NThing
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { 
  SearchOutline as SearchIcon,
  StarOutline as StarIcon,
  GiftOutline as GiftIcon,
  MailOutline as MailIcon,
  PersonOutline as UserIcon,
  ChevronForwardOutline as ChevronIcon
} from '@vicons/ionicons5'
import { useTeacherCabinet, useCabinetCourses } from '@/composables/useCabinet'
import { usePoints } from '@/composables/usePoints'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { loading, error, fetchTeacherStudents } = useTeacherCabinet()
const { fetchCourses } = useCabinetCourses()
const { transferPoints, loading: pointsLoading } = usePoints()

const students = ref<any[]>([])
const groups = ref<any[]>([])
const selectedGroupId = ref<number | null>(null)
const searchQuery = ref('')

const awardDialogVisible = ref(false)
const selectedStudent = ref<any>(null)
const awardAmount = ref(10)
const awardComment = ref('')

const groupOptions = computed(() => groups.value.map(g => ({ label: g.name, value: g.id })))

const columns: DataTableColumns<any> = [
  {
    title: '#',
    key: 'index',
    width: 60,
    render: (_, index) => index + 1
  },
  {
    title: t('admin.table.fullName'),
    key: 'full_name',
    sorter: 'default',
    render(row) {
      return h(NSpace, { align: 'center', wrap: false }, {
        default: () => [
          h(NAvatar, {
            round: true,
            size: 'medium',
            src: row.avatar || undefined
          }, {
            icon: () => h(NIcon, null, { default: () => h(UserIcon) })
          }),
          h(NSpace, { vertical: true, size: 4 }, {
            default: () => [
              h(NText, { strong: true }, { default: () => row.full_name }),
              h(NText, { depth: 3 }, { default: () => row.username })
            ]
          })
        ]
      })
    }
  },
  {
    title: t('cabinet.menu.groups'),
    key: 'groups',
    render(row) {
      return h(NSpace, { size: 'small' }, {
        default: () => row.groups.map((group: any) => 
          h(NTag, { size: 'small', type: 'info', bordered: false }, { default: () => group.name })
        )
      })
    }
  },
  {
    title: t('admin.forms.phone'),
    key: 'phone',
    sorter: 'default'
  },
  {
    title: t('cabinet.dashboard.stats.activityPoints'),
    key: 'points',
    sorter: 'default',
    render(row) {
      return h(NBadge, { value: row.points || 0, type: 'warning' })
    }
  },
  {
    title: t('common.actions'),
    key: 'actions',
    render(row) {
      return h(NSpace, { size: 'small' }, {
        default: () => [
          h(NButton, {
            size: 'small',
            circle: true,
            quaternary: true,
            type: 'warning',
            onClick: () => router.push(`/cabinet/teacher/grades?student_id=${row.id}`)
          }, {
            icon: () => h(NIcon, null, { default: () => h(StarIcon) })
          }),
          h(NButton, {
            size: 'small',
            circle: true,
            quaternary: true,
            type: 'success',
            onClick: () => openAwardDialog(row)
          }, {
            icon: () => h(NIcon, null, { default: () => h(GiftIcon) })
          }),
          h(NButton, {
            size: 'small',
            circle: true,
            quaternary: true,
            type: 'info',
            onClick: () => router.push(`/cabinet/head-teacher/mailing/create?recipient_id=${row.id}`)
          }, {
            icon: () => h(NIcon, null, { default: () => h(MailIcon) })
          })
        ]
      })
    }
  }
]

const pagination = {
  pageSize: 10
}

const openAwardDialog = (student: any) => {
  selectedStudent.value = student
  awardAmount.value = 10
  awardComment.value = ''
  awardDialogVisible.value = true
}

const handleAwardPoints = async () => {
  if (!selectedStudent.value || !awardAmount.value) return
  
  try {
    await transferPoints(selectedStudent.value.user_id || selectedStudent.value.id, awardAmount.value, awardComment.value)
    awardDialogVisible.value = false
    await loadStudents()
  } catch (err) {
    console.error('Failed to award points:', err)
  }
}

const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  const query = searchQuery.value.toLowerCase()
  return students.value.filter(s => 
    s.full_name.toLowerCase().includes(query) || 
    s.username.toLowerCase().includes(query) ||
    s.email?.toLowerCase().includes(query)
  )
})

const loadGroups = async () => {
  try {
    const data = await fetchCourses(true)
    groups.value = data.courses || []
  } catch (err) {
    console.error('Failed to load groups:', err)
  }
}

const loadStudents = async () => {
  try {
    students.value = await fetchTeacherStudents(selectedGroupId.value || undefined)
  } catch (err) {
    console.error('Failed to load students:', err)
  }
}

onMounted(async () => {
  if (route.query.group_id) {
    selectedGroupId.value = parseInt(route.query.group_id as string)
  }
  await Promise.all([loadGroups(), loadStudents()])
})
</script>

<style scoped>
.students-page {
  max-width: 1400px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
