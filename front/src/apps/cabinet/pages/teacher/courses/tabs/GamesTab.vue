<template>
  <div class="games-tab">
    <!-- List View -->
    <n-card v-if="!selectedGame" bordered>
      <template #header>
        <n-space align="center" justify="space-between">
          <span>{{ $t('cabinet.menu.games') || 'Игры' }}</span>
          <n-button type="primary" size="small" @click="goToAddGame">
            <template #icon><n-icon><add-icon /></n-icon></template>
            {{ $t('common.add') || 'Добавить игру' }}
          </n-button>
        </n-space>
      </template>

      <div v-if="gamesLoading" class="loading-container">
        <n-spin size="medium" />
      </div>

      <n-empty v-else-if="!games.length" :description="$t('cabinet.games.noGames') || 'Игр пока нет'">
        <template #extra>
          <n-button size="small" @click="openGameEditor()">
            Создать первую игру
          </n-button>
        </template>
      </n-empty>

      <n-data-table
        v-else
        :columns="columns"
        :data="games"
        :pagination="{ pageSize: 10 }"
        :row-props="rowProps"
        class="games-table"
      />
    </n-card>

    <!-- Detail View -->
    <GamesDetailView 
      v-else 
      :game="selectedGame" 
      @back="selectedGame = null" 
      @edit="goToEditGame"
      @updated="loadGames"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NSpace, NCard, NIcon, NSpin, NEmpty, NButton, NTag, useMessage,
  NDataTable, NProgress, NText
} from 'naive-ui'
import {
  AddOutline as AddIcon,
  PlayOutline as PlayIcon,
  RefreshOutline as RefreshIcon,
  ChevronForwardOutline as ChevronIcon
} from '@vicons/ionicons5'
import axios from 'axios'
import GamesDetailView from './GamesDetailView.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const groupId = route.params.id

// Games state
const games = ref<any[]>([])
const gamesLoading = ref(false)
const selectedGame = ref<any>(null)

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
              h(NText, { depth: 3, size: 'small' }, { default: () => row.lesson_title || t('cabinet.games.notAttached') })
            ]
          })
        ]
      })
    }
  },
  {
    title: t('cabinet.games.createdAt'),
    key: 'created_at',
    width: 120,
    render(row: any) {
      return new Date(row.created_at).toLocaleDateString()
    }
  },
  {
    title: t('cabinet.courses.progress'),
    key: 'play_percentage',
    width: 200,
    render(row: any) {
      return h(NSpace, { align: 'center', wrap: false }, {
        default: () => [
          h(NProgress, {
            type: 'line',
            percentage: row.play_percentage,
            showIndicator: false,
            status: row.play_percentage >= 80 ? 'success' : 'default',
            style: { width: '100px' }
          }),
          h(NText, { size: 'small', depth: 3 }, { default: () => `${row.played_count}/${row.total_students}` })
        ]
      })
    }
  },
  {
    title: t('cabinet.games.status'),
    key: 'is_active',
    width: 100,
    render(row: any) {
      return h(NTag, {
        type: row.is_active ? 'success' : 'default',
        size: 'small',
        round: true
      }, { default: () => row.is_active ? t('cabinet.games.active') : t('cabinet.games.inactive') })
    }
  },
  {
    title: '',
    key: 'actions',
    width: 40,
    render() {
      return h(NIcon, { size: '20', depth: 3 }, { default: () => h(ChevronIcon) })
    }
  }
])

const lessonOptions = computed(() => {
  return lessons.value.map(l => ({
    label: l.title,
    value: l.id
  }))
})

const loadGames = async () => {
  gamesLoading.value = true
  try {
    const res = await axios.get(`/api/v1/courses/games/?group_id=${groupId}`)
    games.value = Array.isArray(res.data) ? res.data : res.data.results || []
    
    // Update selected game if it exists
    if (selectedGame.value) {
      selectedGame.value = games.value.find(g => g.id === selectedGame.value.id) || null
    }
  } catch (err) {
    console.error('Error loading games:', err)
    message.error(t('cabinet.games.errorSavingGame'))
  } finally {
    gamesLoading.value = false
  }
}

const loadLessons = async () => {
  try {
    const res = await axios.get(`/api/v1/courses/lessons/?group_id=${groupId}`)
    lessons.value = Array.isArray(res.data) ? res.data : res.data.results || []
  } catch (err) {
    console.error('Error loading lessons:', err)
  }
}

const handleRowClick = (row: any) => {
  selectedGame.value = row
}

const rowProps = (row: any) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => handleRowClick(row)
  }
}

const goToAddGame = () => {
  router.push({ name: 'TeacherGameAdd', params: { id: groupId } })
}

const goToEditGame = (game: any) => {
  router.push({ name: 'TeacherGameEdit', params: { id: groupId, gameId: game.id } })
}

onMounted(() => {
  loadGames()
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
</style>
