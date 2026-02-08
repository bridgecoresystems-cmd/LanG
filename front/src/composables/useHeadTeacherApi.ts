import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_BASE_URL = '/api/v1'

// Create axios instance with auth
export const headTeacherApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth interceptor
headTeacherApi.interceptors.request.use(
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
headTeacherApi.interceptors.response.use(
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
        return headTeacherApi(originalRequest)
      } catch (refreshError) {
        authStore.logout()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const useHeadTeacherCourses = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCourses = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await headTeacherApi.get('/courses/head-teacher/courses/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch courses'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCourse = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await headTeacherApi.get(`/courses/head-teacher/courses/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch course'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createCourse = async (data: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await headTeacherApi.post('/courses/head-teacher/courses/', data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.response?.data?.message || 'Failed to create course'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCourse = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await headTeacherApi.patch(`/courses/head-teacher/courses/${id}/`, data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update course'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCourse = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await headTeacherApi.delete(`/courses/head-teacher/courses/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete course'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchCourses,
    fetchCourse,
    createCourse,
    updateCourse,
    deleteCourse,
  }
}

export const useHeadTeacherGroups = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchGroups = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await headTeacherApi.get('/courses/head-teacher/groups/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch groups'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchGroup = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await headTeacherApi.get(`/courses/head-teacher/groups/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch group'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createGroup = async (data: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await headTeacherApi.post('/courses/head-teacher/groups/', data)
      return response.data
    } catch (err: any) {
      // Pass full error details
      const errorMsg = err.response?.data?.detail || 
                      err.response?.data?.message || 
                      (err.response?.data && typeof err.response.data === 'object' 
                        ? JSON.stringify(err.response.data) 
                        : 'Failed to create group')
      error.value = errorMsg
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateGroup = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await headTeacherApi.patch(`/courses/head-teacher/groups/${id}/`, data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update group'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteGroup = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await headTeacherApi.delete(`/courses/head-teacher/groups/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete group'
      throw err
    } finally {
      loading.value = false
    }
  }

  const addStudents = async (groupId: number, studentIds: number[]) => {
    loading.value = true
    error.value = null
    try {
      const response = await headTeacherApi.post(
        `/courses/head-teacher/groups/${groupId}/add_students/`,
        { student_ids: studentIds }
      )
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.response?.data?.error || 'Failed to add students'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeStudents = async (groupId: number, studentIds: number[]) => {
    loading.value = true
    error.value = null
    try {
      const response = await headTeacherApi.post(
        `/courses/head-teacher/groups/${groupId}/remove_students/`,
        { student_ids: studentIds }
      )
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.response?.data?.error || 'Failed to remove students'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchGroups,
    fetchGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    addStudents,
    removeStudents,
  }
}

