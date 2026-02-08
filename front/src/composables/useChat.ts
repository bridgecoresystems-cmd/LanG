import { ref, onUnmounted, computed, watch, type Ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'

export interface ChatMessage {
  id: number
  room_id: number
  user_id: number
  content: string
  file?: string
  file_name?: string
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    avatar?: string
  }
}

export interface ChatRoom {
  id: number
  name: string
  room_type: string
  course_id?: number
  group_id?: number
  is_private: boolean
  is_active: boolean
  message_count: number
  last_message_at?: string
}

const CHAT_SERVICE_URL = import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:3001'

export const useChat = (roomId: number | Ref<number>) => {
  const authStore = useAuthStore()
  const ws = ref<WebSocket | null>(null)
  const messages = ref<ChatMessage[]>([])
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const error = ref<string | null>(null)
  const typingUsers = ref<Set<number>>(new Set())
  const unreadCount = ref(0)
  
  // Делаем roomId реактивным
  const currentRoomId = computed(() => {
    return typeof roomId === 'number' ? roomId : roomId.value
  })
  
  // Хранилище для таймеров переподключения
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

  const connect = async () => {
    const room = currentRoomId.value
    if (!room || room <= 0) {
      console.warn('Cannot connect: invalid roomId', room)
      error.value = 'Invalid room ID'
      return
    }

    // Если уже подключены к этой же комнате, не переподключаемся
    if (ws.value?.readyState === WebSocket.OPEN) {
      const currentUrl = ws.value.url
      if (currentUrl && currentUrl.includes(`/ws/chat/${room}`)) {
        console.log('Already connected to room', room)
        return
      }
      // Если подключены к другой комнате, отключаемся
      disconnect()
    }

    if (isConnecting.value) {
      return // Already connecting
    }

    isConnecting.value = true
    error.value = null

    // Получаем актуальный токен из store
    let token = authStore.accessToken
    if (!token) {
      console.error('❌ No authentication token available')
      error.value = 'No authentication token. Please login again.'
      isConnecting.value = false
      return
    }
    
    // Проверяем что токен не пустой
    if (token.trim() === '') {
      console.error('❌ Empty authentication token')
      error.value = 'Invalid authentication token. Please login again.'
      isConnecting.value = false
      return
    }
    
    // Проверяем валидность токена, пытаясь получить пользователя
    // Это обновит токен если он истек (через axios interceptor)
    try {
      await authStore.fetchCurrentUser()
      // После fetchCurrentUser токен может быть обновлен через interceptor
      token = authStore.accessToken
      if (!token) {
        console.error('❌ Token became invalid after refresh attempt')
        error.value = 'Authentication failed. Please login again.'
        isConnecting.value = false
        return
      }
      console.log('🔐 Token validated, using for WebSocket connection')
    } catch (err: any) {
      console.error('❌ Failed to validate token:', err)
      error.value = 'Authentication failed. Please login again.'
      isConnecting.value = false
      return
    }

    try {
      // Правильно конвертируем HTTP URL в WebSocket URL
      let wsUrl = CHAT_SERVICE_URL
      if (wsUrl.startsWith('http://')) {
        wsUrl = wsUrl.replace('http://', 'ws://')
      } else if (wsUrl.startsWith('https://')) {
        wsUrl = wsUrl.replace('https://', 'wss://')
      } else if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        wsUrl = `ws://${wsUrl}`
      }
      const fullWsUrl = `${wsUrl}/ws/chat/${room}?token=${token}`
      console.log('Connecting to WebSocket:', fullWsUrl.replace(token, 'TOKEN_HIDDEN'))
      ws.value = new WebSocket(fullWsUrl)

      ws.value.onopen = () => {
        isConnected.value = true
        isConnecting.value = false
        error.value = null
        console.log('Chat WebSocket connected, readyState:', ws.value?.readyState, 'roomId:', currentRoomId.value)
        
        // Проверяем что соединение действительно открыто
        if (ws.value?.readyState === WebSocket.OPEN) {
          console.log('✅ WebSocket is OPEN and ready for messages')
          
          // Проверяем состояние через небольшую задержку
          setTimeout(() => {
            if (ws.value?.readyState === WebSocket.OPEN) {
              console.log('✅ WebSocket still OPEN after 500ms')
            } else {
              console.warn('⚠️  WebSocket state changed to:', ws.value?.readyState, 'after 500ms')
            }
          }, 500)
        } else {
          console.warn('⚠️  WebSocket state after onopen:', ws.value?.readyState)
        }
      }

      ws.value.onmessage = (event) => {
        try {
          if (!event || !event.data) {
            console.warn('Invalid WebSocket message event:', event)
            return
          }
          const data = JSON.parse(event.data)
          console.log('📥 WebSocket message received:', data.type, data.message?.id || 'no message id')
          handleMessage(data)
        } catch (err) {
          console.error('Error parsing WebSocket message:', err, 'data:', event?.data)
        }
      }

      ws.value.onerror = (err) => {
        console.error('WebSocket error:', err)
        error.value = 'Connection error'
        isConnecting.value = false
        isConnected.value = false
      }

      ws.value.onclose = (event) => {
        const wasConnected = isConnected.value
        isConnected.value = false
        isConnecting.value = false
        
        console.log('Chat WebSocket disconnected', { 
          code: event.code, 
          reason: event.reason, 
          wasClean: event.wasClean,
          roomId: currentRoomId.value,
          wasConnectedBeforeClose: wasConnected
        })
        
        // Если соединение было установлено и сразу закрылось - это проблема
        if (wasConnected && event.code === 1000 && !event.reason) {
          console.error('⚠️  Connection was established but closed immediately with code 1000')
          error.value = 'Connection closed unexpectedly. Возможно, комната не существует или вы не являетесь участником.'
        }
        
        // Не переподключаемся если это ошибка авторизации или доступа
        if (event.code === 1008) {
          error.value = event.reason || 'Access denied'
          console.error('WebSocket closed with error:', event.reason)
          return
        }
        
        // Для нормального закрытия (1000) тоже не переподключаемся автоматически
        // Это может быть намеренное закрытие или проблема с комнатой
        if (event.code === 1000) {
          if (event.reason) {
            error.value = event.reason
          } else if (wasConnected) {
            // Если было подключено и закрылось без причины - это проблема
            error.value = 'Connection closed unexpectedly'
          }
          console.warn('WebSocket closed normally, but may indicate a problem:', event.reason || 'No reason provided')
          return
        }
        
        // Auto-reconnect after 3 seconds только для неожиданных разрывов (network errors)
        // Очищаем предыдущий timeout если есть
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout)
        }
        reconnectTimeout = setTimeout(async () => {
          if (!isConnected.value && event.code !== 1008 && event.code !== 1000 && currentRoomId.value > 0) {
            console.log('Attempting to reconnect...')
            await connect()
          }
          reconnectTimeout = null
        }, 3000)
      }
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      error.value = 'Failed to connect'
      isConnecting.value = false
    }
  }

  const handleMessage = (data: any) => {
    console.log('🔍 handleMessage called with:', { type: data?.type, hasMessage: !!data?.message })
    
    if (!data || typeof data !== 'object') {
      console.warn('❌ Invalid message data received:', data)
      return
    }
    
    if (!data.type) {
      console.warn('❌ Message data missing type property:', data)
      return
    }
    
    switch (data.type) {
      case 'messages_history':
        if (data.messages && Array.isArray(data.messages)) {
          // Нормализуем сообщения - убеждаемся что у каждого есть user объект
          const normalizedMessages = data.messages.map((msg: any) => {
            if (!msg.user) {
              console.warn('⚠️  Message missing user object:', msg)
              return {
                ...msg,
                user: {
                  id: msg.user_id || 0,
                  username: 'Unknown',
                  first_name: '',
                  last_name: ''
                }
              }
            }
            return msg
          })
          // Сортируем по created_at (старые первыми, новые внизу)
          normalizedMessages.sort((a: any, b: any) => {
            const dateA = new Date(a.created_at).getTime()
            const dateB = new Date(b.created_at).getTime()
            return dateA - dateB
          })
          messages.value = normalizedMessages
          console.log('✅ Messages history loaded:', messages.value.length, 'messages')
          // После загрузки истории скроллим вниз к последним сообщениям
          // Используем setTimeout чтобы дать Vue время отрендерить сообщения
          setTimeout(() => {
            // Эмитим событие для компонента, чтобы он мог скроллить
            // Это будет обработано в watch(messages) в ChatWidget
          }, 50)
        }
        break

      case 'message':
        if (data.message) {
          console.log('📨 Received new message via WebSocket:', data.message)
          
          // Нормализуем сообщение - убеждаемся что есть user объект
          if (!data.message.user) {
            console.warn('⚠️  New message missing user object:', data.message)
            data.message.user = {
              id: data.message.user_id || 0,
              username: 'Unknown',
              first_name: '',
              last_name: ''
            }
          }
          
          // Проверяем, нет ли уже такого сообщения (избегаем дубликатов)
          const existingIndex = messages.value.findIndex((msg: ChatMessage) => msg.id === data.message.id)
          if (existingIndex === -1) {
            // Создаем новый массив для правильной реактивности Vue
            const newMessages = [...messages.value, data.message]
            // Сортируем по времени (старые первыми, новые внизу)
            newMessages.sort((a: ChatMessage, b: ChatMessage) => {
              const dateA = new Date(a.created_at).getTime()
              const dateB = new Date(b.created_at).getTime()
              return dateA - dateB
            })
            messages.value = newMessages
            console.log('✅ New message added:', data.message.id, 'Total messages:', messages.value.length)
          } else {
            console.log('⚠️  Message already exists, skipping:', data.message.id)
          }
          // Auto-scroll will be handled by component watcher
        }
        break

      case 'message_sent':
        // Message was sent successfully, already added to messages
        break

      case 'typing':
        if (data.user_id && data.user_id !== authStore.user?.id) {
          typingUsers.value.add(data.user_id)
          // Auto-remove after 3 seconds
          setTimeout(() => {
            typingUsers.value.delete(data.user_id)
          }, 3000)
        }
        break

      case 'stop_typing':
        if (data.user_id) {
          typingUsers.value.delete(data.user_id)
        }
        break

      case 'user_joined':
        console.log('User joined:', data.user_id)
        break

      case 'user_left':
        console.log('User left:', data.user_id)
        break

      case 'read_confirmed':
        // Message was read
        break

      default:
        console.log('Unknown message type:', data.type)
    }
  }

  const sendMessage = (content: string, filePath?: string, fileName?: string, fileType?: string) => {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      error.value = 'Not connected to chat'
      return false
    }

    if (!content.trim() && !filePath) {
      return false
    }

    try {
      ws.value.send(JSON.stringify({
        type: 'message',
        content: content.trim(),
        file_path: filePath,
        file_name: fileName,
        file_type: fileType
      }))
      return true
    } catch (err) {
      console.error('Error sending message:', err)
      error.value = 'Failed to send message'
      return false
    }
  }

  const sendTyping = () => {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      ws.value.send(JSON.stringify({
        type: 'typing'
      }))
    } catch (err) {
      console.error('Error sending typing status:', err)
    }
  }

  const sendStopTyping = () => {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      ws.value.send(JSON.stringify({
        type: 'stop_typing'
      }))
    } catch (err) {
      console.error('Error sending stop typing status:', err)
    }
  }

  const markAsRead = () => {
    unreadCount.value = 0
    // Optionally send read confirmation to server
  }

  const disconnect = () => {
    // Логируем вызов disconnect для отладки
    const stack = new Error().stack
    console.log('🔌 disconnect() called', {
      roomId: currentRoomId.value,
      isConnected: isConnected.value,
      readyState: ws.value?.readyState,
      stack: stack?.split('\n').slice(1, 4).join('\n') // Первые 3 строки стека
    })
    
    // Очищаем таймер переподключения
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    
    if (ws.value) {
      try {
        // Удаляем все обработчики событий перед закрытием
        ws.value.onopen = null
        ws.value.onmessage = null
        ws.value.onerror = null
        ws.value.onclose = null
        
        // Закрываем соединение только если оно открыто
        if (ws.value.readyState === WebSocket.OPEN || ws.value.readyState === WebSocket.CONNECTING) {
          console.log('🔌 Closing WebSocket connection...')
          ws.value.close()
        }
      } catch (err) {
        console.error('Error closing WebSocket:', err)
      } finally {
        ws.value = null
      }
    }
    isConnected.value = false
    isConnecting.value = false
  }

  const isCurrentUser = (userId: number | string) => {
    const currentUserId = authStore.user?.id
    if (!currentUserId) return false
    // Сравниваем как числа, чтобы избежать проблем с типами
    return Number(userId) === Number(currentUserId)
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    messages,
    isConnected,
    isConnecting,
    error,
    typingUsers,
    unreadCount,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    sendStopTyping,
    markAsRead,
    isCurrentUser
  }
}
