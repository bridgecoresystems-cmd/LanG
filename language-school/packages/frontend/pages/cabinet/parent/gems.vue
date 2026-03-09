<template>
  <div class="parent-gems-page">

    <!-- No child selected -->
    <div v-if="!selectedChildId" class="empty-state">
      <NIcon size="64" color="#d1d5db"><component :is="PeopleIcon" /></NIcon>
      <h3>Выберите ребёнка</h3>
      <p>Выберите ребёнка в боковом меню, чтобы увидеть его гемы</p>
    </div>

    <template v-else>
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <NSpin size="large" />
      </div>

      <template v-else>
        <!-- Child name header -->
        <div class="child-header" v-if="selectedChild">
          <NTag type="success" size="medium" round>{{ selectedChild.full_name }}</NTag>
        </div>

        <!-- Balance card -->
        <NCard class="balance-card" :bordered="false">
          <div class="balance-card__body">
            <div class="balance-label">Баланс гемов</div>
            <div class="balance-value">
              <span class="balance-amount">{{ gemsData?.balance ?? 0 }}</span>
              <span class="balance-icon">💎</span>
            </div>
          </div>
        </NCard>

        <!-- Transactions table -->
        <NCard :content-style="{ padding: 0 }" class="tx-card" v-if="transactions.length > 0">
          <div class="tx-header">
            <span class="tx-header__title">История транзакций</span>
            <NTag size="small" type="default">{{ transactions.length }} записей</NTag>
          </div>
          <NDataTable
            :columns="columns"
            :data="transactions"
            :bordered="false"
            :single-line="false"
            size="medium"
            :scroll-x="520"
            class="tx-table"
          />
        </NCard>

        <div v-else class="empty-state-sm">
          <NEmpty description="Транзакций пока нет" />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { NCard, NTag, NIcon, NSpin, NEmpty, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { PeopleOutline as PeopleIcon } from '@vicons/ionicons5'
import { useParentCabinet } from '~/composables/useParentCabinet'
import { useContextStore } from '~/stores/contextStore'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const parentApi = useParentCabinet()
const contextStore = useContextStore()

const selectedChildId = computed(() => contextStore.selectedChildId)
const selectedChild = computed(() =>
  contextStore.availableChildren.find(c => c.id === selectedChildId.value) ?? null
)

const loading = ref(false)
const gemsData = ref<{ balance: number; transactions: any[] } | null>(null)

const transactions = computed(() => gemsData.value?.transactions ?? [])

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    award: 'Награда',
    transfer: 'Перевод',
    purchase: 'Покупка',
    topup: 'Пополнение',
  }
  return map[type] || type
}

const columns: DataTableColumns<any> = [
  {
    title: 'Дата',
    key: 'createdAt',
    width: 160,
    render: (row) => h('span', { class: 'col-date' }, formatDate(row.createdAt)),
  },
  {
    title: 'Тип',
    key: 'type',
    width: 120,
    align: 'center',
    render: (row) => h(NTag, {
      type: row.direction === 'in' ? 'success' : 'warning',
      size: 'small',
      round: true,
      bordered: false,
    }, { default: () => (row.direction === 'in' ? 'Пополнение' : 'Списание') }),
  },
  {
    title: 'Сумма',
    key: 'amount',
    width: 110,
    align: 'right',
    render: (row) => h('span', {
      class: row.direction === 'in' ? 'amount-in' : 'amount-out',
    }, `${row.direction === 'in' ? '+' : '-'}${row.amount} 💎`),
  },
  {
    title: 'Комментарий',
    key: 'comment',
    minWidth: 150,
    render: (row) => h('span', { class: 'col-comment' }, row.comment || '—'),
  },
  {
    title: 'От кого / Кому',
    key: 'counterparty',
    minWidth: 150,
    render: (row) => {
      const name = row.direction === 'in' ? row.senderName : row.receiverName
      return h('span', { class: 'col-counterparty' }, name || '—')
    },
  },
]

async function loadData() {
  const childId = selectedChildId.value
  if (!childId) {
    gemsData.value = null
    return
  }
  loading.value = true
  try {
    const { data } = await parentApi.getChildGems(childId)
    gemsData.value = data as any
  } catch (e) {
    console.error('Failed to load child gems', e)
    gemsData.value = null
  } finally {
    loading.value = false
  }
}

watch(selectedChildId, loadData, { immediate: true })
</script>

<style scoped>
.parent-gems-page {
  padding-bottom: 60px;
}

.child-header {
  margin-bottom: 16px;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 40px;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
  text-align: center;
  color: #6b7280;
}
.empty-state h3 { margin: 0; font-size: 18px; color: #374151; }
.empty-state p { margin: 0; font-size: 14px; }

.empty-state-sm {
  padding: 48px 0;
  text-align: center;
}

.balance-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 16px;
  margin-bottom: 24px;
}

.balance-card__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}

.balance-label {
  font-size: 13px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.balance-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.balance-amount {
  font-size: 64px;
  font-weight: 900;
  color: #15803d;
  line-height: 1;
}

.balance-icon {
  font-size: 40px;
}

.tx-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--n-border-color);
}

.tx-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--n-border-color);
}

.tx-header__title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.tx-table :deep(.n-data-table-th) {
  background: var(--n-color-hover) !important;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--n-text-color-3);
  padding: 12px 16px !important;
}
.tx-table :deep(.n-data-table-td) {
  padding: 14px 16px !important;
  font-size: 0.875rem;
}

.col-date {
  color: var(--n-text-color-2);
  font-size: 0.85rem;
}

.col-comment {
  color: var(--n-text-color-2);
}

.col-counterparty {
  color: var(--n-text-color-2);
  font-size: 0.85rem;
}

.amount-in {
  font-weight: 700;
  color: #18a058;
}

.amount-out {
  font-weight: 700;
  color: #ef4444;
}
</style>
