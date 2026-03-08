import { ref } from 'vue'
import { api } from './useApi'

export interface StudentGroup {
  id: number
  name: string
  course_name: string | null
  teacher_name: string | null
  school_name: string | null
  start_date: string | null
  end_date: string | null
  time_slot: string | null
  week_days: string[] | null
  is_active: boolean
  total_lessons: number
  completed_lessons: number
  progress: number
  next_lesson: { id: number; title: string | null; date: string | undefined } | null
  average_grade: number | null
  total_paid: number
  tariff_price: number | null
  student_discount: number
}

export function useStudentGroups() {
  const groups = ref<StudentGroup[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchGroups() {
    loading.value = true
    error.value = null
    try {
      const data = await api.cabinet.student.groups()
      groups.value = (data as StudentGroup[]) || []
    } catch (e: unknown) {
      error.value = (e as Error)?.message || 'Failed to load groups'
    } finally {
      loading.value = false
    }
  }

  return { groups, loading, error, fetchGroups }
}
