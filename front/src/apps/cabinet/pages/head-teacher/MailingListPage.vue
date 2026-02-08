<template>
  <CabinetLayout>
    <n-space vertical size="large" class="head-teacher-page">
      <div class="page-header">
        <n-space justify="space-between" align="center">
          <div>
            <n-h1 style="margin-bottom: 4px;">{{ $t('cabinet.mailing.list.title') }}</n-h1>
            <n-text depth="3">{{ $t('cabinet.mailing.list.description') }}</n-text>
          </div>
          <n-button type="primary" round @click="$router.push('/cabinet/head-teacher/mailing/create')">
            <template #icon><n-icon><add-icon /></n-icon></template>
            {{ $t('cabinet.mailing.list.create') }}
          </n-button>
        </n-space>
      </div>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <div v-else-if="error" class="error-state">
        <n-alert type="error" :title="$t('common.error')" closable>
          {{ error }}
        </n-alert>
      </div>

      <n-card bordered v-else content-style="padding: 0;">
        <n-data-table
          :columns="columns"
          :data="messages"
          :pagination="pagination"
          :bordered="false"
          scroll-x="1000"
          :row-props="(row) => ({ onClick: () => onRowClick(row) })"
          class="clickable-rows"
        />
      </n-card>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '@/apps/cabinet/layouts/CabinetLayout.vue'
import { 
  NSpace, NH1, NText, NCard, NDataTable, NTag, NBadge,
  NButton, NIcon, NSpin, NAlert, DataTableColumns
} from 'naive-ui'
import { 
  AddOutline as AddIcon,
  SendOutline as SendIcon,
  TrashOutline as DeleteIcon,
  PeopleOutline as UsersIcon,
  CalendarOutline as CalendarIcon,
  TimeOutline as TimeIcon
} from '@vicons/ionicons5'
import { useMailingApi, type Message as MessageType } from '@/composables/useMailingApi'

const router = useRouter()
const { t, locale } = useI18n()
const mailingApi = useMailingApi()

const messages = ref<MessageType[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const sending = ref<number | null>(null)

const columns: DataTableColumns<MessageType> = [
  {
    title: t('cabinet.mailing.list.title'),
    key: 'title',
    sorter: 'default',
    render(row) {
      return h(NText, { 
        strong: true, 
        style: 'color: #18a058; cursor: pointer;',
        onClick: () => onRowClick(row)
      }, { default: () => row.title })
    }
  },
  {
    title: t('cabinet.mailing.list.recipients'),
    key: 'recipient_type_display',
    render(row) {
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, { color: '#18a058' }, { default: () => h(UsersIcon) }),
          h(NText, null, { default: () => row.recipient_type_display })
        ]
      })
    }
  },
  {
    title: t('cabinet.mailing.list.totalRecipients'),
    key: 'total_recipients',
    align: 'center',
    render(row) {
      return h(NBadge, { value: row.total_recipients, type: 'info' })
    }
  },
  {
    title: t('cabinet.mailing.list.status'),
    key: 'is_sent',
    render(row) {
      return h(NTag, {
        type: row.is_sent ? 'success' : 'warning',
        round: true,
        size: 'small',
        bordered: false,
        strong: true
      }, { default: () => row.is_sent ? t('cabinet.mailing.list.sent') : t('cabinet.mailing.list.draft') })
    }
  },
  {
    title: t('cabinet.mailing.list.createdAt'),
    key: 'created_at',
    sorter: 'default',
    render(row) {
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, { color: '#999' }, { default: () => h(CalendarIcon) }),
          h(NText, { depth: 3, size: 'small' }, { default: () => formatDate(row.created_at) })
        ]
      })
    }
  },
  {
    title: t('cabinet.mailing.list.sentAt'),
    key: 'sent_at',
    render(row) {
      if (!row.sent_at) return h(NText, { depth: 3, italic: true }, { default: () => '—' })
      return h(NSpace, { align: 'center', size: 'small' }, {
        default: () => [
          h(NIcon, { color: '#18a058' }, { default: () => h(SendIcon) }),
          h(NText, { type: 'success', size: 'small' }, { default: () => formatDate(row.sent_at) })
        ]
      })
    }
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 100,
    render(row) {
      return h(NSpace, { justify: 'end' }, {
        default: () => [
          !row.is_sent && h(NButton, {
            size: 'small',
            circle: true,
            quaternary: true,
            type: 'success',
            loading: sending.value === row.id,
            onClick: (e: Event) => {
              e.stopPropagation()
              handleSend(row.id)
            }
          }, {
            icon: () => h(NIcon, null, { default: () => h(SendIcon) })
          }),
          h(NButton, {
            size: 'small',
            circle: true,
            quaternary: true,
            type: 'error',
            onClick: (e: Event) => {
              e.stopPropagation()
              handleDelete(row.id)
            }
          }, {
            icon: () => h(NIcon, null, { default: () => h(DeleteIcon) })
          })
        ]
      })
    }
  }
]

const pagination = {
  pageSize: 10
}

const loadMessages = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await mailingApi.fetchMessages()
    messages.value = Array.isArray(response) ? response : (response.results || [])
  } catch (err: any) {
    error.value = err.message || t('cabinet.mailing.list.loadError')
  } finally {
    loading.value = false
  }
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
  if (confirm(t('common.confirmDelete') || 'Are you sure?')) {
    try {
      await mailingApi.deleteMessage(id)
      await loadMessages()
    } catch (err: any) {
      console.error('Failed to delete message:', err)
    }
  }
}

const onRowClick = (row: MessageType) => {
  router.push(`/cabinet/head-teacher/mailing/${row.id}`)
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const dateLocale = locale.value === 'ru' ? 'ru-RU' : locale.value === 'tm' ? 'tk-TM' : 'en-US'
  return date.toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.head-teacher-page {
  max-width: 1400px;
  margin: 0 auto;
}

.clickable-rows :deep(.n-data-table-tr) {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-rows :deep(.n-data-table-tr:hover) {
  background-color: rgba(24, 160, 88, 0.05) !important;
}

.clickable-rows :deep(.n-data-table-tr) {
  cursor: pointer;
}

.clickable-rows :deep(.n-data-table-td) {
  cursor: pointer;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
