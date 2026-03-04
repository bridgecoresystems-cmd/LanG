<template>
  <div>
    <div class="row items-center q-mb-md">
      <div class="text-h5 col">Заявки на пополнение 💎</div>
      <QBadge v-if="pendingCount > 0" color="orange" :label="`${pendingCount} ожидают`" class="q-ml-sm" />
    </div>

    <QTable
      :rows="requests"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :filter="filter"
      flat
      bordered
      :rows-per-page-options="[20, 50, 100]"
    >
      <template #top-right>
        <QInput v-model="filter" dense debounce="300" placeholder="Поиск...">
          <template #append>
            <QIcon name="search" />
          </template>
        </QInput>
      </template>

      <template #body="props">
        <QTr :props="props">
          <QTd v-for="col in props.cols" :key="col.name" :props="props">
            <template v-if="col.name === 'status'">
              <QBadge :color="statusColor(props.row.status)" :label="statusLabel(props.row.status)" />
            </template>
            <template v-else-if="col.name === 'actions'">
              <QBtn
                v-if="props.row.status === 'pending_admin'"
                color="positive"
                label="Пополнить 💎"
                size="sm"
                :loading="completing === props.row.id"
                @click="handleComplete(props.row)"
              />
              <span v-else class="text-grey-5">—</span>
            </template>
            <template v-else-if="col.name === 'logs'">
              <QBtn flat round icon="expand_more" size="sm" @click="props.row.__expanded = !props.row.__expanded" />
            </template>
            <template v-else>{{ col.value }}</template>
          </QTd>
        </QTr>

        <!-- Expanded logs row -->
        <QTr v-if="props.row.__expanded" :props="props">
          <QTd colspan="100%" class="q-pa-none">
            <QCard flat class="q-ma-sm">
              <QCardSection>
                <div class="text-subtitle2 q-mb-sm">История изменений</div>
                <QTimeline color="primary" layout="loose">
                  <QTimelineEntry
                    v-for="log in props.row.logs"
                    :key="log.id"
                    :title="logLabel(log.action)"
                    :subtitle="new Date(log.createdAt).toLocaleString('ru-RU')"
                    :color="logColor(log.action)"
                    :icon="logIcon(log.action)"
                  >
                    <div>{{ log.actorName || log.actorId }} · {{ log.actorRole }}</div>
                    <div v-if="log.comment" class="text-grey-7 q-mt-xs">{{ log.comment }}</div>
                  </QTimelineEntry>
                </QTimeline>
              </QCardSection>
            </QCard>
          </QTd>
        </QTr>
      </template>
    </QTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({ layout: 'admin' })

const config = useRuntimeConfig()
const API = config.public.apiBase as string
const $q = useQuasar()

const loading = ref(false)
const completing = ref<number | null>(null)
const filter = ref('')
const requests = ref<any[]>([])

const pendingCount = computed(() => requests.value.filter(r => r.status === 'pending_admin').length)

const columns = [
  { name: 'requesterName', label: 'Заявитель', field: 'requesterName', align: 'left' as const, sortable: true },
  { name: 'title', label: 'Название', field: 'title', align: 'left' as const, sortable: true },
  {
    name: 'requestDate', label: 'Дата заявки', field: 'requestDate', align: 'left' as const, sortable: true,
    format: (v: string) => new Date(v).toLocaleDateString('ru-RU'),
  },
  {
    name: 'amount', label: 'Сумма', field: 'amount', align: 'right' as const, sortable: true,
    format: (v: number) => `${v} 💎`,
  },
  { name: 'status', label: 'Статус', field: 'status', align: 'center' as const, sortable: true },
  { name: 'directorName', label: 'Директор', field: 'directorName', align: 'left' as const },
  {
    name: 'directorActedAt', label: 'Одобрено', field: 'directorActedAt', align: 'left' as const,
    format: (v: string | null) => v ? new Date(v).toLocaleDateString('ru-RU') : '—',
  },
  { name: 'logs', label: 'Лог', field: 'logs', align: 'center' as const },
  { name: 'actions', label: 'Действие', field: 'actions', align: 'center' as const },
]

function statusColor(status: string) {
  const map: Record<string, string> = {
    pending_director: 'blue',
    pending_admin: 'orange',
    rejected: 'red',
    completed: 'green',
  }
  return map[status] || 'grey'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending_director: 'У директора',
    pending_admin: 'У админа',
    rejected: 'Отклонено',
    completed: 'Выполнено',
  }
  return map[status] || status
}

function logLabel(action: string) {
  const map: Record<string, string> = {
    created: 'Заявка создана',
    resubmitted: 'Отправлено повторно',
    director_approved: 'Директор одобрил',
    director_rejected: 'Директор отклонил',
    admin_completed: 'Администратор пополнил',
  }
  return map[action] || action
}

function logColor(action: string) {
  const map: Record<string, string> = {
    created: 'primary',
    resubmitted: 'warning',
    director_approved: 'positive',
    director_rejected: 'negative',
    admin_completed: 'positive',
  }
  return map[action] || 'grey'
}

function logIcon(action: string) {
  const map: Record<string, string> = {
    created: 'add_circle',
    resubmitted: 'refresh',
    director_approved: 'check_circle',
    director_rejected: 'cancel',
    admin_completed: 'diamond',
  }
  return map[action] || 'circle'
}

async function load() {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/admin/gems/topup-requests`, { credentials: 'include' })
    requests.value = data.map(r => ({ ...r, __expanded: false }))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleComplete(row: any) {
  completing.value = row.id
  try {
    const result = await $fetch<any>(`${API}/admin/gems/topup-requests/${row.id}/complete`, {
      method: 'POST',
      credentials: 'include',
    })
    $q.notify({ type: 'positive', message: `Баланс пополнен на ${row.amount} 💎. Новый баланс: ${result.newBalance} 💎` })
    await load()
  } catch (e: any) {
    const body = e?.data ?? e?.value
    const err = body && typeof body === 'object' ? (body.error || JSON.stringify(body)) : (e?.message || 'Ошибка')
    $q.notify({ type: 'negative', message: err })
  } finally {
    completing.value = null
  }
}

onMounted(load)
</script>
