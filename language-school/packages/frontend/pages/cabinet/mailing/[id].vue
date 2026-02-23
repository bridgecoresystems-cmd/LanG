<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NButton
          text
          icon-placement="left"
          @click="navigateTo('/cabinet/mailing')"
          class="back-link"
        >
          <template #icon>
            <NIcon><component :is="BackIcon" /></NIcon>
          </template>
          Назад к списку
        </NButton>
        <NH1 class="page-header__title" v-if="message">{{ message.title }}</NH1>
      </div>
    </header>

    <div v-if="pending" class="space-y-4">
      <NSkeleton :height="200" :sharp="false" />
    </div>

    <NCard v-else-if="message" class="cabinet-card detail-card">
      <div class="message-meta">
        <div class="meta-item">
          <NIcon><component :is="UserIcon" /></NIcon>
          <span>Отправитель: <strong>{{ message.sender }}</strong></span>
        </div>
        <div class="meta-item">
          <NIcon><component :is="TimeIcon" /></NIcon>
          <span>Получено: {{ formatDate(message.received_at) }}</span>
        </div>
      </div>

      <NDivider />

      <div class="message-body">
        {{ message.content }}
      </div>
    </NCard>

    <div v-else class="empty-state">
      <NEmpty description="Сообщение не найдено" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  NH1, NButton, NIcon, NCard, NDivider, NSkeleton, NEmpty 
} from 'naive-ui'
import { 
  ArrowBackOutline as BackIcon,
  PersonOutline as UserIcon,
  TimeOutline as TimeIcon
} from '@vicons/ionicons5'
import { useCabinetMailing } from '~/composables/useCabinetMailing'

definePageMeta({ 
  layout: 'cabinet', 
  middleware: 'cabinet-auth' 
})

const route = useRoute()
const mailingApi = useCabinetMailing()
const messageId = parseInt(route.params.id as string)

const message = ref<any>(null)
const pending = ref(true)

const loadMessage = async () => {
  pending.value = true
  try {
    // В нашем API список возвращает все нужные поля, найдем конкретное сообщение
    const all = await mailingApi.getMyMessages()
    const found = all.find((m: any) => m.id === messageId)
    if (found) {
      message.value = found
      // Помечаем как прочитанное
      if (!found.is_read) {
        await mailingApi.markAsRead(messageId)
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    pending.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('ru-RU', { 
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

onMounted(() => loadMessage())
</script>

<style scoped>
.cabinet-page {
  padding-bottom: 40px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.back-link {
  margin-bottom: 12px;
  color: #18a058;
}

.page-header__title {
  margin: 0;
  font-weight: 800;
  font-size: 1.75rem;
}

.detail-card {
  border-radius: 20px;
  padding: 12px;
}

.message-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--n-text-color-3);
}

.message-body {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--n-text-color-2);
  white-space: pre-wrap;
  padding: 12px 0;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}
</style>
