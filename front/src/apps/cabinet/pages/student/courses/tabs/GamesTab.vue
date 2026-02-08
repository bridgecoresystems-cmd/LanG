<template>
  <div class="games-tab">
    <n-card bordered>
      <div v-if="gamesLoading" class="loading-container">
        <n-spin size="medium" />
      </div>

      <n-empty v-else-if="!activeGames.length" :description="$t('cabinet.games.noGames') || 'Игр пока нет'" />

      <n-data-table
        v-else
        :columns="columns"
        :data="activeGames"
        :pagination="{ pageSize: 10 }"
        :row-props="rowProps"
        class="games-table"
      />
    </n-card>

    <!-- Game Player Modal -->
    <n-modal
      v-model:show="showGamePlayer"
      preset="card"
      :style="activeGame?.game_type === 'sprint' ? 'width: 600px; max-width: 95vw;' : (activeGame?.game_type === 'memory' ? 'width: 700px; max-width: 95vw;' : 'width: 800px; max-width: 95vw;')"
      :title="activeGame?.title"
      :on-after-leave="resetGameState"
      :closable="!isSprintRunning"
      :mask-closable="!isSprintRunning"
    >
      <!-- Results View (Shared) -->
      <div v-if="gameFinished" class="game-results">
        <n-result
          :status="gameStats.percentage >= 70 ? 'success' : 'warning'"
          :title="activeGame?.game_type === 'sprint' ? $t('cabinet.games.sprintFinished') : (activeGame?.game_type === 'memory' ? $t('cabinet.games.memoryFinished') : $t('cabinet.games.gameFinished'))"
          :description="activeGame?.game_type === 'sprint' 
            ? `${$t('cabinet.games.yourScore')}: ${gameStats.correct} ${$t('cabinet.games.sprintResultCorrect')}. ${$t('cabinet.games.sprintResultStreak')}: ${gameStats.bestStreak}`
            : activeGame?.game_type === 'memory'
            ? `${$t('cabinet.games.memoryResult')}: ${gameStats.correct} ${$t('cabinet.games.memoryPairs')}. ${$t('cabinet.games.memoryTime')}: ${formatTime(memoryTime.value)}. ${$t('cabinet.games.memoryMoves')}: ${memoryMoves.value}`
            : `${$t('cabinet.games.yourScore')}: ${gameStats.correct} ${$t('cabinet.grades.of')} ${gameStats.total}`"
        >
          <template #footer>
            <n-space vertical align="center">
              <n-text depth="3">
                {{ activeGame?.game_type === 'sprint' ? `${$t('cabinet.games.sprintResultTotal')}: ${gameStats.total}` : (activeGame?.game_type === 'memory' ? `${$t('cabinet.games.correctPercentage')}: ${gameStats.percentage}%` : `${$t('cabinet.games.correctPercentage')}: ${gameStats.percentage}%`) }}
              </n-text>
              <n-space>
                <n-button type="primary" @click="restartGame">
                  {{ $t('cabinet.games.tryAgain') }}
                </n-button>
                <n-button @click="showGamePlayer = false">
                  {{ $t('cabinet.games.exit') }}
                </n-button>
              </n-space>
            </n-space>
          </template>
        </n-result>
      </div>

      <!-- Sprint Game UI -->
      <div v-else-if="activeGame?.game_type === 'sprint'" class="sprint-container">
        <div v-if="!isSprintRunning && !gameFinished" class="sprint-start">
          <n-space vertical align="center" size="large">
            <n-text depth="3" align="center">
              {{ $t('cabinet.games.sprintStartDesc') }}
            </n-text>
            <n-button type="primary" size="large" round @click="startSprint">
              {{ $t('cabinet.games.sprintStartBtn') }}
            </n-button>
          </n-space>
        </div>

        <div v-else class="sprint-active">
          <!-- Timer and Score Header -->
          <div class="sprint-header">
            <div class="sprint-timer" :class="{ 'timer-low': sprintTime <= 5 }">
              {{ sprintTime }}с
            </div>
            <div class="sprint-streak">
              🔥 {{ $t('cabinet.games.sprintStreak') }}: {{ currentStreak }}
            </div>
          </div>

          <!-- Question Card -->
          <div 
            class="sprint-card" 
            :class="{ 
              'flash-green': feedbackType === 'correct', 
              'flash-red': feedbackType === 'wrong',
              'shake': feedbackType === 'wrong'
            }"
          >
            <transition name="fade-slide" mode="out-in">
              <div :key="currentSprintIdx" class="sprint-question">
                <div class="word-main">{{ currentSprintItem?.word }}</div>
                <div class="divider">это</div>
                <div class="word-trans">{{ currentSprintItem?.translation }}?</div>
              </div>
            </transition>
          </div>

          <!-- Controls -->
          <div class="sprint-controls">
            <n-button 
              type="error" 
              size="large" 
              class="sprint-btn"
              :disabled="!isSprintRunning || !currentSprintItem || feedbackType !== null"
              @click="handleSprintAnswer(false)"
            >
              {{ $t('cabinet.games.sprintIncorrect') }}
              <template #suffix><n-icon><arrow-left-icon /></n-icon></template>
            </n-button>
            <n-button 
              type="success" 
              size="large" 
              class="sprint-btn"
              :disabled="!isSprintRunning || !currentSprintItem || feedbackType !== null"
              @click="handleSprintAnswer(true)"
            >
              {{ $t('cabinet.games.sprintCorrect') }}
              <template #suffix><n-icon><arrow-right-icon /></n-icon></template>
            </n-button>
          </div>
          <div class="sprint-hint">
            {{ $t('cabinet.games.sprintHint') }}
          </div>
        </div>
      </div>

      <!-- Memory Game UI -->
      <div v-else-if="activeGame?.game_type === 'memory'" class="memory-game-container">
        <div v-if="!memoryGameStarted && !gameFinished" class="memory-start">
          <n-space vertical align="center" size="large">
            <n-text depth="3" align="center">
              {{ $t('cabinet.games.memoryStartDesc') }}
            </n-text>
            <n-button type="primary" size="large" round @click="startMemoryGame">
              {{ $t('cabinet.games.memoryStartBtn') }}
            </n-button>
          </n-space>
        </div>

        <div v-else-if="!gameFinished" class="memory-active">
          <!-- Timer and Moves Counter -->
          <div class="memory-header">
            <div class="memory-timer">
              ⏱️ {{ $t('cabinet.games.memoryTime') }}: {{ formatTime(memoryTime) }}
            </div>
            <div class="memory-moves">
              🎯 {{ $t('cabinet.games.memoryMoves') }}: {{ memoryMoves }}
            </div>
          </div>

          <!-- Cards Grid -->
          <div class="memory-grid" :style="{ gridTemplateColumns: `repeat(${memoryGridCols}, 1fr)` }">
            <div
              v-for="card in memoryCards"
              :key="card.id"
              class="memory-card"
              :class="{
                'flipped': card.isFlipped,
                'matched': card.isMatched,
                'disabled': card.isFlipped || card.isMatched || memoryFlipping
              }"
              @click="flipCard(card)"
            >
              <div class="card-inner">
                <div class="card-front">
                  <n-icon size="48" color="#999">
                    <question-icon />
                  </n-icon>
                </div>
                <div class="card-back">
                  <div class="card-content">{{ card.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Matching Game UI (Original) -->
      <div v-else class="matching-game-container">
        <n-grid :cols="2" :x-gap="24">
          <n-gi>
            <n-space vertical size="medium">
              <n-text depth="3" align="center">{{ $t('cabinet.games.dragWord') }}</n-text>
              <div 
                v-for="item in leftWords" 
                :key="item.id"
                class="draggable-item word-item"
                :class="{ 'dragging': draggingId === item.id, 'matched': item.matched }"
                draggable="true"
                @dragstart="onDragStart($event, item.id)"
                @dragend="onDragEnd"
              >
                {{ item.word }}
              </div>
            </n-space>
          </n-gi>
          <n-gi>
            <n-space vertical size="medium">
              <n-text depth="3" align="center">{{ $t('cabinet.games.dropTargets') }}</n-text>
              <div 
                v-for="item in rightWords" 
                :key="item.id"
                class="drop-zone"
                :class="{ 
                  'active': draggingId !== null,
                  'correct': showFeedback && item.matched && matches[item.id] === item.correctId,
                  'incorrect': showFeedback && item.matched && matches[item.id] !== item.correctId
                }"
                @dragover.prevent
                @dragenter.prevent="dragOverId = item.id"
                @dragleave="dragOverId = null"
                @drop="onDrop($event, item.id)"
              >
                <div class="target-label">{{ item.translation }}</div>
                <div v-if="matches[item.id]" class="matched-word">
                  {{ getWordById(matches[item.id]) }}
                </div>
                <div v-else class="empty-drop">{{ $t('cabinet.games.dragHere') }}</div>
              </div>
            </n-space>
          </n-gi>
        </n-grid>
      </div>

      <template #footer v-if="!gameFinished && activeGame?.game_type !== 'sprint' && activeGame?.game_type !== 'memory'">
        <n-space justify="center" align="center">
          <n-button 
            type="primary" 
            size="large" 
            :disabled="!allMatched" 
            @click="checkResults"
          >
            {{ $t('cabinet.games.checkAnswers') }}
          </n-button>
          <n-button quaternary circle @click="restartGame">
            <template #icon><n-icon><refresh-icon /></n-icon></template>
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NSpace, NCard, NIcon, NSpin, NEmpty, NButton, NModal, NGrid, NGi, 
  NResult, NText, NDataTable, NTag, useMessage
} from 'naive-ui'
import {
  PlayOutline as PlayIcon,
  RefreshOutline as RefreshIcon,
  CheckmarkCircleOutline as DoneIcon,
  ArrowBackOutline as ArrowLeftIcon,
  ArrowForwardOutline as ArrowRightIcon
} from '@vicons/ionicons5'
import axios from 'axios'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const message = useMessage()
const groupId = route.params.id

// Games state
const games = ref<any[]>([])
const gamesLoading = ref(false)
const showGamePlayer = ref(false)

const activeGames = computed(() => games.value.filter(g => g.is_active))

// Game Play state
const activeGame = ref<any>(null)
const leftWords = ref<any[]>([])
const rightWords = ref<any[]>([])
const matches = ref<Record<string, string>>({}) // translationId -> wordId
const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const showFeedback = ref(false)
const gameFinished = ref(false)
const gameStats = ref({ correct: 0, total: 0, percentage: 0, bestStreak: 0 })

// Sprint specific state
const sprintSession = ref<any[]>([])
const currentSprintIdx = ref(0)
const sprintTime = ref(30)
const isSprintRunning = ref(false)
const currentStreak = ref(0)
const feedbackType = ref<string | null>(null)
const currentSprintItem = computed(() => sprintSession.value[currentSprintIdx.value])
let sprintTimer: any = null

// Memory specific state
const memoryCards = ref<any[]>([])
const memoryGameStarted = ref(false)
const memoryTime = ref(0)
const memoryMoves = ref(0)
const memoryFlipping = ref(false)
const flippedCards = ref<any[]>([])
let memoryTimer: any = null
const memoryGridCols = computed(() => {
  const count = memoryCards.value.length
  if (count <= 8) return 3
  if (count <= 12) return 4
  return 4
})

const columns = computed(() => [
  {
    title: t('cabinet.games.gameTitle'),
    key: 'title',
    render(row: any) {
      return h(NSpace, { vertical: true, size: 0 }, {
        default: () => [
          h(NText, { strong: true }, { default: () => row.title }),
          h(NSpace, { size: 'small', align: 'center' }, {
            default: () => [
              h(NTag, { 
                size: 'tiny', 
                round: true, 
                type: row.game_type === 'sprint' ? 'warning' : (row.game_type === 'memory' ? 'success' : 'info') 
              }, { 
                default: () => {
                  if (row.game_type === 'sprint') return t('cabinet.games.sprint')
                  if (row.game_type === 'memory') return t('cabinet.games.memory')
                  return t('cabinet.games.matching')
                }
              }),
              h(NText, { depth: 3, style: 'font-size: 12px;' }, { default: () => row.lesson_title || t('cabinet.games.additional') })
            ]
          })
        ]
      })
    }
  },
  {
    title: t('cabinet.games.status'),
    key: 'is_played',
    render(row: any) {
      const isPlayed = row.is_played
      return h(NTag, {
        type: isPlayed ? 'success' : 'info',
        size: 'small',
        round: true
      }, { 
        default: () => isPlayed ? t('cabinet.games.played') : t('cabinet.games.new'),
        icon: () => isPlayed ? h(NIcon, null, { default: () => h(DoneIcon) }) : null
      })
    }
  },
  {
    title: '',
    key: 'actions',
    width: 120,
    render(row: any) {
      return h(NButton, {
        type: 'primary',
        size: 'small',
        round: true,
        onClick: () => playGame(row)
      }, {
        default: () => t('cabinet.games.play'),
        icon: () => h(NIcon, null, { default: () => h(PlayIcon) })
      })
    }
  }
])

const loadGames = async () => {
  gamesLoading.value = true
  try {
    const res = await axios.get(`/api/v1/courses/games/?group_id=${groupId}`)
    games.value = Array.isArray(res.data) ? res.data : res.data.results || []
  } catch (err) {
    console.error('Error loading games:', err)
  } finally {
    gamesLoading.value = false
  }
}

// Game Play Logic
const playGame = (game: any) => {
  activeGame.value = game
  restartGame()
  showGamePlayer.value = true
}

const rowProps = (row: any) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => playGame(row)
  }
}

const restartGame = async () => {
  if (!activeGame.value) return
  
  showFeedback.value = false
  gameFinished.value = false
  
  if (activeGame.value.game_type === 'sprint') {
    isSprintRunning.value = false
    currentStreak.value = 0
    currentSprintIdx.value = 0
    sprintTime.value = 30
    gameStats.value = { correct: 0, total: 0, percentage: 0, bestStreak: 0 }
    
    // Fetch session data
    try {
      const res = await axios.get(`/api/v1/courses/games/${activeGame.value.id}/sprint_session/`)
      sprintSession.value = res.data
    } catch (err) {
      message.error('Не удалось загрузить данные спринта')
    }
  } else if (activeGame.value.game_type === 'memory') {
    memoryGameStarted.value = false
    memoryTime.value = 0
    memoryMoves.value = 0
    memoryFlipping.value = false
    flippedCards.value = []
    memoryCards.value = []
    if (memoryTimer) {
      clearInterval(memoryTimer)
      memoryTimer = null
    }
    
    // Fetch memory cards
    try {
      const res = await axios.get(`/api/v1/courses/games/${activeGame.value.id}/memory_cards/`)
      memoryCards.value = res.data.map((card: any) => ({
        ...card,
        isFlipped: false,
        isMatched: false
      }))
    } catch (err) {
      message.error('Не удалось загрузить карточки памяти')
    }
  } else {
    // Matching logic
    const pairs = activeGame.value.data
    leftWords.value = pairs.map((p: any, idx: number) => ({ id: `w_${idx}`, word: p.word, matched: false }))
    rightWords.value = pairs.map((p: any, idx: number) => ({ id: `t_${idx}`, translation: p.translation, correctId: `w_${idx}`, matched: false }))
    rightWords.value = [...rightWords.value].sort(() => Math.random() - 0.5)
    matches.value = {}
    draggingId.value = null
    dragOverId.value = null
  }
}

// Sprint Game Functions
const startSprint = () => {
  if (!sprintSession.value || sprintSession.value.length === 0) {
    message.error('Слова для игры еще не загружены или отсутствуют')
    return
  }
  isSprintRunning.value = true
  window.addEventListener('keydown', handleKeydown)
  
  sprintTimer = setInterval(() => {
    sprintTime.value--
    if (sprintTime.value <= 0) {
      endSprint()
    }
  }, 1000)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!isSprintRunning.value || feedbackType.value) return
  if (e.key === 'ArrowLeft') handleSprintAnswer(false)
  if (e.key === 'ArrowRight') handleSprintAnswer(true)
}

const handleSprintAnswer = (answer: boolean) => {
  // Добавляем максимально строгую проверку всех состояний перед доступом к данным
  if (
    !isSprintRunning.value || 
    gameFinished.value || 
    feedbackType.value !== null || 
    !currentSprintItem.value
  ) {
    return
  }
  
  const isCorrect = answer === currentSprintItem.value.is_correct
  
  feedbackType.value = isCorrect ? 'correct' : 'wrong'
  gameStats.value.total++
  
  if (isCorrect) {
    gameStats.value.correct++
    currentStreak.value++
    if (currentStreak.value > gameStats.value.bestStreak) {
      gameStats.value.bestStreak = currentStreak.value
    }
  } else {
    currentStreak.value = 0
  }
  
  setTimeout(() => {
    // Если за время анимации (300мс) игра закончилась, ничего не делаем
    if (!isSprintRunning.value) return
    
    feedbackType.value = null
    nextSprintQuestion()
  }, 300)
}

const nextSprintQuestion = () => {
  if (currentSprintIdx.value < sprintSession.value.length - 1) {
    currentSprintIdx.value++
  } else {
    // End if we ran out of words (rare)
    endSprint()
  }
}

const endSprint = async () => {
  clearInterval(sprintTimer)
  isSprintRunning.value = false
  window.removeEventListener('keydown', handleKeydown)
  
  // Calculate final percentage for sprint
  // For sprint, we can treat accuracy as score, or just successful completion if they saw enough words
  const total = gameStats.value.total
  const correct = gameStats.value.correct
  gameStats.value.percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  
  // Register play on backend if they actually played (at least 5 words seen)
  if (total >= 5) {
    try {
      await axios.post(`/api/v1/courses/games/${activeGame.value.id}/play/`, {
        score: gameStats.value.percentage
      })
      await loadGames() // Refresh to show "Done" status
    } catch (err: any) {
      console.error('Error registering sprint play:', err)
    }
  }
  
  gameFinished.value = true
}

// Original Matching Functions
const onDragStart = (event: DragEvent, id: string) => {
  draggingId.value = id
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', id)
    event.dataTransfer.effectAllowed = 'move'
  }
}

const onDragEnd = () => {
  draggingId.value = null
  dragOverId.value = null
}

const onDrop = (event: DragEvent, translationId: string) => {
  const wordId = event.dataTransfer?.getData('text/plain')
  if (!wordId) return
  Object.keys(matches.value).forEach(tId => {
    if (matches.value[tId] === wordId) {
      delete matches.value[tId]
      const target = rightWords.value.find(rw => rw.id === tId)
      if (target) target.matched = false
    }
  })
  matches.value[translationId] = wordId
  const target = rightWords.value.find(rw => rw.id === translationId)
  if (target) target.matched = true
  const source = leftWords.value.find(lw => lw.id === wordId)
  if (source) source.matched = true
  draggingId.value = null
  dragOverId.value = null
}

const getWordById = (id: string) => leftWords.value.find(w => w.id === id)?.word || ''
const allMatched = computed(() => Object.keys(matches.value).length === leftWords.value.length)

const checkResults = async () => {
  showFeedback.value = true
  let correctCount = 0
  rightWords.value.forEach(rw => {
    if (matches.value[rw.id] === rw.correctId) correctCount++
  })
  const total = rightWords.value.length
  gameStats.value = { ...gameStats.value, correct: correctCount, total: total, percentage: Math.round((correctCount / total) * 100) }
  
  // Register play on backend if percentage is high enough
  if (gameStats.value.percentage >= 70) {
    try {
      const res = await axios.post(`/api/v1/courses/games/${activeGame.value.id}/play/`, {
        score: gameStats.value.percentage
      })
      message.success('Результат успешно сохранен!')
      await loadGames() // Refresh to show "Done" status
    } catch (err: any) {
      console.error('Error registering play:', err)
      message.error('Не удалось сохранить результат: ' + (err.response?.data?.error || err.message))
    }
  }

  setTimeout(() => { gameFinished.value = true }, 1500)
}

// Memory Game Functions
const startMemoryGame = () => {
  memoryGameStarted.value = true
  memoryTime.value = 0
  memoryMoves.value = 0
  
  // Start timer
  memoryTimer = setInterval(() => {
    memoryTime.value++
  }, 1000)
}

const flipCard = (card: any) => {
  if (card.isFlipped || card.isMatched || memoryFlipping.value || flippedCards.value.length >= 2) {
    return
  }
  
  card.isFlipped = true
  flippedCards.value.push(card)
  memoryMoves.value++
  
  if (flippedCards.value.length === 2) {
    memoryFlipping.value = true
    checkMemoryMatch()
  }
}

const checkMemoryMatch = () => {
  const [card1, card2] = flippedCards.value
  
  if (card1.matchId === card2.matchId) {
    // Match found!
    setTimeout(() => {
      card1.isMatched = true
      card2.isMatched = true
      flippedCards.value = []
      memoryFlipping.value = false
      
      // Check win condition
      if (memoryCards.value.every(c => c.isMatched)) {
        endMemoryGame()
      }
    }, 500)
  } else {
    // No match, flip back
    setTimeout(() => {
      card1.isFlipped = false
      card2.isFlipped = false
      flippedCards.value = []
      memoryFlipping.value = false
    }, 1000)
  }
}

const endMemoryGame = async () => {
  if (memoryTimer) {
    clearInterval(memoryTimer)
    memoryTimer = null
  }
  
  // Calculate score (percentage based on time and moves)
  const totalPairs = memoryCards.value.length / 2
  const optimalMoves = totalPairs * 2
  const timeBonus = Math.max(0, 300 - memoryTime.value) // Max 5 minutes
  const movesBonus = Math.max(0, optimalMoves - memoryMoves.value) * 10
  const score = Math.min(100, 50 + Math.floor((timeBonus + movesBonus) / 10))
  
  gameStats.value = {
    correct: totalPairs,
    total: totalPairs,
    percentage: score,
    bestStreak: 0
  }
  gameFinished.value = true
  
  // Register play on backend
  if (score >= 50) {
    try {
      await axios.post(`/api/v1/courses/games/${activeGame.value.id}/play/`, {
        score: score
      })
      await loadGames()
    } catch (err: any) {
      console.error('Error registering memory play:', err)
    }
  }
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const resetGameState = () => {
  activeGame.value = null
  leftWords.value = []
  rightWords.value = []
  matches.value = {}
  showFeedback.value = false
  gameFinished.value = false
  clearInterval(sprintTimer)
  if (memoryTimer) {
    clearInterval(memoryTimer)
    memoryTimer = null
  }
  window.removeEventListener('keydown', handleKeydown)
}

onMounted(() => {
  loadGames()
})

onUnmounted(() => {
  clearInterval(sprintTimer)
  if (memoryTimer) {
    clearInterval(memoryTimer)
  }
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.games-table :deep(.n-data-table-tr) {
  cursor: pointer;
}

/* Matching Game Styles */
.matching-game-container {
  padding: 20px;
  background-color: #f9f9fb;
  border-radius: 12px;
}

.draggable-item {
  padding: 12px 20px;
  background-color: white;
  border: 2px solid #efeff5;
  border-radius: 8px;
  cursor: grab;
  text-align: center;
  font-weight: 500;
  transition: all 0.2s;
  user-select: none;
}

.draggable-item:hover {
  border-color: #18a058;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.draggable-item.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.draggable-item.matched {
  background-color: #f0fdf4;
  border-color: #18a058;
  color: #18a058;
  cursor: default;
}

.drop-zone {
  min-height: 80px;
  padding: 12px;
  background-color: white;
  border: 2px dashed #efeff5;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  position: relative;
}

.drop-zone.active {
  border-color: #18a058;
  background-color: #f0fdf4;
}

.drop-zone.correct {
  border-color: #18a058;
  background-color: #f0fdf4;
  border-style: solid;
}

.drop-zone.incorrect {
  border-color: #d03050;
  background-color: #fef2f2;
  border-style: solid;
}

.target-label {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.matched-word {
  padding: 6px 16px;
  background-color: #18a058;
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
  animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.empty-drop {
  font-size: 0.8rem;
  color: #aaa;
}

/* Sprint Game Styles */
.sprint-container {
  padding: 20px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #f0f2f5;
  border-radius: 16px;
}

.sprint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.sprint-timer {
  font-size: 2.5rem;
  font-weight: 800;
  color: #18a058;
  background: white;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.timer-low {
  color: #d03050;
  animation: pulse 1s infinite;
}

.sprint-streak {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f0a020;
}

.sprint-card {
  background: white;
  border-radius: 24px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  margin-bottom: 40px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: 4px solid transparent;
}

.word-main {
  font-size: 3rem;
  font-weight: 800;
  color: #333;
  margin-bottom: 10px;
}

.divider {
  font-size: 1.2rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 10px 0;
}

.word-trans {
  font-size: 2.5rem;
  font-weight: 600;
  color: #18a058;
}

.sprint-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.sprint-btn {
  height: 80px !important;
  font-size: 1.5rem !important;
  font-weight: 800 !important;
  border-radius: 20px !important;
}

.sprint-hint {
  text-align: center;
  margin-top: 20px;
  color: #999;
  font-size: 0.9rem;
}

.flash-green {
  border-color: #18a058 !important;
  background-color: #f0fdf4 !important;
}

.flash-red {
  border-color: #d03050 !important;
  background-color: #fef2f2 !important;
}

.shake {
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes pop {
  0% { transform: scale(0.8); }
  100% { transform: scale(1); }
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.game-results {
  padding: 40px 0;
}

/* Memory Game Styles */
.memory-game-container {
  padding: 20px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  border-radius: 16px;
}

.memory-start {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.memory-active {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.memory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.memory-timer,
.memory-moves {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.memory-grid {
  display: grid;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.memory-card {
  aspect-ratio: 1;
  perspective: 1000px;
  cursor: pointer;
}

.memory-card.disabled {
  cursor: not-allowed;
}

.memory-card.matched {
  opacity: 0.5;
  pointer-events: none;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.memory-card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.card-front {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-back {
  background: white;
  color: #333;
  transform: rotateY(180deg);
  border: 2px solid #18a058;
}

.memory-card.matched .card-back {
  border-color: #18a058;
  background: #f0fdf4;
  animation: pulse 0.5s ease-in-out;
}

.card-content {
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  padding: 8px;
  word-break: break-word;
}

.memory-card:hover:not(.disabled):not(.matched) .card-front {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

@keyframes pulse {
  0%, 100% { transform: rotateY(180deg) scale(1); }
  50% { transform: rotateY(180deg) scale(1.1); }
}

@media (max-width: 768px) {
  .memory-grid {
    gap: 8px;
    padding: 8px;
  }
  
  .card-content {
    font-size: 1rem;
  }
}
</style>
