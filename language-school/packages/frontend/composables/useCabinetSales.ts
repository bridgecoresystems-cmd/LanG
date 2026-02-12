import { useEden } from './useEden'

export const useCabinetSales = () => {
  const api = useEden()

  const getAll = async (params: any = {}) => {
    const { data, error } = await api.api.v1.cabinet.sales.calls.get({
      query: params
    })
    if (error) throw error
    return data ?? []
  }

  const getById = async (id: number) => {
    const { data, error } = await api.api.v1.cabinet.sales.calls({ id: String(id) }).get()
    if (error) throw error
    return data
  }

  const create = async (body: any) => {
    const { data, error } = await api.api.v1.cabinet.sales.calls.post(body)
    if (error) {
      const errorObj = error.value as any
      throw { value: errorObj, message: errorObj?.error || 'Ошибка при создании записи' }
    }
    return data
  }

  const update = async (id: number, body: any) => {
    const { data, error } = await api.api.v1.cabinet.sales.calls({ id: String(id) }).patch(body)
    if (error) {
      const errorObj = error.value as any
      throw { value: errorObj, message: errorObj?.error || 'Ошибка при обновлении записи' }
    }
    return data
  }

  const remove = async (id: number) => {
    const { error } = await api.api.v1.cabinet.sales.calls({ id: String(id) }).delete()
    if (error) throw error
  }

  const getStats = async () => {
    const { data, error } = await api.api.v1.cabinet.sales.stats.get()
    if (error) throw error
    return data
  }

  return { getAll, getById, create, update, remove, getStats }
}
