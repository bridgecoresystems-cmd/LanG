<template>
  <div class="chat-widget" :class="{ 'is-open': isOpen }">
    <div class="chat-widget-header" @click="toggleChat">
      <n-space align="center" justify="space-between" style="width: 100%;">
        <n-space align="center" size="small">
          <div class="status-indicator" :class="{ 'is-online': isConnected }"></div>
          <n-text strong>{{ teacherName || $t('chat.teacher') }}</n-text>
          <n-icon v-if="typingUsers.size > 0" :size="16" style="color: #666; animation: pulse 1.5s ease-in-out infinite;">
            <pencil-icon />
          </n-icon>
          <n-text depth="3" size="small" v-if="unreadCount > 0" class="unread-badge">
            ({{ unreadCount }})
          </n-text>
        </n-space>
        <n-icon :size="20" @click.stop="closeChat">
          <close-icon />
        </n-icon>
      </n-space>
    </div>

    <div class="chat-widget-body" ref="messagesContainer">
      <div v-if="isConnecting" class="chat-loading">
        <n-spin size="small" />
        <n-text depth="3" size="small">{{ $t('chat.connecting') }}</n-text>
      </div>

      <div v-else-if="error" class="chat-error">
        <n-alert type="error" size="small" :title="$t('common.error')">
          {{ error }}
        </n-alert>
      </div>

      <div v-else-if="messages.length === 0" class="chat-empty">
        <n-text depth="3" size="small">{{ $t('chat.noMessages') }}</n-text>
      </div>

      <div v-else class="chat-messages">
        <div
          v-for="message in messages"
          :key="message.id"
          class="chat-message"
          :class="{ 'is-own': isCurrentUser(message.user_id) }"
        >
          <div class="message-content">
            <div class="message-bubble">
              <div v-if="message.file" class="message-file">
                <img v-if="message.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)" 
                     :src="getFileUrl(message.file)" 
                     alt="Image" 
                     class="message-image"
                     @click="openImageModal(message.file)" />
                <audio v-else-if="message.file_name?.match(/\.(mp3|wav|ogg|webm)$/i)"
                       :src="getFileUrl(message.file)"
                       controls
                       class="message-audio" />
              </div>
              <n-text v-if="message.content">{{ message.content }}</n-text>
              <n-text v-if="message.is_edited" depth="3" size="small" class="edited-label">
                {{ $t('chat.edited') }}
              </n-text>
            </div>
            <div class="message-time">
              <n-text depth="3" size="small">{{ formatTime(message.created_at) }}</n-text>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-widget-footer">
      <div v-if="selectedFile" class="selected-file-info">
        <n-space align="center" size="small">
          <n-icon :size="16" style="color: #18a058;">
            <camera-icon />
          </n-icon>
          <n-text depth="3" size="small">{{ selectedFile?.name || 'File' }}</n-text>
          <n-button
            quaternary
            size="tiny"
            @click="clearSelectedFile"
          >
            ✕
          </n-button>
        </n-space>
      </div>
      <n-input
        v-model:value="messageInput"
        type="textarea"
        :placeholder="$t('chat.placeholder')"
        :rows="2"
        :maxlength="1000"
        show-count
        @keydown="handleKeyDown"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        class="chat-input"
      />
      <n-space align="center" size="small" class="chat-actions">
        <n-button
          quaternary
          circle
          size="small"
          @click="handleFileClick"
          :disabled="!isConnected"
        >
          <template #icon>
            <n-icon><camera-icon /></n-icon>
          </template>
        </n-button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*,audio/*"
          style="display: none;"
          @change="handleFileSelect"
        />
        <n-button
          type="primary"
          circle
          size="small"
          @click="sendMessage"
          :disabled="!canSendMessage"
          :loading="sending"
        >
          <template #icon>
            <n-icon><send-icon /></n-icon>
          </template>
        </n-button>
      </n-space>
    </div>

    <!-- Модальное окно для просмотра изображений -->
    <n-modal
      v-model:show="showImageModal"
      preset="card"
      :style="{ maxWidth: '90vw', maxHeight: '90vh' }"
      :title="$t('chat.viewImage')"
      size="large"
      :bordered="false"
      :segmented="false"
    >
      <div class="image-modal-content">
        <img 
          v-if="modalImageUrl" 
          :src="modalImageUrl" 
          alt="Image" 
          class="modal-image"
        />
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChat, type ChatMessage } from '@/composables/useChat'
import {
  NText, NIcon, NSpace, NInput, NButton, NSpin, NAlert, NModal
} from 'naive-ui'
import {
  CloseOutline as CloseIcon,
  SendOutline as SendIcon,
  CameraOutline as CameraIcon,
  PencilOutline as PencilIcon
} from '@vicons/ionicons5'

const CHAT_SERVICE_URL = import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:3001'

interface Props {
  isOpen: boolean
  roomId: number
  teacherName?: string
}

const props = withDefaults(defineProps<Props>(), {
  teacherName: ''
})

const emit = defineEmits<{
  close: []
  'update:unreadCount': [count: number]
}>()

const { t, locale } = useI18n()

// Создаем composable с реактивным roomId
const roomIdRef = computed(() => props.roomId)
const {
  messages,
  isConnected,
  isConnecting,
  error,
  typingUsers,
  unreadCount,
  connect,
  disconnect,
  sendMessage: sendChatMessage,
  sendTyping,
  sendStopTyping,
  markAsRead,
  isCurrentUser
} = useChat(roomIdRef)

// Сохраняем последний roomId для проверки
const lastRoomId = ref<number>(0)

const messageInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const sending = ref(false)
const typingTimeout = ref<number | null>(null)
const showImageModal = ref(false)
const modalImageUrl = ref<string>('')

// Computed для проверки, можно ли отправить сообщение
const canSendMessage = computed(() => {
  return isConnected.value && (messageInput.value.trim().length > 0 || selectedFile.value !== null)
})

const getFileUrl = (filePath: string) => {
  if (!filePath) return ''
  if (filePath.startsWith('http')) return filePath
  return `${CHAT_SERVICE_URL}${filePath}`
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return t('chat.justNow')
  if (minutes < 60) return `${minutes} ${t('chat.minutesAgo')}`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} ${t('chat.hoursAgo')}`

  // Преобразуем код локали в формат для toLocaleDateString
  const localeMap: Record<string, string> = {
    'ru': 'ru-RU',
    'en': 'en-US',
    'tm': 'tk-TM' // Туркменский
  }
  const dateLocale = localeMap[locale.value as string] || 'ru-RU'

  return date.toLocaleDateString(dateLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = async (force = false) => {
  await nextTick()
  if (messagesContainer.value) {
    // Скроллим вниз к последним сообщениям
    requestAnimationFrame(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        // Дополнительная проверка через небольшую задержку для случаев когда контент еще рендерится
        if (force) {
          setTimeout(() => {
            if (messagesContainer.value) {
              messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
            }
          }, 100)
          // Еще одна попытка через большую задержку для надежности
          setTimeout(() => {
            if (messagesContainer.value) {
              messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
            }
          }, 300)
        }
      }
    })
  }
}

const sendMessage = async () => {
  if (!messageInput.value.trim() && !selectedFile.value) {
    console.log('⚠️  Cannot send: no message and no file')
    return
  }
  if (!isConnected.value) {
    console.log('⚠️  Cannot send: not connected')
    return
  }

  sending.value = true
  try {
    let filePath: string | undefined
    let fileName: string | undefined
    let fileType: string | undefined

    if (selectedFile.value) {
      console.log('📤 Uploading file:', selectedFile.value.name, 'type:', selectedFile.value.type)
      // Upload file first
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      formData.append('room_id', props.roomId.toString())
      
      const isImage = selectedFile.value.type.startsWith('image/')
      formData.append('file_type', isImage ? 'image' : 'audio')

      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('No access token found')
      }

      console.log('📤 Sending upload request to:', `${CHAT_SERVICE_URL}/api/upload`)
      const response = await fetch(`${CHAT_SERVICE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      console.log('📤 Upload response status:', response.status)
      if (response.ok) {
        const result = await response.json()
        console.log('✅ File uploaded successfully:', result)
        filePath = result.file_path
        fileName = result.file_name
        fileType = result.file_type || (isImage ? 'image' : 'audio')
      } else {
        const errorText = await response.text()
        console.error('❌ Upload failed:', response.status, errorText)
        throw new Error(`Failed to upload file: ${response.status} ${errorText}`)
      }
    }

    console.log('📨 Sending message with file:', { filePath, fileName, fileType, content: messageInput.value })
    const success = sendChatMessage(messageInput.value, filePath, fileName, fileType)
    if (success) {
      console.log('✅ Message sent successfully')
      messageInput.value = ''
      selectedFile.value = null
      if (fileInput.value) {
        fileInput.value.value = ''
      }
      await scrollToBottom()
    } else {
      console.error('❌ Failed to send message')
    }
  } catch (err: any) {
    console.error('❌ Error sending message:', err)
    alert(err.message || 'Ошибка при отправке сообщения')
  } finally {
    sending.value = false
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  // Enter без Shift - отправить сообщение
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    if (messageInput.value.trim()) {
      sendMessage()
    }
  }
  // Shift+Enter - разрешить новую строку (ничего не делаем)
}

const handleInput = () => {
  if (isConnected.value) {
    sendTyping()
    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value)
    }
    typingTimeout.value = window.setTimeout(() => {
      sendStopTyping()
    }, 1000)
  }
}

const handleFocus = () => {
  markAsRead()
  if (unreadCount.value > 0) {
    unreadCount.value = 0
    emit('update:unreadCount', 0)
  }
}

const handleBlur = () => {
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
    typingTimeout.value = null
  }
  sendStopTyping()
}

const handleFileClick = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const clearSelectedFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    selectedFile.value = file
    console.log('📎 File selected:', file.name, 'size:', file.size, 'type:', file.type)
    // Кнопка отправки должна стать активной автоматически благодаря :disabled условию
    // Проверяем, что файл действительно выбран
    if (!selectedFile.value) {
      console.error('❌ File not set in selectedFile.value')
    }
  } else {
    console.log('⚠️  No file selected')
    selectedFile.value = null
  }
}

const openImageModal = (imageUrl: string) => {
  modalImageUrl.value = getFileUrl(imageUrl)
  showImageModal.value = true
}

const toggleChat = () => {
  if (!props.isOpen) {
    emit('close')
  }
}

const closeChat = () => {
  emit('close')
}

// Отслеживаем изменение roomId и переподключаемся
let roomIdWatchStop: (() => void) | null = null
let isOpenWatchStop: (() => void) | null = null
let currentTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  // Watch для изменения roomId
  roomIdWatchStop = watch(() => props.roomId, (newRoomId, oldRoomId) => {
    if (oldRoomId && oldRoomId !== newRoomId) {
      // Если roomId изменился, отключаемся от старой комнаты
      disconnect()
      lastRoomId.value = 0
    }
    // Если комната открыта и roomId валидный, подключаемся
    if (props.isOpen && newRoomId > 0) {
      lastRoomId.value = newRoomId
      // Очищаем предыдущий timeout если есть
      if (currentTimeout) {
        clearTimeout(currentTimeout)
      }
      // Небольшая задержка чтобы убедиться что старое соединение закрыто
      currentTimeout = setTimeout(async () => {
        if (props.isOpen && props.roomId === newRoomId) {
          await connect()
        }
        currentTimeout = null
      }, 100)
    }
  }, { immediate: false })
  
  // Watch для изменения isOpen
  isOpenWatchStop = watch(() => props.isOpen, (newVal, oldVal) => {
    // Очищаем предыдущий timeout если есть
    if (currentTimeout) {
      clearTimeout(currentTimeout)
      currentTimeout = null
    }
    
    // Если значение не изменилось при первом запуске, не делаем ничего
    if (newVal === oldVal && oldVal === undefined) {
      return
    }
    
    if (newVal && props.roomId > 0) {
      console.log('Chat opening, roomId:', props.roomId, 'oldVal:', oldVal)
      
      // Проверяем, не подключены ли уже к этой комнате
      const alreadyConnected = isConnected.value
      const isSameRoom = lastRoomId.value === props.roomId
      
      if (alreadyConnected && isSameRoom && messages.value.length > 0) {
        console.log('✅ Already connected to this room with messages, just scrolling to bottom')
        markAsRead()
        if (unreadCount.value > 0) {
          unreadCount.value = 0
          emit('update:unreadCount', 0)
        }
        // Просто скроллим вниз, не переподключаемся
        nextTick().then(() => {
          scrollToBottom(true)
          setTimeout(() => {
            scrollToBottom(true)
          }, 100)
        })
        return
      }
      
      // Сохраняем roomId для следующей проверки
      lastRoomId.value = props.roomId
      
      // Если не подключены или подключены к другой комнате - подключаемся
      currentTimeout = setTimeout(async () => {
        // Проверяем что чат все еще должен быть открыт
        if (props.isOpen && props.roomId > 0) {
          console.log('Connecting to room:', props.roomId)
          await connect()
          markAsRead()
          if (unreadCount.value > 0) {
            unreadCount.value = 0
            emit('update:unreadCount', 0)
          }
          // Скроллим вниз после подключения и загрузки сообщений
          await nextTick()
          scrollToBottom(true)
          setTimeout(() => {
            scrollToBottom(true)
          }, 300)
        } else {
          console.warn('Cannot connect: isOpen=', props.isOpen, 'roomId=', props.roomId)
        }
        currentTimeout = null
      }, 300)
    } else if (!newVal && oldVal !== undefined) {
      // Закрываем только если значение действительно изменилось с true на false
      console.log('Chat closing, but keeping connection alive...', 'oldVal:', oldVal, 'newVal:', newVal)
      // НЕ отключаемся от WebSocket - оставляем соединение открытым для быстрого открытия
      // disconnect() // Закомментировано - не отключаемся при закрытии чата
    }
  }, { immediate: false })
  
  // Если чат уже открыт при монтировании, подключаемся
  if (props.isOpen && props.roomId > 0) {
    console.log('Chat already open on mount, checking connection...')
    lastRoomId.value = props.roomId
    
    // Проверяем, не подключены ли уже
    const alreadyConnected = isConnected.value
    const hasMessages = messages.value.length > 0
    
    if (alreadyConnected && hasMessages) {
      console.log('✅ Already connected with messages, just scrolling to bottom')
      nextTick().then(() => {
        scrollToBottom(true)
        setTimeout(() => {
          scrollToBottom(true)
        }, 100)
      })
    } else {
      console.log('Connecting to room on mount...')
      currentTimeout = setTimeout(async () => {
        if (props.isOpen && props.roomId > 0) {
          await connect()
          // Скроллим вниз после подключения
          await nextTick()
          scrollToBottom(true)
          setTimeout(() => {
            scrollToBottom(true)
          }, 300)
        }
        currentTimeout = null
      }, 100)
    }
  }
})

onBeforeUnmount(() => {
  // Очищаем timeout
  if (currentTimeout) {
    clearTimeout(currentTimeout)
    currentTimeout = null
  }
  
  // Останавливаем watchers
  if (roomIdWatchStop) {
    roomIdWatchStop()
    roomIdWatchStop = null
  }
  if (isOpenWatchStop) {
    isOpenWatchStop()
    isOpenWatchStop = null
  }
  
  // Отключаемся от WebSocket
  disconnect()
})

watch(messages, (newMessages, oldMessages) => {
  // Если это первая загрузка сообщений (история), скроллим вниз
  const isInitialLoad = !oldMessages || oldMessages.length === 0
  // Скроллим если это новое сообщение или первая загрузка
  if (isInitialLoad || newMessages.length > (oldMessages?.length || 0)) {
    // Для первой загрузки используем force=true чтобы убедиться что скролл произошел
    scrollToBottom(isInitialLoad)
  }
  // Update unread count if chat is closed and new message from other user
  if (!props.isOpen && newMessages.length > (oldMessages?.length || 0)) {
    const lastMessage = newMessages[newMessages.length - 1]
    if (lastMessage && !isCurrentUser(lastMessage.user_id)) {
      unreadCount.value++
      emit('update:unreadCount', unreadCount.value)
    }
  }
}, { deep: true })

onUnmounted(() => {
  // Очищаем timeout
  if (currentTimeout) {
    clearTimeout(currentTimeout)
    currentTimeout = null
  }
  
  // Останавливаем watchers (если еще не остановлены в onBeforeUnmount)
  if (roomIdWatchStop) {
    roomIdWatchStop()
    roomIdWatchStop = null
  }
  if (isOpenWatchStop) {
    isOpenWatchStop()
    isOpenWatchStop = null
  }
  
  // Отключаемся от WebSocket
  disconnect()
  
  // Очищаем typing timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
    typingTimeout.value = null
  }
})
</script>

<style scoped>
.chat-widget {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 380px;
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transform: translateY(100%);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
  pointer-events: none;
}

.chat-widget.is-open {
  transform: translateY(0);
  opacity: 1;
  pointer-events: all;
}

.chat-widget-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.chat-widget-header :deep(.n-text) {
  color: white;
}

.chat-widget-header :deep(.n-icon) {
  color: white;
  cursor: pointer;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d9d9d9;
  display: inline-block;
}

.status-indicator.is-online {
  background: #18a058;
}

.unread-badge {
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.chat-widget-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-loading,
.chat-error,
.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 8px;
}

.chat-messages {
  display: flex;
  flex-direction: column; /* Обычный порядок - старые сверху, новые внизу */
  gap: 12px;
}

.chat-message {
  display: flex;
  flex-direction: column;
}

.chat-message.is-own {
  align-items: flex-end;
}

.chat-message:not(.is-own) {
  align-items: flex-start;
}

.message-content {
  max-width: 75%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-message.is-own .message-content {
  align-items: flex-end;
}

.message-sender {
  margin-bottom: 4px;
}

.message-bubble {
  padding: 8px 12px;
  border-radius: 12px;
  background: #f5f5f5;
  word-wrap: break-word;
}

.chat-message.is-own .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-message:not(.is-own) .message-bubble {
  background: #f5f5f5;
  color: #333;
}

.message-file {
  margin-bottom: 8px;
}

.message-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
}

.message-audio {
  width: 100%;
  max-width: 300px;
}

.edited-label {
  font-style: italic;
  margin-top: 4px;
}

.message-time {
  font-size: 11px;
  margin-top: 2px;
}

.chat-typing {
  padding: 8px;
  font-style: italic;
}

.chat-widget-footer {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-file-info {
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
}

.chat-input {
  width: 100%;
}

.chat-actions {
  display: flex;
  justify-content: flex-end;
}

/* Scrollbar styling */
.chat-widget-body::-webkit-scrollbar {
  width: 6px;
}

.chat-widget-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-widget-body::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.chat-widget-body::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Анимация для индикатора печати */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Модальное окно для изображений */
.image-modal-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.modal-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
