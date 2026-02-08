import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginCredentials, TokenResponse } from '@/types/user'
import axios from 'axios'

const API_BASE_URL = '/api/v1'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)
  const isSuperuser = computed(() => !!user.value?.is_superuser)
  const userFullName = computed(() => user.value?.full_name || user.value?.username || '')
  const userAvatar = computed(() => user.value?.avatar_url || null)

  // Configure axios to include token in requests
  const setupAxiosInterceptor = () => {
    axios.interceptors.request.use(
      (config) => {
        if (accessToken.value) {
          config.headers.Authorization = `Bearer ${accessToken.value}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Handle token refresh on 401
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        
        if (error.response?.status === 401 && !originalRequest._retry && refreshToken.value) {
          originalRequest._retry = true
          
          try {
            const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
              refresh: refreshToken.value
            })
            
            const { access } = response.data
            accessToken.value = access
            localStorage.setItem('access_token', access)
            
            originalRequest.headers.Authorization = `Bearer ${access}`
            return axios(originalRequest)
          } catch (refreshError) {
            logout()
            return Promise.reject(refreshError)
          }
        }
        
        return Promise.reject(error)
      }
    )
  }

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post<TokenResponse>(
        `${API_BASE_URL}/auth/token/`,
        credentials
      )
      
      const { access, refresh } = response.data
      accessToken.value = access
      refreshToken.value = refresh
      
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      
      setupAxiosInterceptor()
      
      // Fetch user data
      await fetchCurrentUser()
      
      // Log login activity (after user is loaded)
      try {
        const { logActivityDirect } = await import('@/composables/useActivityLog')
        if (user.value) {
          await logActivityDirect(
            '/login',
            'LoginPage',
            'login',
            `Login: ${credentials.username}`,
            'User',
            user.value.id,
            user.value.full_name || user.value.username
          )
        }
      } catch (err) {
        // Silently fail - don't interrupt login
        console.debug('Activity log error:', err)
      }
      
      return true
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Login failed'
      console.error('Login error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    // Log logout activity before clearing user data
    if (user.value) {
      try {
        const { logActivityDirect } = await import('@/composables/useActivityLog')
        await logActivityDirect(
          '/logout',
          'Logout',
          'logout',
          `Logout: ${user.value.full_name || user.value.username}`,
          'User',
          user.value.id,
          user.value.full_name || user.value.username
        )
      } catch (err) {
        // Silently fail - don't interrupt logout
        console.debug('Activity log error:', err)
      }
    }
    
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    error.value = null
  }

  const fetchCurrentUser = async (): Promise<void> => {
    if (!accessToken.value) {
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get<User>(`${API_BASE_URL}/users/me/`, {
        headers: {
          Authorization: `Bearer ${accessToken.value}`
        }
      })
      
      user.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch user'
      console.error('Error fetching user:', err)
      // If 401, logout
      if (err.response?.status === 401) {
        logout()
      }
    } finally {
      loading.value = false
    }
  }

  const initializeAuth = async () => {
    if (accessToken.value && !user.value) {
      setupAxiosInterceptor()
      await fetchCurrentUser()
    }
  }

  const changePassword = async (
    oldPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ): Promise<{ success: boolean; message?: string; errors?: any }> => {
    if (!accessToken.value) {
      return { success: false, message: 'Not authenticated' }
    }

    loading.value = true
    error.value = null

    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/me/change-password/`,
        {
          old_password: oldPassword,
          new_password: newPassword,
          new_password_confirmation: newPasswordConfirmation,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken.value}`
          }
        }
      )

      return { success: true, message: response.data.message || 'Password changed successfully' }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to change password'
      const errors = err.response?.data
      error.value = errorMessage
      return { success: false, message: errorMessage, errors }
    } finally {
      loading.value = false
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
    fetchCurrentUser,
    initializeAuth,
    changePassword,
  }
})

