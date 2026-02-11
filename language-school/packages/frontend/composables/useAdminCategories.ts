import { useEden } from './useEden'

/**
 * Composable for managing categories via Eden Treaty
 */
export const useAdminCategories = () => {
  const api = useEden()

  const getAll = async () => {
    const { data, error } = await api.api.v1.admin.categories.get()
    if (error) throw error
    return data
  }

  const getById = async (id: number) => {
    const { data, error } = await api.api.v1.admin.categories({ id }).get()
    if (error) throw error
    return data
  }

  const create = async (category: any) => {
    const { data, error } = await api.api.v1.admin.categories.post(category)
    if (error) throw error
    return data
  }

  const update = async (id: number, category: any) => {
    const { data, error } = await api.api.v1.admin.categories({ id }).patch(category)
    if (error) throw error
    return data
  }

  const remove = async (id: number) => {
    const { data, error } = await api.api.v1.admin.categories({ id }).delete()
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
