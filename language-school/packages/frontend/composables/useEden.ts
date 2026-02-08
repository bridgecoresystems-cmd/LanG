import { treaty } from '@elysiajs/eden'

/** Eden Treaty client for type-safe API calls to Elysia backend. */
export const useEden = () => {
  const baseUrl = import.meta.client
    ? (typeof window !== 'undefined' ? window.location.origin : '')
    : (process.env.API_URL || 'http://127.0.0.1:8000')
  return treaty<any>(baseUrl, { credentials: 'include' })
}
