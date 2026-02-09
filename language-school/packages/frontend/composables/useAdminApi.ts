import { ref } from 'vue'

/** Admin news API — $fetch с apiBase (как users, categories). */
export const useAdminNews = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchNews = async (params: Record<string, any> = {}) => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<any[]>(`${apiBase}/admin/news`, {
        credentials: 'include',
        query: params,
      })
      return data ?? []
    } catch (err: any) {
      error.value = err?.data?.error || err?.message || 'Failed to fetch news'
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchNewsItem = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<any>(`${apiBase}/admin/news/${id}`, { credentials: 'include' })
      return data
    } catch (err: any) {
      error.value = err?.data?.error || err?.message || 'Failed to fetch news item'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createNews = async (data: Record<string, unknown>) => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${apiBase}/admin/news`, {
        method: 'POST',
        credentials: 'include',
        body: data,
      })
    } catch (err: any) {
      error.value = err?.data?.error || err?.message || 'Failed to create news'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateNews = async (id: number, data: Record<string, unknown>) => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${apiBase}/admin/news/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: data,
      })
    } catch (err: any) {
      error.value = err?.data?.error || err?.message || 'Failed to update news'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteNews = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${apiBase}/admin/news/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch (err: any) {
      error.value = err?.data?.error || err?.message || 'Failed to delete news'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchNews, fetchNewsItem, createNews, updateNews, deleteNews }
}
