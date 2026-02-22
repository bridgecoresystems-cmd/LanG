<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Рассылки</NH2>
        <p class="page-header__subtitle">
          Создавайте и отправляйте сообщения ученикам, родителям и учителям вашей школы.
        </p>
      </div>
      <div class="page-header__actions">
        <NButton type="primary" size="large" @click="navigateTo('/cabinet/head-teacher/mailing/create')">
          <template #icon>
            <NIcon><component :is="AddIcon" /></NIcon>
          </template>
          Создать рассылку
        </NButton>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <NSpin size="large" />
    </div>

    <NAlert v-else-if="error" type="error" closable class="q-mb-md">
      {{ error }}
    </NAlert>

    <NCard v-else class="cabinet-card table-card" :content-style="{ padding: 0 }">
      <NDataTable
        :columns="columns"
        :data="messages"
        :pagination="pagination"
        :bordered="false"
        :row-props="(row) => ({ style: 'cursor: pointer;', onClick: () => onRowClick(row) })"
        :row-key="(row) => row.id"
        class="cabinet-data-table clickable-rows"
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useCabinetMailing, type MailingMessage } from '~/composables/useCabinetMailing'
import {
  NCard,
  NButton,
  NIcon,
  NH2,
  NDataTable,
  NTag,
  NBadge,
  NSpin,
  NAlert,
  type DataTableColumns,
} from 'naive-ui'
import {
  AddOutline as AddIcon,
  SendOutline as SendIcon,
  TrashOutline as DeleteIcon,
  PeopleOutline as UsersIcon,
  CalendarOutline as CalendarIcon,
} from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const authStore = useAuthStore()
const message = useMessage()

function canAccess() {
  const u = authStore.user
  if (!u) return false
  const hasHeadTeacher = u.role === 'HEAD_TEACHER' || (u.additional_roles || []).includes('HEAD_TEACHER')
  return hasHeadTeacher || u.role === 'SUPERUSER'
}

const { getList, send, remove } = useCabinetMailing()
const messages = ref<MailingMessage[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const sending = ref<number | null>(null)

const pagination = { pageSize: 10 }

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const columns: DataTableColumns<MailingMessage> = [
  {
    title: 'Заголовок',
    key: 'title',
    render(row) {
      return h('div', { class: 'font-semibold text-primary', style: 'color: #18a058;' }, row.title)
    },
  },
  {
    title: 'Получатели',
    key: 'recipient_type_display',
    width: 140,
    render(row) {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(NIcon, { size: 18, color: '#18a058' }, { default: () => h(UsersIcon) }),
        h('span', row.recipient_type_display),
      ])
    },
  },
  {
    title: 'Кол-во',
    key: 'total_recipients',
    width: 90,
    align: 'center',
    render(row) {
      return h(NBadge, { value: row.total_recipients, type: 'info' })
    },
  },
  {
    title: 'Статус',
    key: 'is_sent',
    width: 120,
    render(row) {
      return h(NTag, {
        type: row.is_sent ? 'success' : 'warning',
        round: true,
        size: 'small',
      }, () => row.is_sent ? 'Отправлено' : 'Черновик')
    },
  },
  {
    title: 'Создано',
    key: 'created_at',
    width: 160,
    render(row) {
      return h('div', { class: 'flex items-center gap-2 text-gray-500' }, [
        h(NIcon, { size: 16 }, { default: () => h(CalendarIcon) }),
        h('span', { style: 'font-size: 13px' }, formatDate(row.created_at)),
      ])
    },
  },
  {
    title: 'Отправлено',
    key: 'sent_at',
    width: 160,
    render(row) {
      if (!row.sent_at) return h('span', { class: 'text-gray-400 italic' }, '—')
      return h('div', { class: 'flex items-center gap-2 text-success' }, [
        h(NIcon, { size: 16, color: '#18a058' }, { default: () => h(SendIcon) }),
        h('span', { style: 'font-size: 13px' }, formatDate(row.sent_at)),
      ])
    },
  },
  {
    title: '',
    key: 'actions',
    width: 100,
    align: 'right',
    render(row) {
      return h('div', { class: 'flex justify-end gap-1' }, [
        !row.is_sent && h(NButton, {
          size: 'small',
          circle: true,
          quaternary: true,
          type: 'success',
          loading: sending.value === row.id,
          onClick: (e: Event) => {
            e.stopPropagation()
            handleSend(row.id)
          },
        }, { icon: () => h(NIcon, null, { default: () => h(SendIcon) }) }),
        h(NButton, {
          size: 'small',
          circle: true,
          quaternary: true,
          type: 'error',
          onClick: (e: Event) => {
            e.stopPropagation()
            handleDelete(row.id)
          },
        }, { icon: () => h(NIcon, null, { default: () => h(DeleteIcon) }) }),
      ])
    },
  },
]

const loadMessages = async () => {
  loading.value = true
  error.value = null
  try {
    messages.value = await getList()
  } catch (e: any) {
    error.value = e?.message || 'Ошибка загрузки'
    message.error(error.value)
  } finally {
    loading.value = false
  }
}

const handleSend = async (id: number) => {
  try {
    sending.value = id
    await send(id)
    message.success('Рассылка отправлена')
    await loadMessages()
  } catch (e: any) {
    message.error(e?.message || 'Ошибка отправки')
  } finally {
    sending.value = null
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Удалить рассылку?')) return
  try {
    await remove(id)
    message.success('Удалено')
    await loadMessages()
  } catch (e: any) {
    message.error(e?.message || 'Ошибка удаления')
  }
}

const onRowClick = (row: MailingMessage) => {
  navigateTo(`/cabinet/head-teacher/mailing/${row.id}`)
}

onMounted(() => {
  if (!canAccess()) {
    navigateTo('/cabinet')
    return
  }
  loadMessages()
})
</script>

<style scoped>
.cabinet-page { padding-bottom: 40px; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}
.page-header__title { margin: 0 0 8px; font-weight: 700; }
.page-header__subtitle { margin: 0; color: var(--n-text-color-3); }
.loading-state { text-align: center; padding: 4rem 2rem; }
.table-card { border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

.clickable-rows :deep(.n-data-table-tr) {
  cursor: pointer;
  transition: background-color 0.2s;
}
.clickable-rows :deep(.n-data-table-tr:hover) {
  background-color: rgba(24, 160, 88, 0.05) !important;
}
:deep(.n-data-table-th) {
  font-weight: 600 !important;
  color: var(--n-text-color-3) !important;
  text-transform: uppercase;
  font-size: 0.75rem;
  padding: 16px 24px !important;
}
:deep(.n-data-table-td) { padding: 16px 24px !important; }
</style>
