import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_BASE_URL = '/api/v1/admin'

// Configure axios instance for admin API
const adminApi = axios.create({
  baseURL: API_BASE_URL,
})

// Add request interceptor to include auth token
adminApi.interceptors.request.use(
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

// Add response interceptor to handle token refresh (same as in authStore)
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const authStore = useAuthStore()
    
    if (error.response?.status === 401 && !originalRequest._retry && authStore.refreshToken) {
      originalRequest._retry = true
      
      try {
        // Use the global axios to refresh token to avoid recursion if adminApi also fails
        const response = await axios.post('/api/v1/auth/token/refresh/', {
          refresh: authStore.refreshToken
        })
        
        const { access } = response.data
        authStore.accessToken = access
        localStorage.setItem('access_token', access)
        
        originalRequest.headers.Authorization = `Bearer ${access}`
        return adminApi(originalRequest)
      } catch (refreshError) {
        authStore.logout()
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

// News API
export const useAdminNews = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchNews = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/landing/news/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch news'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchNewsItem = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get(`/landing/news/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch news item'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createNews = async (data: FormData) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.post('/landing/news/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to create news'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateNews = async (id: number, data: FormData) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.patch(`/landing/news/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update news'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteNews = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await adminApi.delete(`/landing/news/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete news'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchNews,
    fetchNewsItem,
    createNews,
    updateNews,
    deleteNews
  }
}

// Users API
export const useAdminUsers = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/users/users/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch users'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchUser = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get(`/users/users/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch user'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createUser = async (data: any) => {
    loading.value = true
    error.value = null
    try {
      // Check if there are any files (like avatar) in the data
      const hasFiles = data.avatar instanceof File || data.avatar instanceof Blob
      
      if (hasFiles) {
        // Use FormData if there are files
        const formData = new FormData()
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            if (data[key] instanceof File || data[key] instanceof Blob) {
              formData.append(key, data[key])
            } else {
              formData.append(key, data[key])
            }
          }
        })
        const response = await adminApi.post('/users/users/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
      } else {
        // Use JSON if no files
        const jsonData: any = {}
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            jsonData[key] = data[key]
          }
        })
        const response = await adminApi.post('/users/users/', jsonData)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.response?.data?.password?.[0] || err.message || 'Failed to create user'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    try {
      // If data is already FormData, use it directly
      let formData: FormData
      if (data instanceof FormData) {
        formData = data
        // Log FormData contents for debugging
        const entries = Array.from(formData.entries())
        console.log('FormData entries:', entries.map(([k, v]) => [k, k === 'password' ? '***' : (v instanceof File ? `File: ${v.name}` : String(v))]))
      } else {
        // Otherwise, create FormData from object
        formData = new FormData()
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            formData.append(key, data[key])
          }
        })
        console.log('Created FormData from object:', Object.keys(data))
      }
      const response = await adminApi.patch(`/users/users/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (err: any) {
      console.error('Update user error:', err.response?.data)
      console.error('Full error object:', err)
      console.error('Error response:', err.response)
      // Format validation errors properly
      if (err.response?.data) {
        const errorData = err.response.data
        console.error('Error data:', JSON.stringify(errorData, null, 2))
        if (typeof errorData === 'object') {
          const errorMessages: string[] = []
          for (const [key, value] of Object.entries(errorData)) {
            if (Array.isArray(value)) {
              errorMessages.push(`${key}: ${value.join(', ')}`)
            } else if (typeof value === 'string') {
              errorMessages.push(`${key}: ${value}`)
            } else {
              errorMessages.push(`${key}: ${JSON.stringify(value)}`)
            }
          }
          error.value = errorMessages.join('; ') || 'Failed to update user'
        } else {
          error.value = errorData || 'Failed to update user'
        }
      } else {
        error.value = err.message || 'Failed to update user'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await adminApi.delete(`/users/users/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete user'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser
  }
}

// Courses API
export const useAdminCourses = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCourses = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/landing/courses/', { params })
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
      const response = await adminApi.get(`/landing/courses/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch course'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createCourse = async (data: FormData) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.post('/landing/courses/', data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to create course'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCourse = async (id: number, data: FormData) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.patch(`/landing/courses/${id}/`, data)
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
      await adminApi.delete(`/landing/courses/${id}/`)
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
    deleteCourse
  }
}

// Teachers API
export const useAdminTeachers = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTeachers = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/users/teachers/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch teachers'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTeacher = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get(`/users/teachers/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch teacher'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createTeacher = async (data: any) => {
    loading.value = true
    error.value = null
    try {
      // Check if there are files (avatar, video)
      const hasFiles = data.avatar instanceof File || data.video instanceof File
      
      if (hasFiles) {
        const formData = new FormData()
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            if (data[key] instanceof File || data[key] instanceof Blob) {
              formData.append(key, data[key])
            } else {
              formData.append(key, data[key])
            }
          }
        })
        const response = await adminApi.post('/users/teachers/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
      } else {
        const response = await adminApi.post('/users/teachers/', data)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.response?.data?.password_confirmation?.[0] || err.message || 'Failed to create teacher'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTeacher = async (id: number, data: FormData) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.patch(`/users/teachers/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update teacher'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteTeacher = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await adminApi.delete(`/users/teachers/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete teacher'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchTeachers,
    fetchTeacher,
    createTeacher,
    updateTeacher,
    deleteTeacher
  }
}

// Students API
export const useAdminStudents = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchStudents = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/users/students/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch students'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchStudent = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get(`/users/students/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch student'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createStudent = async (data: any) => {
    loading.value = true
    error.value = null
    try {
      // Check if there are files (avatar)
      const hasFiles = data.avatar instanceof File
      
      if (hasFiles) {
        const formData = new FormData()
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined) {
            if (data[key] instanceof File || data[key] instanceof Blob) {
              formData.append(key, data[key])
            } else if (key === 'points' && typeof data[key] === 'number') {
              // Ensure numbers are sent as strings in FormData
              formData.append(key, data[key].toString())
            } else if (data[key] !== '') {
              // Only append non-empty strings
              formData.append(key, String(data[key]))
            }
          }
        })
        const response = await adminApi.post('/users/students/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
      } else {
        const response = await adminApi.post('/users/students/', data)
        return response.data
      }
    } catch (err: any) {
      // Better error handling - show all validation errors
      const errorData = err.response?.data
      if (errorData) {
        console.error('API Error Response:', errorData)
        if (errorData.username) {
          error.value = `Username: ${Array.isArray(errorData.username) ? errorData.username[0] : errorData.username}`
        } else if (errorData.email) {
          error.value = `Email: ${Array.isArray(errorData.email) ? errorData.email[0] : errorData.email}`
        } else if (errorData.password_confirmation) {
          error.value = `Password: ${Array.isArray(errorData.password_confirmation) ? errorData.password_confirmation[0] : errorData.password_confirmation}`
        } else if (errorData.detail) {
          error.value = errorData.detail
        } else {
          // Show first error found
          const firstErrorKey = Object.keys(errorData)[0]
          const firstError = errorData[firstErrorKey]
          error.value = `${firstErrorKey}: ${Array.isArray(firstError) ? firstError[0] : firstError}`
        }
      } else {
        error.value = err.message || 'Failed to create student'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateStudent = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key])
        }
      })
      const response = await adminApi.patch(`/users/students/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update student'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteStudent = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await adminApi.delete(`/users/students/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete student'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchStudents,
    fetchStudent,
    createStudent,
    updateStudent,
    deleteStudent
  }
}

// Contact Messages API
// Contact Messages API
export const useAdminContactMessages = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchMessages = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/landing/contact-messages/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch messages'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMessage = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get(`/landing/contact-messages/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch message'
      throw err
    } finally {
      loading.value = false
    }
  }

  const toggleApproval = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.post(`/landing/contact-messages/${id}/toggle_approval/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to toggle approval'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteMessage = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await adminApi.delete(`/landing/contact-messages/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete message'
      throw err
    } finally {
      loading.value = false
    }
  }

  const likeMessage = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.post(`/landing/contact-messages/${id}/like/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to like message'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateMessage = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.patch(`/landing/contact-messages/${id}/`, data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update message'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchMessages,
    fetchMessage,
    toggleApproval,
    deleteMessage,
    likeMessage,
    updateMessage
  }
}

// Course Categories API
export const useAdminCourseCategories = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCategories = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/landing/course-categories/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch categories'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCategory = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get(`/landing/course-categories/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createCategory = async (data: FormData) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.post('/landing/course-categories/', data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to create category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCategory = async (id: number, data: FormData) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.patch(`/landing/course-categories/${id}/`, data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCategory = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await adminApi.delete(`/landing/course-categories/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete category'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchCategories,
    fetchCategory,
    createCategory,
    updateCategory,
    deleteCategory
  }
}

// Course SubCategories API
export const useAdminCourseSubCategories = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchSubCategories = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/landing/course-subcategories/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch subcategories'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchSubCategory = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get(`/landing/course-subcategories/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch subcategory'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createSubCategory = async (data: FormData) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.post('/landing/course-subcategories/', data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to create subcategory'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSubCategory = async (id: number, data: FormData) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.patch(`/landing/course-subcategories/${id}/`, data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update subcategory'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteSubCategory = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await adminApi.delete(`/landing/course-subcategories/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete subcategory'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchSubCategories,
    fetchSubCategory,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory
  }
}

// Dashboard Stats API
export const useAdminDashboard = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchStats = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/landing/dashboard/stats/')
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
    fetchStats,
  }
}

// Directors API
export const useAdminDirectors = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchDirectors = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/users/directors/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch directors'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchDirector = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get(`/users/directors/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch director'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createDirector = async (data: any) => {
    loading.value = true
    error.value = null
    try {
      const hasFiles = data.avatar instanceof File
      
      if (hasFiles) {
        const formData = new FormData()
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            if (data[key] instanceof File || data[key] instanceof Blob) {
              formData.append(key, data[key])
            } else {
              formData.append(key, data[key])
            }
          }
        })
        const response = await adminApi.post('/users/directors/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
      } else {
        const response = await adminApi.post('/users/directors/', data)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.response?.data?.password_confirmation?.[0] || err.message || 'Failed to create director'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateDirector = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    try {
      const hasFiles = data.avatar instanceof File
      
      if (hasFiles) {
        const formData = new FormData()
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            if (data[key] instanceof File || data[key] instanceof Blob) {
              formData.append(key, data[key])
            } else {
              formData.append(key, data[key])
            }
          }
        })
        const response = await adminApi.patch(`/users/directors/${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
      } else {
        const response = await adminApi.patch(`/users/directors/${id}/`, data)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update director'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteDirector = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await adminApi.delete(`/users/directors/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete director'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchDirectors,
    fetchDirector,
    createDirector,
    updateDirector,
    deleteDirector
  }
}

// Administrators API
export const useAdminAdministrators = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchAdministrators = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/users/administrators/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch administrators'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAdministrator = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get(`/users/administrators/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch administrator'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createAdministrator = async (data: any) => {
    loading.value = true
    error.value = null
    try {
      const hasFiles = data.avatar instanceof File
      
      if (hasFiles) {
        const formData = new FormData()
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            if (data[key] instanceof File || data[key] instanceof Blob) {
              formData.append(key, data[key])
            } else {
              formData.append(key, data[key])
            }
          }
        })
        const response = await adminApi.post('/users/administrators/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
      } else {
        const response = await adminApi.post('/users/administrators/', data)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.response?.data?.password_confirmation?.[0] || err.message || 'Failed to create administrator'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateAdministrator = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    try {
      const hasFiles = data.avatar instanceof File
      
      if (hasFiles) {
        const formData = new FormData()
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            if (data[key] instanceof File || data[key] instanceof Blob) {
              formData.append(key, data[key])
            } else {
              formData.append(key, data[key])
            }
          }
        })
        const response = await adminApi.patch(`/users/administrators/${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
      } else {
        const response = await adminApi.patch(`/users/administrators/${id}/`, data)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update administrator'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteAdministrator = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await adminApi.delete(`/users/administrators/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete administrator'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchAdministrators,
    fetchAdministrator,
    createAdministrator,
    updateAdministrator,
    deleteAdministrator
  }
}

export const useAdminHeadTeachers = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchHeadTeachers = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/users/head-teachers/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch head teachers'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchHeadTeacher = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get(`/users/head-teachers/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch head teacher'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createHeadTeacher = async (data: any) => {
    loading.value = true
    error.value = null
    try {
      const hasFiles = data.avatar instanceof File
      
      if (hasFiles) {
        const formData = new FormData()
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            if (data[key] instanceof File || data[key] instanceof Blob) {
              formData.append(key, data[key])
            } else {
              formData.append(key, data[key])
            }
          }
        })
        const response = await adminApi.post('/users/head-teachers/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
      } else {
        const response = await adminApi.post('/users/head-teachers/', data)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.response?.data?.password_confirmation?.[0] || err.message || 'Failed to create head teacher'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateHeadTeacher = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    try {
      const hasFiles = data.avatar instanceof File
      
      if (hasFiles) {
        const formData = new FormData()
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            if (data[key] instanceof File || data[key] instanceof Blob) {
              formData.append(key, data[key])
            } else {
              formData.append(key, data[key])
            }
          }
        })
        const response = await adminApi.patch(`/users/head-teachers/${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
      } else {
        const response = await adminApi.patch(`/users/head-teachers/${id}/`, data)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update head teacher'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteHeadTeacher = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await adminApi.delete(`/users/head-teachers/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete head teacher'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchHeadTeachers,
    fetchHeadTeacher,
    createHeadTeacher,
    updateHeadTeacher,
    deleteHeadTeacher
  }
}

// Leaderboards API
export const useAdminLeaderboards = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchLeaderboards = async (params?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get('/landing/leaderboards/', { params })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch leaderboards'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchLeaderboard = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.get(`/landing/leaderboards/${id}/`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch leaderboard'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createLeaderboard = async (data: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.post('/landing/leaderboards/', data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to create leaderboard'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateLeaderboard = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await adminApi.patch(`/landing/leaderboards/${id}/`, data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to update leaderboard'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteLeaderboard = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await adminApi.delete(`/landing/leaderboards/${id}/`)
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete leaderboard'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchLeaderboards,
    fetchLeaderboard,
    createLeaderboard,
    updateLeaderboard,
    deleteLeaderboard
  }
}

