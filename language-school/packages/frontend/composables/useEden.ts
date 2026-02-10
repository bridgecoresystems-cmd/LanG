import { treaty } from '@elysiajs/eden'
import type { App } from 'backend'

/** Eden Treaty client for type-safe API calls to Elysia backend. */
export const useEden = () => {
  // В dev режиме всегда используем localhost:8000 для консистентности с куками
  const baseUrl = import.meta.client
    ? 'http://localhost:8000'
    : (process.env.API_URL || 'http://localhost:8000')

  // Для SSR (кабинет и публичные страницы) прокидываем куки текущего запроса
  const serverHeaders =
    import.meta.server
      ? (useRequestHeaders(['cookie']) as Record<string, string>)
      : {}

  console.log('[useEden] Base URL:', baseUrl)

  return treaty<App>(baseUrl, {
    fetch: {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...serverHeaders,
      },
    },
  })
}
