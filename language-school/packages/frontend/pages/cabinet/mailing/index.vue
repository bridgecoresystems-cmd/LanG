<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Мои сообщения</NH1>
        <p class="page-header__subtitle">Входящие уведомления и рассылки от школы</p>
      </div>
      <div class="page-header__actions">
        <NButton
          v-if="unreadCount > 0"
          secondary
          round
          @click="handleMarkAllRead"
          :loading="markingAll"
        >
          <template #icon>
            <NIcon><component :is="MarkReadIcon" /></NIcon>
          </template>
          Прочитать все
        </NButton>
      </div>
    </header>

    <NSpace vertical size="large">
      <NTabs type="segment" v-model:value="filterKey" class="filter-tabs">
        <NTab name="all">Все</NTab>
        <NTab name="unread">
          <NSpace size="small" align="center">
            Непрочитанные
            <NBadge v-if="unreadCount > 0" :value="unreadCount" type="error" />
          </NSpace>
        </NTab>
        <NTab name="read">Прочитанные</NTab>
      </NTabs>

      <div v-if="pending" class="grid grid-cols-1 gap-4">
        <NSkeleton v-for="i in 3" :key="i" :height="100" :sharp="false" />
      </div>

      <div v-else-if="filteredMessages.length > 0" class="messages-list">
        <NCard
          v-for="msg in filteredMessages"
          :key="msg.id"
          class="cabinet-card message-card"
          :class="{ 'unread-card': !msg.is_read }"
          hoverable
          @click="openMessage(msg)"
        >
          <div class="message-card__content">
            <div class="message-card__avatar">
              <NAvatar
                round
                size="medium"
                :style="{ backgroundColor: msg.is_read ? '#f5f7f9' : 'rgba(24, 160, 88, 0.1)' }"
              >
                <NIcon :color="msg.is_read ? '#999' : '#18a058'">
                  <component :is="MailIcon" />
                </NIcon>
              </NAvatar>
            </div>
            <div class="message-card__main">
              <div class="message-card__header">
                <div class="message-card__title">{{ msg.title }}</div>
                <div class="message-card__date">{{ formatDate(msg.received_at) }}</div>
              </div>
              <div class="message-card__sender">От: {{ msg.sender }}</div>
              <div class="message-card__preview">{{ truncateText(msg.content, 120) }}</div>
            </div>
            <div class="message-card__arrow">
              <NIcon size="20" depth="3">
                <component :is="ChevronIcon" />
              </NIcon>
            </div>
          </div>
        </NCard>
      </div>

      <div v-else class="empty-state">
        <NEmpty description="Сообщений пока нет">
          <template #icon>
            <NIcon><component :is="MailIcon" /></NIcon>
          </template>
        </NEmpty>
      </div>
    </NSpace>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  NH1, NButton, NIcon, NCard, NBadge, NSpace, NTabs, NTab, NEmpty, NSkeleton, NAvatar, useMessage 
} from 'naive-ui'
import { 
  MailOutline as MailIcon,
  CheckmarkDoneCircleOutline as MarkReadIcon,
  ChevronForwardOutline as ChevronIcon
} from '@vicons/ionicons5'
import { useCabinetMailing } from '~/composables/useCabinetMailing'

definePageMeta({ 
  layout: 'cabinet', 
  middleware: 'cabinet-auth' 
})

const mailingApi = useCabinetMailing()
const message = useMessage()

const messages = ref<any[]>([])
const pending = ref(true)
const markingAll = ref(false)
const filterKey = ref('all')

const unreadCount = computed(() => messages.value.filter(m => !m.is_read).length)

const filteredMessages = computed(() => {
  if (filterKey.value === 'all') return messages.value
  const isRead = filterKey.value === 'read'
  return messages.value.filter(m => m.is_read === isRead)
})

const loadMessages = async () => {
  pending.value = true
  try {
    messages.value = await mailingApi.getMyMessages()
  } catch (e) {
    console.error(e)
  } finally {
    pending.value = false
  }
}

const openMessage = (msg: any) => {
  navigateTo(`/cabinet/mailing/${msg.id}`)
}

const handleMarkAllRead = async () => {
  markingAll.value = true
  try {
    await mailingApi.markAllAsRead()
    messages.value.forEach(m => m.is_read = true)
    message.success('Все сообщения помечены как прочитанные')
  } catch (e) {
    message.error('Ошибка при обновлении')
  } finally {
    markingAll.value = false
  }
}

const truncateText = (text: string, max: number) => {
  return text.length > max ? text.slice(0, max) + '...' : text
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

onMounted(() => loadMessages())
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
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

.filter-tabs {
  margin-bottom: 8px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-card {
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.unread-card {
  background-color: #fbfdff;
  border-left: 4px solid #18a058;
}

.message-card__content {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 4px;
}

.message-card__main {
  flex: 1;
}

.message-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-card__title {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--n-text-color-1);
}

.message-card__date {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.message-card__sender {
  font-size: 13px;
  color: #18a058;
  font-weight: 600;
  margin-bottom: 4px;
}

.message-card__preview {
  font-size: 14px;
  color: var(--n-text-color-2);
  line-height: 1.4;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}
</style>
