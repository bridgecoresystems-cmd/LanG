import { useEden } from './useEden'

/**
 * Composable for managing changelogs via Eden Treaty
 */
export const useAdminChangelogs = () => {
  const api = useEden()

  const getAll = async () => {
    const { data, error } = await api.api.v1.admin.changelog.get()
    if (error) throw error
    return data
  }

  const getById = async (id: number) => {
    const { data, error } = await api.api.v1.admin.changelog[id].get()
    if (error) throw error
    return data
  }

  const create = async (changelog: any) => {
    const { data, error } = await api.api.v1.admin.changelog.post(changelog)
    if (error) throw error
    return data
  }

  const update = async (id: number, changelog: any) => {
    const { data, error } = await api.api.v1.admin.changelog[id].patch(changelog)
    if (error) throw error
    return data
  }

  const remove = async (id: number) => {
    const { data, error } = await api.api.v1.admin.changelog[id].delete()
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
