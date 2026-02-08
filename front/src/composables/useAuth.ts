import { useAuthStore } from '@/stores/authStore'
import { onMounted } from 'vue'

export const useAuth = () => {
  const store = useAuthStore()

  // Initialize auth on mount if token exists
  onMounted(() => {
    if (store.accessToken && !store.user) {
      store.initializeAuth()
    }
  })

  return store
}

