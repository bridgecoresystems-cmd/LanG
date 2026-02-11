import { useEden } from './useEden'

/**
 * Composable for managing courses via Eden Treaty
 */
export const useAdminCourses = () => {
  const api = useEden()

  const getAll = async () => {
    const { data, error } = await api.api.v1.admin.courses.get()
    if (error) throw error
    return data
  }

  const getById = async (id: number) => {
    const { data, error } = await api.api.v1.admin.courses[id].get()
    if (error) throw error
    return data
  }

  const create = async (course: any) => {
    const { data, error } = await api.api.v1.admin.courses.post(course)
    if (error) throw error
    return data
  }

  const update = async (id: number, course: any) => {
    const { data, error } = await api.api.v1.admin.courses[id].put(course)
    if (error) throw error
    return data
  }

  const remove = async (id: number) => {
    const { data, error } = await api.api.v1.admin.courses[id].delete()
    if (error) throw error
    return data
  }

  return {
    getAll,
    getById,
    create,
    update,
    remove
  }
}
