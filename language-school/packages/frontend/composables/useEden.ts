import { treaty } from '@elysiajs/eden'

/** Eden Treaty client for type-safe API calls to Elysia backend. Ходит напрямую на backend. */
export const useEden = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  // Если apiBase — полный URL (http://...), берём корень для Eden. Иначе — origin (прокси).
  const baseUrl = apiBase.startsWith('http')
    ? apiBase.replace(/\/api\/v1\/?$/, '')
    : (typeof window !== 'undefined' ? window.location.origin : process.env.API_URL || 'http://127.0.0.1:8000')
  return treaty<any>(baseUrl, { credentials: 'include' })
}
