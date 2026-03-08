/**
 * API client для мобильного приложения.
 * Использует fetch напрямую вместо Eden Treaty чтобы избежать
 * конфликтов версий Elysia между пакетами monorepo.
 *
 * Dev:  http://localhost:8000
 * Prod: задаётся через VITE_API_URL в .env
 */
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8010'

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string>,
): Promise<T> {
  let url = `${BASE}${path}`
  if (query && Object.keys(query).length > 0) {
    url += `?${new URLSearchParams(query).toString()}`
  }
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data as T
}

export const api = {
  auth: {
    login: (body: { username: string; password: string }) =>
      request<{ user: Record<string, unknown> }>('POST', '/api/v1/auth/login', body),
    logout: () =>
      request<void>('POST', '/api/v1/auth/logout'),
  },
  cabinet: {
    profile: () =>
      request<Record<string, unknown>>('GET', '/api/v1/cabinet/profile'),
    schedule: (query?: { days?: string }) =>
      request<unknown[]>('GET', '/api/v1/cabinet/schedule', undefined, query as Record<string, string> | undefined),
    gems: {
      wallet: () =>
        request<{ balance: number }>('GET', '/api/v1/cabinet/gems/wallet'),
      transactions: () =>
        request<unknown[]>('GET', '/api/v1/cabinet/gems/transactions'),
    },
    myGroups: () =>
      request<unknown[]>('GET', '/api/v1/cabinet/my-groups'),
    lessonById: (lessonId: number) =>
      request<any>('GET', `/api/v1/cabinet/student/lessons/${lessonId}`),
    attendance: (groupId: number) =>
      request<unknown[]>('GET', `/api/v1/cabinet/student/groups/${groupId}/attendance`),
    examResults: (groupId: number) =>
      request<any>('GET', `/api/v1/cabinet/student/groups/${groupId}/exam-results`),
    games: (groupId: number) =>
      request<unknown[]>('GET', `/api/v1/cabinet/student/groups/${groupId}/games`),
    playGame: (gameId: number, score: number) =>
      request<void>('POST', `/api/v1/cabinet/student/games/${gameId}/play`, { score }),
    payments: () =>
      request<any[]>('GET', '/api/v1/cabinet/student/payments'),
    paymentById: (id: number) =>
      request<any>('GET', `/api/v1/cabinet/student/payments/${id}/receipt`),
    courses: () =>
      request<any[]>('GET', '/api/v1/landing/courses'),
  },
}
