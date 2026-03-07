import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type UserRole = 'STUDENT' | 'PARENT'

export interface MobileUser {
  id: string
  name: string
  email: string
  role: UserRole
  schoolId: string
  avatarUrl?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<MobileUser | null>(null)
  const token = ref<string | null>(localStorage.getItem('lang_mobile_token'))

  const isLoggedIn = computed(() => !!user.value && !!token.value)
  const isStudent = computed(() => user.value?.role === 'STUDENT')
  const isParent = computed(() => user.value?.role === 'PARENT')

  function setUser(userData: MobileUser, authToken: string) {
    user.value = userData
    token.value = authToken
    localStorage.setItem('lang_mobile_token', authToken)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('lang_mobile_token')
  }

  return { user, token, isLoggedIn, isStudent, isParent, setUser, logout }
})
