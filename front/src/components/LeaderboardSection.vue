<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import UserAvatar from '@/components/UserAvatar.vue'
import { useCourses } from '@/composables/useCourses'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Skeleton from 'primevue/skeleton'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'

const { t, locale } = useI18n()
const { fetchLeaderboard } = useCourses()
const leaderboards = ref<any[]>([])
const loading = ref(false)
const socket = ref<WebSocket | null>(null)

const loadActiveLeaderboards = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/v1/landing/leaderboards/', {
        params: { lang: locale.value }
    })
    leaderboards.value = Array.isArray(response.data) ? response.data : response.data.results || []
  } catch (error) {
    console.error('Error loading leaderboards:', error)
  } finally {
    loading.value = false
  }
}

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  // Use port 3001 as per project rules
  const wsUrl = `${protocol}//${window.location.hostname}:3001/ws/chat/0?token=landing`
  
  socket.value = new WebSocket(wsUrl)

  socket.value.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data)
      if (message.type === 'LEADERBOARD_UPDATE') {
        const courseId = message.data.course_id
        loadLeaderboard(courseId)
      }
    } catch (e) {
      // Ignore non-json or malformed messages
    }
  }

  socket.value.onclose = () => {
    setTimeout(connectWebSocket, 5000)
  }
}

onMounted(async () => {
  loadActiveLeaderboards()
  connectWebSocket()
})

onUnmounted(() => {
  if (socket.value) socket.value.close()
})

const getRankIcon = (rank: number) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return rank
}

// Watch locale to reload
watch(locale, () => {
    loadActiveLeaderboards()
})

// For demonstration, let's provide a way to load a specific course leaderboard
defineExpose({ loadActiveLeaderboards })
</script>

<template>
  <section class="section leaderboard-section" v-if="leaderboards.length > 0 || loading">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">{{ t('leaderboard.achievements_title') }}</h2>
        <p class="section-subtitle">{{ t('leaderboard.achievements_subtitle') }}</p>
      </div>

      <div class="leaderboard-container">
        <div v-if="leaderboards.length > 0">
            <div v-for="data in leaderboards" :key="data.id" class="course-leaderboard-card">
                <div class="card-header">
                    <div>
                        <h3 class="course-title">{{ data.title }}</h3>
                        <div class="course-subtitle text-xs text-gray-500 uppercase">{{ data.course_name }}</div>
                    </div>
                    <span class="exam-tag">
                        {{ data.exam_type_name }}
                    </span>
                </div>
                
                <DataTable :value="data.students" class="p-datatable-sm custom-leaderboard-table">
                    <Column field="rank" :header="t('leaderboard.rank')" style="width: 60px">
                        <template #body="slotProps">
                            <span class="rank-id" :class="'rank-' + (slotProps.index + 1)">
                                {{ getRankIcon(slotProps.index + 1) }}
                            </span>
                        </template>
                    </Column>
                    <Column field="group_name" :header="t('leaderboard.group')">
                        <template #body="slotProps">
                            <span class="group-badge">{{ slotProps.data.group_name }}</span>
                        </template>
                    </Column>
                    <Column field="student_name" :header="t('leaderboard.student')">
                        <template #body="slotProps">
                            <div class="student-info">
                                <UserAvatar 
                                    :src="slotProps.data.student_avatar_url" 
                                    :gender="slotProps.data.student_gender" 
                                    size="small"
                                    class="student-avatar"
                                />
                                <span class="student-name">{{ slotProps.data.student_name }}</span>
                            </div>
                        </template>
                    </Column>
                    <Column field="score" :header="t('leaderboard.score')" style="width: 100px">
                        <template #body="slotProps">
                            <span class="score-pill">{{ slotProps.data.score }}</span>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
        
        <div v-else-if="loading" class="leaderboard-loading">
            <Skeleton v-for="i in 3" :key="i" height="200px" class="mb-4" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.leaderboard-section {
    background-color: var(--bg-secondary);
    padding: 80px 0;
}

.section-header {
    text-align: center;
    margin-bottom: 3rem;
}

.leaderboard-container {
    max-width: 900px;
    margin: 0 auto;
}

.course-leaderboard-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    margin-bottom: 2.5rem;
    overflow: hidden;
    border: 1px solid #edf2f7;
}

.card-header {
    padding: 1.5rem;
    background: linear-gradient(to right, #ffffff, #f8f9fa);
    border-bottom: 1px solid #edf2f7;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.course-title {
    margin: 0;
    font-size: 1.4rem;
    color: var(--primary-color);
    font-weight: 700;
}

.exam-tag {
    background: #e6f7ff;
    color: #0050b3;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid #91d5ff;
}

.custom-leaderboard-table :deep(.p-datatable-thead > tr > th) {
    background: #f8f9fa;
    color: #4a5568;
    font-weight: 600;
    padding: 1rem;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
}

.custom-leaderboard-table :deep(.p-datatable-tbody > tr > td) {
    padding: 1rem;
    border-bottom: 1px solid #f7fafc;
}

.rank-id {
    font-weight: 800;
    font-size: 1.1rem;
    display: flex;
    justify-content: center;
}

.rank-1 { color: #ecc94b; transform: scale(1.2); }
.rank-2 { color: #a0aec0; }
.rank-3 { color: #ed8936; }

.student-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.student-avatar {
    border: 1px solid #edf2f7;
}

.student-name {
    font-weight: 600;
    color: #2d3748;
}

.group-badge {
    background: #f1f5f9;
    color: #475569;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
}

.score-pill {
    display: inline-block;
    background: #f0fdf4;
    color: #166534;
    font-weight: 800;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 1rem;
    min-width: 50px;
    text-align: center;
}

.leaderboard-empty {
    text-align: center;
    padding: 4rem;
    background: white;
    border-radius: 12px;
    color: var(--text-secondary);
}

@media (max-width: 640px) {
    .card-header {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>

