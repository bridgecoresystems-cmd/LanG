import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface ContextGroup {
  id: number
  name: string
  course_name?: string
  [key: string]: unknown // для хранения полных данных групп (students_count, progress и т.д.)
}

export interface ContextChild {
  id: string
  username: string
  first_name?: string | null
  last_name?: string | null
  full_name: string
  avatar?: string | null
}

export const useContextStore = defineStore('context', () => {
  const selectedGroupId = ref<number | null>(null)
  const availableGroups = ref<ContextGroup[]>([])
  const isLoading = ref(false)

  // Parent-specific state
  const selectedChildId = ref<string | null>(null)
  const availableChildren = ref<ContextChild[]>([])
  const childGroups = ref<ContextGroup[]>([])

  // Инициализация из localStorage для сохранения контекста при перезагрузке
  if (import.meta.client) {
    const saved = localStorage.getItem('selected_group_id')
    if (saved) {
      selectedGroupId.value = parseInt(saved)
    }
    const savedChild = localStorage.getItem('selected_child_id')
    if (savedChild) {
      selectedChildId.value = savedChild
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

  watch(selectedChildId, (newId) => {
    if (import.meta.client) {
      if (newId) {
        localStorage.setItem('selected_child_id', newId)
      } else {
        localStorage.removeItem('selected_child_id')
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

  // Parent: set available children list
  const setChildren = (children: ContextChild[]) => {
    availableChildren.value = children
    // Auto-select first child if none selected or selected one not in list
    if (selectedChildId.value && !children.find(c => c.id === selectedChildId.value)) {
      selectedChildId.value = children.length > 0 ? children[0].id : null
    } else if (!selectedChildId.value && children.length > 0) {
      selectedChildId.value = children[0].id
    }
  }

  const setSelectedChild = (id: string | null) => {
    selectedChildId.value = id
    // Reset child groups when child changes
    childGroups.value = []
    selectedGroupId.value = null
  }

  // Parent: set child's groups (loaded after child selection)
  const setChildGroups = (groups: ContextGroup[]) => {
    childGroups.value = groups
    // Auto-select first group if none selected
    if (!selectedGroupId.value && groups.length > 0) {
      selectedGroupId.value = groups[0].id
    } else if (selectedGroupId.value && !groups.find(g => g.id === selectedGroupId.value)) {
      selectedGroupId.value = groups.length > 0 ? groups[0].id : null
    }
  }

  const clearContext = () => {
    selectedGroupId.value = null
    availableGroups.value = []
    selectedChildId.value = null
    availableChildren.value = []
    childGroups.value = []
  }

  return {
    selectedGroupId,
    availableGroups,
    isLoading,
    setGroups,
    setSelectedGroup,
    clearContext,
    // Parent-specific
    selectedChildId,
    availableChildren,
    childGroups,
    setChildren,
    setSelectedChild,
    setChildGroups,
  }
})
