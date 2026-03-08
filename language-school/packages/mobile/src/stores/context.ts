import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface ContextGroup {
  id: number
  name: string
  course_name?: string
  [key: string]: any
}

export const useContextStore = defineStore('context', () => {
  const selectedGroupId = ref<number | null>(
    (() => {
      const saved = localStorage.getItem('selected_group_id')
      return saved ? parseInt(saved) : null
    })()
  )
  const availableGroups = ref<ContextGroup[]>([])
  const isLoading = ref(false)

  watch(selectedGroupId, (newId) => {
    if (newId) {
      localStorage.setItem('selected_group_id', newId.toString())
    } else {
      localStorage.removeItem('selected_group_id')
    }
  })

  const setGroups = (groups: ContextGroup[]) => {
    availableGroups.value = groups
    if (selectedGroupId.value && !groups.find(g => g.id === selectedGroupId.value)) {
      selectedGroupId.value = groups.length > 0 ? groups[0].id : null
    } else if (!selectedGroupId.value && groups.length > 0) {
      selectedGroupId.value = groups[0].id
    }
  }

  const setSelectedGroup = (id: number | null) => {
    selectedGroupId.value = id
  }

  return {
    selectedGroupId,
    availableGroups,
    isLoading,
    setGroups,
    setSelectedGroup
  }
})
