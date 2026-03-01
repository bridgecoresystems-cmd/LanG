<template>
  <div class="payments-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Мои платежи</NH1>
        <p class="page-header__subtitle">История оплаты за курсы</p>
      </div>
    </header>

    <!-- Stats -->
    <div v-if="!pending && payments.length > 0" class="stats-bar">
      <div class="stat-card">
        <span class="stat-card__value">{{ payments.length }}</span>
        <span class="stat-card__label">Платежей</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value stat-card__value--green">{{ totalPaid }} TMT</span>
        <span class="stat-card__label">Итого оплачено</span>
      </div>
    </div>

    <div v-if="pending" class="loading-state">
      <NSpin size="large" />
    </div>

    <NCard v-else-if="payments.length > 0" :content-style="{ padding: 0 }" class="payments-card">
      <NDataTable
        :columns="columns"
        :data="payments"
        :bordered="false"
        :single-line="false"
        size="medium"
        :scroll-x="560"
        :row-props="rowProps"
        :row-key="(row: any) => row.id"
        class="payments-table"
      />
    </NCard>

    <div v-else class="empty-state">
      <NEmpty description="Платежей пока нет">
        <template #icon>
          <NIcon size="48"><component :is="ReceiptIcon" /></NIcon>
        </template>
      </NEmpty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NH1, NIcon, NEmpty, NSpin, NCard, NDataTable, NButton, NTag, NEllipsis } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import {
  ReceiptOutline as ReceiptIcon,
  OpenOutline as ViewIcon,
} from '@vicons/ionicons5'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const payments = ref<any[]>([])
const pending = ref(true)

const totalPaid = computed(() =>
  payments.value.reduce((acc, p) => acc + Number(p.total), 0).toFixed(2)
)

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
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
    title: 'Курс / Группа',
    key: 'course',
    minWidth: 180,
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
      row.discount > 0
        ? h('span', { class: 'col-amount__discount' }, `-${Number(row.discount).toFixed(2)} TMT`)
        : null,
    ]),
  },
  {
    title: '',
    key: 'actions',
    width: 56,
    align: 'center',
    render: (row) => h(NButton, {
      circle: true,
      quaternary: true,
      size: 'small',
      title: 'Квитанция',
      onClick: (e: Event) => {
        e.stopPropagation()
        navigateTo(`/cabinet/student/payments/${row.id}/receipt`)
      },
    }, { icon: () => h(NIcon, null, { default: () => h(ViewIcon) }) }),
  },
]

const rowProps = (row: any) => ({
  style: 'cursor: pointer;',
  onClick: () => navigateTo(`/cabinet/student/payments/${row.id}/receipt`),
})

const loadPayments = async () => {
  pending.value = true
  try {
    const data = await $fetch<any[]>('/api/v1/cabinet/student/payments', { credentials: 'include' })
    payments.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
  } finally {
    pending.value = false
  }
}

loadPayments()
</script>

<style scoped>
.payments-page {
  padding-bottom: 48px;
}

.page-header {
  margin-bottom: 24px;
}
.page-header__title {
  margin: 0 0 6px;
  font-weight: 700;
}
.page-header__subtitle {
  margin: 0;
  color: var(--n-text-color-3);
  font-size: 0.875rem;
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
.payments-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: var(--n-color-hover) !important;
}
.payments-table :deep(.n-data-table-tr) {
  cursor: pointer;
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

.loading-state {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}
.empty-state {
  padding: 80px 0;
  text-align: center;
}
</style>
