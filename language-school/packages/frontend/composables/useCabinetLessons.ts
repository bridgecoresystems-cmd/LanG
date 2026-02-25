import { useEden } from './useEden'
import { useAuthStore } from '~/stores/authStore'

export interface Lesson {
  id: number
  group_id: number
  group_name?: string
  title: string
  description?: string | null
  lesson_date: string
  duration_minutes: number
  homework?: string | null
  materials?: string | null
  lesson_plan?: string | null
  lesson_notes?: string | null
}

function cabinetFetch<T>(path: string, opts?: { method?: string; body?: any }): Promise<T> {
  return $fetch<T>(path, {
    credentials: 'include',
    method: opts?.method || 'GET',
    body: opts?.body,
  })
}

export const useCabinetLessons = () => {
  const api = useEden()
  const authStore = useAuthStore()
  const role = authStore.user?.role

  const getList = async (params: { group_id: number }) => {
    if (role === 'TEACHER') {
      return cabinetFetch<Lesson[]>(`/api/v1/cabinet/teacher/groups/${params.group_id}/lessons`)
    }
    if (role === 'STUDENT') {
      return cabinetFetch<Lesson[]>(`/api/v1/cabinet/student/groups/${params.group_id}/lessons`)
    }
    const ht = api.api.v1.cabinet['head-teacher']
    const { data, error } = await ht.lessons.get({ query: { group_id: params.group_id } })
    if (error) throw error
    return (data ?? []) as Lesson[]
  }

  const getById = async (id: number) => {
    if (role === 'TEACHER') {
      return cabinetFetch<Lesson>(`/api/v1/cabinet/teacher/lessons/${id}`)
    }
    if (role === 'STUDENT') {
      return cabinetFetch<Lesson>(`/api/v1/cabinet/student/lessons/${id}`)
    }
    const ht = api.api.v1.cabinet['head-teacher']
    const { data, error } = await ht.lessons({ id: String(id) }).get()
    if (error) throw error
    return data as Lesson
  }

  const update = async (id: number, body: Partial<Lesson>) => {
    if (role === 'TEACHER') {
      return cabinetFetch<Lesson>(`/api/v1/cabinet/teacher/lessons/${id}`, {
        method: 'PATCH',
        body,
      })
    }
    const ht = api.api.v1.cabinet['head-teacher']
    const { data, error } = await ht.lessons({ id: String(id) }).patch(body)
    if (error) throw error
    return data
  }

  return { getList, getById, update }
}
