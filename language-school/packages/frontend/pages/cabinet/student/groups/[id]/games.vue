<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Игры и викторины</NH1>
        <p class="page-header__subtitle">Интерактивные задания для закрепления материала</p>
      </div>
    </header>

    <div v-if="pending" class="games-loading">
      <NSpin size="large" />
    </div>

    <NCard v-else-if="games.length > 0" bordered class="games-card" :content-style="{ padding: 0 }">
      <div class="games-table-scroll">
        <NDataTable
          :columns="columns"
          :data="games"
          :bordered="true"
          :single-line="false"
          size="small"
          :row-props="rowProps"
          :row-key="(row) => row.id"
          class="games-data-table clickable-rows"
        />
      </div>
    </NCard>

    <div v-else class="empty-state">
      <NEmpty description="Игр пока нет">
        <template #icon>
          <NIcon><component :is="PuzzleIcon" /></NIcon>
        </template>
      </NEmpty>
    </div>

    <!-- Game Player Modal -->
    <NModal
      v-model:show="showGamePlayer"
      preset="card"
      :style="modalStyle"
      :title="activeGame?.title"
      :on-after-leave="resetGameState"
      :closable="!isSprintRunning"
      :mask-closable="!isSprintRunning"
    >
      <!-- Results View -->
      <div v-if="gameFinished" class="game-results">
        <NResult
          :status="gameStats.percentage >= 70 ? 'success' : 'warning'"
          :title="resultTitle"
          :description="resultDescription"
        >
          <template #footer>
            <NSpace vertical align="center">
              <NSpace>
                <NButton type="primary" @click="restartGame">Играть снова</NButton>
                <NButton @click="showGamePlayer = false">Выйти</NButton>
              </NSpace>
            </NSpace>
          </template>
        </NResult>
      </div>

      <!-- Sprint Game UI -->
      <div v-else-if="activeGame?.game_type === 'sprint'" class="sprint-container">
        <div v-if="!isSprintRunning && !gameFinished" class="sprint-start">
          <NSpace vertical align="center" size="large">
            <NText depth="3" align="center">
              Нажмите «Старт» — 30 секунд. Стрелки ← / → для ответа (верно / неверно).
            </NText>
            <NButton type="primary" size="large" round @click="startSprint">
              Старт
            </NButton>
          </NSpace>
        </div>

        <div v-else class="sprint-active">
          <div class="sprint-header">
            <div class="sprint-timer" :class="{ 'timer-low': sprintTime <= 5 }">{{ sprintTime }}с</div>
            <div class="sprint-streak">🔥 Серия: {{ currentStreak }}</div>
          </div>

          <div
            class="sprint-card"
            :class="{
              'flash-green': feedbackType === 'correct',
              'flash-red': feedbackType === 'wrong',
              shake: feedbackType === 'wrong',
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

          <div class="sprint-controls">
            <NButton
              type="error"
              size="large"
              class="sprint-btn"
              :disabled="!isSprintRunning || !currentSprintItem || feedbackType !== null"
              @click="handleSprintAnswer(false)"
            >
              Неверно
              <template #suffix><NIcon><ArrowBackOutline /></NIcon></template>
            </NButton>
            <NButton
              type="success"
              size="large"
              class="sprint-btn"
              :disabled="!isSprintRunning || !currentSprintItem || feedbackType !== null"
              @click="handleSprintAnswer(true)"
            >
              Верно
              <template #suffix><NIcon><ArrowForwardOutline /></NIcon></template>
            </NButton>
          </div>
          <div class="sprint-hint">Стрелки ← / → на клавиатуре</div>
        </div>
      </div>

      <!-- Memory Game UI -->
      <div v-else-if="activeGame?.game_type === 'memory'" class="memory-game-container">
        <div v-if="!memoryGameStarted && !gameFinished" class="memory-start">
          <NSpace vertical align="center" size="large">
            <NText depth="3" align="center">
              Найдите пары: слово — перевод. Кликайте по карточкам.
            </NText>
            <NButton type="primary" size="large" round @click="startMemoryGame">
              Старт
            </NButton>
          </NSpace>
        </div>

        <div v-else-if="!gameFinished" class="memory-active">
          <div class="memory-header">
            <div class="memory-timer">⏱️ Время: {{ formatTime(memoryTime) }}</div>
            <div class="memory-moves">🎯 Ходов: {{ memoryMoves }}</div>
          </div>

          <div class="memory-grid" :style="{ gridTemplateColumns: `repeat(${memoryGridCols}, 1fr)` }">
            <div
              v-for="card in memoryCards"
              :key="card.id"
              class="memory-card"
              :class="{
                flipped: card.isFlipped,
                matched: card.isMatched,
                disabled: card.isFlipped || card.isMatched || memoryFlipping,
              }"
              @click="flipCard(card)"
            >
              <div class="card-inner">
                <div class="card-front">
                  <NIcon size="48" color="#999">
                    <component :is="HelpCircleOutline" />
                  </NIcon>
                </div>
                <div class="card-back">
                  <div class="card-content">{{ card.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Matching Game UI -->
      <div v-else class="matching-game-container">
        <NGrid :cols="2" :x-gap="24">
          <NGi>
            <NSpace vertical size="medium">
              <NText depth="3" align="center">Перетащите слово</NText>
              <div
                v-for="item in leftWords"
                :key="item.id"
                class="draggable-item word-item"
                :class="{ dragging: draggingId === item.id, matched: item.matched }"
                draggable="true"
                @dragstart="onDragStart($event, item.id)"
                @dragend="onDragEnd"
              >
                {{ item.word }}
              </div>
            </NSpace>
          </NGi>
          <NGi>
            <NSpace vertical size="medium">
              <NText depth="3" align="center">На перевод</NText>
              <div
                v-for="item in rightWords"
                :key="item.id"
                class="drop-zone"
                :class="{
                  active: draggingId !== null,
                  correct: showFeedback && item.matched && matches[item.id] === item.correctId,
                  incorrect: showFeedback && item.matched && matches[item.id] !== item.correctId,
                }"
                @dragover.prevent
                @dragenter.prevent="dragOverId = item.id"
                @dragleave="dragOverId = null"
                @drop="onDrop($event, item.id)"
              >
                <div class="target-label">{{ item.translation }}</div>
                <div v-if="matches[item.id]" class="matched-word">{{ getWordById(matches[item.id]) }}</div>
                <div v-else class="empty-drop">Перетащите сюда</div>
              </div>
            </NSpace>
          </NGi>
        </NGrid>
      </div>

      <template #footer v-if="!gameFinished && activeGame?.game_type !== 'sprint' && activeGame?.game_type !== 'memory'">
        <NSpace justify="center" align="center">
          <NButton type="primary" size="large" :disabled="!allMatched" @click="checkResults">
            Проверить
          </NButton>
          <NButton quaternary circle @click="restartGame">
            <template #icon><NIcon><RefreshOutline /></NIcon></template>
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted, onUnmounted } from 'vue'
import {
  NH1,
  NIcon,
  NEmpty,
  NSpin,
  NCard,
  NDataTable,
  NTag,
  NModal,
  NButton,
  NResult,
  NSpace,
  NText,
  NGrid,
  NGi,
  useMessage,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import {
  GameControllerOutline as PuzzleIcon,
  PlayOutline as PlayIcon,
  CheckmarkCircleOutline as DoneIcon,
  ArrowBackOutline,
  ArrowForwardOutline,
  RefreshOutline,
  HelpCircleOutline,
} from '@vicons/ionicons5'
import { useStudentGames } from '~/composables/useStudentGames'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const message = useMessage()
const groupId = computed(() => parseInt(route.params.id as string))
const { getGames, playGame } = useStudentGames()

const games = ref<any[]>([])
const pending = ref(true)
const showGamePlayer = ref(false)
const activeGame = ref<any>(null)

// Matching
const leftWords = ref<any[]>([])
const rightWords = ref<any[]>([])
const matches = ref<Record<string, string>>({})
const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const showFeedback = ref(false)
const gameFinished = ref(false)
const gameStats = ref({ correct: 0, total: 0, percentage: 0, bestStreak: 0 })

// Sprint
const sprintSession = ref<{ word: string; translation: string; is_correct: boolean }[]>([])
const currentSprintIdx = ref(0)
const sprintTime = ref(30)
const isSprintRunning = ref(false)
const currentStreak = ref(0)
const feedbackType = ref<string | null>(null)
const currentSprintItem = computed(() => sprintSession.value[currentSprintIdx.value])
let sprintTimer: ReturnType<typeof setInterval> | null = null

// Memory
const memoryCards = ref<{ id: string; content: string; matchId: string; isFlipped: boolean; isMatched: boolean }[]>([])
const memoryGameStarted = ref(false)
const memoryTime = ref(0)
const memoryMoves = ref(0)
const memoryFlipping = ref(false)
const flippedCards = ref<any[]>([])
let memoryTimer: ReturnType<typeof setInterval> | null = null
const memoryGridCols = computed(() => {
  const count = memoryCards.value.length
  if (count <= 8) return 3
  if (count <= 12) return 4
  return 4
})

const modalStyle = computed(() => {
  const t = activeGame.value?.game_type
  if (t === 'sprint') return 'width: 600px; max-width: 95vw;'
  if (t === 'memory') return 'width: 700px; max-width: 95vw;'
  return 'width: 800px; max-width: 95vw;'
})

const resultTitle = computed(() => {
  const t = activeGame.value?.game_type
  if (t === 'sprint') return 'Спринт завершён'
  if (t === 'memory') return 'Память завершена'
  return 'Игра завершена'
})

const resultDescription = computed(() => {
  const t = activeGame.value?.game_type
  const s = gameStats.value
  if (t === 'sprint')
    return `Правильно: ${s.correct}. Серия: ${s.bestStreak}. Процент: ${s.percentage}%`
  if (t === 'memory')
    return `Пар: ${s.correct}. Время: ${formatTime(memoryTime.value)}. Ходов: ${memoryMoves.value}`
  return `Правильно: ${s.correct} из ${s.total} (${s.percentage}%)`
})

const columns: DataTableColumns<any> = [
  {
    title: 'Игра',
    key: 'title',
    render(row) {
      return h(NSpace, { vertical: true, size: 0 }, {
        default: () => [
          h(NText, { strong: true }, { default: () => row.title }),
          h(NSpace, { size: 'small', align: 'center' }, {
            default: () => [
              h(NTag, {
                size: 'tiny',
                round: true,
                type: row.game_type === 'sprint' ? 'warning' : row.game_type === 'memory' ? 'success' : 'info',
              }, {
                default: () => {
                  if (row.game_type === 'sprint') return 'Спринт'
                  if (row.game_type === 'memory') return 'Память'
                  return 'Сопоставление'
                },
              }),
              h(NText, { depth: 3, style: 'font-size: 12px;' }, {
                default: () => row.lesson_title || 'Дополнительно',
              }),
            ],
          }),
        ],
      })
    },
  },
  {
    title: 'Статус',
    key: 'is_played',
    width: 120,
    render(row) {
      return h(
        NTag,
        { type: row.is_played ? 'success' : 'info', size: 'small', round: true },
        {
          default: () => (row.is_played ? 'Сыграно' : 'Новая'),
          icon: () => (row.is_played ? h(NIcon, null, { default: () => h(DoneIcon) }) : null),
        }
      )
    },
  },
  {
    title: '',
    key: 'actions',
    width: 120,
    render(row) {
      return h(
        NButton,
        {
          type: 'primary',
          size: 'small',
          round: true,
          onClick: (e: Event) => {
            e.stopPropagation()
            openGame(row)
          },
        },
        { default: () => 'Играть', icon: () => h(NIcon, null, { default: () => h(PlayIcon) }) }
      )
    },
  },
]

const rowProps = (row: any) => ({
  style: 'cursor: pointer;',
  onClick: () => openGame(row),
})

function buildSprintSession(pairs: { word: string; translation: string }[]) {
  if (!pairs?.length) return []
  const allTranslations = pairs.map((p) => p.translation)
  return pairs.map((p) => {
    const isCorrect = Math.random() > 0.5
    let translation = p.translation
    if (!isCorrect && allTranslations.length > 1) {
      const wrong = allTranslations.filter((t) => t !== p.translation)
      translation = wrong[Math.floor(Math.random() * wrong.length)] ?? p.translation
    }
    return { word: p.word, translation, is_correct: isCorrect }
  })
}

function buildMemoryCards(pairs: { word: string; translation: string }[]) {
  if (!pairs?.length) return []
  const cards: { id: string; content: string; matchId: string; isFlipped: boolean; isMatched: boolean }[] = []
  pairs.forEach((p, i) => {
    const matchId = `m_${i}`
    cards.push({ id: `a_${i}`, content: p.word, matchId, isFlipped: false, isMatched: false })
    cards.push({ id: `b_${i}`, content: p.translation, matchId, isFlipped: false, isMatched: false })
  })
  return cards.sort(() => Math.random() - 0.5)
}

const loadGames = async () => {
  pending.value = true
  try {
    games.value = await getGames(groupId.value)
  } catch (e) {
    console.error(e)
    message.error('Не удалось загрузить игры')
  } finally {
    pending.value = false
  }
}

const openGame = (game: any) => {
  activeGame.value = game
  restartGame()
  showGamePlayer.value = true
}

function parseGameData(data: unknown): { word: string; translation: string }[] {
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const restartGame = () => {
  if (!activeGame.value) return
  showFeedback.value = false
  gameFinished.value = false

  const pairs = parseGameData(activeGame.value.data)

  if (activeGame.value.game_type === 'sprint') {
    isSprintRunning.value = false
    currentStreak.value = 0
    currentSprintIdx.value = 0
    sprintTime.value = 30
    gameStats.value = { correct: 0, total: 0, percentage: 0, bestStreak: 0 }
    sprintSession.value = buildSprintSession(pairs)
  } else if (activeGame.value.game_type === 'memory') {
    memoryGameStarted.value = false
    memoryTime.value = 0
    memoryMoves.value = 0
    memoryFlipping.value = false
    flippedCards.value = []
    memoryCards.value = buildMemoryCards(pairs)
    if (memoryTimer) {
      clearInterval(memoryTimer)
      memoryTimer = null
    }
  } else {
    leftWords.value = pairs.map((p: any, idx: number) => ({
      id: `w_${idx}`,
      word: p.word,
      matched: false,
    }))
    rightWords.value = pairs.map((p: any, idx: number) => ({
      id: `t_${idx}`,
      translation: p.translation,
      correctId: `w_${idx}`,
      matched: false,
    }))
    rightWords.value = [...rightWords.value].sort(() => Math.random() - 0.5)
    matches.value = {}
    draggingId.value = null
    dragOverId.value = null
  }
}

const saveScore = async (score: number) => {
  if (!activeGame.value) return
  try {
    await playGame(activeGame.value.id, score)
    await loadGames()
  } catch (e) {
    console.error(e)
    message.error('Не удалось сохранить результат')
  }
}

// Matching
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
  Object.keys(matches.value).forEach((tId) => {
    if (matches.value[tId] === wordId) {
      delete matches.value[tId]
      const target = rightWords.value.find((rw) => rw.id === tId)
      if (target) target.matched = false
    }
  })
  matches.value[translationId] = wordId
  const target = rightWords.value.find((rw) => rw.id === translationId)
  if (target) target.matched = true
  const source = leftWords.value.find((lw) => lw.id === wordId)
  if (source) source.matched = true
  draggingId.value = null
  dragOverId.value = null
}

const getWordById = (id: string) => leftWords.value.find((w) => w.id === id)?.word || ''
const allMatched = computed(() => Object.keys(matches.value).length === leftWords.value.length)

const checkResults = async () => {
  showFeedback.value = true
  let correctCount = 0
  rightWords.value.forEach((rw) => {
    if (matches.value[rw.id] === rw.correctId) correctCount++
  })
  const total = rightWords.value.length
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0
  gameStats.value = { correct: correctCount, total, percentage, bestStreak: 0 }
  if (percentage >= 70) await saveScore(percentage)
  setTimeout(() => {
    gameFinished.value = true
  }, 1500)
}

// Sprint
const startSprint = () => {
  if (!sprintSession.value.length) {
    message.error('Нет данных для спринта')
    return
  }
  isSprintRunning.value = true
  window.addEventListener('keydown', handleKeydown)
  sprintTimer = setInterval(() => {
    sprintTime.value--
    if (sprintTime.value <= 0) endSprint()
  }, 1000)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!isSprintRunning.value || feedbackType.value) return
  if (e.key === 'ArrowLeft') handleSprintAnswer(false)
  if (e.key === 'ArrowRight') handleSprintAnswer(true)
}

const handleSprintAnswer = (answer: boolean) => {
  if (!isSprintRunning.value || gameFinished.value || feedbackType.value !== null || !currentSprintItem.value) return
  const isCorrect = answer === currentSprintItem.value.is_correct
  feedbackType.value = isCorrect ? 'correct' : 'wrong'
  gameStats.value.total++
  if (isCorrect) {
    gameStats.value.correct++
    currentStreak.value++
    if (currentStreak.value > gameStats.value.bestStreak) gameStats.value.bestStreak = currentStreak.value
  } else {
    currentStreak.value = 0
  }
  setTimeout(() => {
    if (!isSprintRunning.value) return
    feedbackType.value = null
    if (currentSprintIdx.value < sprintSession.value.length - 1) {
      currentSprintIdx.value++
    } else {
      endSprint()
    }
  }, 300)
}

const endSprint = async () => {
  if (sprintTimer) clearInterval(sprintTimer)
  sprintTimer = null
  isSprintRunning.value = false
  window.removeEventListener('keydown', handleKeydown)
  const total = gameStats.value.total
  const correct = gameStats.value.correct
  gameStats.value.percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  if (total >= 5) await saveScore(gameStats.value.percentage)
  gameFinished.value = true
}

// Memory
const startMemoryGame = () => {
  memoryGameStarted.value = true
  memoryTime.value = 0
  memoryMoves.value = 0
  memoryTimer = setInterval(() => {
    memoryTime.value++
  }, 1000)
}

const flipCard = (card: any) => {
  if (card.isFlipped || card.isMatched || memoryFlipping.value || flippedCards.value.length >= 2) return
  card.isFlipped = true
  flippedCards.value.push(card)
  memoryMoves.value++
  if (flippedCards.value.length === 2) {
    memoryFlipping.value = true
    const [card1, card2] = flippedCards.value
    if (card1.matchId === card2.matchId) {
      setTimeout(() => {
        card1.isMatched = true
        card2.isMatched = true
        flippedCards.value = []
        memoryFlipping.value = false
        if (memoryCards.value.every((c) => c.isMatched)) endMemoryGame()
      }, 500)
    } else {
      setTimeout(() => {
        card1.isFlipped = false
        card2.isFlipped = false
        flippedCards.value = []
        memoryFlipping.value = false
      }, 1000)
    }
  }
}

const endMemoryGame = async () => {
  if (memoryTimer) {
    clearInterval(memoryTimer)
    memoryTimer = null
  }
  const totalPairs = memoryCards.value.length / 2
  const optimalMoves = totalPairs * 2
  const timeBonus = Math.max(0, 300 - memoryTime.value)
  const movesBonus = Math.max(0, optimalMoves - memoryMoves.value) * 10
  const score = Math.min(100, 50 + Math.floor((timeBonus + movesBonus) / 10))
  gameStats.value = { correct: totalPairs, total: totalPairs, percentage: score, bestStreak: 0 }
  gameFinished.value = true
  if (score >= 50) await saveScore(score)
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
  if (sprintTimer) clearInterval(sprintTimer)
  sprintTimer = null
  if (memoryTimer) {
    clearInterval(memoryTimer)
    memoryTimer = null
  }
  window.removeEventListener('keydown', handleKeydown)
}

onMounted(() => loadGames())

onUnmounted(() => {
  if (sprintTimer) clearInterval(sprintTimer)
  if (memoryTimer) clearInterval(memoryTimer)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.games-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.games-card {
  border-radius: 12px;
}

.games-table-scroll {
  overflow-x: auto;
}

.games-data-table :deep(.n-data-table-tr) {
  cursor: pointer;
}

.empty-state {
  padding: 48px 24px;
  text-align: center;
}

.game-results {
  padding: 40px 0;
}

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
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
}

.empty-drop {
  font-size: 0.8rem;
  color: #aaa;
}

.sprint-container {
  padding: 20px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #f0f2f5;
  border-radius: 16px;
}

.sprint-start,
.memory-start {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
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
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
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
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
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

.memory-game-container {
  padding: 20px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  border-radius: 16px;
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
}

.card-content {
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  padding: 8px;
  word-break: break-word;
}
</style>
