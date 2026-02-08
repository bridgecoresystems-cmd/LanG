import { onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { usePointsStore } from '@/stores/pointsStore'
import { useMessage, useNotification } from 'naive-ui'

export function useNotifications() {
  const authStore = useAuthStore()
  const pointsStore = usePointsStore()
  const message = useMessage()
  const notification = useNotification()
  const socket = ref<WebSocket | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (!authStore.accessToken) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host === 'localhost:5173' ? 'localhost:8000' : window.location.host
    const wsUrl = `${protocol}//${host}/ws/notifications/?token=${authStore.accessToken}`

    socket.value = new WebSocket(wsUrl)

    socket.value.onopen = () => {
      console.log('Django Notifications WebSocket connected')
      reconnectAttempts.value = 0
    }

    socket.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleNotification(data)
      } catch (err) {
        console.error('Error parsing notification message:', err)
      }
    }

    socket.value.onclose = (e) => {
      console.log('Django Notifications WebSocket closed', e.reason)
      if (reconnectAttempts.value < maxReconnectAttempts && authStore.isAuthenticated) {
        setTimeout(() => {
          reconnectAttempts.value++
          connect()
        }, 3000)
      }
    }

    socket.value.onerror = (err) => {
      console.error('Django Notifications WebSocket error:', err)
      socket.value?.close()
    }
  }

  const handleNotification = (data: any) => {
    const { type, payload } = data

    switch (type) {
      case 'BALANCE_UPDATE':
        if (pointsStore.wallet) {
          pointsStore.wallet.balance = payload.new_balance.toString()
        }
        notification.success({
          title: 'Баланс обновлен',
          content: payload.text || `Ваш баланс: ${payload.new_balance} 💎`,
          duration: 5000
        })
        break
      
      case 'system':
        notification.info({
          title: 'Системное уведомление',
          content: typeof payload === 'string' ? payload : JSON.stringify(payload),
          duration: 10000
        })
        break

      default:
        console.log('Unknown notification type:', type, payload)
    }
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
  }

  onMounted(() => {
    if (authStore.isAuthenticated) {
      connect()
    }
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect
  }
}

