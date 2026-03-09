import { ref } from 'vue'
import { useEden } from './useEden'

export const useAdminNews = () => {
  const api = useEden()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getAll = async (params: any = {}) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.admin.news.get({
        query: params
      })
      if (err) throw err
      return data || []
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch news'
      return []
    } finally {
      loading.value = false
    }
  }

  const getById = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.admin.news({ id: String(id) }).get()
      if (err) throw err
      return data
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch news item'
      throw e
    } finally {
      loading.value = false
    }
  }

  const create = async (body: any) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.admin.news.post(body)
      if (err) throw err
      return data
    } catch (e: any) {
      error.value = e?.message || 'Failed to create news'
      throw e
    } finally {
      loading.value = false
    }
  }

  const update = async (id: number, body: any) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.admin.news({ id: String(id) }).patch(body)
      if (err) throw err
      return data
    } catch (e: any) {
      error.value = e?.message || 'Failed to update news'
      throw e
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.admin.news({ id: String(id) }).delete()
      if (err) throw err
      return data
    } catch (e: any) {
      error.value = e?.message || 'Failed to delete news'
      throw e
    } finally {
      loading.value = false
    }
  }

  const getSubscribers = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.admin.news.subscribers.get()
      if (err) throw err
      return Array.isArray(data) ? data : []
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch subscribers'
      return []
    } finally {
      loading.value = false
    }
  }

  const removeSubscriber = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await api.api.v1.admin.news.subscribers({ id: String(id) }).delete()
      if (err) throw err
      return data
    } catch (e: any) {
      error.value = e?.message || 'Failed to delete subscriber'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, getAll, getById, create, update, remove, getSubscribers, removeSubscriber }
}
