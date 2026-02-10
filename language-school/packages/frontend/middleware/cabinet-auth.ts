/**
 * Cabinet middleware — любой аутентифицированный пользователь.
 * Редирект на логин, если не залогинен.
 */
export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()
  const api = useEden()

  try {
    const { data, error } = await api.api.v1.me.get()
    if (error || !(data as any)?.user) {
      return navigateTo('/landing/login')
    }
    authStore.user = (data as any).user
  } catch {
    return navigateTo('/landing/login')
  }
})
