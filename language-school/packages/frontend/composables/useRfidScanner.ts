import { ref, onUnmounted, type Ref } from 'vue'

// Must match SCANNER_TOKEN in the Arduino sketch and RFID_SCANNER_TOKEN on the server.
const SCANNER_TOKEN = 'LANG_RFID_001'
const POLL_INTERVAL_MS = 1000
const SCAN_TIMEOUT_MS = 30_000

export function useRfidScanner(rfidRef: Ref<string>) {
  const config = useRuntimeConfig()
  const API = config.public.apiBase as string

  const scanning = ref(false)
  const scanError = ref<string | null>(null)

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null

  async function startScan() {
    if (scanning.value) {
      stopScan()
      return
    }

    scanError.value = null

    // Clear any leftover scan from previous session
    await $fetch(`${API}/terminal/rfid-scan`, {
      method: 'DELETE',
      query: { scannerToken: SCANNER_TOKEN },
    }).catch(() => {})

    scanning.value = true

    pollTimer = setInterval(async () => {
      try {
        const data = await $fetch<{ uid: string | null }>(`${API}/terminal/rfid-scan`, {
          query: { scannerToken: SCANNER_TOKEN },
        })
        if (data.uid) {
          rfidRef.value = data.uid
          await $fetch(`${API}/terminal/rfid-scan`, {
            method: 'DELETE',
            query: { scannerToken: SCANNER_TOKEN },
          }).catch(() => {})
          stopScan()
        }
      } catch (_) {}
    }, POLL_INTERVAL_MS)

    // Auto-cancel after timeout
    timeoutTimer = setTimeout(() => {
      scanError.value = 'Время ожидания истекло. Поднесите браслет ближе и попробуйте снова.'
      stopScan()
    }, SCAN_TIMEOUT_MS)
  }

  function stopScan() {
    scanning.value = false
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
    if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null }
  }

  onUnmounted(stopScan)

  return { scanning, scanError, startScan, stopScan }
}
