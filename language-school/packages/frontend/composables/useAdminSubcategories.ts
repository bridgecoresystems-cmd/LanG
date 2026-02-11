import { useEden } from './useEden'

/**
 * Composable for managing subcategories via Eden Treaty
 */
export const useAdminSubcategories = () => {
  const api = useEden()

  const getAll = async () => {
    const { data, error } = await api.api.v1.admin.subcategories.get()
    if (error) throw error
    return data
  }

  const getById = async (id: number) => {
    const { data, error } = await api.api.v1.admin.subcategories({ id }).get()
    if (error) throw error
    return data
  }

  const create = async (subcategory: any) => {
    const { data, error } = await api.api.v1.admin.subcategories.post(subcategory)
    if (error) throw error
    return data
  }

  const update = async (id: number, subcategory: any) => {
    const { data, error } = await api.api.v1.admin.subcategories({ id }).patch(subcategory)
    if (error) throw error
    return data
  }

  const remove = async (id: number) => {
    const { data, error } = await api.api.v1.admin.subcategories({ id }).delete()
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
