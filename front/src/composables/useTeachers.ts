import { ref } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import type { Teacher, TeacherList } from '@/types/teacher'

const API_BASE_URL = '/api/v1'

export const useTeachers = () => {
  const { locale } = useI18n()
  const teachers = ref<TeacherList[]>([])
  const teacher = ref<Teacher | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTeachers = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/users/teachers/`, {
        params: {
          lang: locale.value
        },
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      // Handle paginated response
      if (response.data && Array.isArray(response.data)) {
        teachers.value = response.data
      } else if (response.data && response.data.results) {
        teachers.value = response.data.results
      } else {
        teachers.value = []
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch teachers'
      console.error('Error fetching teachers:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchTeacher = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/users/teachers/${id}/`, {
        params: {
          lang: locale.value
        },
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      teacher.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch teacher'
      console.error('Error fetching teacher:', err)
      teacher.value = null
    } finally {
      loading.value = false
    }
  }

  const incrementViews = async (id: number) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/teachers/${id}/increment_views/`
      )
      
      if (response.status === 200 && teacher.value) {
        // Check by user_id or id
        const teacherId = teacher.value.user_id || teacher.value.id
        if (teacherId === id) {
          teacher.value.views = response.data.views
        }
      }
      
      // Update in list if exists - check by user_id or id
      const teacherInList = teachers.value.find(t => (t.user_id || t.id) === id)
      if (teacherInList) {
        teacherInList.views = response.data.views
      }
    } catch (err: any) {
      console.error('Error incrementing views:', err)
    }
  }

  const likeTeacher = async (id: number) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/teachers/${id}/like/`
      )
      
      if (response.status === 200) {
        const { likes, is_liked } = response.data
        
        // Update teacher detail if it's the same teacher
        if (teacher.value) {
          const teacherId = teacher.value.user_id || teacher.value.id
          if (teacherId === id) {
            teacher.value.likes = likes
            teacher.value.is_liked = is_liked
          }
        }
        
        // Update in list if exists
        const teacherInList = teachers.value.find(t => (t.user_id || t.id) === id)
        if (teacherInList) {
          teacherInList.likes = likes
          teacherInList.is_liked = is_liked
        }
        
        return { likes, is_liked }
      }
      
      return null
    } catch (err: any) {
      console.error('Error liking teacher:', err)
      if (err.response?.status === 401) {
        throw new Error('Authentication required')
      }
      return null
    }
  }

  return {
    teachers,
    teacher,
    loading,
    error,
    fetchTeachers,
    fetchTeacher,
    incrementViews,
    likeTeacher
  }
}

