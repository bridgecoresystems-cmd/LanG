<template>
  <div class="ha-gems-page">

    <!-- Stats row -->
    <div class="stats-row">
      <NCard class="stat-card" :bordered="false">
        <div class="stat-card__label">Всего кошельков</div>
        <div class="stat-card__value">{{ wallets.length }}</div>
      </NCard>
      <NCard class="stat-card" :bordered="false">
        <div class="stat-card__label">Суммарный баланс</div>
        <div class="stat-card__value">{{ totalBalance.toFixed(0) }} 💎</div>
      </NCard>
      <NCard class="stat-card" :bordered="false">
        <div class="stat-card__label">Мой баланс</div>
        <div class="stat-card__value" style="color: #15803d;">{{ myBalance.toFixed(0) }} 💎</div>
      </NCard>
    </div>

    <!-- Wallets table -->
    <NCard style="border-radius: 14px; margin-top: 24px;">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <span style="font-weight: 700; font-size: 16px;">Все кошельки</span>
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <NSelect
              v-model:value="schoolFilter"
              :options="schoolOptions"
              placeholder="Все школы"
              clearable
              style="width: 200px;"
              size="small"
              @update:value="loadWallets"
            />
            <NButton quaternary size="small" @click="navigateTo('/cabinet/head-accountant/gems/requests')">
              📋 Заявки на пополнение
            </NButton>
            <NInput v-model:value="search" placeholder="Поиск по имени..." style="width: 220px;" clearable />
          </div>
        </div>
      </template>
      <NDataTable
        :columns="columns"
        :data="filteredWallets"
        :loading="loading"
        :bordered="false"
        :pagination="{ pageSize: 20 }"
        :row-key="(r: any) => r.userId"
      />
    </NCard>

    <!-- Send Gems Modal -->
    <NModal v-model:show="showSendModal" preset="card" style="width: 420px;" :title="`Начислить гемы → ${selectedUser?.name}`">
      <div class="send-form">
        <div class="send-form__label">Количество гемов</div>
        <NInputNumber v-model:value="sendAmount" :min="1" style="width: 100%;" placeholder="Сколько гемов?" />
        <div class="send-form__label" style="margin-top: 12px;">Комментарий <span style="color:#9ca3af">(необязательно)</span></div>
        <NInput v-model:value="sendComment" placeholder="Причина начисления..." />
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showSendModal = false">Отмена</NButton>
          <NButton type="primary" :loading="sending" :disabled="!sendAmount" @click="doSend">
            Начислить {{ sendAmount || 0 }} 💎
          </NButton>
        </NSpace>
      </template>
    </NModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import { NCard, NDataTable, NButton, NModal, NInput, NInputNumber, NSelect, NSpace, useMessage, NTag } from 'naive-ui'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const config = useRuntimeConfig()
const API = config.public.apiBase as string
const message = useMessage()

const loading = ref(true)
const wallets = ref<any[]>([])
const schools = ref<{ id: number; label: string }[]>([])
const myBalance = ref(0)
const search = ref('')
const schoolFilter = ref<number | null>(null)

const schoolOptions = computed(() => {
  const opts: { label: string; value: number | null }[] = [{ label: 'Все школы', value: null }]
  schools.value.forEach((s) => opts.push({ label: s.label, value: s.id }))
  return opts
})

const showSendModal = ref(false)
const selectedUser = ref<any>(null)
const sendAmount = ref<number | null>(null)
const sendComment = ref('')
const sending = ref(false)

const ROLE_LABELS: Record<string, string> = {
  HEAD_ACCOUNTANT: 'Гл. бухгалтер',
  ACCOUNTANT: 'Бухгалтер',
  TEACHER: 'Учитель',
  STUDENT: 'Ученик',
  MERCHANT: 'Вендор',
  SUPERUSER: 'Суперадмин',
  GEN_DIRECTOR: 'Ген. директор',
}

const totalBalance = computed(() => wallets.value.reduce((s, w) => s + w.balance, 0))

const filteredWallets = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return wallets.value
  return wallets.value.filter((w) => w.name.toLowerCase().includes(q))
})

const columns = computed(() => [
  {
    title: 'Имя',
    key: 'name',
    render: (row: any) => h('span', { style: 'font-weight: 600;' }, row.name || row.userId),
  },
  {
    title: 'Школа',
    key: 'school_name',
    width: 180,
    ellipsis: { tooltip: true },
    render: (row: any) => row.school_name || '—',
  },
  {
    title: 'Роль',
    key: 'role',
    width: 140,
    render: (row: any) => {
      const r = (row.role || '').toUpperCase()
      const label = ROLE_LABELS[r] || r
      const typeMap: Record<string, any> = {
        STUDENT: 'info',
        TEACHER: 'success',
        ACCOUNTANT: 'warning',
        MERCHANT: 'default',
      }
      return h(NTag, { type: typeMap[r] || 'default', size: 'small', round: true }, { default: () => label })
    },
  },
  {
    title: 'Баланс 💎',
    key: 'balance',
    width: 130,
    sorter: (a: any, b: any) => a.balance - b.balance,
    render: (row: any) =>
      h('span', {
        style: `font-weight: 700; font-size: 15px; color: ${row.balance > 0 ? '#15803d' : '#9ca3af'}`,
      }, `${row.balance} 💎`),
  },
  {
    title: '',
    key: 'actions',
    width: 110,
    render: (row: any) => {
      const allowed = ['ACCOUNTANT', 'TEACHER', 'STUDENT']
      if (!allowed.includes((row.role || '').toUpperCase())) return null
      return h(NButton, {
        size: 'small',
        type: 'primary',
        ghost: true,
        onClick: () => openSend(row),
      }, { default: () => 'Начислить' })
    },
  },
])

function openSend(user: any) {
  selectedUser.value = user
  sendAmount.value = null
  sendComment.value = ''
  showSendModal.value = true
}

async function doSend() {
  if (!selectedUser.value || !sendAmount.value) return
  sending.value = true
  try {
    const res = await $fetch<any>(`${API}/cabinet/gems/transfer`, {
      method: 'POST',
      credentials: 'include',
      body: {
        receiverId: selectedUser.value.userId,
        amount: sendAmount.value,
        comment: sendComment.value || undefined,
      },
    })
    message.success(`Начислено ${sendAmount.value} 💎 → ${selectedUser.value.name}`)
    myBalance.value = res.newBalance
    showSendModal.value = false
    await loadWallets()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    sending.value = false
  }
}

async function loadWallets() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (schoolFilter.value != null && schoolFilter.value > 0) params.set('schoolId', String(schoolFilter.value))
    const query = params.toString()
    const [walletsData, walletMe, schoolsData] = await Promise.all([
      $fetch<any[]>(`${API}/cabinet/gems/all-wallets${query ? '?' + query : ''}`, { credentials: 'include' }),
      $fetch<{ balance: number }>(`${API}/cabinet/gems/wallet`, { credentials: 'include' }),
      $fetch<{ id: number; label: string }[]>(`${API}/cabinet/gems/schools`, { credentials: 'include' }),
    ])
    wallets.value = Array.isArray(walletsData) ? walletsData : []
    myBalance.value = walletMe.balance ?? 0
    schools.value = Array.isArray(schoolsData) ? schoolsData : []
  } catch (e) {
    console.error('Wallets load failed', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadWallets)
</script>

<style scoped>
.ha-gems-page { padding-bottom: 60px; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 0;
}

.stat-card {
  border-radius: 14px;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
}

.stat-card__label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-card__value {
  font-size: 28px;
  font-weight: 900;
  color: #111827;
}

.send-form { display: flex; flex-direction: column; gap: 8px; }
.send-form__label { font-size: 13px; font-weight: 500; color: #374151; }
</style>
