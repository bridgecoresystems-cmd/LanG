import { ref } from 'vue'
import { api } from './useApi'

export interface ScheduleLesson {
  id: number
  title: string | null
  description: string | null
  lessonDate: string | null
  durationMinutes: number | null
  homework: string | null
  groupId: number
  groupName: string
  courseName: string | null
  teacherFirstName: string | null
  teacherLastName: string | null
}

export function useSchedule() {
  const lessons = ref<ScheduleLesson[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSchedule(days = 14) {
    loading.value = true
    error.value = null
    try {
      const data = await api.cabinet.schedule({ days: String(days) })
      lessons.value = (data as ScheduleLesson[]) || []
    } catch (e: unknown) {
      error.value = (e as Error)?.message || 'Failed to load schedule'
    } finally {
      loading.value = false
    }
  }

  function lessonsForDay(date: string) {
    return lessons.value.filter((l) => l.lessonDate?.slice(0, 10) === date)
  }

  function nextLesson() {
    const now = new Date()
    return lessons.value
      .filter((l) => l.lessonDate && new Date(l.lessonDate) >= now)
      .sort((a, b) => new Date(a.lessonDate!).getTime() - new Date(b.lessonDate!).getTime())[0] ?? null
  }

  return { lessons, loading, error, fetchSchedule, lessonsForDay, nextLesson }
}
