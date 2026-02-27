function cabinetFetch<T>(path: string, opts?: { method?: string; body?: any }): Promise<T> {
  return $fetch<T>(path, {
    credentials: 'include',
    method: opts?.method || 'GET',
    body: opts?.body,
  })
}

export const useStudentGames = () => {
  const getGames = async (groupId: number) => {
    return cabinetFetch<any[]>(`/api/v1/cabinet/student/groups/${groupId}/games`)
  }

  const playGame = async (gameId: number, score: number) => {
    return cabinetFetch<{ success: boolean; score: number }>(`/api/v1/cabinet/student/games/${gameId}/play`, {
      method: 'POST',
      body: { score },
    })
  }

  return { getGames, playGame }
}
