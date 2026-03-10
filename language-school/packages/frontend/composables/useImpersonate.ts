/**
 * Impersonation composable.
 *
 * Flow:
 * 1. Admin clicks "Login as User" → impersonate(userId)
 *    - Calls POST /admin/impersonate/:userId
 *    - Backend creates a new session for target user
 *    - We save the current admin session token in a plain cookie "admin_session_backup"
 *    - We set the new session token as "better-auth.session_token" (httpOnly is set by backend)
 *    - Redirect to /cabinet
 *
 * 2. User in cabinet sees banner → stopImpersonating()
 *    - Calls POST /admin/impersonate/stop (logs audit)
 *    - Reads "admin_session_backup" cookie
 *    - Restores it as "better-auth.session_token" via backend /auth/restore-session
 *    - Deletes backup cookie
 *    - Redirect to /admin
 */

const BACKUP_COOKIE = "admin_session_backup"

/** Read a cookie value by name (client-side only) */
function getCookie(name: string): string | null {
  if (!import.meta.client) return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/** Set a plain (non-httpOnly) cookie */
function setCookie(name: string, value: string, maxAgeSec = 60 * 60 * 24) {
  const secure = location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`
}

/** Delete a cookie */
function deleteCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

export const useImpersonate = () => {
  const config = useRuntimeConfig()
  const API = config.public.apiBase as string

  /** True if we currently have an admin backup session (= we're impersonating) */
  const isImpersonating = computed(() => {
    if (!import.meta.client) return false
    return !!getCookie(BACKUP_COOKIE)
  })

  /**
   * Start impersonating a user.
   * @param userId - target user ID
   * @param adminToken - current admin session token (read from cookie before switching)
   */
  async function impersonate(userId: string) {
    // 1. Read current admin session token from cookie (it's httpOnly, so we ask the backend
    //    to echo it back, OR we rely on the fact that `impersonate` endpoint sets a NEW cookie
    //    and we need to save what we had BEFORE the request)
    //
    // Strategy: the backend sets the NEW session cookie in Set-Cookie header.
    // We call the endpoint, then save the OLD token via a separate GET /auth/me-token endpoint.
    // Simpler: save the current token via document.cookie read before calling impersonate.
    // Since better-auth.session_token is httpOnly we can't read it directly.
    //
    // Solution: use a two-step approach:
    //   a) GET /cabinet/profile/token → returns current session token (backend echoes it)
    //   b) call impersonate → backend sets new session cookie
    //   c) save echoed token to admin_session_backup cookie

    // Step a: get current token echo
    const tokenData = await $fetch<{ token: string }>(`${API}/auth/session-token`, {
      credentials: "include",
    })
    const adminToken = tokenData?.token

    if (!adminToken) {
      throw new Error("Не удалось получить текущий токен сессии")
    }

    // Step b: call impersonate (backend sets new better-auth.session_token cookie)
    await $fetch(`${API}/admin/impersonate/${userId}`, {
      method: "POST",
      credentials: "include",
    })

    // Step c: save admin token in a readable backup cookie
    setCookie(BACKUP_COOKIE, adminToken, 60 * 60 * 8) // 8 hours

    // Redirect to cabinet
    await navigateTo("/cabinet")
  }

  /**
   * Stop impersonating — restore admin session.
   */
  async function stopImpersonating() {
    const adminToken = getCookie(BACKUP_COOKIE)
    if (!adminToken) {
      await navigateTo("/admin")
      return
    }

    // Log the stop event
    try {
      await $fetch(`${API}/admin/impersonate/stop`, {
        method: "POST",
        credentials: "include",
      })
    } catch { /* ignore */ }

    // Restore admin session via backend endpoint
    await $fetch(`${API}/auth/restore-session`, {
      method: "POST",
      credentials: "include",
      body: { token: adminToken },
    })

    // Clear backup cookie
    deleteCookie(BACKUP_COOKIE)

    // Reload page first to clear any user-specific state, then redirect
    await navigateTo("/admin/users")
  }

  return { isImpersonating, impersonate, stopImpersonating }
}
