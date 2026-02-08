import { ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_BASE_URL = '/api/v1/admin'

// Configure axios instance for activity log API
const activityLogApi = axios.create({
  baseURL: API_BASE_URL,
})

// Add request interceptor to include auth token and activity log headers
activityLogApi.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for token refresh
activityLogApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const authStore = useAuthStore()

    if (error.response?.status === 401 && !originalRequest._retry && authStore.refreshToken) {
      originalRequest._retry = true
      
      try {
        const response = await axios.post('/api/v1/auth/token/refresh/', {
          refresh: authStore.refreshToken
        })
        
        const { access } = response.data
        authStore.accessToken = access
        localStorage.setItem('access_token', access)
        
        originalRequest.headers.Authorization = `Bearer ${access}`
        return activityLogApi(originalRequest)
      } catch (refreshError) {
        authStore.logout()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Global axios interceptor to add activity log headers to all requests
let activityLogHeaders: Record<string, string> = {}

export const setActivityLogHeaders = (headers: Record<string, string>) => {
  activityLogHeaders = headers
}

// Intercept all axios requests to add activity log headers
// BUT: Don't add headers to requests that don't need them (like login, public endpoints)
axios.interceptors.request.use(
  (config) => {
    // Don't add activity log headers to certain endpoints
    const excludedPaths = [
      '/api/v1/auth/token/',
      '/api/v1/auth/token/refresh/',
      '/api/v1/auth/token/verify/',
      '/api/v1/activity-logs/create/',  // This endpoint doesn't need headers
    ]
    
    const shouldAddHeaders = !excludedPaths.some(path => config.url?.includes(path))
    
    if (shouldAddHeaders) {
      // Add activity log headers if they exist
      Object.keys(activityLogHeaders).forEach(key => {
        if (activityLogHeaders[key]) {
          config.headers[key] = activityLogHeaders[key]
        }
      })
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Directly log activity via API (for navigation and actions)
 */
const logActivityDirectly = async (
  pagePath: string,
  componentName: string,
  actionType: 'view' | 'create' | 'update' | 'delete' | 'export' | 'import' | 'login' | 'logout' | 'other',
  actionDescription?: string,
  objectType?: string,
  objectId?: number,
  objectName?: string
) => {
  try {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      return // Don't log if not authenticated
    }

    // Use the global axios instance for creating logs to get token refresh logic
    await axios.post('/api/v1/activity-logs/create/', {
      action_type: actionType,
      page_path: pagePath,
      component_name: componentName,
      action_description: actionDescription,
      object_type: objectType,
      object_id: objectId,
      object_name: objectName,
    })
  } catch (error) {
    // Silently fail - don't interrupt user flow
    console.debug('Activity log error (non-critical):', error)
  }
}

/**
 * Composable for activity logging.
 * Automatically logs user actions when pages are viewed or actions are performed.
 */
export const useActivityLog = () => {
  const route = useRoute()
  
  /**
   * Log an activity action.
   * This sets headers that will be sent with the next API request.
   */
  const logActivity = (
    actionType: 'view' | 'create' | 'update' | 'delete' | 'export' | 'import' | 'login' | 'logout' | 'other',
    actionDescription?: string,
    objectType?: string,
    objectId?: number,
    objectName?: string
  ) => {
    try {
      // Get component name from route
      const componentName = route.name?.toString() || route.path.split('/').pop() || ''
      
      // Set headers for activity logging (for API requests)
      // Note: Headers must be ISO-8859-1, so we only put ASCII-safe values here
      // Descriptions with non-ASCII will be sent in request body via logActivityDirectly, not headers
      setActivityLogHeaders({
        'X-Page-Path': route.path,
        'X-Component-Name': componentName,
        'X-Action-Type': actionType,
        // Don't put non-ASCII text in headers - it will cause encoding errors
        ...(objectType && { 'X-Object-Type': objectType }),
        ...(objectId && { 'X-Object-ID': String(objectId) }),
      })
      
      // Also log directly via API (for immediate logging)
      logActivityDirectly(
        route.path,
        componentName,
        actionType,
        actionDescription,
        objectType,
        objectId,
        objectName
      )
    } catch (error) {
      console.error('Activity log error:', error)
    }
  }
  
  /**
   * Clear activity log headers.
   */
  const clearActivityLog = () => {
    setActivityLogHeaders({})
  }
  
  return {
    logActivity,
    clearActivityLog,
  }
}

/**
 * Log activity directly (for use outside of components)
 */
export const logActivityDirect = logActivityDirectly

/**
 * Composable for fetching activity logs (admin only).
 */
export const useAdminActivityLog = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchActivityLogs = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await activityLogApi.get('/activity-logs/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch activity logs'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchActivityLog = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await activityLogApi.get(`/activity-logs/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch activity log'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchActivityLogsByUser = async (userId: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await activityLogApi.get('/activity-logs/by_user/', {
        params: { user_id: userId }
      })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch user activity logs'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchStatistics = async (days: number = 7) => {
    loading.value = true
    error.value = null
    try {
      const response = await activityLogApi.get('/activity-logs/statistics/', {
        params: { days }
      })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch statistics'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchActivityLogs,
    fetchActivityLog,
    fetchActivityLogsByUser,
    fetchStatistics,
  }
}

