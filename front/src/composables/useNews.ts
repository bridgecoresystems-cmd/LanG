import { ref } from 'vue'
import axios from 'axios'
import type { News } from '@/types/news'
import { useI18n } from 'vue-i18n'

const API_BASE_URL = '/api/v1'

export const useNews = () => {
  const { locale } = useI18n()
  const news = ref<News[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchNews = async (featured = false) => {
    loading.value = true
    error.value = null
    
    try {
      const params: any = {
        lang: locale.value
      }
      
      if (featured) {
        params.is_featured = true
      }
      
      const response = await axios.get(`${API_BASE_URL}/landing/news/`, {
        params,
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      // Handle paginated response
      if (response.data && Array.isArray(response.data)) {
        news.value = response.data
      } else if (response.data && response.data.results) {
        news.value = response.data.results
      } else {
        news.value = []
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch news'
      console.error('Error fetching news:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    news,
    loading,
    error,
    fetchNews
  }
}

