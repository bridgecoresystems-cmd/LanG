<template>
  <div class="attendance-page">
    <header class="page-header">
      <NButton quaternary circle @click="goBack">
        <template #icon>
          <NIcon><component :is="BackIcon" /></NIcon>
        </template>
      </NButton>
      <div class="page-header__text">
        <NH1 class="page-header__title">Журнал посещаемости</NH1>
        <p class="page-header__subtitle">Отмечайте присутствие учеников на занятиях</p>
      </div>
      <div class="page-header__lesson">
        <NSpace>
          <NButton type="primary" :loading="savingAll" @click="saveAll">
            Сохранить всё
          </NButton>
          <NSelect
            v-model:value="selectedLessonId"
            :options="lessonOptions"
            :loading="lessonsLoading"
            placeholder="Выберите урок"
            size="medium"
            class="lesson-select"
            @update:value="onLessonChange"
          />
        </NSpace>
      </div>
    </header>

    <NCard v-if="selectedLesson" bordered class="attendance-card mt-6">
      <div v-if="studentsLoading" class="loading-state">
        <NSpin size="large" />
      </div>
      <div v-else-if="students.length > 0" class="attendance-list">
        <div
          v-for="row in students"
          :key="row.id"
          class="attendance-row"
          :class="{ 'attendance-row--saving': savingId === row.id }"
        >
          <div class="attendance-row__student">
            <NAvatar
              round
              :size="40"
              :src="avatarSrc(row)"
              :fallback-src="avatarFallback(row)"
              class="attendance-row__avatar"
            >
              {{ getInitial(row) }}
            </NAvatar>
            <div class="attendance-row__info">
              <span class="attendance-row__name">
                {{ row.firstName }} {{ row.lastName }}
              </span>
              <span class="attendance-row__username">@{{ row.username }}</span>
            </div>
          </div>
          <div class="attendance-row__status">
            <NSelect
              v-model:value="attendanceMap[row.id]"
              :options="statusOptions"
              size="medium"
              class="status-select"
              @update:value="(v: string) => updateStatus(row.id, v)"
            />
          </div>
          <div class="attendance-row__time">
            <div class="time-inputs">
              <NTimePicker
                v-model:value="entryTimeMap[row.id]"
                format="HH:mm"
                placeholder="Вход"
                size="small"
                clearable
                @update:value="() => updateStatus(row.id, attendanceMap[row.id])"
              />
              <NTimePicker
                v-model:value="exitTimeMap[row.id]"
                format="HH:mm"
                placeholder="Выход"
                size="small"
                clearable
                @update:value="() => updateStatus(row.id, attendanceMap[row.id])"
              />
            </div>
            <div class="status-indicator">
              <NIcon
                v-if="savingId === row.id"
                :component="SpinnerIcon"
                class="status-icon status-icon--saving"
              />
              <NIcon
                v-else-if="lastSavedId === row.id"
                :component="CheckIcon"
                class="status-icon status-icon--saved"
              />
            </div>
          </div>
          <div class="attendance-row__notes">
            <NInput
              v-model:value="notesMap[row.id]"
              type="text"
              placeholder="Заметка..."
              size="medium"
              clearable
              @blur="updateStatus(row.id, attendanceMap[row.id])"
            />
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <NEmpty description="В группе пока нет учеников" />
      </div>
    </NCard>

    <NCard v-else bordered class="empty-lesson-card mt-6">
      <div class="empty-lesson">
        <NIcon :component="CalendarIcon" size="64" class="empty-lesson__icon" />
        <h3 class="empty-lesson__title">Урок не выбран</h3>
        <p class="empty-lesson__text">Выберите урок из списка выше, чтобы отметить посещаемость</p>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NH1, NButton, NIcon, NCard, NSelect, NInput, NAvatar, NEmpty, NSpin, NTimePicker, NSpace, useMessage
} from 'naive-ui'
import {
  ChevronBackOutline as BackIcon,
  CalendarOutline as CalendarIcon,
  CheckmarkCircleOutline as CheckIcon,
  SyncOutline as SpinnerIcon
} from '@vicons/ionicons5'
import { useCabinetGroups } from '~/composables/useCabinetGroups'
import { useCabinetLessons } from '~/composables/useCabinetLessons'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const groupId = computed(() => parseInt(route.params.id as string))
const message = useMessage()
const groupsApi = useCabinetGroups()

const avatarSrc = (row: any) => {
  const av = row.avatar
  if (!av || typeof av !== 'string' || !av.trim()) return undefined
  const t = av.trim()
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  if (t.startsWith('/')) return t
  return `/${t}`
}
const lessonsApi = useCabinetLessons()

const lessons = ref<any[]>([])
const students = ref<any[]>([])
const lessonsLoading = ref(true)
const studentsLoading = ref(false)
const selectedLessonId = ref<number | null>(null)
const attendanceMap = ref<Record<string, string>>({})
const entryTimeMap = ref<Record<string, number | null>>({})
const exitTimeMap = ref<Record<string, number | null>>({})
const notesMap = ref<Record<string, string>>({})
const savingId = ref<string | null>(null)
const lastSavedId = ref<string | null>(null)
const savingAll = ref(false)

const selectedLesson = computed(() =>
  lessons.value.find((l) => l.id === selectedLessonId.value)
)

const lessonOptions = computed(() =>
  lessons.value.map((l) => ({
    label: `${formatDate(l.lesson_date)} — ${l.title}`,
    value: l.id
  }))
)

const statusOptions = [
  { label: 'Присутствует', value: 'present' },
  { label: 'Отсутствует', value: 'absent' },
  { label: 'Опоздал', value: 'late' },
  { label: 'Уважительная', value: 'excused' }
]

const getInitial = (row: any) => {
  const first = row.firstName?.[0] || row.lastName?.[0] || ''
  const last = row.lastName?.[0] || row.firstName?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

const avatarFallback = (row: any) => {
  const letter = getInitial(row)
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect fill='%2318a058' width='40' height='40' rx='20'/><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' fill='white' font-size='16' font-weight='600'>${letter}</text></svg>`
}

const loadLessons = async () => {
  lessonsLoading.value = true
  try {
    const data = await lessonsApi.getList({ group_id: groupId.value })
    lessons.value = Array.isArray(data) ? data : []
    if (lessons.value.length > 0 && !selectedLessonId.value) {
      selectedLessonId.value = lessons.value[0].id
    }
  } catch (e) {
    console.error(e)
  } finally {
    lessonsLoading.value = false
  }
}

const loadStudents = async () => {
  studentsLoading.value = true
  try {
    const data = await groupsApi.getGroupStudents(groupId.value)
    students.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
    students.value = []
  } finally {
    studentsLoading.value = false
  }
}

const loadAttendance = async () => {
  if (!selectedLesson.value) return
  try {
    const data = await groupsApi.getAttendance(groupId.value)
    const lessonAttendance = (data || []).filter(
      (a: any) => a.lessonId === selectedLesson.value.id
    )
    attendanceMap.value = {}
    entryTimeMap.value = {}
    exitTimeMap.value = {}
    notesMap.value = {}
    lessonAttendance.forEach((a: any) => {
      attendanceMap.value[a.userId] = a.status
      entryTimeMap.value[a.userId] = a.entryTime ? new Date(a.entryTime).getTime() : null
      exitTimeMap.value[a.userId] = a.exitTime ? new Date(a.exitTime).getTime() : null
      notesMap.value[a.userId] = a.notes || ''
    })
    students.value.forEach((s) => {
      if (!attendanceMap.value[s.id]) {
        attendanceMap.value[s.id] = 'present'
      }
    })
  } catch (e) {
    console.error(e)
  }
}

const onLessonChange = () => {
  loadAttendance()
}

const updateStatus = async (userId: string, status: string) => {
  if (!selectedLesson.value) return
  savingId.value = userId
  try {
    const entryTime = entryTimeMap.value[userId]
    const exitTime = exitTimeMap.value[userId]
    
    await groupsApi.saveAttendance({
      lesson_id: selectedLesson.value.id,
      user_id: userId,
      status,
      notes: notesMap.value[userId],
      entry_time: entryTime ? new Date(entryTime).toISOString() : undefined,
      exit_time: exitTime ? new Date(exitTime).toISOString() : undefined,
    })
    lastSavedId.value = userId
    setTimeout(() => {
      if (lastSavedId.value === userId) lastSavedId.value = null
    }, 2000)
  } catch (e) {
    console.error(e)
  } finally {
    savingId.value = null
  }
}

const saveAll = async () => {
  if (!selectedLesson.value) return
  savingAll.value = true
  try {
    const promises = students.value.map(s => {
      const entryTime = entryTimeMap.value[s.id]
      const exitTime = exitTimeMap.value[s.id]
      return groupsApi.saveAttendance({
        lesson_id: selectedLesson.value.id,
        user_id: s.id,
        status: attendanceMap.value[s.id],
        notes: notesMap.value[s.id],
        entry_time: entryTime ? new Date(entryTime).toISOString() : undefined,
        exit_time: exitTime ? new Date(exitTime).toISOString() : undefined,
      })
    })
    await Promise.all(promises)
    message.success('Все данные успешно сохранены')
  } catch (e) {
    console.error(e)
    message.error('Ошибка при сохранении данных')
  } finally {
    savingAll.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit'
  })
}

const goBack = () => {
  navigateTo(`/cabinet/teacher/groups/${groupId.value}/students`)
}

watch(selectedLessonId, () => {
  loadAttendance()
})

loadLessons()
loadStudents()
</script>

<style scoped>
.attendance-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.page-header__text {
  flex: 1;
  min-width: 200px;
}

.page-header__title {
  margin: 0 0 4px;
  font-weight: 700;
}

.page-header__subtitle {
  margin: 0;
  color: var(--n-text-color-3);
  font-size: 0.9rem;
}

.page-header__lesson {
  flex-shrink: 0;
}

.lesson-select {
  min-width: 280px;
}

.attendance-card :deep(.n-card__content) {
  padding: 0;
}

.attendance-list {
  display: flex;
  flex-direction: column;
}

.attendance-row {
  display: grid;
  grid-template-columns: 1fr minmax(160px, auto) minmax(200px, auto) 1fr;
  gap: 20px;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--n-border-color);
  transition: background-color 0.15s ease;
}

.attendance-row__time {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-inputs {
  display: flex;
  gap: 8px;
}

.time-inputs :deep(.n-time-picker) {
  width: 100px;
}

.status-indicator {
  width: 24px;
  display: flex;
  justify-content: center;
}

.attendance-row:last-child {
  border-bottom: none;
}

.attendance-row:hover {
  background-color: var(--n-color-hover);
}

.attendance-row--saving {
  background-color: var(--n-color-hover);
}

.attendance-row__student {
  display: flex;
  align-items: center;
  gap: 14px;
}

.attendance-row__avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #18a058 0%, #36ad6a 100%);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.attendance-row__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.attendance-row__name {
  font-weight: 600;
  color: var(--n-text-color-1);
}

.attendance-row__username {
  font-size: 0.8rem;
  color: var(--n-text-color-3);
}

.attendance-row__status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-select {
  min-width: 160px;
}

.status-icon {
  flex-shrink: 0;
  font-size: 20px;
}

.status-icon--saving {
  color: var(--n-primary-color);
  animation: spin 0.8s linear infinite;
}

.status-icon--saved {
  color: #18a058;
}

.attendance-row__notes :deep(.n-input) {
  max-width: 100%;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.empty-state {
  padding: 48px;
  text-align: center;
}

.empty-lesson-card :deep(.n-card__content) {
  padding: 48px;
}

.empty-lesson {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-lesson__icon {
  color: var(--n-text-color-3);
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-lesson__title {
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--n-text-color-1);
}

.empty-lesson__text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--n-text-color-3);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
