import { useEden } from './useEden'

export const useCabinetHeadTeacher = () => {
  const api = useEden()
  const ht = api.api.v1.cabinet['head-teacher']

  const getUsers = async () => {
    const { data, error } = await ht.users.get()
    if (error) throw error
    return data ?? []
  }

  const createUser = async (body: any) => {
    const { data, error } = await ht.users.post(body)
    if (error) {
      const errorObj = error.value as any
      throw { value: errorObj, message: errorObj?.error || 'Ошибка при создании пользователя' }
    }
    return data
  }

  const getById = async (id: string) => {
    const { data, error } = await ht.users({ id }).get()
    if (error) throw error
    return data
  }

  const updateUser = async (id: string, body: any) => {
    const { data, error } = await ht.users({ id }).patch(body)
    if (error) {
      const errorObj = error.value as any
      throw { value: errorObj, message: errorObj?.error || 'Ошибка при сохранении' }
    }
    return data
  }

  return { getUsers, createUser, getById, updateUser }
}
