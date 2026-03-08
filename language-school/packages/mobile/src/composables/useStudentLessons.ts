import { ref } from 'vue'
import { api } from './useApi'

export function useStudentLessons() {
  const attendance = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAttendance(groupId: number) {
    loading.value = true
    error.value = null
    try {
      const data = await api.cabinet.attendance(groupId)
      attendance.value = data || []
    } catch (e: any) {
      error.value = e?.message || 'Failed to load attendance'
    } finally {
      loading.value = false
    }
  }

  return { attendance, loading, error, fetchAttendance }
}
