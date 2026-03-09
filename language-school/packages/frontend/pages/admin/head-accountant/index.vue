<template>
  <div class="admin-head-accountant-dashboard">
    <div class="admin-hero admin-hero--accountant q-mb-lg">
      <div class="admin-hero__content">
        <h1 class="admin-hero__title">Главбух 💰</h1>
        <p class="admin-hero__subtitle">Платежи, Gems, долги, тарифы, вендоры</p>
      </div>
    </div>

    <!-- Stats -->
    <h2 class="admin-section-title q-mb-md">Статистика платежей</h2>
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-4">
        <QCard flat bordered class="stat-card">
          <QCardSection>
            <div class="stat-label">Всего платежей</div>
            <div class="stat-value">{{ stats?.totalCount ?? '—' }}</div>
          </QCardSection>
        </QCard>
      </div>
      <div class="col-12 col-sm-6 col-md-4">
        <QCard flat bordered class="stat-card">
          <QCardSection>
            <div class="stat-label">Сумма (TMT)</div>
            <div class="stat-value text-positive">{{ formatNum(stats?.totalSum) }}</div>
          </QCardSection>
        </QCard>
      </div>
      <div class="col-12 col-md-4">
        <QCard flat bordered class="stat-card">
          <QCardSection>
            <div class="stat-label">Период</div>
            <div class="stat-value stat-value--sm">{{ dateFrom && dateTo ? `${dateFrom} — ${dateTo}` : 'Вся история' }}</div>
          </QCardSection>
        </QCard>
      </div>
    </div>

    <div v-if="stats?.byPurpose?.length" class="row q-mb-lg">
      <div class="col-12">
        <QCard flat bordered>
          <QCardSection>
            <div class="text-subtitle2 q-mb-md">По назначению</div>
            <QList dense>
              <QItem v-for="p in (stats?.byPurpose || []).slice(0, 10)" :key="p.purpose">
                <QItemSection>{{ p.purpose }}</QItemSection>
                <QItemSection side>
                  <strong>{{ p.sum }} TMT</strong>
                </QItemSection>
              </QItem>
            </QList>
          </QCardSection>
        </QCard>
      </div>
    </div>

    <!-- Shortcuts -->
    <h2 class="admin-section-title q-mb-md">Разделы</h2>
    <div class="admin-shortcuts">
      <QCard
        v-for="card in shortcuts"
        :key="card.path"
        flat
        bordered
        class="admin-shortcut-card"
        clickable
        @click="navigateTo(card.path)"
      >
        <QCardSection class="q-pa-sm">
          <div class="admin-shortcut-card__inner">
            <div :class="['admin-shortcut-card__icon', card.iconBg]">
              <QIcon :name="card.icon" size="22px" />
            </div>
            <div class="admin-shortcut-card__body">
              <div class="admin-shortcut-card__label">{{ card.label }}</div>
              <div class="admin-shortcut-card__desc">{{ card.desc }}</div>
            </div>
            <QIcon name="chevron_right" size="18px" class="admin-shortcut-card__arrow text-grey-6" />
          </div>
        </QCardSection>
      </QCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const config = useRuntimeConfig()
const API = config.public.apiBase as string

const stats = ref<{
  totalCount: number
  totalSum: number
  byMethod: Record<string, number>
  byPurpose: { purpose: string; sum: number }[]
} | null>(null)
const dateFrom = ref('')
const dateTo = ref('')

function formatNum(n: number | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

async function loadStats() {
  try {
    const params = new URLSearchParams()
    if (dateFrom.value) params.set('dateFrom', dateFrom.value)
    if (dateTo.value) params.set('dateTo', dateTo.value)
    const url = `${API}/cabinet/accountant/payments/stats${params.toString() ? '?' + params : ''}`
    stats.value = await $fetch<any>(url, { credentials: 'include' })
  } catch (e) {
    console.error('Stats load error:', e)
  }
}

const shortcuts = [
  { label: 'Gems кошельки', desc: 'Балансы, начисления', path: '/admin/head-accountant/gems', icon: 'diamond', iconBg: 'icon--gems' },
  { label: 'Платежи', desc: 'Отчёт, приём, редактирование', path: '/admin/head-accountant/payments', icon: 'payments', iconBg: 'icon--payments' },
  { label: 'Контроль долгов', desc: 'Задолженности по группам', path: '/admin/head-accountant/debts', icon: 'receipt_long', iconBg: 'icon--debts' },
  { label: 'Тарифы', desc: 'Цены, категории', path: '/admin/head-accountant/tariffs', icon: 'price_change', iconBg: 'icon--tariffs' },
  { label: 'Вендоры', desc: 'Точки приёма гемов', path: '/admin/head-accountant/vendors', icon: 'store', iconBg: 'icon--vendors' },
]

onMounted(loadStats)
watch([dateFrom, dateTo], loadStats)
</script>

<style scoped>
.admin-hero--accountant {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 50%, #0d3d12 100%) !important;
}

.stat-card {
  border-radius: 10px;
}

.stat-label {
  font-size: 0.75rem;
  color: #757575;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-value--sm {
  font-size: 0.95rem;
}

.admin-shortcuts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.admin-shortcut-card__inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-shortcut-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.admin-shortcut-card__icon.icon--gems { background: #f1f8e9; color: #689f38; }
.admin-shortcut-card__icon.icon--payments { background: #e8f5e9; color: #388e3c; }
.admin-shortcut-card__icon.icon--debts { background: #fff3e0; color: #e65100; }
.admin-shortcut-card__icon.icon--tariffs { background: #e3f2fd; color: #1976d2; }
.admin-shortcut-card__icon.icon--vendors { background: #f3e5f5; color: #7b1fa2; }

.admin-shortcut-card {
  cursor: pointer;
}

.admin-shortcut-card__body { flex: 1; min-width: 0; }
.admin-shortcut-card__label { font-size: 0.95rem; font-weight: 600; color: #1a1a1a; }
.admin-shortcut-card__desc { font-size: 0.75rem; color: #757575; margin-top: 2px; }
.admin-shortcut-card__arrow { flex-shrink: 0; }

.admin-shortcut-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
</style>
