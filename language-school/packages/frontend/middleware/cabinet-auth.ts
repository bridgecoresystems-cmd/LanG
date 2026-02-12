/**
 * Cabinet middleware — любой аутентифицированный пользователь.
 * Редирект на логин, если не залогинен.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const api = useEden()

  console.log(`[CabinetAuth] Checking access to: ${to.path}`)

  // Если пользователь уже загружен в стор, просто пропускаем
  if (authStore.user) {
    return
  }

  try {
    const { data, error } = await api.api.v1.me.get()
    
    if (error || !(data as any)?.user) {
      console.warn('[CabinetAuth] ❌ Not authenticated, redirecting to login')
      return navigateTo('/landing/login')
    }

    // Сохраняем пользователя в стор
    authStore.user = (data as any).user
    console.log(`[CabinetAuth] ✅ Authenticated as: ${authStore.user?.username}`)
  } catch (err) {
    console.error('[CabinetAuth] 🚨 Auth error:', err)
    return navigateTo('/landing/login')
  }
})
