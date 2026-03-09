import { ref } from 'vue'

/**
 * ВРЕМЕННАЯ версия без WebSocket.
 *
 * Раньше здесь открывалось WebSocket‑подключение через Eden Treaty
 * (`/api/v1/ws?channel=admin|public`), но в текущей конфигурации Nuxt/Nitro
 * этот маршрут по `ws://localhost:3000` недоступен, из-за чего в консоли
 * постоянно сыпались ошибки.
 *
 * Сейчас composable оставлен как «заглушка», чтобы:
 * - не падал фронтенд;
 * - интерфейс страниц сообщений продолжал работать на обычных HTTP‑запросах;
 * - было легко вернуть real‑time, когда появится стабильный WS‑прокси.
 */
export function useContactWs(_channel: 'admin' | 'public', _onMessage: (data: any) => void) {
  const connected = ref(false)

  const connect = () => {
    // без WebSocket ничего не делаем
    connected.value = false
  }

  const disconnect = () => {
    // здесь тоже no-op
  }

  return { connect, disconnect, connected }
}
