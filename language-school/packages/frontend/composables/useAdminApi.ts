import { ref } from 'vue'
import { useEden } from './useEden'

export const useAdminNews = () => {
  const api = useEden()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchNews = async (params: any = {}) => {
    loading.value = true
    error.value = null
    try {
      // Assuming your Eden API is set up to handle query params for filtering
      const response = await api.api.v1.admin.news.get({query: params})
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch news'
      return [] // Return an empty array in case of error
    } finally {
      loading.value = false
    }
  }

  const fetchNewsItem = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.api.v1.admin.news[id].get()
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch news item'
    } finally {
      loading.value = false
    }
  }

  const createNews = async (data: Record<string, unknown>) => {
    loading.value = true
    error.value = null
    try {
      await api.api.v1.admin.news.post(data)
    } catch (err: any) {
      error.value = err.message || 'Failed to create news'
      throw err // Re-throw to handle in component
    } finally {
      loading.value = false
    }
  }

  const updateNews = async (id: number, data: Record<string, unknown>) => {
    loading.value = true
    error.value = null
    try {
      await api.api.v1.admin.news[id].put(data)
    } catch (err: any) {
      error.value = err.message || 'Failed to update news'
      throw err // Re-throw to handle in component
    } finally {
      loading.value = false
    }
  }

  const deleteNews = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await api.api.v1.admin.news[id].delete()
    } catch (err: any) {
      error.value = err.message || 'Failed to delete news'
      throw err // Re-throw to handle in component
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchNews, fetchNewsItem, createNews, updateNews, deleteNews }
}
