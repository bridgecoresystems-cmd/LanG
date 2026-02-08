<template>
  <CabinetLayout>
    <n-space vertical size="large" class="head-teacher-page">
      <div class="page-header">
        <n-space justify="space-between" align="center">
          <n-space align="center" size="large">
            <n-button
              circle
              secondary
              @click="$router.push('/cabinet/head-teacher/mailing')"
            >
              <template #icon>
                <n-icon><arrow-back-icon /></n-icon>
              </template>
            </n-button>
            <div>
              <n-h1 style="margin: 0;">{{ mailing?.title || $t('cabinet.mailing.detail.title') }}</n-h1>
              <n-text depth="3">{{ $t('cabinet.mailing.detail.description') }}</n-text>
            </div>
          </n-space>
        </n-space>
      </div>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <n-alert v-else-if="error" type="error" closable>
        {{ error }}
      </n-alert>

      <n-grid v-else-if="mailing" cols="1 m:12" responsive="screen" :x-gap="24" :y-gap="24">
        <!-- Content Card -->
        <n-gi span="1 m:8">
          <n-card bordered class="content-card">
            <template #header>
              <n-space align="center">
                <n-icon size="24" color="#18a058"><content-icon /></n-icon>
                <n-h3 style="margin: 0;">{{ $t('cabinet.mailing.detail.content') }}</n-h3>
              </n-space>
            </template>
            <div class="mailing-content-box">
              <n-text style="white-space: pre-wrap; font-size: 1.1rem; line-height: 1.6;">
                {{ mailing.content }}
              </n-text>
            </div>
          </n-card>

          <!-- Recipients List -->
          <n-card v-if="mailing.is_sent && recipients.length > 0" bordered class="q-mt-md">
            <template #header>
              <n-space align="center">
                <n-icon size="24" color="#18a058"><people-icon /></n-icon>
                <n-h3 style="margin: 0;">{{ $t('cabinet.mailing.detail.recipients') }} ({{ recipients.length }})</n-h3>
              </n-space>
            </template>
            <n-list :show-divider="true">
              <n-list-item v-for="recipient in recipients" :key="recipient.id">
                <n-space justify="space-between" align="center" style="width: 100%;">
                  <n-space align="center">
                    <n-avatar round size="small" :style="{ backgroundColor: recipient.is_read ? '#18a058' : '#999' }">
                      {{ recipient.recipient_name?.charAt(0)?.toUpperCase() || recipient.recipient_username?.charAt(0)?.toUpperCase() || '?' }}
                    </n-avatar>
                    <n-space vertical size="small">
                      <n-text strong>{{ recipient.recipient_name || recipient.recipient_username || '—' }}</n-text>
                      <n-text depth="3" style="font-size: 12px;">{{ recipient.recipient_username }}</n-text>
                    </n-space>
                  </n-space>
                  <n-space align="center">
                    <n-tag :type="recipient.is_read ? 'success' : 'warning'" size="small" round>
                      {{ recipient.is_read ? $t('cabinet.mailing.detail.read') : $t('cabinet.mailing.detail.unread') }}
                    </n-tag>
                    <n-text v-if="recipient.read_at" depth="3" style="font-size: 12px;">
                      {{ formatDate(recipient.read_at) }}
                    </n-text>
                  </n-space>
                </n-space>
              </n-list-item>
            </n-list>
          </n-card>
        </n-gi>

        <!-- Sidebar Info -->
        <n-gi span="1 m:4">
          <n-space vertical size="large">
            <n-card bordered class="info-card">
              <template #header>
                <n-space align="center">
                  <n-icon size="24" color="#18a058"><info-icon /></n-icon>
                  <n-h3 style="margin: 0;">{{ $t('cabinet.mailing.detail.info') }}</n-h3>
                </n-space>
              </template>
              
              <n-list :show-divider="false">
                <n-list-item>
                  <n-space vertical size="small">
                    <n-text depth="3">{{ $t('cabinet.mailing.detail.status') }}</n-text>
                    <n-tag :type="getStatusType(mailing.is_sent)" round>
                      {{ mailing.is_sent ? $t('cabinet.mailing.list.sent') : $t('cabinet.mailing.list.draft') }}
                    </n-tag>
                  </n-space>
                </n-list-item>
                
                <n-list-item>
                  <n-space vertical size="small">
                    <n-text depth="3">{{ $t('cabinet.mailing.detail.recipientType') }}</n-text>
                    <n-tag secondary round>
                      {{ mailing.recipient_type_display || mailing.recipient_type }}
                    </n-tag>
                  </n-space>
                </n-list-item>

                <n-list-item v-if="mailing.scheduled_at">
                  <n-space vertical size="small">
                    <n-text depth="3">{{ $t('cabinet.mailing.detail.scheduledAt') }}</n-text>
                    <n-text strong>
                      {{ formatDate(mailing.scheduled_at) }}
                    </n-text>
                  </n-space>
                </n-list-item>

                <n-list-item v-if="mailing.sent_at">
                  <n-space vertical size="small">
                    <n-text depth="3">{{ $t('cabinet.mailing.detail.sentAt') }}</n-text>
                    <n-text strong>
                      {{ formatDate(mailing.sent_at) }}
                    </n-text>
                  </n-space>
                </n-list-item>

                <n-list-item>
                  <n-space vertical size="small">
                    <n-text depth="3">{{ $t('cabinet.mailing.detail.stats') }}</n-text>
                    <n-space>
                      <n-badge :value="mailing.total_recipients || recipients.length || 0" type="info">
                        <n-tag secondary>{{ $t('cabinet.mailing.detail.recipients') }}</n-tag>
                      </n-badge>
                      <n-badge :value="readCount" type="success">
                        <n-tag secondary>{{ $t('cabinet.mailing.detail.read') }}</n-tag>
                      </n-badge>
                    </n-space>
                    <div v-if="mailing.is_sent && mailing.total_recipients > 0" class="q-mt-sm">
                      <n-progress
                        type="line"
                        :percentage="readPercentage"
                        :status="readPercentage === 100 ? 'success' : 'default'"
                        :show-indicator="true"
                      />
                      <n-text depth="3" style="font-size: 12px;">{{ readPercentage }}% {{ $t('cabinet.mailing.detail.read') }}</n-text>
                    </div>
                  </n-space>
                </n-list-item>
              </n-list>
            </n-card>

            <n-card bordered v-if="mailing.groups && mailing.groups.length > 0" :title="$t('admin.models.groups')">
              <n-space>
                <n-tag v-for="group in mailing.groups" :key="group.id" size="small" type="primary" ghost>
                  {{ group.name }}
                </n-tag>
              </n-space>
            </n-card>
          </n-space>
        </n-gi>
      </n-grid>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '@/apps/cabinet/layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NH3, NText, NCard, NTag, NGrid, NGi, 
  NList, NListItem, NBadge, NIcon, NSpin, NAlert,
  NAvatar, NProgress
} from 'naive-ui'
import { 
  ChevronBackOutline as ArrowBackIcon,
  DocumentTextOutline as ContentIcon,
  InformationCircleOutline as InfoIcon,
  PeopleOutline as PeopleIcon
} from '@vicons/ionicons5'
import { useMailingApi, type Message, type MessageRecipient } from '@/composables/useMailingApi'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const { t, locale } = useI18n()
const mailingApi = useMailingApi()
const authStore = useAuthStore()

const mailing = ref<Message | null>(null)
const recipients = ref<MessageRecipient[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const readCount = computed(() => {
  return recipients.value.filter(r => r.is_read).length
})

const readPercentage = computed(() => {
  if (!mailing.value || !mailing.value.total_recipients || mailing.value.total_recipients === 0) {
    return 0
  }
  return Math.round((readCount.value / mailing.value.total_recipients) * 100)
})

const loadMailing = async () => {
  try {
    loading.value = true
    error.value = null
    const id = parseInt(route.params.id as string)
    mailing.value = await mailingApi.fetchMessage(id)
    
    // Load recipients if message is sent
    if (mailing.value.is_sent) {
      await loadRecipients(id)
    }
  } catch (err: any) {
    console.error('Failed to load mailing:', err)
    error.value = err.response?.data?.detail || err.message || t('cabinet.mailing.detail.loadError')
  } finally {
    loading.value = false
  }
}

const loadRecipients = async (messageId: number) => {
  try {
    const token = authStore.accessToken
    const response = await axios.get(
      `http://localhost:8000/api/v1/mailing/messages/${messageId}/recipients/`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    recipients.value = response.data.recipients || []
  } catch (err: any) {
    console.error('Failed to load recipients:', err)
    // If endpoint doesn't exist or user doesn't have permission, just continue without recipients
  }
}

const getStatusType = (isSent: boolean) => {
  return isSent ? 'success' : 'default'
}

const formatDate = (dateString: string) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleString(locale.value === 'ru' ? 'ru-RU' : 'tk-TM', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadMailing()
})
</script>

<style scoped>
.head-teacher-page {
  max-width: 1200px;
  margin: 0 auto;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.content-card, .info-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.mailing-content-box {
  background-color: #f9f9f9;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #eee;
}
</style>
