<template>
  <div class="game-detail-view">
    <header class="detail-header">
      <NButton quaternary circle @click="$emit('back')">
        <template #icon>
          <NIcon><component :is="BackIcon" /></NIcon>
        </template>
      </NButton>
      <div class="detail-header__text">
        <NH2 class="detail-header__title">
          <NSpace align="center">
            <span>{{ game.title }}</span>
            <NTag :type="game.is_active ? 'success' : 'default'" size="small">
              {{ game.is_active ? 'Активна' : 'Неактивна' }}
            </NTag>
          </NSpace>
        </NH2>
      </div>
      <NSpace>
        <NButton secondary size="small" @click="$emit('updated')">
          <template #icon>
            <NIcon><component :is="RefreshIcon" /></NIcon>
          </template>
          Обновить
        </NButton>
        <NButton
          :type="game.is_active ? 'warning' : 'success'"
          secondary
          size="small"
          @click="toggleActive"
        >
          {{ game.is_active ? 'Деактивировать' : 'Активировать' }}
        </NButton>
        <NButton type="primary" size="small" @click="$emit('edit', game)">
          Редактировать
        </NButton>
      </NSpace>
    </header>

    <NGrid cols="1 m:5" :x-gap="24" :y-gap="24" class="detail-grid">
      <NGi :span="3">
        <NSpace vertical size="large">
          <NCard bordered size="small" class="stats-card">
            <NGrid cols="2 s:4" :x-gap="12">
              <NGi>
                <NStatistic label="Прогресс группы">
                  <div class="progress-circle-wrap">
                    <NProgress
                      type="circle"
                      :percentage="game.play_percentage ?? 0"
                      :color="getProgressColor(game.play_percentage ?? 0)"
                      :stroke-width="10"
                      :width="80"
                    />
                  </div>
                </NStatistic>
              </NGi>
              <NGi>
                <NStatistic label="Сыграло" :value="`${game.played_count ?? 0} / ${game.total_students ?? 0}`" />
              </NGi>
              <NGi>
                <NStatistic label="Дата создания" :value="formatDate(game.created_at)" />
              </NGi>
              <NGi>
                <NStatistic label="Урок" :value="game.lesson_title || '—'" />
              </NGi>
            </NGrid>
          </NCard>

          <NCard title="Слова в игре" bordered size="small">
            <NTable :bordered="false" :single-line="false" size="small" class="words-table">
              <thead>
                <tr>
                  <th>Слово</th>
                  <th>Перевод</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(pair, idx) in gameData" :key="idx">
                  <td><NText strong>{{ pair.word }}</NText></td>
                  <td>{{ pair.translation }}</td>
                </tr>
              </tbody>
            </NTable>
          </NCard>
        </NSpace>
      </NGi>

      <NGi :span="2">
        <NCard title="Активность студентов" bordered size="small">
          <NDataTable
            :columns="studentColumns"
            :data="studentStats"
            :pagination="{ pageSize: 15 }"
            size="small"
          />
        </NCard>
      </NGi>
    </NGrid>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NButton, NIcon, NH2, NSpace, NTag, NGrid, NGi, NCard,
  NStatistic, NProgress, NTable, NText, NDataTable, useMessage
} from 'naive-ui'
import { ChevronBackOutline as BackIcon, RefreshOutline as RefreshIcon } from '@vicons/ionicons5'
import { useCabinetGroups } from '~/composables/useCabinetGroups'

const props = defineProps<{ game: any }>()
const emit = defineEmits(['back', 'edit', 'updated'])
const message = useMessage()
const groupsApi = useCabinetGroups()

const gameData = computed(() => {
  const d = props.game?.data
  if (Array.isArray(d)) return d
  if (typeof d === 'string') {
    try {
      return JSON.parse(d) || []
    } catch {
      return []
    }
  }
  return []
})

const studentStats = computed(() => props.game?.student_stats ?? [])

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

const getProgressColor = (pct: number) => {
  if (pct >= 80) return '#18a058'
  if (pct >= 50) return '#f0a020'
  return '#d03050'
}

const studentColumns = [
  { title: 'Студент', key: 'full_name', ellipsis: { tooltip: true } },
  { title: 'Игр', key: 'attempts_count', width: 60, align: 'center' as const },
  {
    title: 'Ср. балл',
    key: 'best_score',
    width: 80,
    render: (row: any) => row.attempts_count > 0 ? `${row.best_score}%` : '—',
  },
]

const toggleActive = async () => {
  try {
    await groupsApi.patchGame(props.game.id, { is_active: !props.game.is_active })
    message.success(props.game.is_active ? 'Игра деактивирована' : 'Игра активирована')
    emit('updated')
  } catch (e) {
    message.error('Ошибка при обновлении статуса')
  }
}
</script>

<style scoped>
.game-detail-view {
  padding: 4px 0 40px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-header__text {
  flex: 1;
}

.detail-header__title {
  margin: 0;
  font-size: 1.25rem;
}

.detail-grid {
  margin-top: 0;
}

.progress-circle-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.words-table :deep(.n-table-th),
.words-table :deep(.n-table-td) {
  padding: 10px 16px;
}
</style>
