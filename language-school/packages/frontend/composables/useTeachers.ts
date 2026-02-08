import type { Teacher } from '~/types/teacher'

export const useTeachers = () => {
  const { locale } = useI18n()
  const api = useEden()

  const teachers = ref<Teacher[]>([])
  const teacher = ref<Teacher | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTeachers = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.users.teachers.get({
        query: { lang: locale.value },
      })
      if (err) throw err
      teachers.value = Array.isArray(data) ? data : []
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch teachers'
    } finally {
      loading.value = false
    }
  }

  const fetchTeacher = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.users.teachers({ id: String(id) }).get({
        query: { lang: locale.value },
      })
      if (err) throw err
      teacher.value = data && !('error' in data) ? (data as Teacher) : null
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch teacher'
      teacher.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    teachers,
    teacher,
    loading,
    error,
    fetchTeachers,
    fetchTeacher,
  }
}
