import { ref } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import type { CourseCategory, CourseSubCategory, Course } from '@/types/course'

const API_BASE_URL = '/api/v1'

export const useCourses = () => {
  const { locale } = useI18n()
  const categories = ref<CourseCategory[]>([])
  const subcategories = ref<CourseSubCategory[]>([])
  const courses = ref<Course[]>([])
  const category = ref<CourseCategory | null>(null)
  const subcategory = ref<CourseSubCategory | null>(null)
  const course = ref<Course | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCategories = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/landing/course-categories/`, {
        params: {
          lang: locale.value
        },
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.data && Array.isArray(response.data)) {
        categories.value = response.data
      } else if (response.data && response.data.results) {
        categories.value = response.data.results
      } else {
        categories.value = []
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch categories'
      console.error('Error fetching categories:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchCategory = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/landing/course-categories/${id}/`, {
        params: {
          lang: locale.value
        },
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      category.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch category'
      console.error('Error fetching category:', err)
      category.value = null
    } finally {
      loading.value = false
    }
  }

  const fetchSubcategories = async (categoryId?: number) => {
    loading.value = true
    error.value = null
    
    try {
      const params: any = {
        lang: locale.value
      }
      
      if (categoryId) {
        params.category = categoryId
      }
      
      const response = await axios.get(`${API_BASE_URL}/landing/course-subcategories/`, {
        params,
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.data && Array.isArray(response.data)) {
        subcategories.value = response.data
      } else if (response.data && response.data.results) {
        subcategories.value = response.data.results
      } else {
        subcategories.value = []
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch subcategories'
      console.error('Error fetching subcategories:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchSubcategory = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/landing/course-subcategories/${id}/`, {
        params: {
          lang: locale.value
        },
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      subcategory.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch subcategory'
      console.error('Error fetching subcategory:', err)
      subcategory.value = null
    } finally {
      loading.value = false
    }
  }

  const fetchCourses = async (subcategoryId?: number) => {
    loading.value = true
    error.value = null
    
    try {
      const params: any = {
        lang: locale.value
      }
      
      if (subcategoryId) {
        params.subcategory = subcategoryId
      }
      
      const response = await axios.get(`${API_BASE_URL}/landing/courses/`, {
        params,
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.data && Array.isArray(response.data)) {
        courses.value = response.data
      } else if (response.data && response.data.results) {
        courses.value = response.data.results
      } else {
        courses.value = []
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch courses'
      console.error('Error fetching courses:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchCourse = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/landing/courses/${id}/`, {
        params: {
          lang: locale.value
        },
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      course.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch course'
      console.error('Error fetching course:', err)
      course.value = null
    } finally {
      loading.value = false
    }
  }

  const fetchLeaderboard = async (courseId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/courses/${courseId}/leaderboard/`)
      return response.data
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err)
      return null
    }
  }

  return {
    categories,
    subcategories,
    courses,
    category,
    subcategory,
    course,
    loading,
    error,
    fetchCategories,
    fetchCategory,
    fetchSubcategories,
    fetchSubcategory,
    fetchCourses,
    fetchCourse,
    fetchLeaderboard
  }
}

