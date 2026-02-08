import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface Wallet {
  id: number
  balance: string
  weekly_limit: string
  updated_at: string
}

export const usePointsStore = defineStore('points', () => {
  const wallet = ref<Wallet | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchMyWallet = async () => {
    loading.value = true
    try {
      const response = await axios.get('/api/v1/points/wallets/me/')
      wallet.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching wallet'
      console.error('Points Store Error:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    wallet,
    loading,
    error,
    fetchMyWallet
  }
})
