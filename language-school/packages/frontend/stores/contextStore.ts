import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface ContextGroup {
  id: number
  name: string
  course_name?: string
  [key: string]: unknown // для хранения полных данных групп (students_count, progress и т.д.)
}

export const useContextStore = defineStore('context', () => {
  const selectedGroupId = ref<number | null>(null)
  const availableGroups = ref<ContextGroup[]>([])
  const isLoading = ref(false)

  // Инициализация из localStorage для сохранения контекста при перезагрузке
  if (import.meta.client) {
    const saved = localStorage.getItem('selected_group_id')
    if (saved) {
      selectedGroupId.value = parseInt(saved)
    }
  }

  // Следим за изменением ID и сохраняем
  watch(selectedGroupId, (newId) => {
    if (import.meta.client) {
      if (newId) {
        localStorage.setItem('selected_group_id', newId.toString())
      } else {
        localStorage.removeItem('selected_group_id')
      }
    }
  })

  const setGroups = (groups: ContextGroup[]) => {
    availableGroups.value = groups
    // Если текущая выбранная группа не входит в новый список, сбрасываем или выбираем первую
    if (selectedGroupId.value && !groups.find(g => g.id === selectedGroupId.value)) {
      selectedGroupId.value = groups.length > 0 ? groups[0].id : null
    } else if (!selectedGroupId.value && groups.length > 0) {
      selectedGroupId.value = groups[0].id
    }
  }

  const setSelectedGroup = (id: number | null) => {
    selectedGroupId.value = id
  }

  const clearContext = () => {
    selectedGroupId.value = null
    availableGroups.value = []
  }

  return {
    selectedGroupId,
    availableGroups,
    isLoading,
    setGroups,
    setSelectedGroup,
    clearContext
  }
})
