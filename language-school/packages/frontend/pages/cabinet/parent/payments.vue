<template>
  <div class="parent-payments-page">

    <!-- No children -->
    <div v-if="contextStore.availableChildren.length === 0" class="empty-state">
      <NIcon size="64" color="#d1d5db"><component :is="PeopleIcon" /></NIcon>
      <h3>Нет детей</h3>
      <p>У вас ещё нет привязанных детей</p>
    </div>

    <template v-else>
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <NSpin size="large" />
      </div>

      <template v-else>
        <!-- Child selector tabs -->
        <div class="child-tabs">
          <NButton
            v-for="child in contextStore.availableChildren"
            :key="child.id"
            :type="activeChildId === child.id ? 'primary' : 'default'"
            :color="activeChildId === child.id ? '#18a058' : undefined"
            size="medium"
            round
            @click="switchChild(child.id)"
          >
            {{ child.full_name }}
          </NButton>
          <NButton
            :type="activeChildId === 'all' ? 'primary' : 'default'"
            :color="activeChildId === 'all' ? '#18a058' : undefined"
            size="medium"
            round
            @click="switchChild('all')"
          >
            Все дети
          </NButton>
        </div>

        <!-- Stats -->
        <div v-if="displayedPayments.length > 0" class="stats-bar">
          <div class="stat-card">
            <span class="stat-card__value">{{ displayedPayments.length }}</span>
            <span class="stat-card__label">Платежей</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__value stat-card__value--green">{{ totalPaid }} TMT</span>
            <span class="stat-card__label">Итого оплачено</span>
          </div>
        </div>

        <!-- Payments table -->
        <NCard
          v-if="displayedPayments.length > 0"
          :content-style="{ padding: 0 }"
          class="payments-card"
        >
          <NDataTable
            :columns="columns"
            :data="displayedPayments"
            :bordered="false"
            :single-line="false"
            size="medium"
            :scroll-x="600"
            class="payments-table"
          />
        </NCard>

        <div v-else class="empty-state-sm">
          <NEmpty description="Платежей пока нет" />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h, onMounted } from 'vue'
import { NCard, NTag, NIcon, NSpin, NEmpty, NDataTable, NButton } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { PeopleOutline as PeopleIcon } from '@vicons/ionicons5'
import { useContextStore } from '~/stores/contextStore'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const contextStore = useContextStore()
const config = useRuntimeConfig()
const API = config.public.apiBase as string

// all payments per child: childId -> payment[]
const paymentsMap = ref<Record<string, any[]>>({})
const loading = ref(false)
const activeChildId = ref<string>('all')

const selectedChildId = computed(() => contextStore.selectedChildId)

const displayedPayments = computed(() => {
  if (activeChildId.value === 'all') {
    // Combine all children's payments, add child name
    return contextStore.availableChildren.flatMap(c => {
      const ps = paymentsMap.value[c.id] ?? []
      return ps.map(p => ({ ...p, child_name: c.full_name }))
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  const ps = paymentsMap.value[activeChildId.value] ?? []
  const child = contextStore.availableChildren.find(c => c.id === activeChildId.value)
  return ps.map(p => ({ ...p, child_name: child?.full_name ?? '' }))
})

const totalPaid = computed(() =>
  displayedPayments.value.reduce((sum, p) => sum + Number(p.total), 0).toFixed(2)
)

function switchChild(id: string) {
  activeChildId.value = id
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const methodLabel = (method: string) => {
  const map: Record<string, string> = {
    cash: 'Наличные',
    card: 'Карта',
    bank_transfer: 'Перевод',
  }
  return map[method] || method
}

const methodType = (method: string): 'success' | 'info' | 'default' => {
  if (method === 'cash') return 'success'
  if (method === 'card') return 'info'
  return 'default'
}

const columns: DataTableColumns<any> = [
  {
    title: 'Ребёнок',
    key: 'child_name',
    width: 130,
    render: (row) => h('span', { class: 'col-child' }, row.child_name || '—'),
  },
  {
    title: 'Курс / Группа',
    key: 'course',
    minWidth: 150,
    render: (row) => h('div', { class: 'col-course' }, [
      h('span', { class: 'col-course__name' }, row.course_name || row.purpose || '—'),
      row.group_name
        ? h('span', { class: 'col-course__group' }, row.group_name)
        : null,
    ]),
  },
  {
    title: 'Дата',
    key: 'created_at',
    width: 120,
    render: (row) => h('span', { class: 'col-date' }, formatDate(row.created_at)),
  },
  {
    title: 'Метод',
    key: 'method',
    width: 110,
    align: 'center',
    render: (row) => h(NTag, {
      type: methodType(row.method),
      size: 'small',
      round: true,
      bordered: false,
    }, { default: () => methodLabel(row.method) }),
  },
  {
    title: 'Сумма',
    key: 'total',
    width: 130,
    align: 'right',
    render: (row) => h('div', { class: 'col-amount' }, [
      h('span', { class: 'col-amount__total' }, `${Number(row.total).toFixed(2)} TMT`),
      Number(row.discount) > 0
        ? h('span', { class: 'col-amount__discount' }, `-${Number(row.discount).toFixed(2)} TMT`)
        : null,
    ]),
  },
]

async function loadAllChildrenPayments() {
  const children = contextStore.availableChildren
  if (children.length === 0) return

  loading.value = true
  try {
    await Promise.all(
      children.map(async (child) => {
        try {
          const data = await $fetch<any[]>(
            `${API}/cabinet/parent/children/${child.id}/payments`,
            { credentials: 'include' }
          )
          paymentsMap.value[child.id] = Array.isArray(data) ? data : []
        } catch (e) {
          console.error(`Failed to load payments for child ${child.id}`, e)
          paymentsMap.value[child.id] = []
        }
      })
    )
  } finally {
    loading.value = false
  }
}

// Set active tab to selected child if available
watch(selectedChildId, (id) => {
  if (id) activeChildId.value = id
}, { immediate: true })

watch(() => contextStore.availableChildren, (children) => {
  if (children.length > 0) {
    loadAllChildrenPayments()
  }
}, { immediate: true })
</script>

<style scoped>
.parent-payments-page {
  padding-bottom: 48px;
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

.child-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.stats-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.stat-card {
  flex: 1;
  min-width: 120px;
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 10px;
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-card__value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}
.stat-card__value--green { color: #18a058; }
.stat-card__label {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  font-weight: 500;
}

.payments-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--n-border-color);
}

.payments-table :deep(.n-data-table-th) {
  background: var(--n-color-hover) !important;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--n-text-color-3);
  padding: 12px 16px !important;
}
.payments-table :deep(.n-data-table-td) {
  padding: 14px 16px !important;
  font-size: 0.875rem;
}

.col-child {
  font-weight: 600;
  color: #18a058;
}

.col-course {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.col-course__name {
  font-weight: 600;
  color: var(--n-text-color-1);
}
.col-course__group {
  font-size: 0.78rem;
  color: var(--n-text-color-3);
}

.col-date {
  color: var(--n-text-color-2);
}

.col-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.col-amount__total {
  font-weight: 700;
  color: #18a058;
  font-size: 0.95rem;
}
.col-amount__discount {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
}
</style>
