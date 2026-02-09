import { defineStore } from 'pinia'
import type { User, LoginCredentials, TokenResponse } from '~/types/user'

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

  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  const fetchCurrentUser = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<{ user?: User }>(`${apiBase}/me`, { credentials: 'include' })
      user.value = data?.user ?? null
    } catch (err: any) {
      error.value = err.data?.error || 'Failed to fetch user'
      user.value = null
      if (err.response?.status === 401) {
        await logout()
      }
    } finally {
      loading.value = false
    }
  }

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<any>(`${apiBase}/auth/login`, {
        method: 'POST',
        body: credentials,
        credentials: 'include',
      })
      // Сохраняем пользователя из ответа логина
      if (data.user) {
        user.value = data.user
      }
      return true
    } catch (err: any) {
      error.value = err.data?.error || 'Login failed'
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
      await $fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // 401 when not logged in is expected, ignore
    }
  }

  const register = async (credentials: LoginCredentials & { email?: string }): Promise<boolean> => {
    loading.value = true;
    error.value = null;
    try {
      const data = await $fetch<any>(`${apiBase}/auth/register`, {
        method: 'POST',
        body: credentials,
      });
      // After successful registration, automatically log in the user
      // Or redirect to login page for manual login
      // For now, let's assume automatic login for convenience
      user.value = data.user;
      return true;
    } catch (err: any) {
      error.value = err.data?.error || 'Registration failed';
      return false;
    } finally {
      loading.value = false;
    }
  };

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
