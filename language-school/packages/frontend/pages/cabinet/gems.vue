<template>
  <div class="gems-page">

    <!-- Balance card -->
    <NCard class="balance-card" :bordered="false">
      <div class="balance-card__body">
        <div class="balance-card__left">
          <div class="balance-card__label">Мой баланс</div>
          <div class="balance-card__amount">
            {{ balance.toFixed(2) }}
            <span class="balance-card__sym">💎</span>
          </div>
          <NTag type="success" size="small" round style="margin-top: 8px;">
            {{ roleLabel }}
          </NTag>
        </div>
        <div class="balance-card__right">
          <!-- Send Gems button (if sender role) -->
          <NButton
            v-if="canSend"
            type="primary"
            size="large"
            @click="showSendModal = true"
          >
            <template #icon><NIcon><component :is="SendIcon" /></NIcon></template>
            Отправить гемы
          </NButton>
        </div>
      </div>
    </NCard>

    <!-- Transaction history -->
    <NCard style="border-radius: 14px; margin-top: 24px;">
      <template #header>
        <span style="font-weight: 700; font-size: 16px;">История транзакций</span>
      </template>
      <div v-if="loadingTx" class="tx-loading"><NSpin /></div>
      <div v-else-if="transactions.length === 0" class="tx-empty">
        Транзакций пока нет
      </div>
      <div v-else class="tx-list">
        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="tx-item"
          :class="tx.direction === 'in' ? 'tx-item--in' : 'tx-item--out'"
        >
          <div class="tx-item__left">
            <span class="tx-item__icon">{{ tx.direction === 'in' ? '⬇️' : '⬆️' }}</span>
            <div class="tx-item__info">
              <div class="tx-item__who">
                {{ tx.direction === 'in' ? (tx.senderName || 'Система') : (tx.receiverName || '—') }}
              </div>
              <div class="tx-item__comment">{{ tx.comment || txTypeLabel(tx.type) }}</div>
              <div class="tx-item__date">{{ formatDate(tx.createdAt) }}</div>
            </div>
          </div>
          <div class="tx-item__amount" :class="tx.direction === 'in' ? 'amount--in' : 'amount--out'">
            {{ tx.direction === 'in' ? '+' : '-' }}{{ tx.amount }} 💎
          </div>
        </div>
      </div>
    </NCard>

    <!-- Send Gems Modal -->
    <NModal v-model:show="showSendModal" preset="card" style="width: 460px;" title="Отправить гемы">
      <div class="send-form">
        <div class="send-form__field">
          <div class="send-form__label">Получатель</div>
          <NSelect
            v-model:value="sendForm.receiverId"
            :options="receiverOptions"
            filterable
            placeholder="Выберите получателя"
            :loading="loadingReceivers"
          />
        </div>
        <div class="send-form__field">
          <div class="send-form__label">Количество гемов</div>
          <NInputNumber
            v-model:value="sendForm.amount"
            :min="1"
            :max="canSendUnlimited ? 999999 : balance"
            style="width: 100%;"
            placeholder="Введите сумму"
          />
          <div v-if="!canSendUnlimited" class="send-form__hint">
            Доступно: {{ balance.toFixed(2) }} 💎
          </div>
        </div>
        <div class="send-form__field">
          <div class="send-form__label">Комментарий <span style="color:#9ca3af">(необязательно)</span></div>
          <NInput v-model:value="sendForm.comment" placeholder="За что начисляем?" />
        </div>
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showSendModal = false">Отмена</NButton>
          <NButton type="primary" :loading="sending" :disabled="!sendForm.receiverId || !sendForm.amount" @click="doSend">
            Отправить
          </NButton>
        </NSpace>
      </template>
    </NModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NTag, NButton, NIcon, NModal, NSelect, NInputNumber, NInput, NSpace, NSpin, useMessage } from 'naive-ui'
import { SendOutline as SendIcon } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const config = useRuntimeConfig()
const API = config.public.apiBase as string
const authStore = useAuthStore()
const message = useMessage()

const balance = ref(0)
const transactions = ref<any[]>([])
const loadingTx = ref(true)

const showSendModal = ref(false)
const loadingReceivers = ref(false)
const sending = ref(false)
const receivers = ref<any[]>([])

const sendForm = ref({ receiverId: null as string | null, amount: null as number | null, comment: '' })

// Roles that can send gems
const SENDER_ROLES = ['HEAD_ACCOUNTANT', 'ACCOUNTANT', 'TEACHER', 'SUPERUSER', 'GEN_DIRECTOR']
// Roles whose balance doesn't limit sending
const UNLIMITED_ROLES = ['HEAD_ACCOUNTANT', 'SUPERUSER', 'GEN_DIRECTOR']

const userRole = computed(() => (authStore.user?.role || '').toUpperCase())

const canSend = computed(() => SENDER_ROLES.includes(userRole.value))
const canSendUnlimited = computed(() => UNLIMITED_ROLES.includes(userRole.value))

const ROLE_LABELS: Record<string, string> = {
  HEAD_ACCOUNTANT: 'Гл. бухгалтер',
  ACCOUNTANT: 'Бухгалтер',
  TEACHER: 'Учитель',
  STUDENT: 'Ученик',
  MERCHANT: 'Вендор',
  SUPERUSER: 'Суперадмин',
  GEN_DIRECTOR: 'Ген. директор',
}

const roleLabel = computed(() => ROLE_LABELS[userRole.value] || userRole.value)

const receiverOptions = computed(() =>
  receivers.value.map((r) => ({
    label: `${r.name} (${ROLE_LABELS[r.role?.toUpperCase()] || r.role})`,
    value: r.id,
  }))
)

function txTypeLabel(type: string) {
  const map: Record<string, string> = {
    transfer: 'Перевод',
    award: 'Награда',
    purchase: 'Покупка',
    system: 'Системная операция',
  }
  return map[type] || type
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function loadAll() {
  try {
    const [walletData, txData] = await Promise.all([
      $fetch<{ balance: number }>(`${API}/cabinet/gems/wallet`, { credentials: 'include' }),
      $fetch<any[]>(`${API}/cabinet/gems/transactions`, { credentials: 'include' }),
    ])
    balance.value = walletData.balance ?? 0
    transactions.value = Array.isArray(txData) ? txData : []
  } catch (e) {
    console.error('Gems load failed', e)
  } finally {
    loadingTx.value = false
  }
}

async function loadReceivers() {
  if (!canSend.value) return
  loadingReceivers.value = true
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/gems/users-to-send`, { credentials: 'include' })
    receivers.value = Array.isArray(data) ? data : []
  } catch {
    receivers.value = []
  } finally {
    loadingReceivers.value = false
  }
}

async function doSend() {
  if (!sendForm.value.receiverId || !sendForm.value.amount) return
  sending.value = true
  try {
    const res = await $fetch<any>(`${API}/cabinet/gems/transfer`, {
      method: 'POST',
      credentials: 'include',
      body: {
        receiverId: sendForm.value.receiverId,
        amount: sendForm.value.amount,
        comment: sendForm.value.comment || undefined,
      },
    })
    message.success(`Гемы отправлены → ${res.receiverName}! Ваш баланс: ${res.newBalance} 💎`)
    showSendModal.value = false
    sendForm.value = { receiverId: null, amount: null, comment: '' }
    await loadAll()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка при отправке')
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  loadAll()
  loadReceivers()
})
</script>

<style scoped>
.gems-page { padding-bottom: 60px; }

.balance-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 16px;
}

.balance-card__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
}

.balance-card__label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.balance-card__amount {
  font-size: 52px;
  font-weight: 900;
  color: #15803d;
  line-height: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.balance-card__sym {
  font-size: 32px;
}

/* Transactions */
.tx-loading, .tx-empty {
  display: flex;
  justify-content: center;
  padding: 40px;
  color: #9ca3af;
  font-size: 14px;
}

.tx-list { display: flex; flex-direction: column; gap: 0; }

.tx-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #f3f4f6;
}
.tx-item:last-child { border-bottom: none; }

.tx-item__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tx-item__icon { font-size: 1.2rem; }

.tx-item__who {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.tx-item__comment {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.tx-item__date {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.tx-item__amount {
  font-size: 16px;
  font-weight: 700;
}

.amount--in { color: #15803d; }
.amount--out { color: #6b7280; }

/* Send Form */
.send-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.send-form__label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.send-form__hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}
</style>
