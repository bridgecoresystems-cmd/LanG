export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  // Only access store on client — Pinia is not ready during SSR
  const authStore = import.meta.client ? useAuthStore() : null

  const fetch = $fetch.create({
    baseURL: apiBase,
    headers: {
      'Content-Type': 'application/json',
    },
    onRequest({ options }) {
      if (authStore?.accessToken) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${authStore!.accessToken}`,
        } as HeadersInit
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401 && authStore?.refreshToken) {
        try {
          const { access } = await $fetch<{ access: string }>(
            `${apiBase}/auth/token/refresh/`,
            {
              method: 'POST',
              body: { refresh: authStore!.refreshToken },
            }
          )
          authStore!.accessToken = access
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('access_token', access)
          }
        } catch {
          authStore?.logout()
        }
      }
    },
  })

  return { apiBase, fetch }
}
