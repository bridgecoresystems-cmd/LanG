import { ref } from 'vue'
import { api } from './useApi'

export interface GemsTransaction {
  id: number
  amount: string
  type: string
  comment: string | null
  createdAt: string | null
  senderId: string | null
  receiverId: string | null
}

export function useGems() {
  const balance = ref<number>(0)
  const transactions = ref<GemsTransaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBalance() {
    loading.value = true
    error.value = null
    try {
      const data = await api.cabinet.gems.wallet()
      balance.value = data?.balance ?? 0
    } catch (e: unknown) {
      error.value = (e as Error)?.message || 'Failed to load gems balance'
    } finally {
      loading.value = false
    }
  }

  async function fetchTransactions() {
    try {
      const data = await api.cabinet.gems.transactions()
      transactions.value = (data as GemsTransaction[]) || []
    } catch { /* ignore */ }
  }

  return { balance, transactions, loading, error, fetchBalance, fetchTransactions }
}
