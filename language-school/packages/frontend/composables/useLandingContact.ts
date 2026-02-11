import { useEden } from './useEden'

/**
 * Composable for landing contact messages via Eden Treaty
 */
export const useLandingContact = () => {
  const api = useEden()

  const getMessages = async (params?: { page?: number; limit?: number }) => {
    const { data, error } = await api.api.v1.landing['contact-messages'].get({
      query: params
    })
    if (error) throw error
    return data
  }

  const sendMessage = async (message: any) => {
    const { data, error } = await api.api.v1.landing['contact-messages'].post(message)
    if (error) throw error
    return data
  }

  const likeMessage = async (id: number) => {
    const { data, error } = await api.api.v1.landing['contact-messages'][id].like.post()
    if (error) throw error
    return data
  }

  return {
    getMessages,
    sendMessage,
    likeMessage
  }
}
