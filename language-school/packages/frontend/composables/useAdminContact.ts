import { useEden } from './useEden'

export const useAdminContact = () => {
  const api = useEden()

  const getAll = async (params: any = {}) => {
    const { data, error } = await api.api.v1.admin['contact-messages'].get({
      query: params
    })
    if (error) throw error
    return data ?? []
  }

  const getById = async (id: number) => {
    const { data, error } = await api.api.v1.admin['contact-messages']({ id: String(id) }).get()
    if (error) throw error
    return data
  }

  const remove = async (id: number) => {
    const { error } = await api.api.v1.admin['contact-messages']({ id: String(id) }).delete()
    if (error) throw error
  }

  const toggleApproval = async (id: number) => {
    const { data, error } = await api.api.v1.admin['contact-messages']({ id: String(id) })['toggle-approval'].post()
    if (error) throw error
    return data
  }

  const likeMessage = async (id: number) => {
    const { data, error } = await api.api.v1.admin['contact-messages']({ id: String(id) }).like.post()
    if (error) throw error
    return data
  }

  const update = async (id: number, body: any) => {
    const { data, error } = await api.api.v1.admin['contact-messages']({ id: String(id) }).patch(body)
    if (error) throw error
    return data
  }

  return { getAll, getById, remove, toggleApproval, likeMessage, update }
}
