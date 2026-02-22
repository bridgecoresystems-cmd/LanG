import { useEden } from './useEden'

export interface HtLesson {
  id: number
  group_id: number
  group_name?: string
  title: string
  description?: string | null
  lesson_date: string
  duration_minutes: number
  homework?: string | null
  materials?: string | null
}

export const useCabinetLessons = () => {
  const api = useEden()
  const ht = api.api.v1.cabinet['head-teacher']

  const getList = async (params?: { group_id?: number }) => {
    const opts = params?.group_id ? { query: { group_id: params.group_id } } : undefined
    const { data, error } = await ht.lessons.get(opts)
    if (error) throw error
    return (data ?? []) as HtLesson[]
  }

  const getById = async (id: number) => {
    const { data, error } = await ht.lessons({ id: String(id) }).get()
    if (error) throw error
    return data as HtLesson
  }

  const create = async (body: { group_id: number; title: string; lesson_date: string; description?: string; duration_minutes?: number; homework?: string }) => {
    const { data, error } = await ht.lessons.post(body)
    if (error) throw error
    return data
  }

  const update = async (id: number, body: Partial<HtLesson>) => {
    const { data, error } = await ht.lessons({ id: String(id) }).patch(body)
    if (error) throw error
    return data
  }

  const remove = async (id: number) => {
    const { error } = await ht.lessons({ id: String(id) }).delete()
    if (error) throw error
  }

  return { getList, getById, create, update, remove }
}
