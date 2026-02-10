import { ref } from 'vue'
import { useEden } from './useEden'

/**
 * WebSocket composable for contact messages real-time updates.
 * - Admin: receives new_message when someone submits the form
 * - Public: receives message_approved when admin approves a message
 */
export function useContactWs(channel: 'admin' | 'public', onMessage: (data: any) => void) {
  const api = useEden()
  let wsClient: any = null
  const connected = ref(false)

  const connect = () => {
    if (typeof window === 'undefined') return
    
    wsClient = api.api.v1.ws.subscribe({
      query: { channel }
    })

    wsClient.on('open', () => {
      connected.value = true
    })

    wsClient.on('message', (event: any) => {
      onMessage(event.data)
    })

    wsClient.on('close', () => {
      connected.value = false
      // Eden subscribe often handles reconnection or you can trigger it manually
      setTimeout(connect, 3000)
    })

    wsClient.on('error', () => {
      wsClient?.close()
    })
  }

  const disconnect = () => {
    wsClient?.close()
    wsClient = null
  }

  return { connect, disconnect, connected }
}
