<template>
  <div class="students-page">
    <header class="page-header">
      <NButton quaternary circle @click="goBack">
        <template #icon>
          <NIcon><component :is="BackIcon" /></NIcon>
        </template>
      </NButton>
      <div class="page-header__text">
        <NH1 class="page-header__title">Список учеников</NH1>
        <p class="page-header__subtitle">{{ course?.course_name || course?.name || 'Группа' }}</p>
      </div>
    </header>

    <!-- Course info header -->
    <NCard v-if="course" bordered class="course-header-card mt-4">
      <div class="course-header">
        <div class="course-header__main">
          <div class="cell-title">{{ course.course_name || course.courseName || '—' }}</div>
          <div class="cell-subtitle">{{ course.name || '' }}</div>
        </div>
        <div class="course-header__stats">
          <span class="cell-with-icon">
            <NIcon size="16" class="cell-icon"><component :is="PeopleIcon" /></NIcon>
            {{ course.students_count ?? 0 }} / {{ course.max_students ?? 15 }}
          </span>
        </div>
        <div class="course-header__dates">
          <span class="cell-with-icon">
            <NIcon size="14" class="cell-icon"><component :is="CalendarIcon" /></NIcon>
            {{ formatDateShort(course.start_date) }}
          </span>
          <span class="cell-with-icon">
            <NIcon size="14" class="cell-icon"><component :is="CalendarIcon" /></NIcon>
            {{ formatDateShort(course.end_date) }}
          </span>
        </div>
        <div class="course-header__progress">
          <div class="progress-header">
            <span>{{ course.progress || 0 }}%</span>
            <span class="progress-hint">{{ course.completed_lessons || 0 }} / {{ course.total_lessons || 0 }}</span>
          </div>
          <NProgress
            type="line"
            :percentage="course.progress || 0"
            :show-indicator="false"
            status="success"
          />
        </div>
        <div v-if="course.next_lesson && course.is_active" class="course-header__next">
          <span class="cell-with-icon">
            <NIcon size="14" class="cell-icon"><component :is="TimeIcon" /></NIcon>
            {{ course.next_lesson.title }}
          </span>
          <div class="cell-subtitle">{{ formatDateTime(course.next_lesson.date) }}</div>
        </div>
      </div>
    </NCard>

    <!-- Students table -->
    <NCard bordered class="students-table-card mt-6">
      <div v-if="pending" class="loading-state">
        <NSpin size="large" />
      </div>
      <div v-else class="table-wrapper">
        <table class="students-table">
          <thead>
            <tr>
              <th>ФИО ученика</th>
              <th>ФИО родителя</th>
              <th>Оплачено</th>
              <th>Чат</th>
              <th>Наградить</th>
              <th>Тел. ученика</th>
              <th>Тел. родителя</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in students" :key="s.id" class="student-row">
              <td>
                <div class="cell-title">{{ s.full_name || '—' }}</div>
              </td>
              <td>
                <div class="cell-subtitle">{{ s.parent_full_name || '—' }}</div>
              </td>
              <td>
                <div class="payment-cell">
                  <NText
                    v-if="s.paid_amount > 0"
                    :type="s.status === 'paid' ? 'success' : 'warning'"
                    strong
                    class="mb-1"
                  >
                    {{ s.paid_amount }} TMT
                  </NText>
                  <NText v-else type="error" strong class="mb-1">0 TMT</NText>
                  <div v-if="s.debt_amount > 0" class="debt-hint">
                    Долг: {{ s.debt_amount }} TMT
                  </div>
                </div>
              </td>
              <td>
                <NButton
                  size="small"
                  :type="chat.studentId === s.id && chat.isOpen ? 'primary' : 'default'"
                  :loading="chat.loadingId === s.id"
                  @click="openChat(s)"
                >
                  <template #icon>
                    <NIcon><component :is="ChatIcon" /></NIcon>
                  </template>
                  Чат
                  <NBadge
                    v-if="unreadMap[s.id] > 0 && !(chat.studentId === s.id && chat.isOpen)"
                    :value="unreadMap[s.id]"
                    :max="9"
                    style="margin-left: 4px;"
                  />
                </NButton>
              </td>
              <td><span class="placeholder">—</span></td>
              <td>
                <div class="cell-subtitle">{{ s.phone || '—' }}</div>
              </td>
              <td>
                <div class="cell-subtitle">{{ s.parent_phone || '—' }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!pending && students.length === 0" class="empty-state">
        <NEmpty description="В группе пока нет учеников" />
      </div>
    </NCard>

    <!-- Floating Chat Widget -->
    <ChatWidget
      v-model="chat.isOpen"
      :room-id="chat.roomId"
      :title="chat.title"
      :readonly="!courseIsActive"
      :current-user-id="authStore.user?.id"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import {
  NH1, NButton, NIcon, NCard, NProgress, NSpin, NEmpty, NText, NBadge,
} from 'naive-ui'
import {
  ChevronBackOutline as BackIcon,
  CalendarOutline as CalendarIcon,
  TimeOutline as TimeIcon,
  PeopleOutline as PeopleIcon,
  ChatbubbleEllipsesOutline as ChatIcon,
} from '@vicons/ionicons5'
import { useContextStore } from '~/stores/contextStore'
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const groupId = computed(() => parseInt(route.params.id as string))
const contextStore = useContextStore()
const authStore = useAuthStore()
const config = useRuntimeConfig()
const API = config.public.apiBase as string

// ── Course ────────────────────────────────────────────────────────────────────
const course = ref<any>(null)

const courseIsActive = computed(() => {
  if (!course.value) return true // default allow
  if (course.value.is_active === false) return false
  if (course.value.end_date && new Date(course.value.end_date) < new Date()) return false
  return true
})

const ensureCourseInContext = async () => {
  const found = contextStore.availableGroups.find((g: any) => g.id === groupId.value)
  if (found) {
    course.value = found
    contextStore.setSelectedGroup(groupId.value)
    return
  }
  try {
    const profileApi = (await import('~/composables/useCabinetProfile')).useCabinetProfile()
    const groups = await profileApi.getMyGroups()
    const list = Array.isArray(groups) ? groups : []
    contextStore.setGroups(list.map((g: any) => ({ ...g, course_name: g.course_name ?? g.courseName })))
    contextStore.setSelectedGroup(groupId.value)
    const c = list.find((g: any) => g.id === groupId.value)
    if (c) course.value = { ...c, course_name: c.course_name ?? c.courseName }
  } catch (e) {
    console.error('Failed to load course', e)
  }
}

// ── Students ──────────────────────────────────────────────────────────────────
const students = ref<any[]>([])
const pending = ref(true)

const loadStudents = async () => {
  pending.value = true
  try {
    const data = await $fetch<any[]>(
      `/api/v1/cabinet/head-teacher/groups/${groupId.value}/students`,
      { credentials: 'include' }
    )
    students.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Failed to load students', e)
    students.value = []
  } finally {
    pending.value = false
  }
}

// ── Chat ──────────────────────────────────────────────────────────────────────
const chat = reactive({
  isOpen: false,
  roomId: null as number | null,
  title: '',
  studentId: null as string | null,
  loadingId: null as string | null,
})

const unreadMap = ref<Record<string, number>>({})

async function openChat(student: any) {
  // Toggle if same student already loaded
  if (chat.studentId === student.id && chat.roomId) {
    chat.isOpen = !chat.isOpen
    return
  }

  chat.loadingId = student.id
  chat.isOpen = false

  try {
    const room = await $fetch<any>(
      `${API}/cabinet/chat/rooms/${groupId.value}/student/${student.id}`,
      { credentials: 'include' }
    )
    chat.roomId = room.id
    chat.title = student.full_name || student.username || 'Ученик'
    chat.studentId = student.id
    chat.isOpen = true
    unreadMap.value[student.id] = 0
  } catch (e) {
    console.error('Chat: open failed', e)
  } finally {
    chat.loadingId = null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('ru-RU', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatDateShort = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

const goBack = () => navigateTo('/cabinet/teacher/courses')

onMounted(async () => {
  await ensureCourseInContext()
  loadStudents()
})
</script>

<style scoped>
.students-page { padding-bottom: 80px; }

.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
.page-header__title { margin: 0 0 4px; font-weight: 700; }
.page-header__subtitle { margin: 0; color: var(--n-text-color-3); }

.course-header {
  display: flex; flex-wrap: wrap; align-items: flex-start; gap: 24px;
}
.course-header__main { min-width: 160px; }
.course-header__stats,
.course-header__dates,
.course-header__progress,
.course-header__next { flex: 0 0 auto; }

.cell-title { font-weight: 600; }
.cell-subtitle { font-size: 0.85rem; color: var(--n-text-color-3); margin-top: 2px; }
.cell-with-icon { display: inline-flex; align-items: center; gap: 6px; }
.cell-with-icon .cell-icon { color: #18a058; flex-shrink: 0; }
.course-header__dates { display: flex; flex-direction: column; gap: 4px; }

.progress-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 4px; font-size: 0.9rem;
}
.progress-hint { font-size: 0.8rem; color: var(--n-text-color-3); }
.course-header__progress { min-width: 140px; }

.table-wrapper { overflow-x: auto; }
.students-table { width: 100%; border-collapse: collapse; }
.students-table th,
.students-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--n-border-color);
  vertical-align: middle;
}
.students-table th {
  font-weight: 600; color: var(--n-text-color-2); white-space: nowrap;
}
.student-row:hover { background-color: var(--n-color-hover); }
.placeholder { color: var(--n-text-color-3); font-size: 0.9rem; }
.payment-cell { display: flex; flex-direction: column; align-items: flex-start; }
.debt-hint { font-size: 0.75rem; color: var(--n-error-color); font-weight: 500; }
.mb-1 { margin-bottom: 4px; }
.loading-state { display: flex; justify-content: center; padding: 40px 0; }
.empty-state { padding: 40px 0; text-align: center; }
</style>
