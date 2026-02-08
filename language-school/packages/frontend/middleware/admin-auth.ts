export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()
  
  // Если только что залогинились и пользователь уже есть в store, пропускаем проверку
  if (import.meta.client) {
    const justLoggedIn = sessionStorage.getItem('auth_just_logged_in')
    if (justLoggedIn && authStore.user?.role === 'admin') {
      sessionStorage.removeItem('auth_just_logged_in')
      return
    }
  }
  
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const baseUrl = import.meta.server
    ? (process.env.API_URL || 'http://127.0.0.1:8000')
    : ''

  try {
    const opts: any = { 
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    }
    if (import.meta.server) {
      const headers = useRequestHeaders(['cookie'])
      if (headers.cookie) opts.headers.cookie = headers.cookie
    }
    const user = await $fetch<{ user?: { role: string } }>(
      `${baseUrl || ''}${apiBase}/me`,
      opts
    )
    if (!user?.user || user.user.role !== 'admin') {
      return navigateTo('/landing/login')
    }
    authStore.user = user.user as any
  } catch (err: any) {
    // Если 401 или 403, редиректим на логин
    if (err.response?.status === 401 || err.response?.status === 403) {
      return navigateTo('/landing/login')
    }
    // Для других ошибок тоже редиректим
    return navigateTo('/landing/login')
  }
})
