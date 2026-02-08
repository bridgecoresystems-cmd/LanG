<template>
  <AdminLayout>
    <div class="admin-page">
      <q-inner-loading :showing="loading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>

      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <div v-if="!loading && !error && messageData" class="detail-page">
        <!-- Header -->
        <div class="row items-center q-mb-lg">
          <div class="col">
            <q-btn
              flat
              icon="arrow_back"
              :label="$t('common.back')"
              @click="router.push('/management/mailing')"
              class="q-mb-sm"
            />
            <h1 class="text-h4 q-ma-none">{{ messageData.title }}</h1>
          </div>
          <div class="col-auto q-gutter-sm">
            <q-btn
              v-if="!messageData.is_sent"
              color="positive"
              icon="send"
              :label="$t('admin.mailing.send')"
              @click="handleSend"
              :loading="sending"
            />
            <q-btn
              color="negative"
              icon="delete"
              :label="$t('admin.actions.delete')"
              @click="handleDelete"
            />
          </div>
        </div>

        <div class="row q-col-gutter-lg">
          <!-- Main Content -->
          <div class="col-12 col-md-8">
            <!-- Message Content -->
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <h2 class="text-h6 q-mb-md">
                  <q-icon name="description" class="q-mr-sm" />
                  {{ $t('admin.mailing.content') }}
                </h2>
                <div class="message-content" style="white-space: pre-wrap;">{{ messageData.content }}</div>
              </q-card-section>
            </q-card>

            <!-- Recipients List -->
            <q-card flat bordered>
              <q-card-section>
                <div class="row items-center justify-between q-mb-md">
                  <h2 class="text-h6 q-ma-none">
                    <q-icon name="people" class="q-mr-sm" />
                    {{ $t('admin.mailing.recipients') }} ({{ statistics?.total_recipients || 0 }})
                  </h2>
                  <q-input
                    v-model="recipientSearch"
                    :placeholder="$t('admin.search')"
                    outlined
                    dense
                    clearable
                    style="max-width: 300px;"
                  >
                    <template v-slot:prepend>
                      <q-icon name="search" />
                    </template>
                  </q-input>
                </div>

                <q-table
                  :rows="filteredRecipients"
                  :columns="recipientColumns"
                  row-key="id"
                  :pagination="{ rowsPerPage: 20 }"
                  :loading="loadingRecipients"
                >
                  <template v-slot:body-cell-recipient_name="props">
                    <q-td :props="props">
                      <div class="row items-center">
                        <q-avatar 
                          size="32px" 
                          :color="props.row.is_read ? 'positive' : 'grey-5'"
                          text-color="white"
                          class="q-mr-sm"
                        >
                          {{ (props.row.recipient_name?.charAt(0) || props.row.recipient_username?.charAt(0) || '?').toUpperCase() }}
                        </q-avatar>
                        <div>
                          <div class="text-weight-medium">{{ props.row.recipient_name || props.row.recipient_username || '—' }}</div>
                          <div class="text-caption text-grey-7">{{ props.row.recipient_username }}</div>
                        </div>
                      </div>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-is_read="props">
                    <q-td :props="props">
                      <q-badge
                        :color="props.row.is_read ? 'positive' : 'warning'"
                        :label="props.row.is_read ? $t('admin.mailing.read') : $t('admin.mailing.unread')"
                      />
                    </q-td>
                  </template>

                  <template v-slot:body-cell-read_at="props">
                    <q-td :props="props">
                      <span v-if="props.row.read_at">{{ formatDateTime(props.row.read_at) }}</span>
                      <span v-else class="text-grey-7">—</span>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-received_at="props">
                    <q-td :props="props">
                      {{ formatDateTime(props.row.received_at) }}
                    </q-td>
                  </template>
                </q-table>
              </q-card-section>
            </q-card>
          </div>

          <!-- Sidebar Stats -->
          <div class="col-12 col-md-4">
            <!-- Statistics Card -->
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <h2 class="text-h6 q-mb-md">
                  <q-icon name="analytics" class="q-mr-sm" />
                  {{ $t('admin.mailing.statistics') }}
                </h2>
                <div v-if="statistics">
                  <div class="stat-item q-mb-md">
                    <div class="stat-label">{{ $t('admin.mailing.createdBy') }}</div>
                    <div class="stat-value">{{ statistics.created_by?.full_name || statistics.created_by?.username || '-' }}</div>
                    <div class="stat-meta">{{ formatDateTime(statistics.created_at) }}</div>
                  </div>

                  <q-separator class="q-mb-md" />

                  <div class="stat-item q-mb-md">
                    <div class="stat-label">{{ $t('admin.mailing.status') }}</div>
                    <div class="stat-value">
                      <q-badge
                        :color="messageData.is_sent ? 'positive' : 'warning'"
                        :label="messageData.is_sent ? $t('admin.mailing.sent') : $t('admin.mailing.draft')"
                      />
                    </div>
                    <div v-if="messageData.sent_at" class="stat-meta">{{ formatDateTime(messageData.sent_at) }}</div>
                  </div>

                  <q-separator class="q-mb-md" />

                  <div class="stat-item q-mb-md">
                    <div class="stat-label">{{ $t('admin.mailing.totalRecipients') }}</div>
                    <div class="stat-value text-h6">{{ statistics.total_recipients || 0 }}</div>
                  </div>

                  <div class="stat-item q-mb-md">
                    <div class="stat-label">{{ $t('admin.mailing.readCount') }}</div>
                    <div class="stat-value text-h6 text-positive">{{ statistics.read_count || 0 }}</div>
                  </div>

                  <div class="stat-item q-mb-md">
                    <div class="stat-label">{{ $t('admin.mailing.unreadCount') }}</div>
                    <div class="stat-value text-h6 text-warning">{{ statistics.unread_count || 0 }}</div>
                  </div>

                  <q-separator class="q-mb-md" />

                  <div class="stat-item">
                    <div class="stat-label">{{ $t('admin.mailing.readPercentage') }}</div>
                    <div class="stat-value text-h6">{{ statistics.read_percentage || 0 }}%</div>
                    <q-linear-progress
                      :value="(statistics.read_percentage || 0) / 100"
                      color="positive"
                      class="q-mt-sm"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- Message Info -->
            <q-card flat bordered>
              <q-card-section>
                <h2 class="text-h6 q-mb-md">
                  <q-icon name="info" class="q-mr-sm" />
                  {{ $t('admin.mailing.info') }}
                </h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label class="info-label">{{ $t('admin.mailing.recipientType') }}</label>
                    <div class="info-value">{{ messageData.recipient_type_display }}</div>
                  </div>
                  <div class="info-item">
                    <label class="info-label">{{ $t('admin.mailing.createdAt') }}</label>
                    <div class="info-value">{{ formatDateTime(messageData.created_at) }}</div>
                  </div>
                  <div v-if="messageData.scheduled_at" class="info-item">
                    <label class="info-label">{{ $t('admin.mailing.scheduledAt') }}</label>
                    <div class="info-value">{{ formatDateTime(messageData.scheduled_at) }}</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { useMailingApi, type Message, type MessageRecipient } from '@/composables/useMailingApi'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()
const mailingApi = useMailingApi()

const messageData = ref<Message | null>(null)
const statistics = ref<any>(null)
const recipients = ref<MessageRecipient[]>([])
const loading = ref(false)
const loadingRecipients = ref(false)
const error = ref<string | null>(null)
const sending = ref(false)
const recipientSearch = ref('')

const recipientColumns = computed(() => [
  {
    name: 'recipient_name',
    label: t('admin.mailing.recipient'),
    field: 'recipient_name',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'is_read',
    label: t('admin.mailing.status'),
    field: 'is_read',
    align: 'center' as const,
    sortable: true
  },
  {
    name: 'read_at',
    label: t('admin.mailing.readAt'),
    field: 'read_at',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'received_at',
    label: t('admin.mailing.receivedAt'),
    field: 'received_at',
    align: 'left' as const,
    sortable: true
  }
])

const filteredRecipients = computed(() => {
  if (!recipientSearch.value) return recipients.value
  
  const query = recipientSearch.value.toLowerCase()
  return recipients.value.filter(r =>
    (r.recipient_name && r.recipient_name.toLowerCase().includes(query)) ||
    (r.recipient_username && r.recipient_username.toLowerCase().includes(query))
  )
})

const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY-MM-DD HH:mm')
}

const loadMessage = async () => {
  const messageId = parseInt(route.params.id as string)
  if (!messageId) {
    error.value = 'Invalid message ID'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Load message
    messageData.value = await mailingApi.fetchMessage(messageId)
    
    // Load statistics
    if (messageData.value.is_sent) {
      await loadStatistics(messageId)
      await loadRecipients(messageId)
    }
  } catch (err: any) {
    error.value = err.response?.data?.detail || err.message || 'Failed to load message'
  } finally {
    loading.value = false
  }
}

const loadStatistics = async (messageId: number) => {
  try {
    const token = authStore.accessToken
    const response = await axios.get(
      `http://localhost:8000/api/v1/mailing/messages/${messageId}/statistics/`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    statistics.value = response.data
  } catch (err: any) {
    console.error('Failed to load statistics:', err)
  }
}

const loadRecipients = async (messageId: number) => {
  loadingRecipients.value = true
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
  } finally {
    loadingRecipients.value = false
  }
}

const handleSend = async () => {
  if (!messageData.value) return
  
  sending.value = true
  try {
    await mailingApi.sendMessage(messageData.value.id)
    await loadMessage()
  } catch (err: any) {
    console.error('Failed to send message:', err)
  } finally {
    sending.value = false
  }
}

const handleDelete = async () => {
  if (!messageData.value) return
  
  if (confirm(t('admin.confirmDelete'))) {
    try {
      await mailingApi.deleteMessage(messageData.value.id)
      router.push('/management/mailing')
    } catch (err: any) {
      console.error('Failed to delete message:', err)
    }
  }
}

onMounted(() => {
  loadMessage()
})
</script>

<style scoped>
.detail-page {
  padding: 0;
}

.message-content {
  line-height: 1.6;
  color: #333;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-meta {
  font-size: 0.75rem;
  color: #999;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 4px;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
}
</style>

