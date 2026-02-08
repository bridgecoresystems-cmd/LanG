<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.mailing.title') }}</h1>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            :label="$t('admin.mailing.create')"
            icon="add"
            @click="$router.push('/management/mailing/add')"
          />
        </div>
      </div>

      <!-- Filters -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model="searchQuery"
                :placeholder="$t('admin.search')"
                outlined
                dense
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="statusFilter"
                :options="statusOptions"
                :label="$t('admin.filters.status')"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="createdByFilter"
                :options="createdByOptions"
                :label="$t('admin.mailing.createdBy')"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Loading State -->
      <q-inner-loading :showing="loading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>

      <!-- Error State -->
      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <!-- Mailing Table -->
      <q-card v-if="!loading && !error" flat bordered>
        <q-card-section>
          <q-table
            :rows="sortedItems"
            :columns="columns"
            row-key="id"
            :loading="loading"
            v-model:pagination="pagination"
            :rows-per-page-options="[10, 20, 50, 100]"
            @row-click="(evt, row) => viewDetail(row.id)"
            class="cursor-pointer admin-table"
            binary-state-sort
          >
            <template v-slot:body-cell-title="props">
              <q-td :props="props">
                <div class="text-weight-medium">{{ props.row.title }}</div>
                <div class="text-caption text-grey-7">{{ props.row.recipient_type_display }}</div>
              </q-td>
            </template>

            <template v-slot:body-cell-created_by="props">
              <q-td :props="props">
                <div>
                  <div class="text-weight-medium">{{ props.row.created_by_name || props.row.created_by_username }}</div>
                  <div class="text-caption text-grey-7">{{ formatDate(props.row.created_at) }}</div>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="props.row.is_sent ? 'positive' : 'warning'"
                  :label="props.row.is_sent ? $t('admin.mailing.sent') : $t('admin.mailing.draft')"
                />
              </q-td>
            </template>

            <template v-slot:body-cell-recipients="props">
              <q-td :props="props">
                <div class="row items-center">
                  <q-icon name="people" size="16px" class="q-mr-xs" />
                  <span>{{ props.row.total_recipients || 0 }}</span>
                </div>
              </q-td>
            </template>

            <template v-slot:body-cell-progress="props">
              <q-td :props="props">
                <div v-if="props.row.is_sent && props.row.read_count !== undefined">
                  <div class="row items-center q-mb-xs">
                    <q-linear-progress
                      :value="props.row.read_percentage / 100"
                      color="positive"
                      style="width: 100px; height: 8px;"
                      class="q-mr-sm"
                    />
                    <span class="text-caption">{{ props.row.read_percentage }}%</span>
                  </div>
                  <div class="text-caption text-grey-7">
                    {{ props.row.read_count || 0 }} / {{ props.row.total_recipients || 0 }} {{ $t('admin.mailing.read') }}
                  </div>
                </div>
                <span v-else class="text-grey-7">—</span>
              </q-td>
            </template>

            <template v-slot:body-cell-sent_at="props">
              <q-td :props="props">
                <div v-if="props.row.sent_at">
                  <div>{{ formatDate(props.row.sent_at) }}</div>
                  <div class="text-caption text-grey-7">{{ formatTime(props.row.sent_at) }}</div>
                </div>
                <span v-else class="text-grey-7">—</span>
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props" @click.stop>
                <q-btn
                  flat
                  round
                  dense
                  icon="visibility"
                  color="info"
                  @click.stop="viewDetail(props.row.id)"
                  class="q-mr-xs"
                  :title="$t('admin.actions.view')"
                />
                <q-btn
                  v-if="!props.row.is_sent"
                  flat
                  round
                  dense
                  icon="send"
                  color="positive"
                  @click.stop="handleSend(props.row.id)"
                  class="q-mr-xs"
                  :title="$t('admin.mailing.send')"
                  :loading="sending === props.row.id"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  @click.stop="handleDelete(props.row.id)"
                  :title="$t('admin.actions.delete')"
                />
              </q-td>
            </template>

            <template v-slot:no-data>
              <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
                <q-icon name="inbox" size="2em" />
                <span>{{ $t('admin.table.noData') }}</span>
              </div>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { useMailingApi, type Message } from '@/composables/useMailingApi'
import dayjs from 'dayjs'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const mailingApi = useMailingApi()

const searchQuery = ref('')
const statusFilter = ref('')
const createdByFilter = ref<number | null>(null)
const items = ref<Message[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const sending = ref<number | null>(null)
const createdByUsers = ref<any[]>([])

const pagination = ref({
  sortBy: 'id',
  descending: true,
  page: 1,
  rowsPerPage: 20
})

const statusOptions = [
  { label: t('admin.filters.all'), value: '' },
  { label: t('admin.mailing.sent'), value: 'sent' },
  { label: t('admin.mailing.draft'), value: 'draft' }
]

const createdByOptions = computed(() => [
  { label: t('admin.filters.all'), value: null },
  ...createdByUsers.value.map(user => ({
    label: user.full_name || user.username,
    value: user.id
  }))
])

const columns = computed(() => [
  {
    name: 'id',
    label: t('admin.table.id'),
    field: 'id',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'title',
    label: t('admin.mailing.title'),
    field: 'title',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'created_by',
    label: t('admin.mailing.createdBy'),
    field: 'created_by_name',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'status',
    label: t('admin.table.status'),
    field: 'is_sent',
    align: 'center' as const,
    sortable: true
  },
  {
    name: 'recipients',
    label: t('admin.mailing.recipients'),
    field: 'total_recipients',
    align: 'center' as const,
    sortable: true
  },
  {
    name: 'progress',
    label: t('admin.mailing.progress'),
    field: 'read_percentage',
    align: 'center' as const,
    sortable: true
  },
  {
    name: 'sent_at',
    label: t('admin.mailing.sentAt'),
    field: 'sent_at',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'actions',
    label: t('admin.table.actions'),
    field: 'actions',
    align: 'center' as const
  }
])

const filteredItems = computed(() => {
  let filtered = items.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(query) ||
      (item.created_by_name && item.created_by_name.toLowerCase().includes(query)) ||
      (item.recipient_type_display && item.recipient_type_display.toLowerCase().includes(query))
    )
  }

  if (statusFilter.value) {
    if (statusFilter.value === 'sent') {
      filtered = filtered.filter(item => item.is_sent)
    } else if (statusFilter.value === 'draft') {
      filtered = filtered.filter(item => !item.is_sent)
    }
  }

  if (createdByFilter.value) {
    filtered = filtered.filter(item => item.created_by === createdByFilter.value)
  }

  return filtered
})

const sortedItems = computed(() => {
  const sortBy = pagination.value.sortBy
  const descending = pagination.value.descending
  
  if (sortBy) {
    const sorted = [...filteredItems.value]
    sorted.sort((a, b) => {
      let aVal: any
      let bVal: any
      
      if (sortBy === 'sent_at' || sortBy === 'created_at') {
        aVal = a[sortBy] ? new Date(a[sortBy]).getTime() : 0
        bVal = b[sortBy] ? new Date(b[sortBy]).getTime() : 0
      } else if (sortBy === 'read_percentage') {
        aVal = (a as any).read_percentage || 0
        bVal = (b as any).read_percentage || 0
      } else {
        aVal = a[sortBy as keyof Message]
        bVal = b[sortBy as keyof Message]
      }
      
      if (aVal == null) return 1
      if (bVal == null) return -1
      
      if (aVal < bVal) return descending ? 1 : -1
      if (aVal > bVal) return descending ? -1 : 1
      return 0
    })
    return sorted
  }
  
  return filteredItems.value
})

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return dayjs(dateString).format('YYYY-MM-DD')
}

const formatTime = (dateString: string) => {
  if (!dateString) return ''
  return dayjs(dateString).format('HH:mm')
}

const loadMessages = async () => {
  loading.value = true
  error.value = null
  
  try {
    const messages = await mailingApi.fetchMessages()
    items.value = messages
    
    // Load statistics for sent messages
    for (const message of items.value) {
      if (message.is_sent) {
        try {
          const stats = await fetchMessageStatistics(message.id)
          ;(message as any).read_count = stats.read_count
          ;(message as any).unread_count = stats.unread_count
          ;(message as any).read_percentage = stats.read_percentage
        } catch (err) {
          console.error('Failed to load statistics for message', message.id, err)
        }
      }
    }
    
    // Extract unique created_by users
    const userIds = new Set(messages.map(m => m.created_by))
    createdByUsers.value = Array.from(userIds).map(id => {
      const msg = messages.find(m => m.created_by === id)
      return {
        id: msg!.created_by,
        username: msg!.created_by_username,
        full_name: msg!.created_by_name
      }
    })
  } catch (err: any) {
    error.value = err.response?.data?.detail || err.message || 'Failed to load messages'
  } finally {
    loading.value = false
  }
}

const fetchMessageStatistics = async (messageId: number) => {
  const token = authStore.accessToken
  const response = await axios.get(
    `http://localhost:8000/api/v1/mailing/messages/${messageId}/statistics/`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  return response.data
}

const handleSend = async (id: number) => {
  try {
    sending.value = id
    await mailingApi.sendMessage(id)
    await loadMessages()
  } catch (err: any) {
    console.error('Failed to send message:', err)
  } finally {
    sending.value = null
  }
}

const handleDelete = async (id: number) => {
  if (confirm(t('admin.confirmDelete'))) {
    try {
      await mailingApi.deleteMessage(id)
      await loadMessages()
    } catch (err: any) {
      console.error('Failed to delete message:', err)
    }
  }
}

const viewDetail = (id: number) => {
  router.push(`/management/mailing/${id}`)
}

watch([statusFilter, searchQuery, createdByFilter], () => {
  pagination.value.page = 1
})

watch(() => pagination.value.rowsPerPage, () => {
  pagination.value.page = 1
})

onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.admin-page {
  padding: 0;
}

:deep(.q-table tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

:deep(.q-table tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
</style>

