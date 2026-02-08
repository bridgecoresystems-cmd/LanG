<template>
  <CabinetLayout>
    <n-space vertical size="large" class="message-detail-page">
      <!-- Header -->
      <div class="message-header">
        <n-space justify="space-between" align="center">
          <n-space align="center" size="large">
            <n-button
              circle
              secondary
              @click="$router.push('/cabinet/messages')"
            >
              <template #icon>
                <n-icon><arrow-back-icon /></n-icon>
              </template>
            </n-button>
            <div>
              <n-h1 style="margin: 0;">{{ message?.message_title || $t('cabinet.messages.detail.title') }}</n-h1>
              <n-text depth="3">{{ $t('cabinet.messages.description') }}</n-text>
            </div>
          </n-space>
          
          <n-button
            v-if="message && !message.is_read"
            type="primary"
            round
            @click="handleMarkAsRead"
            :loading="marking"
          >
            <template #icon>
              <n-icon><checkmark-icon /></n-icon>
            </template>
            {{ $t('cabinet.messages.markAsRead') }}
          </n-button>
        </n-space>
      </div>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <n-grid v-else-if="message" cols="1 m:12" responsive="screen" :x-gap="24" :y-gap="24">
        <!-- Message Content -->
        <n-gi span="1 m:8">
          <n-card bordered class="content-card">
            <template #header>
              <n-space align="center" size="small">
                <n-icon color="#18a058" size="20"><mail-icon /></n-icon>
                <n-text strong>{{ $t('cabinet.mailing.detail.content') }}</n-text>
              </n-space>
            </template>
            
            <div class="message-body">
              <n-text style="white-space: pre-wrap; font-size: 1.1rem; line-height: 1.8;">
                {{ message.message_content }}
              </n-text>
            </div>
          </n-card>
        </n-gi>

        <!-- Sidebar Info -->
        <n-gi span="1 m:4">
          <n-space vertical size="large">
            <n-card bordered>
              <template #header>
                <n-space align="center" size="small">
                  <n-icon color="#18a058" size="20"><info-icon /></n-icon>
                  <n-text strong>{{ $t('cabinet.mailing.detail.info') }}</n-text>
                </n-space>
              </template>

              <n-space vertical size="large">
                <!-- Sender -->
                <div class="info-item sender-box">
                  <n-space align="center" size="medium">
                    <n-avatar round size="large">
                      <n-icon><user-icon /></n-icon>
                    </n-avatar>
                    <n-space vertical :size="4">
                      <n-text depth="3" strong uppercase>{{ $t('cabinet.messages.from') }}</n-text>
                      <n-text strong>{{ message.sender_name || message.sender_username }}</n-text>
                    </n-space>
                  </n-space>
                </div>

                <n-divider style="margin: 8px 0;" />

                <!-- Status -->
                <n-space justify="space-between" align="center">
                  <n-text depth="3" strong uppercase>{{ $t('cabinet.mailing.detail.status') }}</n-text>
                  <n-tag :type="message.is_read ? 'success' : 'error'" round size="small" :bordered="false" strong>
                    {{ message.is_read ? $t('cabinet.messages.read') : $t('cabinet.messages.unread') }}
                  </n-tag>
                </n-space>

                <!-- Dates -->
                <n-space vertical size="small">
                  <n-text depth="3" strong uppercase>{{ $t('cabinet.messages.date') }}</n-text>
                  <n-space align="center" size="small">
                    <n-icon color="#18a058"><calendar-icon /></n-icon>
                    <n-text>{{ formatDate(message.message_created_at) }}</n-text>
                  </n-space>
                </n-space>

                <n-space v-if="message.read_at" vertical size="small">
                  <n-text depth="3" strong uppercase>{{ $t('cabinet.mailing.detail.sentAt') }} (Read At)</n-text>
                  <n-space align="center" size="small">
                    <n-icon color="#18a058"><checkmark-circle-icon /></n-icon>
                    <n-text type="success" strong>{{ formatDate(message.read_at) }}</n-text>
                  </n-space>
                </n-space>
              </n-space>
            </n-card>
          </n-space>
        </n-gi>
      </n-grid>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '@/apps/cabinet/layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NButton, NIcon, NCard, NAvatar, NTag, 
  NSpin, NGrid, NGi, NDivider
} from 'naive-ui'
import { 
  ArrowBackOutline as ArrowBackIcon,
  CheckmarkOutline as CheckmarkIcon,
  MailOutline as MailIcon,
  InformationCircleOutline as InfoIcon,
  PersonOutline as UserIcon,
  CalendarOutline as CalendarIcon,
  CheckmarkCircleOutline as CheckmarkCircleIcon
} from '@vicons/ionicons5'
import { useMailingApi, type MessageRecipient } from '@/composables/useMailingApi'
import { useMailingStore } from '@/stores/mailingStore'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const mailingApi = useMailingApi()
const mailingStore = useMailingStore()

const message = ref<MessageRecipient | null>(null)
const loading = ref(true)
const marking = ref(false)

const loadMessage = async () => {
  try {
    loading.value = true
    const id = parseInt(route.params.id as string)
    const myMessages = await mailingApi.fetchMyMessages()
    const found = myMessages.find(m => m.id === id)
    
    if (found) {
      message.value = found
      // If unread, mark as read automatically
      if (!found.is_read) {
        await handleMarkAsRead()
      }
    } else {
      router.push('/cabinet/messages')
    }
  } catch (err) {
    console.error('Failed to load message:', err)
  } finally {
    loading.value = false
  }
}

const handleMarkAsRead = async () => {
  if (!message.value || message.value.is_read) return
  try {
    marking.value = true
    await mailingApi.markAsRead(message.value.id)
    message.value.is_read = true
    message.value.read_at = new Date().toISOString()
    await mailingStore.refreshUnreadCount()
  } catch (err) {
    console.error('Failed to mark message as read:', err)
  } finally {
    marking.value = false
  }
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—'
  const dateLocale = locale.value === 'ru' ? 'ru-RU' : locale.value === 'tm' ? 'tk-TM' : 'en-US'
  return new Date(dateString).toLocaleDateString(dateLocale, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

onMounted(() => {
  loadMessage()
})
</script>

<style scoped>
.message-detail-page {
  max-width: 1200px;
  margin: 0 auto;
}

.message-body {
  padding: 16px;
  background-color: #f5f7f9;
  border-radius: 12px;
}

.sender-box {
  padding: 12px;
  background-color: rgba(24, 160, 88, 0.05);
  border-radius: 12px;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
