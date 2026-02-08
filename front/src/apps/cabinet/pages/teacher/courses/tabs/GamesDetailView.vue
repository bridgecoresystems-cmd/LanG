<template>
  <div class="game-detail-view">
    <n-page-header @back="$emit('back')">
      <template #title>
        <n-space align="center">
          <span>{{ game.title }}</span>
          <n-tag :type="game.is_active ? 'success' : 'default'" size="small">
            {{ game.is_active ? 'Активна' : 'Неактивна' }}
          </n-tag>
        </n-space>
      </template>
      <template #extra>
        <n-space>
          <n-button 
            secondary
            size="small"
            @click="$emit('updated')"
          >
            <template #icon><n-icon><refresh-icon /></n-icon></template>
            Обновить стат.
          </n-button>
          <n-button 
            :type="game.is_active ? 'warning' : 'success'" 
            secondary
            size="small"
            @click="toggleActive"
          >
            {{ game.is_active ? 'Деактивировать' : 'Активировать' }}
          </n-button>
          <n-button type="primary" size="small" @click="$emit('edit', game)">
            Редактировать
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-grid cols="1 m:5" :x-gap="24" :y-gap="24" style="margin-top: 24px;">
      <!-- Left Column: Game Info & Content (3/5) -->
      <n-gi span="3">
        <n-space vertical size="large">
          <!-- Stats Card -->
          <n-card bordered size="small">
            <n-grid cols="2 s:4" :x-gap="12">
              <n-gi>
                <n-statistic label="Прогресс группы">
                  <div class="progress-container">
                    <n-progress
                      type="circle"
                      :percentage="game.play_percentage"
                      :color="getProgressColor(game.play_percentage)"
                      :stroke-width="10"
                      style="width: 80px;"
                    />
                  </div>
                </n-statistic>
              </n-gi>
              <n-gi>
                <n-statistic label="Сыграло" :value="`${game.played_count} / ${game.total_students}`" />
              </n-gi>
              <n-gi>
                <n-statistic label="Дата создания" :value="formatDate(game.created_at)" />
              </n-gi>
              <n-gi>
                <n-statistic label="Урок" :value="game.lesson_title || '—'" />
              </n-gi>
            </n-grid>
          </n-card>

          <!-- Content Card -->
          <n-card title="Слова в игре" bordered size="small">
            <n-table :bordered="false" :single-line="false" size="small">
              <thead>
                <tr>
                  <th>Слово</th>
                  <th>Перевод</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(pair, index) in game.data" :key="index">
                  <td><n-text strong>{{ pair.word }}</n-text></td>
                  <td>{{ pair.translation }}</td>
                </tr>
              </tbody>
            </n-table>
          </n-card>
        </n-space>
      </n-gi>

      <!-- Right Column: Student Statistics (2/5) -->
      <n-gi span="2">
        <n-card title="Активность студентов" bordered size="small">
          <n-data-table
            :columns="studentColumns"
            :data="game.student_stats"
            :pagination="{ pageSize: 15 }"
            size="small"
          />
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { 
  NPageHeader, NSpace, NTag, NButton, NGrid, NGi, NCard, 
  NStatistic, NProgress, NTable, useMessage, NDataTable, NText, NIcon
} from 'naive-ui'
import { 
  CheckmarkCircleOutline as DoneIcon, 
  TimeOutline as PendingIcon,
  RefreshOutline as RefreshIcon
} from '@vicons/ionicons5'
import axios from 'axios'

const props = defineProps<{
  game: any
}>()

const emit = defineEmits(['back', 'edit', 'updated'])
const message = useMessage()

const formatDate = (dateString: string) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  })
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#18a058'
  if (percentage >= 50) return '#f0a020'
  return '#d03050'
}

const studentColumns = [
  {
    title: 'Студент',
    key: 'full_name',
    render(row: any) {
      return h(NSpace, { vertical: true, size: 0 }, {
        default: () => [
          h(NText, { strong: true, size: 'small' }, { default: () => row.full_name }),
          h(NText, { depth: 3, style: 'font-size: 10px;' }, { default: () => `@${row.username}` })
        ]
      })
    }
  },
  {
    title: 'Игр',
    key: 'attempts_count',
    width: 60,
    align: 'center'
  },
  {
    title: 'Ср. балл',
    key: 'best_score',
    width: 80,
    render(row: any) {
      return h(NText, { 
        type: row.best_score >= 70 ? 'success' : row.attempts_count > 0 ? 'warning' : 'default' 
      }, { default: () => row.attempts_count > 0 ? `${row.best_score}%` : '—' })
    }
  },
  {
    title: '',
    key: 'status',
    width: 40,
    render(row: any) {
      return h(NIcon, { 
        size: '18', 
        color: row.attempts_count > 0 ? '#18a058' : '#ccc' 
      }, { default: () => row.attempts_count > 0 ? h(DoneIcon) : h(PendingIcon) })
    }
  }
]

const toggleActive = async () => {
  try {
    const res = await axios.patch(`/api/v1/courses/games/${props.game.id}/`, {
      is_active: !props.game.is_active
    })
    message.success(res.data.is_active ? 'Игра активирована' : 'Игра деактивирована')
    emit('updated')
  } catch (err) {
    message.error('Ошибка при обновлении статуса')
  }
}
</script>

<style scoped>
.game-detail-view {
  padding: 4px;
}
.progress-container {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
</style>
