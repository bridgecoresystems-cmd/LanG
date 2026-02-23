<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Журнал посещаемости</h1>
        <p class="text-gray-500">Отмечайте присутствие учеников на занятиях</p>
      </div>
      <div class="flex gap-2">
        <USelectMenu
          v-model="selectedLesson"
          :options="lessons"
          option-attribute="title"
          placeholder="Выберите урок"
          class="w-64"
        >
          <template #label>
            <span v-if="selectedLesson">{{ formatDate(selectedLesson.lesson_date) }} - {{ selectedLesson.title }}</span>
            <span v-else>Выберите урок</span>
          </template>
        </USelectMenu>
      </div>
    </div>

    <UCard v-if="selectedLesson" :ui="{ body: { padding: 'p-0' } }" class="overflow-hidden">
      <UTable :rows="students" :columns="columns">
        <template #student-data="{ row }">
          <div class="flex items-center gap-3 px-4 py-2">
            <UAvatar :src="row.avatar" :alt="row.firstName" size="sm" />
            <div>
              <div class="font-medium text-gray-900 dark:text-white">
                {{ row.firstName }} {{ row.lastName }}
              </div>
              <div class="text-xs text-gray-500">@{{ row.username }}</div>
            </div>
          </div>
        </template>

        <template #status-data="{ row }">
          <div class="flex items-center gap-2">
            <USelect
              v-model="attendanceMap[row.id]"
              :options="statusOptions"
              size="sm"
              class="w-40"
              @update:model-value="updateStatus(row.id, $event)"
            />
            <UIcon 
              v-if="savingId === row.id" 
              name="i-heroicons-arrow-path" 
              class="animate-spin text-primary-500" 
            />
            <UIcon 
              v-else-if="lastSavedId === row.id" 
              name="i-heroicons-check-circle" 
              class="text-emerald-500" 
            />
          </div>
        </template>

        <template #notes-data="{ row }">
          <UInput
            v-model="notesMap[row.id]"
            size="sm"
            placeholder="Заметка..."
            @blur="updateStatus(row.id, attendanceMap[row.id])"
          />
        </template>
      </UTable>
    </UCard>

    <div v-else class="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl ring-1 ring-gray-200 dark:ring-gray-800">
      <UIcon name="i-heroicons-calendar-days" class="w-16 h-16 text-gray-300 mb-4 mx-auto" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Урок не выбран</h3>
      <p class="text-gray-500">Пожалуйста, выберите урок из списка выше, чтобы отметить посещаемость.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCabinetGroups } from '~/composables/useCabinetGroups'
import { useCabinetLessons } from '~/composables/useCabinetLessons'

definePageMeta({ 
  layout: 'cabinet', 
  middleware: 'cabinet-auth' 
})

const route = useRoute()
const groupId = computed(() => parseInt(route.params.id as string))
const groupsApi = useCabinetGroups()
const lessonsApi = useCabinetLessons()

const lessons = ref<any[]>([])
const students = ref<any[]>([])
const selectedLesson = ref<any>(null)
const attendanceMap = ref<Record<string, string>>({})
const notesMap = ref<Record<string, string>>({})
const savingId = ref<string | null>(null)
const lastSavedId = ref<string | null>(null)

const columns = [
  { key: 'student', label: 'Ученик' },
  { key: 'status', label: 'Статус' },
  { key: 'notes', label: 'Заметки' }
]

const statusOptions = [
  { label: 'Присутствует', value: 'present' },
  { label: 'Отсутствует', value: 'absent' },
  { label: 'Опоздал', value: 'late' },
  { label: 'Уважительная', value: 'excused' }
]

const loadData = async () => {
  try {
    const [lessonsData, studentsData] = await Promise.all([
      lessonsApi.getList({ group_id: groupId.value }),
      groupsApi.getGroupStudents(groupId.value)
    ])
    lessons.value = lessonsData
    students.value = studentsData
    
    if (lessons.value.length > 0) {
      selectedLesson.value = lessons.value[0]
    }
  } catch (e) {
    console.error(e)
  }
}

const loadAttendance = async () => {
  if (!selectedLesson.value) return
  try {
    const data = await groupsApi.getAttendance(groupId.value)
    const lessonAttendance = data.filter((a: any) => a.lessonId === selectedLesson.value.id)
    
    // Сбрасываем карты
    attendanceMap.value = {}
    notesMap.value = {}
    
    // Заполняем данными из БД
    lessonAttendance.forEach((a: any) => {
      attendanceMap.value[a.userId] = a.status
      notesMap.value[a.userId] = a.notes || ''
    })
    
    // Для остальных ставим 'present' по умолчанию (или оставляем пустым)
    students.value.forEach(s => {
      if (!attendanceMap.value[s.id]) {
        attendanceMap.value[s.id] = 'present'
      }
    })
  } catch (e) {
    console.error(e)
  }
}

const updateStatus = async (userId: string, status: string) => {
  if (!selectedLesson.value) return
  
  savingId.value = userId
  try {
    await groupsApi.saveAttendance({
      lesson_id: selectedLesson.value.id,
      user_id: userId,
      status: status,
      notes: notesMap.value[userId]
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

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

watch(selectedLesson, () => {
  loadAttendance()
})

loadData()
</script>
