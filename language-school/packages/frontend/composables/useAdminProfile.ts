import { useEden } from './useEden'

/**
 * Composable for admin profile management via Eden Treaty
 */
export const useAdminProfile = () => {
  const api = useEden()

  const get = async () => {
    const { data, error } = await api.api.v1.admin.profile.get()
    if (error) throw error
    return data
  }

  const update = async (profile: any) => {
    const { data, error } = await api.api.v1.admin.profile.patch(profile)
    if (error) throw error
    return data
  }

  const changePassword = async (passwords: { currentPassword: string; newPassword: string }) => {
    const { data, error } = await api.api.v1.admin['change-password'].post(passwords)
    if (error) throw error
    return data
  }

  return {
    get,
    update,
    changePassword
  }
}
