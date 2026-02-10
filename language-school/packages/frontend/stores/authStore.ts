import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User, LoginCredentials } from '~/types/user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  if (import.meta.client) {
    accessToken.value = localStorage.getItem('access_token')
    refreshToken.value = localStorage.getItem('refresh_token')
  }

  const isAuthenticated = computed(() => !!user.value)
  const isSuperuser = computed(() => user.value?.role === 'SUPERUSER')
  const userFullName = computed(
    () => user.value?.full_name || user.value?.username || ''
  )
  const userAvatar = computed(() => user.value?.avatar || null)

  const api = useEden()

  const fetchCurrentUser = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.me.get()
      if (err) throw err
      user.value = (data as any)?.user ?? null
    } catch (err: any) {
      error.value = err?.value?.error || err?.message || 'Failed to fetch user'
      user.value = null
    } finally {
      loading.value = false
    }
  }

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.auth.login.post(credentials)
      if (err) throw err
      if ((data as any)?.user) {
        user.value = (data as any).user
      }
      if (import.meta.client) {
        sessionStorage.setItem('auth_just_logged_in', '1')
      }
      return true
    } catch (err: any) {
      error.value = err?.value?.error || err?.message || 'Login failed'
      user.value = null
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    error.value = null
    if (import.meta.client) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      sessionStorage.setItem('auth_logged_out', '1')
    }
    try {
      const { error: err } = await api.api.v1.auth.logout.post()
      if (err) {
        // ignore logout errors
        // eslint-disable-next-line no-console
        console.warn('Logout error (ignored):', err)
      }
    } catch {
      // ignore
    }
  }

  const register = async (credentials: LoginCredentials & { email?: string }): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.auth.register.post(credentials as any)
      if (err) throw err
      user.value = (data as any)?.user ?? null
      return true
    } catch (err: any) {
      error.value = err?.value?.error || err?.message || 'Registration failed'
      return false
    } finally {
      loading.value = false
    }
  }

  const initializeAuth = async () => {
    if (import.meta.client && sessionStorage.getItem('auth_logged_out')) {
      sessionStorage.removeItem('auth_logged_out')
      return
    }
    if (!user.value) {
      await fetchCurrentUser()
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    isAuthenticated,
    isSuperuser,
    userFullName,
    userAvatar,
    login,
    logout,
    register,
    fetchCurrentUser,
    initializeAuth,
  }
})
