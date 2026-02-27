<template>
  <div class="cabinet-page">
    <!-- List View -->
    <template v-if="!selectedGame">
      <header class="page-header">
        <div class="page-header__text">
          <NH1 class="page-header__title">Игры</NH1>
          <p class="page-header__subtitle">Интерактивные задания для закрепления материала</p>
        </div>
        <NButton type="primary" @click="goToAdd">
          <template #icon>
            <NIcon><component :is="AddIcon" /></NIcon>
          </template>
          Добавить игру
        </NButton>
      </header>

      <div v-if="gamesLoading" class="loading-state">
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
            :scroll-x="720"
            :row-props="(row: any) => ({
              style: 'cursor: pointer;',
              onClick: () => selectGame(row)
            })"
            :row-key="(row: any) => row.id"
            class="games-data-table clickable-rows"
          />
        </div>
      </NCard>

      <div v-else class="empty-state">
        <NEmpty description="Игр пока нет">
          <template #icon>
            <NIcon><component :is="GameIcon" /></NIcon>
          </template>
          <template #extra>
            <NButton type="primary" size="small" @click="goToAdd">
              Создать первую игру
            </NButton>
          </template>
        </NEmpty>
      </div>
    </template>

    <!-- Detail View -->
    <GamesDetailView
      v-else
      :game="selectedGame"
      @back="selectedGame = null"
      @edit="goToEdit"
      @updated="loadGames"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import {
  NH1, NButton, NIcon, NCard, NEmpty, NSpin, NDataTable, NTag, NProgress, NText
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { AddOutline as AddIcon, GameControllerOutline as GameIcon } from '@vicons/ionicons5'
import { useCabinetGroups } from '~/composables/useCabinetGroups'
import GamesDetailView from './GamesDetailView.vue'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const groupId = computed(() => route.params.id as string)
const groupsApi = useCabinetGroups()

const games = ref<any[]>([])
const gamesLoading = ref(false)
const selectedGame = ref<any>(null)

const TYPE_LABELS: Record<string, string> = {
  matching: 'Сопоставление',
  sprint: 'Спринт',
  memory: 'Память',
}

const columns: DataTableColumns<any> = [
  {
    title: 'Название',
    key: 'title',
    minWidth: 180,
    ellipsis: { tooltip: true },
    render: (row: any) => h('div', { class: 'game-cell' }, [
      h('span', { class: 'game-title' }, row.title),
      h('div', { class: 'game-meta' }, [
        h(NTag, {
          size: 'small',
          round: true,
          type: row.type === 'sprint' ? 'warning' : row.type === 'memory' ? 'success' : 'info',
        }, () => TYPE_LABELS[row.type] || row.type),
        h(NText, { depth: 3, style: 'font-size: 0.8rem; margin-left: 8px;' }, () => row.lesson_title || 'Не привязан'),
      ]),
    ]),
  },
  {
    title: 'Создана',
    key: 'created_at',
    width: 110,
    render: (row: any) => formatDate(row.created_at),
  },
  {
    title: 'Прогресс',
    key: 'play_percentage',
    width: 180,
    render: (row: any) => h('div', { class: 'progress-cell' }, [
      h(NProgress, {
        type: 'line',
        percentage: row.play_percentage ?? 0,
        showIndicator: false,
        status: (row.play_percentage ?? 0) >= 80 ? 'success' : 'default',
        style: { width: '100px', display: 'inline-block' },
      }),
      h(NText, { depth: 3, size: 'small', style: 'margin-left: 8px;' }, () => `${row.played_count ?? 0}/${row.total_students ?? 0}`),
    ]),
  },
  {
    title: 'Статус',
    key: 'is_active',
    width: 100,
    render: (row: any) => h(NTag, {
      type: row.is_active ? 'success' : 'default',
      size: 'small',
      round: true,
    }, () => row.is_active ? 'Активна' : 'Неактивна'),
  },
  {
    title: '',
    key: 'arrow',
    width: 40,
    render: () => h(NIcon, { size: 18, depth: 3 }, () => h('span', { class: 'arrow-icon' }, '→')),
  },
]

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

const loadGames = async () => {
  gamesLoading.value = true
  try {
    games.value = await groupsApi.getGames(parseInt(groupId.value)) ?? []
    if (selectedGame.value) {
      selectedGame.value = games.value.find((g: any) => g.id === selectedGame.value.id) ?? null
    }
  } catch (e) {
    console.error(e)
  } finally {
    gamesLoading.value = false
  }
}

const selectGame = async (row: any) => {
  try {
    const full = await groupsApi.getGameById(row.id)
    selectedGame.value = full ?? row
  } catch (e) {
    selectedGame.value = row
  }
}

const goToAdd = () => {
  navigateTo(`/cabinet/teacher/groups/${groupId.value}/games/add`)
}

const goToEdit = (game: any) => {
  navigateTo(`/cabinet/teacher/groups/${groupId.value}/games/${game.id}/edit`)
}

onMounted(loadGames)
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.page-header__title {
  margin: 0 0 8px;
  font-weight: 700;
}

.page-header__subtitle {
  margin: 0;
  color: var(--n-text-color-3);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.games-card {
  border-radius: 12px;
  overflow: hidden;
}

.games-card :deep(.n-card__content) {
  padding: 0;
}

.games-table-scroll {
  overflow-x: auto;
}

.games-data-table :deep(.n-data-table-th) {
  background: var(--n-color-hover) !important;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--n-text-color-2);
  padding: 14px 20px !important;
}

.games-data-table :deep(.n-data-table-td) {
  font-size: 0.9rem;
  padding: 16px 20px !important;
}

.clickable-rows :deep(.n-data-table-tr) {
  cursor: pointer;
}

.games-data-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: var(--n-color-hover) !important;
}

.game-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.game-title {
  font-weight: 600;
}

.game-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.progress-cell {
  display: flex;
  align-items: center;
}

.arrow-icon {
  font-weight: 600;
  color: var(--n-text-color-3);
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}
</style>
