import { useEden } from './useEden'

/**
 * Composable for cabinet profile management via Eden Treaty
 */
export const useCabinetProfile = () => {
  const api = useEden()

  const get = async () => {
    const { data, error } = await api.api.v1.cabinet.profile.get()
    if (error) throw error
    return data
  }

  const update = async (profile: any) => {
    const { data, error } = await api.api.v1.cabinet.profile.patch(profile)
    if (error) throw error
    return data
  }

  const getMyGroups = async () => {
    const { data, error } = await api.api.v1.cabinet['my-groups'].get()
    if (error) throw error
    return data ?? []
  }

  return {
    get,
    update,
    getMyGroups
  }
}
