import { treaty } from '@elysiajs/eden'
import type { App } from 'backend'

/** Fetch с retry при 404 — обход прерывистой недоступности роутов при hot-reload бэкенда. */
async function fetchWithRetry(url: RequestInfo | URL, options?: RequestInit): Promise<Response> {
  const baseInit: RequestInit = {
    credentials: 'include',
    headers: { Accept: 'application/json', ...(options?.headers as Record<string, string>) },
    ...options,
  }
  const maxRetries = 2
  for (let i = 0; i <= maxRetries; i++) {
    const res = await fetch(url, baseInit)
    const method = (options?.method || 'GET').toUpperCase()
    const isIdempotent = ['GET', 'HEAD', 'OPTIONS'].includes(method)
    if (res.status !== 404 || !isIdempotent || i === maxRetries) return res
    await new Promise((r) => setTimeout(r, 500))
  }
  return fetch(url, baseInit)
}

/** Eden Treaty client for type-safe API calls to Elysia backend. */
export const useEden = () => {
  // В браузере — через Nuxt proxy (тот же origin), чтобы избежать CORS и 404 при hot-reload
  const baseUrl = import.meta.client
    ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    : (process.env.API_URL || process.env.NITRO_HOST || 'http://127.0.0.1:8010')

  const serverHeaders =
    import.meta.server
      ? (useRequestHeaders(['cookie']) as Record<string, string>)
      : {}

  return treaty<App>(baseUrl, {
    fetcher: fetchWithRetry,
    fetch: {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...serverHeaders,
      },
    },
  })
}
