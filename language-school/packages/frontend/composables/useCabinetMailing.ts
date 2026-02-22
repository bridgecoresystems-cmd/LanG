import { useEden } from './useEden'

export interface MailingMessage {
  id: number
  title: string
  content: string
  recipient_type: string
  recipient_type_display: string
  created_by_username?: string
  scheduled_at: string | null
  sent_at: string | null
  is_sent: boolean
  total_recipients: number
  created_at: string
}

export interface MailingRecipient {
  id: number
  recipient: string
  recipient_name: string
  recipient_username: string
  is_read: boolean
  read_at: string | null
  received_at: string
}

export interface CreateMailingData {
  title: string
  content: string
  recipient_type: 'all' | 'students' | 'parents' | 'teachers'
  scheduled_at?: string | null
}

export const useCabinetMailing = () => {
  const api = useEden()
  const ht = api.api.v1.cabinet['head-teacher']

  const getList = async () => {
    const { data, error } = await ht.mailing.get()
    if (error) throw error
    return (data ?? []) as MailingMessage[]
  }

  const getById = async (id: number) => {
    const { data, error } = await ht.mailing({ id: String(id) }).get()
    if (error) throw error
    return data as MailingMessage
  }

  const create = async (body: CreateMailingData) => {
    const { data, error } = await ht.mailing.post(body)
    if (error) throw error
    return data
  }

  const send = async (id: number) => {
    const { data, error } = await ht.mailing({ id: String(id) })['send'].post()
    if (error) throw error
    return data
  }

  const remove = async (id: number) => {
    const { error } = await ht.mailing({ id: String(id) }).delete()
    if (error) throw error
  }

  const getRecipients = async (id: number) => {
    const { data, error } = await ht.mailing({ id: String(id) }).recipients.get()
    if (error) throw error
    return (data as { recipients: MailingRecipient[] })?.recipients ?? []
  }

  return { getList, getById, create, send, remove, getRecipients }
}
