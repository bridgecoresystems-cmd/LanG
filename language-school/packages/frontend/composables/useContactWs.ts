/**
 * WebSocket composable for contact messages real-time updates.
 * - Admin: receives new_message when someone submits the form
 * - Public: receives message_approved when admin approves a message
 */
export function useContactWs(channel: 'admin' | 'public', onMessage: (data: any) => void) {
  const config = useRuntimeConfig()
  const wsUrl = (config.public.wsUrl as string) || 'ws://127.0.0.1:8000'
  let ws: WebSocket | null = null
  const connected = ref(false)

  const connect = () => {
    if (typeof window === 'undefined') return
    const base = wsUrl.startsWith('ws') ? wsUrl : `ws://${wsUrl.replace(/^https?:\/\//, '')}`
    const url = `${base}/api/v1/ws?channel=${channel}`
    ws = new WebSocket(url)

    ws.onopen = () => {
      connected.value = true
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (_) {}
    }

    ws.onclose = () => {
      connected.value = false
      ws = null
      setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws?.close()
    }
  }

  const disconnect = () => {
    ws?.close()
    ws = null
  }

  return { connect, disconnect, connected }
}
