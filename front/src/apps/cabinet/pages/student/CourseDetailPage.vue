<template>
  <CabinetLayout>
    <div v-if="loading" class="loading-container">
      <n-spin size="large" />
    </div>

    <div v-else-if="error" class="error-container">
      <n-alert type="error" :title="$t('common.error')">
        {{ error }}
      </n-alert>
    </div>

    <n-space v-else vertical size="large" class="course-detail-page">
      <!-- Course Header Info -->
      <n-card bordered class="course-info-card">
        <n-page-header @back="$router.push('/cabinet/student/courses')">
          <template #title>
            <n-h2 style="margin: 0;">{{ group?.course_name }}</n-h2>
            <n-text depth="3">{{ group?.name }}</n-text>
          </template>
          
          <template #extra>
            <n-space align="center" size="large">
              <div class="stat-item">
                <n-text depth="3" size="small">{{ $t('cabinet.courses.startDate') }}</n-text>
                <div class="stat-value">{{ formatDate(group?.start_date) }}</div>
              </div>
              <div class="stat-item progress-stat">
                <n-text depth="3" size="small">{{ $t('cabinet.courses.progress') }}</n-text>
                <n-space align="center" :wrap="false" :size="8">
                  <n-progress
                    type="line"
                    :percentage="group?.progress || 0"
                    :show-indicator="false"
                    status="success"
                    style="width: 100px"
                  />
                  <n-text type="success" strong>{{ group?.progress || 0 }}%</n-text>
                </n-space>
              </div>
            </n-space>
          </template>
        </n-page-header>
      </n-card>

      <!-- Navigation Tabs -->
      <n-card bordered content-style="padding: 0;">
        <n-tabs
          type="line"
          v-model:value="activeTab"
          size="large"
          justify-content="space-evenly"
          class="course-tabs"
        >
          <n-tab name="attendance">
            <template #default>
              <n-space align="center" size="small">
                <n-icon><calendar-icon /></n-icon>
                <span>{{ $t('cabinet.menu.attendance') || 'Посещаемость' }}</span>
              </n-space>
            </template>
          </n-tab>
          <n-tab name="grades">
            <template #default>
              <n-space align="center" size="small">
                <n-icon><star-icon /></n-icon>
                <span>{{ $t('cabinet.menu.grades') }}</span>
              </n-space>
            </template>
          </n-tab>
          <n-tab name="games">
            <template #default>
              <n-space align="center" size="small">
                <n-icon><game-icon /></n-icon>
                <span>{{ $t('cabinet.menu.games') || 'Игры' }}</span>
              </n-space>
            </template>
          </n-tab>
          <n-tab name="payments">
            <template #default>
              <n-space align="center" size="small">
                <n-icon><cash-icon /></n-icon>
                <span>{{ $t('cabinet.menu.payments') || 'Оплаты' }}</span>
              </n-space>
            </template>
          </n-tab>
        </n-tabs>
      </n-card>

      <!-- Tab Content (Dynamic Components) -->
      <div class="tab-content">
        <component :is="activeTabComponent" :group-id="groupId" />
      </div>
    </n-space>

    <!-- Chat Button -->
    <ChatButton
      v-if="group && group.teacher_id"
      :unread-count="chatUnreadCount"
      @click="openChat"
    />

    <!-- Chat Widget -->
    <ChatWidget
      v-if="group && group.teacher_id && chatRoomId > 0"
      :is-open="isChatOpen"
      :room-id="chatRoomId"
      :teacher-name="group.teacher_name"
      @close="closeChat"
      @update:unread-count="chatUnreadCount = $event"
    />
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import {
  NSpace, NCard, NPageHeader, NH2, NText, NProgress, NTabs, NTab,
  NIcon, NSpin, NAlert
} from 'naive-ui'
import {
  CalendarOutline as CalendarIcon,
  StarOutline as StarIcon,
  GameControllerOutline as GameIcon,
  CashOutline as CashIcon
} from '@vicons/ionicons5'
import axios from 'axios'

// Import Tab Components
import AttendanceTab from './courses/tabs/AttendanceTab.vue'
import GradesTab from './courses/tabs/GradesTab.vue'
import GamesTab from './courses/tabs/GamesTab.vue'
import PaymentsTab from './courses/tabs/PaymentsTab.vue'

// Import Chat Components
import ChatButton from '@/components/ChatButton.vue'
import ChatWidget from '@/components/ChatWidget.vue'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
const groupId = route.params.id

const loading = ref(true)
const error = ref<string | null>(null)
const group = ref<any>(null)
const isChatOpen = ref(false)

// Chat room ID - получаем через API direct_message
const chatRoomId = ref(0)
const chatRooms = ref<Record<number, number>>({}) // Кеш roomId по teacherId

// Chat unread count (will be updated from chat widget)
const chatUnreadCount = ref(0)

// Sync active tab with URL query
const activeTab = computed({
  get: () => (route.query.tab as string) || 'attendance',
  set: (val) => {
    router.replace({ query: { ...route.query, tab: val } })
  }
})

const formatDate = (dateString: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'tk-TM')
}

// Map tab names to components
const activeTabComponent = computed(() => {
  switch (activeTab.value) {
    case 'attendance': return AttendanceTab
    case 'grades': return GradesTab
    case 'games': return GamesTab
    case 'payments': return PaymentsTab
    default: return AttendanceTab
  }
})

const loadGroupInfo = async () => {
  loading.value = true
  error.value = null
  try {
    const groupRes = await axios.get(`/api/v1/courses/groups/${groupId}/`)
    group.value = groupRes.data
  } catch (err: any) {
    console.error('Error loading group info:', err)
    error.value = err.response?.data?.detail || 'Failed to load course details'
  } finally {
    loading.value = false
  }
}

// Получить или создать чат-комнату с учителем
const getOrCreateChatRoom = async (teacherId: number): Promise<number | null> => {
  // Проверяем кеш
  if (chatRooms.value[teacherId] && chatRooms.value[teacherId] > 5) {
    console.log('✅ Using cached roomId:', chatRooms.value[teacherId])
    return chatRooms.value[teacherId]
  }

  try {
    console.log('📞 Creating/getting chat room for teacher:', teacherId)
    const response = await axios.post('/api/v1/chat/rooms/direct_message/', {
      user_id: teacherId
    })

    if (response.data && response.data.id) {
      const roomId = Number(response.data.id)
      chatRooms.value[teacherId] = roomId
      console.log('✅ Chat room ready, roomId:', roomId)
      return roomId
    }
  } catch (err: any) {
    console.error('❌ Error getting chat room:', err)
  }

  return null
}

const openChat = async () => {
  if (!group.value?.teacher_id) {
    console.error('No teacher ID available')
    return
  }

  // Получаем roomId для чата с учителем
  const roomId = await getOrCreateChatRoom(group.value.teacher_id)
  
  if (roomId && roomId > 0) {
    chatRoomId.value = roomId
    isChatOpen.value = true
  } else {
    console.error('Failed to get chat room')
  }
}

const closeChat = () => {
  isChatOpen.value = false
}

onMounted(() => {
  loadGroupInfo()
})
</script>

<style scoped>
.course-detail-page {
  max-width: 1600px;
  margin: 0 auto;
}

.stat-item {
  text-align: center;
  min-width: 100px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #18a058;
}

.progress-stat {
  min-width: 150px;
}

.course-tabs {
  background-color: white;
}

.loading-container, .error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>
