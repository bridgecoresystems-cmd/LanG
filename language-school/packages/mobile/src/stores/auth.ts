import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/composables/useApi'

export type UserRole =
  | 'STUDENT' | 'PARENT' | 'TEACHER' | 'HEAD_TEACHER'
  | 'DIRECTOR' | 'GEN_DIRECTOR' | 'SUPERUSER'
  | 'ACCOUNTANT' | 'HEAD_ACCOUNTANT' | 'SALES' | 'RECEPTIONIST'

export interface MobileUser {
  id: string
  username: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role: UserRole
  school_id: number | null
  parent_id: string | null
  avatar: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<MobileUser | null>(
    (() => {
      try {
        const raw = localStorage.getItem('lang_mobile_user')
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    })()
  )

  const isLoggedIn = computed(() => !!user.value)
  const isStudent = computed(() => user.value?.role === 'STUDENT')
  const isParent = computed(() => user.value?.role === 'PARENT')

  const fullName = computed(() => {
    if (!user.value) return ''
    const { first_name, last_name, username } = user.value
    return [first_name, last_name].filter(Boolean).join(' ') || username
  })

  async function login(username: string, password: string) {
    const data = await api.auth.login({ username, password })
    const u = data.user as unknown as MobileUser
    user.value = u
    localStorage.setItem('lang_mobile_user', JSON.stringify(u))
    return u
  }

  async function fetchProfile() {
    const data = await api.cabinet.profile()
    const u = data as unknown as MobileUser
    user.value = u
    localStorage.setItem('lang_mobile_user', JSON.stringify(u))
    return u
  }

  async function logout() {
    try { await api.auth.logout() } catch { /* ignore */ }
    user.value = null
    localStorage.removeItem('lang_mobile_user')
  }

  return { user, isLoggedIn, isStudent, isParent, fullName, login, fetchProfile, logout }
})
