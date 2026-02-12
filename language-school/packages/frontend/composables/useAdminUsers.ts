import { useEden } from './useEden'

/**
 * Composable for managing users via Eden Treaty
 */
export const useAdminUsers = () => {
  const api = useEden()

  const getAll = async () => {
    const { data, error } = await api.api.v1.admin.users.get()
    if (error) throw error
    return data
  }

  const getById = async (id: number) => {
    const { data, error } = await api.api.v1.admin.users[id].get()
    if (error) throw error
    return data
  }

  const create = async (user: any) => {
    const { data, error } = await api.api.v1.admin.users.post(user)
    if (error) throw error
    return data
  }

  const update = async (id: number, user: any) => {
    const { data, error } = await api.api.v1.admin.users[id].patch(user)
    if (error) throw error
    return data
  }

  const remove = async (id: number) => {
    const { data, error } = await api.api.v1.admin.users[id].delete()
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
