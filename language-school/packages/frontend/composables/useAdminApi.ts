import { ref } from 'vue'

/** Admin news API — useEden treaty. */
export const useAdminNews = () => {
  const api = useEden()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchNews = async (params: Record<string, any> = {}) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.admin.news.get({
        query: params,
      })
      if (err) throw err
      return data ?? []
    } catch (err: any) {
      error.value = err?.value?.error || err?.message || 'Failed to fetch news'
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchNewsItem = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.admin.news({ id: String(id) }).get()
      if (err) throw err
      return data
    } catch (err: any) {
      error.value = err?.value?.error || err?.message || 'Failed to fetch news item'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createNews = async (data: any) => {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await api.api.v1.admin.news.post(data)
      if (err) throw err
    } catch (err: any) {
      error.value = err?.value?.error || err?.message || 'Failed to create news'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateNews = async (id: number, data: any) => {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await api.api.v1.admin.news({ id: String(id) }).put(data)
      if (err) throw err
    } catch (err: any) {
      error.value = err?.value?.error || err?.message || 'Failed to update news'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteNews = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const { error: err } = await api.api.v1.admin.news({ id: String(id) }).delete()
      if (err) throw err
    } catch (err: any) {
      error.value = err?.value?.error || err?.message || 'Failed to delete news'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchNews, fetchNewsItem, createNews, updateNews, deleteNews }
}
