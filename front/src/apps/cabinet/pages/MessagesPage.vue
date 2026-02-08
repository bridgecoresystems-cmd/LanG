<template>
  <CabinetLayout>
    <n-space vertical size="large" class="messages-page">
      <!-- Header -->
      <div class="messages-header">
        <n-space justify="space-between" align="center">
          <div>
            <n-h1 style="margin-bottom: 4px;">{{ $t('cabinet.messages.title') }}</n-h1>
            <n-text depth="3">{{ $t('cabinet.messages.description') }}</n-text>
          </div>
          <n-button
            v-if="unreadCount > 0"
            secondary
            strong
            round
            @click="handleMarkAllRead"
            :loading="markingAll"
          >
            <template #icon>
              <n-icon><mark-read-icon /></n-icon>
            </template>
            {{ $t('cabinet.messages.markAllRead') }}
          </n-button>
        </n-space>
      </div>

      <!-- Filters -->
      <n-space justify="center">
        <n-tabs
          type="segment"
          v-model:value="filterTypeKey"
          @update:value="handleFilterChange"
          style="width: 400px"
        >
          <n-tab name="all">{{ $t('cabinet.messages.all') }}</n-tab>
          <n-tab name="unread">
            <n-space size="small" align="center">
              {{ $t('cabinet.messages.unread') }}
              <n-badge v-if="unreadCount > 0" :value="unreadCount" type="error" />
            </n-space>
          </n-tab>
          <n-tab name="read">{{ $t('cabinet.messages.read') }}</n-tab>
        </n-tabs>
      </n-space>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <div v-else-if="error" class="error-state">
        <n-alert type="error" :title="$t('common.error')" closable>
          {{ error }}
        </n-alert>
      </div>

      <div v-else class="messages-content">
        <n-card v-if="filteredMessages.length === 0" bordered class="empty-card">
          <n-empty :description="$t('cabinet.messages.noMessages')">
            <template #extra>
              <n-text depth="3">{{ $t('cabinet.messages.emptyInboxDescription') || 'Your inbox is clear!' }}</n-text>
            </template>
          </n-empty>
        </n-card>

        <n-list v-else hoverable clickable bordered class="messages-list">
          <n-list-item
            v-for="message in filteredMessages"
            :key="message.id"
            @click="openMessage(message)"
            :class="{ 'unread-item': !message.is_read }"
          >
            <n-thing
              :title="message.message_title"
              content-indented
            >
              <template #header-extra>
                <n-space align="center">
                  <n-tag v-if="!message.is_read" type="error" size="small" round strong uppercase>
                    {{ $t('cabinet.messages.new') }}
                  </n-tag>
                  <n-icon depth="3" size="20"><chevron-icon /></n-icon>
                </n-space>
              </template>

              <template #avatar>
                <n-avatar
                  round
                  size="large"
                  :style="{ backgroundColor: message.is_read ? '#f5f7f9' : 'rgba(24, 160, 88, 0.1)' }"
                >
                  <n-icon :color="message.is_read ? '#999' : '#18a058'"><user-icon /></n-icon>
                </n-avatar>
              </template>

              <template #description>
                <n-space size="small" align="center">
                  <n-text strong>{{ message.sender_name || message.sender_username }}</n-text>
                  <n-divider vertical />
                  <n-space align="center" :size="4">
                    <n-icon size="14" depth="3"><time-icon /></n-icon>
                    <n-text depth="3" size="small">{{ formatDate(message.message_created_at || '') }}</n-text>
                  </n-space>
                </n-space>
              </template>

              <n-text depth="2" class="message-preview">
                {{ truncateText(message.message_content || '', 180) }}
              </n-text>

              <template #footer>
                <n-space justify="space-between" align="center">
                  <n-text v-if="message.is_read && message.read_at" depth="3" size="small">
                    {{ $t('cabinet.messages.readAt') || 'Read' }}: {{ formatDate(message.read_at) }}
                  </n-text>
                  <n-text v-else italic depth="3" size="small">
                    Unread message
                  </n-text>
                </n-space>
              </template>
            </n-thing>
          </n-list-item>
        </n-list>
      </div>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '@/apps/cabinet/layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NButton, NIcon, NTabs, NTab, NBadge, 
  NSpin, NAlert, NCard, NEmpty, NList, NListItem, NThing, NAvatar, NTag, NDivider
} from 'naive-ui'
import { 
  CheckmarkDoneCircleOutline as MarkReadIcon,
  PersonOutline as UserIcon,
  TimeOutline as TimeIcon,
  ChevronForwardOutline as ChevronIcon
} from '@vicons/ionicons5'
import { useMailingApi, type MessageRecipient } from '@/composables/useMailingApi'
import { useMailingStore } from '@/stores/mailingStore'

const router = useRouter()
const { t, locale } = useI18n()
const mailingApi = useMailingApi()
const mailingStore = useMailingStore()

const messages = ref<MessageRecipient[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const markingAll = ref(false)

// Naive UI tabs work better with string names
const filterTypeKey = ref<'all' | 'unread' | 'read'>('all')

const unreadCount = computed(() => mailingStore.unreadCount)

const filteredMessages = computed(() => {
  if (!messages.value || messages.value.length === 0) return []
  if (filterTypeKey.value === 'all') return messages.value
  const isRead = filterTypeKey.value === 'read'
  return messages.value.filter(m => m.is_read === isRead)
})

const handleFilterChange = (value: string) => {
  // Filtering is done client-side via computed property
}

const loadMessages = async () => {
  try {
    loading.value = true
    error.value = null
    // Fetch all messages and filter client-side for smoother experience
    messages.value = await mailingApi.fetchMyMessages()
    await mailingStore.refreshUnreadCount()
  } catch (err: any) {
    error.value = err.message || t('cabinet.messages.loadError')
  } finally {
    loading.value = false
  }
}

const openMessage = (message: MessageRecipient) => {
  router.push(`/cabinet/messages/${message.id}`)
}

const handleMarkAllRead = async () => {
  try {
    markingAll.value = true
    await mailingApi.markAllAsRead()
    messages.value.forEach(m => {
      m.is_read = true
      m.read_at = new Date().toISOString()
    })
    mailingStore.setUnreadCount(0)
  } catch (err: any) {
    console.error(err)
  } finally {
    markingAll.value = false
  }
}

const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return ''
  return text.length <= maxLength ? text : text.substring(0, maxLength) + '...'
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  const dateLocale = locale.value === 'ru' ? 'ru-RU' : locale.value === 'tm' ? 'tk-TM' : 'en-US'
  return new Date(dateString).toLocaleDateString(dateLocale, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

onMounted(() => loadMessages())
</script>

<style scoped>
.messages-page {
  max-width: 1000px;
  margin: 0 auto;
}

.empty-card {
  padding: 4rem 0;
  text-align: center;
}

.messages-list {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
}

.unread-item {
  background-color: #fbfdff;
  border-left: 4px solid #18a058;
}

.message-preview {
  display: block;
  margin-top: 8px;
  line-height: 1.6;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
