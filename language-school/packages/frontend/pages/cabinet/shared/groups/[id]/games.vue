<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Игры и викторины</h1>
        <p class="text-gray-500">Интерактивные задания для закрепления материала</p>
      </div>
      <UButton
        v-if="isTeacher"
        label="Создать игру"
        icon="i-heroicons-plus"
        color="primary"
        @click="isModalOpen = true"
      />
    </div>

    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <USkeleton v-for="i in 3" :key="i" class="h-48 rounded-2xl" />
    </div>

    <div v-else-if="games.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="game in games"
        :key="game.id"
        class="hover:shadow-xl transition-all duration-300 group overflow-hidden"
      >
        <div class="space-y-4">
          <div class="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl w-fit">
            <UIcon :name="getGameIcon(game.type)" class="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          
          <div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-white">{{ game.title }}</h3>
            <UBadge variant="soft" color="gray" class="mt-1">
              {{ translateType(game.type) }}
            </UBadge>
          </div>

          <div class="pt-4">
            <UButton
              label="Запустить игру"
              block
              color="primary"
              icon="i-heroicons-play-circle"
              @click="playGame(game)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <div v-else class="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl ring-1 ring-gray-200 dark:ring-gray-800">
      <UIcon name="i-heroicons-puzzle-piece" class="w-16 h-16 text-gray-300 mb-4 mx-auto" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Игр пока нет</h3>
      <p class="text-gray-500">Здесь будут появляться интересные задания от вашего учителя.</p>
    </div>

    <!-- Модалка создания игры (заглушка) -->
    <UModal v-model="isModalOpen">
      <UCard>
        <template #header>
          <h3 class="font-bold">Создать новую игру</h3>
        </template>
        <div class="p-4 space-y-4">
          <UFormGroup label="Название">
            <UInput v-model="newGame.title" placeholder="Напр. Спряжение глаголов" />
          </UFormGroup>
          <UFormGroup label="Тип игры">
            <USelect v-model="newGame.type" :options="gameTypes" />
          </UFormGroup>
          <div class="flex justify-end gap-2 pt-4">
            <UButton color="gray" variant="ghost" label="Отмена" @click="isModalOpen = false" />
            <UButton color="primary" label="Создать" @click="createGame" :loading="saving" />
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCabinetGroups } from '~/composables/useCabinetGroups'
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ 
  layout: 'cabinet', 
  middleware: 'cabinet-auth' 
})

const route = useRoute()
const groupId = computed(() => parseInt(route.params.id as string))
const groupsApi = useCabinetGroups()
const authStore = useAuthStore()

const isTeacher = computed(() => authStore.user?.role === 'TEACHER')
const games = ref<any[]>([])
const pending = ref(true)
const isModalOpen = ref(false)
const saving = ref(false)

const newGame = ref({
  title: '',
  type: 'quiz',
  group_id: groupId.value
})

const gameTypes = [
  { label: 'Викторина (Quiz)', value: 'quiz' },
  { label: 'Карточки (Flashcards)', value: 'flashcards' },
  { label: 'Поиск слов', value: 'word-search' }
]

const loadGames = async () => {
  pending.value = true
  try {
    const data = await groupsApi.getGames(groupId.value)
    games.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    pending.value = false
  }
}

const getGameIcon = (type: string) => {
  switch (type) {
    case 'quiz': return 'i-heroicons-list-bullet'
    case 'flashcards': return 'i-heroicons-square-2-stack'
    case 'word-search': return 'i-heroicons-magnifying-glass'
    default: return 'i-heroicons-puzzle-piece'
  }
}

const translateType = (type: string) => {
  const types: any = {
    quiz: 'Викторина',
    flashcards: 'Карточки',
    'word-search': 'Поиск слов'
  }
  return types[type] || type
}

const createGame = async () => {
  saving.value = true
  try {
    await groupsApi.saveGame(newGame.value)
    await loadGames()
    isModalOpen.value = false
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const playGame = (game: any) => {
  // Логика запуска игры
  alert(`Запуск игры: ${game.title}`)
}

loadGames()
</script>
