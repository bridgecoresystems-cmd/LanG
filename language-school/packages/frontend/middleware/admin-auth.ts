import { ADMIN_ROLES } from '~/constants/roles'

export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()
  const api = useEden()

  if (import.meta.client) {
    const justLoggedIn = sessionStorage.getItem('auth_just_logged_in')
    const role = authStore.user?.role
    if (justLoggedIn && role && ADMIN_ROLES.includes(role)) {
      sessionStorage.removeItem('auth_just_logged_in')
      return
    }
  }

  try {
    const { data, error } = await api.api.v1.me.get()
    const user = (data as any)?.user
    if (error || !user || !ADMIN_ROLES.includes(user.role)) {
      return navigateTo('/landing/login')
    }
    authStore.user = user as any
  } catch {
    return navigateTo('/landing/login')
  }
})
