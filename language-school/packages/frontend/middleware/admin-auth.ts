import { ROLES } from '~/constants/roles'

export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()
  const api = useEden()

  // Если только что залогинились и пользователь уже есть в store, пропускаем проверку
  if (import.meta.client) {
    const justLoggedIn = sessionStorage.getItem('auth_just_logged_in')
    if (justLoggedIn && authStore.user?.role === ROLES.SUPERUSER) {
      sessionStorage.removeItem('auth_just_logged_in')
      return
    }
  }

  try {
    const { data, error } = await api.api.v1.me.get()
    if (error || !(data as any)?.user || (data as any).user.role !== ROLES.SUPERUSER) {
      return navigateTo('/landing/login')
    }
    authStore.user = (data as any).user as any
  } catch {
    return navigateTo('/landing/login')
  }
})
