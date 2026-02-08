import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMailingApi } from '@/composables/useMailingApi'

export const useMailingStore = defineStore('mailing', () => {
  const unreadCount = ref(0)
  const mailingApi = useMailingApi()

  const refreshUnreadCount = async () => {
    try {
      const count = await mailingApi.getUnreadCount()
      unreadCount.value = count
    } catch (err) {
      console.error('Failed to refresh unread count:', err)
    }
  }

  const setUnreadCount = (count: number) => {
    unreadCount.value = count
  }

  const decrementUnreadCount = () => {
    if (unreadCount.value > 0) {
      unreadCount.value--
    }
  }

  return {
    unreadCount,
    refreshUnreadCount,
    setUnreadCount,
    decrementUnreadCount
  }
})

