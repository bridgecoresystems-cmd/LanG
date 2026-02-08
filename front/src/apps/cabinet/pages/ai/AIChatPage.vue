<template>
  <CabinetLayout>
    <div class="ai-chat-container">
      <n-card class="chat-card" bordered :segmented="{ content: true, footer: true }">
        <template #header>
          <n-space align="center">
            <n-avatar round size="medium" style="background-color: #18a058">
              <n-icon><robot-icon /></n-icon>
            </n-avatar>
            <div>
              <n-text strong>{{ $t('cabinet.ai.assistantTitle') || 'LanG AI Помощник' }}</n-text>
              <br />
              <n-text depth="3" style="font-size: 12px">
                {{ isConnected ? 'Онлайн' : 'Подключение...' }}
              </n-text>
            </div>
          </n-space>
        </template>

        <div class="messages-area" ref="messagesRef">
          <n-empty v-if="messages.length === 0 && !loading" description="Задайте любой вопрос по учебе!" />
          
          <div v-for="msg in messages" :key="msg.id" :class="['message-wrapper', msg.user_id === aiUserId ? 'ai' : 'user']">
            <div class="message-bubble">
              <n-text v-if="msg.user_id === aiUserId" class="markdown-body">
                <div v-html="renderMarkdown(msg.content)"></div>
              </n-text>
              <n-text v-else>{{ msg.content }}</n-text>
              <div class="message-time">{{ formatTime(msg.created_at) }}</div>
            </div>
          </div>

          <!-- Стриминг текущего ответа AI -->
          <div v-if="isStreaming" class="message-wrapper ai">
            <div class="message-bubble">
              <n-text class="markdown-body">
                <div v-html="renderMarkdown(streamingText)"></div>
              </n-text>
              <n-spin size="small" style="margin-left: 8px" />
            </div>
          </div>

          <!-- Индикатор печати -->
          <div v-if="isTyping" class="message-wrapper ai">
            <div class="message-bubble typing">
              <n-ellipsis style="max-width: 40px">...</n-ellipsis>
            </div>
          </div>
        </div>

        <template #footer>
          <n-input-group>
            <n-input
              v-model:value="inputValue"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 4 }"
              placeholder="Введите сообщение..."
              @keypress.enter.prevent="sendMessage"
              :disabled="isStreaming"
            />
            <n-button type="primary" :disabled="!inputValue.trim() || isStreaming" @click="sendMessage">
              <template #icon>
                <n-icon><send-icon /></n-icon>
              </template>
            </n-button>
          </n-input-group>
        </template>
      </n-card>
    </div>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import CabinetLayout from '@/apps/cabinet/layouts/CabinetLayout.vue'
import { 
  NCard, NSpace, NAvatar, NText, NIcon, NEmpty, NInput, NInputGroup, NButton, NSpin, NEllipsis 
} from 'naive-ui'
import { 
  HardwareChipOutline as RobotIcon,
  SendOutline as SendIcon
} from '@vicons/ionicons5'
import axios from 'axios'
import { marked } from 'marked'

const authStore = useAuthStore()
const messages = ref<any[]>([])
const inputValue = ref('')
const loading = ref(true)
const messagesRef = ref<HTMLElement | null>(null)
const socket = ref<WebSocket | null>(null)
const isConnected = ref(false)
const isTyping = ref(false)
const isStreaming = ref(false)
const streamingText = ref('')
const roomId = ref<number | null>(null)
const aiUserId = 32 // Тот самый ID, который мы создали

const renderMarkdown = (text: string) => {
  return marked(text)
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const loadHistory = async () => {
  try {
    const roomRes = await axios.get('/api/v1/chat/rooms/ai_room/')
    roomId.value = roomRes.data.id
    
    const msgRes = await axios.get(`/api/v1/chat/messages/?room=${roomId.value}`)
    messages.value = msgRes.data
    scrollToBottom()
  } catch (err) {
    console.error('Failed to load chat history:', err)
  } finally {
    loading.value = false
  }
}

const connectWebSocket = () => {
  if (!roomId.value) return

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  // Чат сервис работает на порту 3001
  const host = window.location.hostname
  const wsUrl = `${protocol}//${host}:3001/ws/chat/${roomId.value}/?token=${authStore.accessToken}`

  socket.value = new WebSocket(wsUrl)

  socket.value.onopen = () => {
    isConnected.value = true
    console.log('AI Chat Connected')
  }

  socket.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    if (data.type === 'message') {
      messages.value.push(data.message)
      isStreaming.value = false
      streamingText.value = ''
      scrollToBottom()
    } else if (data.type === 'typing' && data.user_id === aiUserId) {
      isTyping.value = true
      scrollToBottom()
    } else if (data.type === 'stop_typing' && data.user_id === aiUserId) {
      isTyping.value = false
    } else if (data.type === 'ai_stream_start') {
      isStreaming.value = true
      streamingText.value = ''
      isTyping.value = false
      scrollToBottom()
    } else if (data.type === 'ai_stream_chunk') {
      streamingText.value += data.chunk
      scrollToBottom()
    }
  }

  socket.value.onclose = () => {
    isConnected.value = false
    setTimeout(connectWebSocket, 3000)
  }
}

const sendMessage = () => {
  if (!inputValue.value.trim() || !socket.value || isStreaming.value) return

  const msg = {
    type: 'message',
    content: inputValue.value
  }

  socket.value.send(JSON.stringify(msg))
  inputValue.value = ''
}

onMounted(async () => {
  await loadHistory()
  connectWebSocket()
})

onUnmounted(() => {
  if (socket.value) socket.value.close()
})
</script>

<style scoped>
.ai-chat-container {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.chat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-wrapper {
  display: flex;
  width: 100%;
}

.message-wrapper.user {
  justify-content: flex-end;
}

.message-wrapper.ai {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  position: relative;
}

.user .message-bubble {
  background-color: #18a058;
  color: white;
  border-bottom-right-radius: 2px;
}

.ai .message-bubble {
  background-color: #f3f3f5;
  color: #333;
  border-bottom-left-radius: 2px;
}

.message-time {
  font-size: 10px;
  opacity: 0.6;
  margin-top: 4px;
  text-align: right;
}

.typing {
  padding: 8px 16px;
}

/* Markdown styling */
:deep(.markdown-body) {
  font-size: 14px;
  line-height: 1.6;
}
:deep(.markdown-body p) {
  margin: 0;
}
:deep(.markdown-body code) {
  background-color: rgba(0,0,0,0.05);
  padding: 2px 4px;
  border-radius: 4px;
}
</style>

