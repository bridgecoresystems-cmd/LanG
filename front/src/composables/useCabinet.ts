import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_BASE_URL = '/api/v1'

// Configure axios instance for cabinet API
const cabinetApi = axios.create({
  baseURL: API_BASE_URL,
})

// Add request interceptor to include auth token
cabinetApi.interceptors.request.use(
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
cabinetApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const authStore = useAuthStore()

    if (error.response?.status === 401 && !originalRequest._retry && authStore.refreshToken) {
      originalRequest._retry = true
      
      try {
        // Use global axios to avoid recursion
        const response = await axios.post('/api/v1/auth/token/refresh/', {
          refresh: authStore.refreshToken
        })
        
        const { access } = response.data
        authStore.accessToken = access
        localStorage.setItem('access_token', access)
        
        originalRequest.headers.Authorization = `Bearer ${access}`
        return cabinetApi(originalRequest)
      } catch (refreshError) {
        authStore.logout()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Dashboard API
export const useCabinetDashboard = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchDashboardStats = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await cabinetApi.get('/users/cabinet/dashboard/')
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch dashboard stats'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchDashboardStats,
  }
}

// Courses API
export const useCabinetCourses = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCourses = async (isActive?: boolean) => {
    loading.value = true
    error.value = null
    try {
      const params: any = {}
      if (isActive !== undefined) {
        params.is_active = isActive
      }
      const response = await cabinetApi.get('/users/cabinet/courses/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch courses'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchCourses,
  }
}

// Schedule API
export const useCabinetSchedule = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchSchedule = async (days: number = 7, groupId?: number) => {
    loading.value = true
    error.value = null
    try {
      const params: any = { days }
      if (groupId) {
        params.group_id = groupId
      }
      const response = await cabinetApi.get('/users/cabinet/schedule/', { params })
      console.log('Schedule API response:', response.data)
      // API returns array directly
      return Array.isArray(response.data) ? response.data : []
    } catch (err: any) {
      console.error('Schedule API error:', err)
      console.error('Error response:', err.response?.data)
      error.value = err.response?.data?.detail || 'Failed to fetch schedule'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchSchedule,
  }
}

// Lessons API
export const useCabinetLessons = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchLessons = async (groupId: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await cabinetApi.get('/courses/lessons/', { params: { group_id: groupId } })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch lessons'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchLessons,
  }
}

// Grades API
export const useCabinetGrades = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchGrades = async (params?: {
    groupId?: number
    courseId?: number
    studentId?: number
    isActive?: boolean
    limit?: number
  }) => {
    loading.value = true
    error.value = null
    try {
      const queryParams: any = {}
      if (params?.groupId) queryParams.group_id = params.groupId
      if (params?.courseId) queryParams.course_id = params.courseId
      if (params?.studentId) queryParams.student_id = params.studentId
      if (params?.isActive !== undefined) queryParams.is_active = params.isActive
      if (params?.limit) queryParams.limit = params.limit

      console.log('Fetching grades with params:', queryParams)
      const response = await cabinetApi.get('/users/cabinet/grades/', { params: queryParams })
      console.log('Grades API response:', response.data)
      
      if (!response.data) {
        console.warn('No data in response')
        return { grades: [], total: 0, active_courses_grades: 0, completed_courses_grades: 0 }
      }
      
      return response.data
    } catch (err: any) {
      console.error('Error fetching grades:', err)
      console.error('Error response:', err.response?.data)
      error.value = err.response?.data?.detail || err.message || 'Failed to fetch grades'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchGrades,
  }
}

// Teacher specific API
export const useTeacherCabinet = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTeacherStudents = async (groupId?: number) => {
    loading.value = true
    error.value = null
    try {
      const params: any = {}
      if (groupId) params.group_id = groupId
      const response = await cabinetApi.get('/users/cabinet/teacher/students/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch students'
      throw err
    } finally {
      loading.value = false
    }
  }

  const saveGrade = async (gradeData: {
    student: number
    lesson: number
    grade: number
    comment?: string
    id?: number
  }) => {
    loading.value = true
    error.value = null
    try {
      let response
      if (gradeData.id) {
        response = await cabinetApi.patch(`/courses/grades/${gradeData.id}/`, gradeData)
      } else {
        response = await cabinetApi.post('/courses/grades/', gradeData)
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to save grade'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteGrade = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await cabinetApi.delete(`/courses/grades/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete grade'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchExamGrades = async (groupId: number) => {
    loading.value = false  // Don't set loading for this, it's called together with students
    error.value = null
    try {
      const response = await cabinetApi.get(`/courses/exam-grades/by-group/${groupId}/`)
      return response.data
    } catch (err: any) {
      // If 404, it means no grades exist yet - that's OK
      if (err.response?.status === 404) {
        throw err  // Re-throw to be handled by caller
      }
      error.value = err.response?.data?.detail || 'Failed to fetch exam grades'
      throw err
    }
  }

  const saveExamGrades = async (groupId: number, grades: any[]) => {
    loading.value = true
    error.value = null
    try {
      const response = await cabinetApi.post('/courses/exam-grades/bulk-update/', {
        group_id: groupId,
        grades: grades
      })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to save exam grades'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchTeacherStudents,
    saveGrade,
    deleteGrade,
    fetchExamGrades,
    saveExamGrades,
  }
}

