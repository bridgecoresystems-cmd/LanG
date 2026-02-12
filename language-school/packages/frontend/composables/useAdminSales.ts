import { useEden } from './useEden'

export const useAdminSales = () => {
  const api = useEden()

  const getAll = async (params: any = {}) => {
    const { data, error } = await api.api.v1.admin.sales.calls.get({
      query: params
    })
    if (error) {
      const errorObj = error.value as any
      throw { value: errorObj, message: errorObj?.error || 'Ошибка при загрузке записей' }
    }
    return data ?? []
  }

  const getById = async (id: number) => {
    const { data, error } = await api.api.v1.admin.sales.calls({ id: String(id) }).get()
    if (error) {
      const errorObj = error.value as any
      throw { value: errorObj, message: errorObj?.error || 'Ошибка при загрузке записи' }
    }
    return data
  }

  const create = async (body: any) => {
    const { data, error } = await api.api.v1.admin.sales.calls.post(body)
    if (error) {
      const errorObj = error.value as any
      throw { value: errorObj, message: errorObj?.error || 'Ошибка при создании записи' }
    }
    return data
  }

  const update = async (id: number, body: any) => {
    const { data, error } = await api.api.v1.admin.sales.calls({ id: String(id) }).patch(body)
    if (error) {
      const errorObj = error.value as any
      throw { value: errorObj, message: errorObj?.error || 'Ошибка при обновлении записи' }
    }
    return data
  }

  const remove = async (id: number) => {
    const { error } = await api.api.v1.admin.sales.calls({ id: String(id) }).delete()
    if (error) {
      const errorObj = error.value as any
      throw { value: errorObj, message: errorObj?.error || 'Ошибка при удалении записи' }
    }
  }

  const getStats = async () => {
    const { data, error } = await api.api.v1.admin.sales.stats.get()
    if (error) {
      const errorObj = error.value as any
      throw { value: errorObj, message: errorObj?.error || 'Ошибка при загрузке статистики' }
    }
    return data
  }

  return { getAll, getById, create, update, remove, getStats }
}
