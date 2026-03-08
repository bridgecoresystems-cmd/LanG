<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary" />
        </ion-buttons>
        <ion-title>Мои платежи</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding payments-content">
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner />
      </div>

      <div v-else-if="payments.length > 0" class="payments-wrapper">
        <div class="stats-cards">
          <div class="stat-card">
            <span class="stat-label">Всего платежей</span>
            <span class="stat-value">{{ payments.length }}</span>
          </div>
          <div class="stat-card highlight">
            <span class="stat-label">Итого оплачено</span>
            <span class="stat-value">{{ totalPaid }} TMT</span>
          </div>
        </div>

        <div class="payments-list">
          <div
            v-for="p in payments"
            :key="p.id"
            class="payment-item"
            @click="router.push(`/student/payments/${p.id}`)"
          >
            <div class="payment-icon">
              <ion-icon :icon="cardOutline" />
            </div>
            <div class="payment-info">
              <h3 class="payment-purpose">{{ p.course_name || p.purpose || 'Оплата обучения' }}</h3>
              <p class="payment-date">{{ formatDate(p.created_at) }} · {{ methodLabel(p.method) }}</p>
            </div>
            <div class="payment-amount">
              <span class="amount-value">{{ Number(p.total).toFixed(2) }}</span>
              <span class="amount-currency">TMT</span>
              <ion-icon :icon="chevronForwardOutline" class="arrow-icon" />
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <ion-icon :icon="receiptOutline" class="empty-icon" />
        <p>Платежей пока нет</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonSpinner, IonIcon
} from '@ionic/vue'
import { cardOutline, chevronForwardOutline, receiptOutline } from 'ionicons/icons'
import { api } from '@/composables/useApi'

const router = useRouter()
const payments = ref<any[]>([])
const loading = ref(true)

const totalPaid = computed(() =>
  payments.value.reduce((acc, p) => acc + Number(p.total), 0).toFixed(2)
)

async function loadPayments() {
  loading.value = true
  try {
    const data = await api.cabinet.payments()
    payments.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Failed to load payments', e)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function methodLabel(method: string) {
  const map: any = { cash: 'Наличные', card: 'Карта', bank_transfer: 'Перевод' }
  return map[method] || method
}

onMounted(loadPayments)
</script>

<style scoped>
.payments-content {
  --background: #f8f9fc;
}

.stats-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  background: white;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.stat-card.highlight .stat-value {
  color: #18a058;
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
}

.payment-item {
  background: white;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.payment-icon {
  width: 48px;
  height: 48px;
  background: #f1f5f9;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #64748b;
}

.payment-info {
  flex: 1;
}

.payment-purpose {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.payment-date {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 2px 0 0;
}

.payment-amount {
  display: flex;
  align-items: center;
  gap: 4px;
}

.amount-value {
  font-size: 1rem;
  font-weight: 800;
  color: #18a058;
}

.amount-currency {
  font-size: 0.7rem;
  font-weight: 700;
  color: #18a058;
}

.arrow-icon {
  color: #cbd5e1;
  font-size: 1.1rem;
  margin-left: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.2;
  margin-bottom: 12px;
}
</style>
