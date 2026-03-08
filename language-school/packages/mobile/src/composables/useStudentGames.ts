import { ref } from 'vue'
import { api } from './useApi'

export function useStudentGames() {
  const games = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchGames(groupId: number) {
    loading.value = true
    error.value = null
    try {
      const data = await api.cabinet.games(groupId)
      games.value = data || []
    } catch (e: any) {
      error.value = e?.message || 'Failed to load games'
    } finally {
      loading.value = false
    }
  }

  async function playGame(gameId: number, score: number) {
    try {
      await api.cabinet.playGame(gameId, score)
    } catch (e: any) {
      console.error('Failed to save game score', e)
    }
  }

  return { games, loading, error, fetchGames, playGame }
}
