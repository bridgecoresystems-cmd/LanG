import { useEden } from './useEden'

export interface HtCourse {
  id: number
  name: string
  language: string
  level: string
  description?: string | null
  duration_months: number
  is_active: boolean
  school_id?: number | null
  created_at?: string
  updated_at?: string
}

export const useCabinetCourses = () => {
  const api = useEden()
  const ht = api.api.v1.cabinet['head-teacher']

  const getList = async (params?: { search?: string; is_active?: string }) => {
    const opts = params && Object.values(params).some(Boolean)
      ? { query: params }
      : undefined
    const { data, error } = await ht.courses.get(opts)
    if (error) throw error
    return (data ?? []) as HtCourse[]
  }

  const getById = async (id: number) => {
    const { data, error } = await ht.courses({ id: String(id) }).get()
    if (error) throw error
    return data as HtCourse
  }

  const create = async (body: Partial<HtCourse> & { name: string; language: string; level: string }) => {
    const { data, error } = await ht.courses.post({
      name: body.name,
      language: body.language,
      level: body.level,
      description: body.description,
      duration_months: body.duration_months ?? 3,
      is_active: body.is_active ?? true,
    })
    if (error) throw error
    return data
  }

  const update = async (id: number, body: Partial<HtCourse>) => {
    const { data, error } = await ht.courses({ id: String(id) }).patch(body)
    if (error) throw error
    return data
  }

  const remove = async (id: number) => {
    const { error } = await ht.courses({ id: String(id) }).delete()
    if (error) throw error
  }

  return { getList, getById, create, update, remove }
}
