<template>
  <div class="games-tab">
    <n-card bordered>
      <template #header>
        <n-space align="center" justify="space-between">
          <span>{{ $t('cabinet.menu.games') || 'Игры' }}</span>
          <n-tag type="info" size="small" :bordered="false">
            {{ $t('common.readOnly') || 'Только просмотр' }}
          </n-tag>
        </n-space>
      </template>

      <div v-if="gamesLoading" class="loading-container">
        <n-spin size="medium" />
      </div>

      <n-empty v-else-if="!games.length" :description="$t('cabinet.games.noGames') || 'Игр пока нет'" />

      <n-data-table
        v-else
        :columns="columns"
        :data="games"
        :pagination="{ pageSize: 10 }"
        class="games-table"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import {
  NSpace, NCard, NIcon, NSpin, NEmpty, NTag, useMessage,
  NDataTable, NProgress, NText
} from 'naive-ui'
import {
  PlayOutline as PlayIcon
} from '@vicons/ionicons5'
import api from '@/services/api'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  groupId: number
}>()

const { t } = useI18n()
const message = useMessage()

// Games state
const games = ref<any[]>([])
const gamesLoading = ref(false)

const columns = computed(() => [
  {
    title: t('cabinet.games.gameTitle'),
    key: 'title',
    render(row: any) {
      return h(NText, { strong: true }, { default: () => row.title })
    }
  },
  {
    title: t('cabinet.games.status'),
    key: 'status',
    render(row: any) {
      return h(NTag, {
        type: row.is_active ? 'success' : 'default',
        size: 'small',
        round: true,
        bordered: false
      }, { default: () => row.is_active ? t('admin.filters.active') : t('admin.filters.inactive') })
    }
  },
  {
    title: t('cabinet.games.createdAt'),
    key: 'created_at',
    render(row: any) {
      if (!row.created_at) return '-'
      const date = new Date(row.created_at)
      return date.toLocaleDateString()
    }
  }
])

const loadGames = async () => {
  gamesLoading.value = true
  try {
    const response = await api.get(`/courses/games/?group_id=${props.groupId}`)
    games.value = Array.isArray(response.data) ? response.data : response.data.results || []
  } catch (err: any) {
    console.error('Error loading games:', err)
    message.error(err.response?.data?.detail || 'Failed to load games')
  } finally {
    gamesLoading.value = false
  }
}

onMounted(() => {
  loadGames()
})
</script>

<style scoped>
.games-tab {
  width: 100%;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.games-table {
  width: 100%;
}
</style>
