import { ref } from 'vue'
import axios from 'axios'
import { usePointsStore } from '@/stores/pointsStore'
import { storeToRefs } from 'pinia'

export interface Transaction {
  id: number
  sender: number
  receiver: number
  sender_info: any
  receiver_info: any
  amount: string
  transaction_type: string
  comment: string
  timestamp: string
}

export function usePoints() {
  const pointsStore = usePointsStore()
  const { wallet, loading, error } = storeToRefs(pointsStore)
  const transactions = ref<Transaction[]>([])

  const fetchMyWallet = pointsStore.fetchMyWallet

  const fetchTransactions = async () => {
    loading.value = true
    try {
      const response = await axios.get('/api/v1/points/transactions/')
      transactions.value = Array.isArray(response.data) ? response.data : response.data.results || []
      return transactions.value
    } catch (err: any) {
      console.error('Error fetching transactions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const transferPoints = async (receiverId: number, amount: number, comment: string = '') => {
    loading.value = true
    try {
      const response = await axios.post('/api/v1/points/transfer/', {
        receiver_id: receiverId,
        amount,
        comment
      })
      // Update the global balance from the response
      if (response.data.new_balance !== undefined) {
        pointsStore.updateBalance(response.data.new_balance)
      } else {
        await fetchMyWallet()
      }
      return response.data
    } catch (err: any) {
      console.error('Error transferring points:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    wallet,
    transactions,
    fetchMyWallet,
    fetchTransactions,
    transferPoints
  }
}
