<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/student/groups/${groupId}`" />
        </ion-buttons>
        <ion-title>{{ game?.title || 'Игра' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding game-player-content">
      <div class="game-player-wrapper">
        <!-- Results View -->
        <div v-if="gameFinished" class="game-results">
          <div class="result-card">
            <div class="result-icon" :class="gameStats.percentage >= 70 ? 'success' : 'warning'">
              <ion-icon :icon="gameStats.percentage >= 70 ? checkmarkCircleOutline : alertCircleOutline" />
            </div>
            <h2 class="result-title">{{ gameStats.percentage >= 70 ? 'Отлично!' : 'Хорошая попытка' }}</h2>
            <p class="result-score">{{ gameStats.percentage }}%</p>
            <div class="result-details">
              <div class="detail-item">
                <span class="detail-label">Правильно</span>
                <span class="detail-value">{{ gameStats.correct }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Всего</span>
                <span class="detail-value">{{ gameStats.total }}</span>
              </div>
              <div v-if="game?.game_type === 'sprint'" class="detail-item">
                <span class="detail-label">Серия</span>
                <span class="detail-value">🔥 {{ gameStats.bestStreak }}</span>
              </div>
            </div>
            <div class="result-actions">
              <ion-button expand="block" @click="restartGame">Играть снова</ion-button>
              <ion-button expand="block" fill="clear" @click="router.back()">Выйти</ion-button>
            </div>
          </div>
        </div>

        <!-- Sprint Game UI -->
        <div v-else-if="game?.game_type === 'sprint'" class="sprint-game">
          <div v-if="!isSprintRunning" class="game-start-screen">
            <div class="game-icon sprint">
              <ion-icon :icon="flashOutline" />
            </div>
            <h1>Спринт</h1>
            <p>У тебя есть 30 секунд, чтобы ответить на как можно больше вопросов!</p>
            <ion-button expand="block" size="large" @click="startSprint">СТАРТ</ion-button>
          </div>

          <div v-else class="game-active">
            <div class="game-header">
              <div class="timer" :class="{ 'low': sprintTime <= 5 }">{{ sprintTime }}</div>
              <div class="streak">🔥 {{ currentStreak }}</div>
            </div>

            <div class="sprint-card" :class="feedbackClass">
              <div v-if="currentSprintItem" class="question-wrap">
                <div class="word-main">{{ currentSprintItem.word }}</div>
                <div class="word-divider">это</div>
                <div class="word-trans">{{ currentSprintItem.translation }}?</div>
              </div>
            </div>

            <div class="game-controls">
              <ion-button class="control-btn wrong" @click="handleSprintAnswer(false)">
                <ion-icon :icon="closeOutline" slot="icon-only" />
              </ion-button>
              <ion-button class="control-btn correct" @click="handleSprintAnswer(true)">
                <ion-icon :icon="checkmarkOutline" slot="icon-only" />
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Memory Game UI -->
        <div v-else-if="game?.game_type === 'memory'" class="memory-game">
          <div v-if="!memoryStarted" class="game-start-screen">
            <div class="game-icon memory">
              <ion-icon :icon="appsOutline" />
            </div>
            <h1>Память</h1>
            <p>Найди все пары слово-перевод как можно быстрее!</p>
            <ion-button expand="block" size="large" @click="startMemory">СТАРТ</ion-button>
          </div>

          <div v-else class="game-active">
            <div class="game-header">
              <div class="timer">{{ formatTime(memoryTime) }}</div>
              <div class="moves">Ходов: {{ memoryMoves }}</div>
            </div>

            <div class="memory-grid">
              <div
                v-for="card in memoryCards"
                :key="card.id"
                class="memory-card"
                :class="{ 'flipped': card.isFlipped, 'matched': card.isMatched }"
                @click="flipCard(card)"
              >
                <div class="card-inner">
                  <div class="card-front">?</div>
                  <div class="card-back">{{ card.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Matching Game UI -->
        <div v-else-if="game?.game_type === 'matching'" class="matching-game">
          <div class="matching-instructions">Соедини слово с его переводом</div>
          <div class="matching-container">
            <div class="words-column">
              <div
                v-for="w in leftWords"
                :key="w.id"
                class="match-item word"
                :class="{ 'selected': selectedWord?.id === w.id, 'matched': w.matched }"
                @click="selectWord(w)"
              >
                {{ w.word }}
              </div>
            </div>
            <div class="trans-column">
              <div
                v-for="t in rightWords"
                :key="t.id"
                class="match-item trans"
                :class="{ 'matched': t.matched }"
                @click="selectTrans(t)"
              >
                {{ t.translation }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon, IonButton
} from '@ionic/vue'
import {
  checkmarkCircleOutline, alertCircleOutline, flashOutline,
  appsOutline, closeOutline, checkmarkOutline
} from 'ionicons/icons'
import { useStudentGames } from '@/composables/useStudentGames'

const route = useRoute()
const router = useRouter()
const groupId = parseInt(route.params.id as string)
const gameId = parseInt(route.params.gameId as string)
const { games, fetchGames, playGame } = useStudentGames()

const game = ref<any>(null)
const gameFinished = ref(false)
const gameStats = ref({ correct: 0, total: 0, percentage: 0, bestStreak: 0 })

// Sprint
const isSprintRunning = ref(false)
const sprintTime = ref(30)
const currentSprintIdx = ref(0)
const sprintSession = ref<any[]>([])
const currentStreak = ref(0)
const feedbackClass = ref('')
let sprintTimer: any = null

const currentSprintItem = computed(() => sprintSession.value[currentSprintIdx.value])

// Memory
const memoryStarted = ref(false)
const memoryTime = ref(0)
const memoryMoves = ref(0)
const memoryCards = ref<any[]>([])
const flippedCards = ref<any[]>([])
const flipping = ref(false)
let memoryTimer: any = null

// Matching
const leftWords = ref<any[]>([])
const rightWords = ref<any[]>([])
const selectedWord = ref<any>(null)

onMounted(async () => {
  await fetchGames(groupId)
  game.value = games.value.find(g => g.id === gameId)
  initGame()
})

onUnmounted(() => {
  clearInterval(sprintTimer)
  clearInterval(memoryTimer)
})

function initGame() {
  if (!game.value) return
  const pairs = typeof game.value.data === 'string' ? JSON.parse(game.value.data) : game.value.data

  if (game.value.game_type === 'sprint') {
    const allTrans = pairs.map((p: any) => p.translation)
    sprintSession.value = pairs.map((p: any) => {
      const isCorrect = Math.random() > 0.5
      let translation = p.translation
      if (!isCorrect && allTrans.length > 1) {
        translation = allTrans.filter((t: any) => t !== p.translation)[Math.floor(Math.random() * (allTrans.length - 1))]
      }
      return { ...p, translation, isCorrect }
    })
  } else if (game.value.game_type === 'memory') {
    const cards: any[] = []
    pairs.forEach((p: any, i: number) => {
      cards.push({ id: `w-${i}`, content: p.word, matchId: i, isFlipped: false, isMatched: false })
      cards.push({ id: `t-${i}`, content: p.translation, matchId: i, isFlipped: false, isMatched: false })
    })
    memoryCards.value = cards.sort(() => Math.random() - 0.5)
  } else if (game.value.game_type === 'matching') {
    leftWords.value = pairs.map((p: any, i: number) => ({ ...p, id: i, matched: false }))
    rightWords.value = [...pairs].map((p: any, i: number) => ({ ...p, id: i, matched: false })).sort(() => Math.random() - 0.5)
  }
}

// Sprint Logic
function startSprint() {
  isSprintRunning.value = true
  sprintTimer = setInterval(() => {
    sprintTime.value--
    if (sprintTime.value <= 0) endSprint()
  }, 1000)
}

function handleSprintAnswer(answer: boolean) {
  if (feedbackClass.value) return
  const correct = answer === currentSprintItem.value.isCorrect
  gameStats.value.total++
  if (correct) {
    gameStats.value.correct++
    currentStreak.value++
    if (currentStreak.value > gameStats.value.bestStreak) gameStats.value.bestStreak = currentStreak.value
    feedbackClass.value = 'correct-flash'
  } else {
    currentStreak.value = 0
    feedbackClass.value = 'wrong-flash'
  }

  setTimeout(() => {
    feedbackClass.value = ''
    if (currentSprintIdx.value < sprintSession.value.length - 1) {
      currentSprintIdx.value++
    } else {
      endSprint()
    }
  }, 300)
}

async function endSprint() {
  clearInterval(sprintTimer)
  isSprintRunning.value = false
  gameStats.value.percentage = Math.round((gameStats.value.correct / gameStats.value.total) * 100)
  gameFinished.value = true
  if (gameStats.value.percentage >= 70) await playGame(gameId, gameStats.value.percentage)
}

// Memory Logic
function startMemory() {
  memoryStarted.value = true
  memoryTimer = setInterval(() => memoryTime.value++, 1000)
}

function flipCard(card: any) {
  if (flipping.value || card.isFlipped || card.isMatched) return
  card.isFlipped = true
  flippedCards.value.push(card)

  if (flippedCards.value.length === 2) {
    memoryMoves.value++
    flipping.value = true
    const [c1, c2] = flippedCards.value
    if (c1.matchId === c2.matchId) {
      setTimeout(() => {
        c1.isMatched = true
        c2.isMatched = true
        flippedCards.value = []
        flipping.value = false
        if (memoryCards.value.every(c => c.isMatched)) endMemory()
      }, 500)
    } else {
      setTimeout(() => {
        c1.isFlipped = false
        c2.isFlipped = false
        flippedCards.value = []
        flipping.value = false
      }, 1000)
    }
  }
}

async function endMemory() {
  clearInterval(memoryTimer)
  gameStats.value.correct = memoryCards.value.length / 2
  gameStats.value.total = gameStats.value.correct
  gameStats.value.percentage = Math.max(0, 100 - (memoryMoves.value - gameStats.value.total) * 5)
  gameFinished.value = true
  if (gameStats.value.percentage >= 70) await playGame(gameId, gameStats.value.percentage)
}

// Matching Logic
function selectWord(word: any) {
  if (word.matched) return
  selectedWord.value = word
}

async function selectTrans(trans: any) {
  if (!selectedWord.value || trans.matched) return
  gameStats.value.total++
  if (selectedWord.value.translation === trans.translation) {
    selectedWord.value.matched = true
    trans.matched = true
    gameStats.value.correct++
    selectedWord.value = null
    if (leftWords.value.every(w => w.matched)) {
      gameStats.value.percentage = Math.round((gameStats.value.correct / gameStats.value.total) * 100)
      gameFinished.value = true
      if (gameStats.value.percentage >= 70) await playGame(gameId, gameStats.value.percentage)
    }
  } else {
    selectedWord.value = null
    // feedback for wrong match could be added here
  }
}

function restartGame() {
  gameFinished.value = false
  gameStats.value = { correct: 0, total: 0, percentage: 0, bestStreak: 0 }
  currentSprintIdx.value = 0
  sprintTime.value = 30
  currentStreak.value = 0
  memoryTime.value = 0
  memoryMoves.value = 0
  memoryStarted.value = false
  initGame()
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const rs = s % 60
  return `${m}:${rs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.game-player-content {
  --background: #f8f9fc;
}

.game-player-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Results */
.game-results {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-card {
  background: white;
  border-radius: 32px;
  padding: 40px 24px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.result-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.result-icon.success { color: #18a058; }
.result-icon.warning { color: #f59e0b; }

.result-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
}

.result-score {
  font-size: 4rem;
  font-weight: 900;
  color: #18a058;
  margin: 10px 0;
}

.result-details {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 32px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 700;
}

.detail-value {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
}

/* Start Screen */
.game-start-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
}

.game-icon {
  width: 100px;
  height: 100px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.game-icon.sprint { background: linear-gradient(135deg, #f59e0b, #ea580c); }
.game-icon.memory { background: linear-gradient(135deg, #3b82f6, #2563eb); }

/* Sprint */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.timer {
  font-size: 2.5rem;
  font-weight: 900;
  color: #1e293b;
}

.timer.low { color: #ef4444; animation: pulse 1s infinite; }

.streak {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f59e0b;
}

.sprint-card {
  background: white;
  border-radius: 32px;
  padding: 60px 24px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  margin-bottom: 40px;
  transition: all 0.2s;
  border: 4px solid transparent;
}

.word-main { font-size: 2.5rem; font-weight: 800; color: #1e293b; }
.word-divider { font-size: 1.2rem; color: #94a3b8; margin: 10px 0; }
.word-trans { font-size: 2rem; font-weight: 700; color: #18a058; }

.game-controls {
  display: flex;
  gap: 20px;
}

.control-btn {
  flex: 1;
  height: 80px !important;
  --border-radius: 24px;
  font-size: 2rem;
}

.control-btn.wrong { --background: #ef4444; }
.control-btn.correct { --background: #18a058; }

.correct-flash { border-color: #18a058; background: #f0fdf4; }
.wrong-flash { border-color: #ef4444; background: #fef2f2; }

/* Memory */
.memory-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.memory-card {
  aspect-ratio: 1;
  perspective: 1000px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.5s;
}

.memory-card.flipped .card-inner { transform: rotateY(180deg); }

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  padding: 4px;
  text-align: center;
  font-size: 0.8rem;
}

.card-front { background: #18a058; color: white; font-size: 1.5rem; }
.card-back { background: white; color: #1e293b; transform: rotateY(180deg); border: 2px solid #18a058; }

.memory-card.matched { opacity: 0.5; pointer-events: none; }

/* Matching */
.matching-instructions {
  text-align: center;
  color: #64748b;
  margin-bottom: 20px;
  font-weight: 600;
}

.matching-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.match-item {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  text-align: center;
  font-weight: 700;
  box-shadow: 0 4px 8px rgba(0,0,0,0.03);
  border: 2px solid transparent;
  transition: all 0.2s;
}

.match-item.selected { border-color: #18a058; background: #f0fdf4; color: #18a058; }
.match-item.matched { opacity: 0.3; background: #f1f5f9; }

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style>
