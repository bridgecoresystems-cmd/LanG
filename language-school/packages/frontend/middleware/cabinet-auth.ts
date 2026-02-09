/**
 * Cabinet middleware — любой аутентифицированный пользователь.
 * Редирект на логин, если не залогинен.
 */
export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()

  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const baseUrl = import.meta.server
    ? (process.env.API_URL || 'http://127.0.0.1:8000')
    : ''

  try {
    const opts: any = {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    }
    if (import.meta.server) {
      const headers = useRequestHeaders(['cookie'])
      if (headers.cookie) opts.headers = { ...opts.headers, cookie: headers.cookie }
    }
    const res = await $fetch<{ user?: any }>(`${baseUrl || ''}${apiBase}/me`, opts)
    if (!res?.user) {
      return navigateTo('/landing/login')
    }
    authStore.user = res.user
  } catch {
    return navigateTo('/landing/login')
  }
})
