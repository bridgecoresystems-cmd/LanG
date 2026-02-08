/**
 * Composable for mailing API interactions.
 */
import axios from 'axios'
import { ref } from 'vue'
import type { Ref } from 'vue'

const API_BASE_URL = '/api/v1'

export interface Message {
  id: number
  title: string
  content: string
  recipient_type: string
  recipient_type_display: string
  created_by: number
  created_by_name: string
  created_by_username: string
  created_at: string
  scheduled_at: string | null
  sent_at: string | null
  is_sent: boolean
  total_recipients: number
  group_filters?: Array<{
    id: number
    group: number
    group_id: number
    group_name: string
  }>
  group_ids?: number[]
}

export interface MessageRecipient {
  id: number
  message: number
  message_title: string
  message_content: string
  message_created_at: string
  recipient: number
  recipient_name: string
  recipient_username: string
  sender_id: number
  sender_name: string
  sender_username: string
  is_read: boolean
  read_at: string | null
  received_at: string
}

export interface CreateMessageData {
  title: string
  content: string
  recipient_type: 'all' | 'students' | 'teachers' | 'directors' | 'head_teachers' | 'groups' | 'group_teachers'
  scheduled_at?: string | null
  group_ids?: number[]
}

export const useMailingApi = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
      Authorization: token ? `Bearer ${token}` : '',
    }
  }

  /**
   * Fetch all messages (for head_teacher and superuser)
   */
  const fetchMessages = async (): Promise<Message[]> => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get<{ results: Message[], count: number } | Message[]>(
        `${API_BASE_URL}/mailing/messages/`,
        { headers: getAuthHeaders() }
      )
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response.data)) {
        return response.data
      } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        return response.data.results
      }
      return []
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch messages'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch message by ID
   */
  const fetchMessage = async (id: number): Promise<Message> => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get<Message>(
        `${API_BASE_URL}/mailing/messages/${id}/`,
        { headers: getAuthHeaders() }
      )
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch message'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new message
   */
  const createMessage = async (data: CreateMessageData): Promise<Message> => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.post<Message>(
        `${API_BASE_URL}/mailing/messages/`,
        data,
        { headers: getAuthHeaders() }
      )
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.response?.data || 'Failed to create message'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Send a message manually
   */
  const sendMessage = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await axios.post(
        `${API_BASE_URL}/mailing/messages/${id}/send/`,
        {},
        { headers: getAuthHeaders() }
      )
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to send message'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch user's received messages
   */
  const fetchMyMessages = async (isRead?: boolean): Promise<MessageRecipient[]> => {
    loading.value = true
    error.value = null
    try {
      const params: any = {}
      if (isRead !== undefined) {
        params.is_read = isRead.toString()
      }
      const response = await axios.get<{ results: MessageRecipient[], count: number, next: string | null, previous: string | null } | MessageRecipient[]>(
        `${API_BASE_URL}/mailing/my-messages/`,
        { 
          headers: getAuthHeaders(),
          params
        }
      )
      // Handle paginated response
      if (Array.isArray(response.data)) {
        return response.data
      } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        return response.data.results
      }
      return []
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch messages'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get unread messages count
   */
  const getUnreadCount = async (): Promise<number> => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get<{ count: number }>(
        `${API_BASE_URL}/mailing/my-messages/unread_count/`,
        { headers: getAuthHeaders() }
      )
      return response.data.count
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to fetch unread count'
      return 0
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark message as read
   */
  const markAsRead = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await axios.post(
        `${API_BASE_URL}/mailing/my-messages/${id}/mark_read/`,
        {},
        { headers: getAuthHeaders() }
      )
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to mark message as read'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark all messages as read
   */
  const markAllAsRead = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await axios.post(
        `${API_BASE_URL}/mailing/my-messages/mark_all_read/`,
        {},
        { headers: getAuthHeaders() }
      )
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to mark all messages as read'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a message
   */
  const deleteMessage = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await axios.delete(
        `${API_BASE_URL}/mailing/messages/${id}/`,
        { headers: getAuthHeaders() }
      )
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Failed to delete message'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchMessages,
    fetchMessage,
    createMessage,
    sendMessage,
    deleteMessage,
    fetchMyMessages,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
  }
}

