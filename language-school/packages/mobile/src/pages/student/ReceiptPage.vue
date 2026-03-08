<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/student/payments" />
        </ion-buttons>
        <ion-title>Чек об оплате</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding receipt-content">
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner />
      </div>

      <div v-else-if="payment" class="receipt-wrapper">
        <div class="receipt-card">
          <div class="receipt-header">
            <div class="school-logo">LanG</div>
            <div class="receipt-status">ОПЛАЧЕНО</div>
          </div>

          <div class="receipt-amount-hero">
            <span class="amount">{{ payment.total }}</span>
            <span class="currency">TMT</span>
          </div>

          <div class="receipt-details">
            <div class="receipt-row">
              <span class="label">Дата</span>
              <span class="value">{{ formatDate(payment.createdAt) }}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Студент</span>
              <span class="value">{{ payment.studentFirstName }} {{ payment.studentLastName }}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Курс</span>
              <span class="value">{{ payment.groupName }}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Метод</span>
              <span class="value">{{ translateMethod(payment.method) }}</span>
            </div>
            <div class="receipt-row">
              <span class="label">ID транзакции</span>
              <span class="value">#{{ payment.id }}</span>
            </div>
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-footer">
            <p>Спасибо за оплату!</p>
            <p class="footer-note">Это электронный чек LanG Academy</p>
          </div>
        </div>

        <ion-button expand="block" class="share-btn" fill="outline">
          <ion-icon :icon="shareOutline" slot="start" />
          Поделиться
        </ion-button>
      </div>

      <div v-else class="empty-state">
        <ion-icon :icon="alertCircleOutline" class="empty-icon" />
        <p>Чек не найден</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonSpinner, IonIcon, IonButton
} from '@ionic/vue'
import { shareOutline, alertCircleOutline } from 'ionicons/icons'
import { api } from '@/composables/useApi'

const route = useRoute()
const paymentId = parseInt(route.params.id as string)
const payment = ref<any>(null)
const loading = ref(true)

async function loadPayment() {
  loading.value = true
  try {
    payment.value = await api.cabinet.paymentById(paymentId)
  } catch (e) {
    console.error('Failed to load receipt', e)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

function translateMethod(method: string) {
  const map: any = { cash: 'Наличные', card: 'Карта', bank_transfer: 'Перевод' }
  return map[method] || method
}

onMounted(loadPayment)
</script>

<style scoped>
.receipt-content {
  --background: #f8f9fc;
}

.receipt-card {
  background: white;
  border-radius: 32px;
  padding: 32px 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  margin-bottom: 24px;
  position: relative;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.school-logo {
  font-size: 1.5rem;
  font-weight: 900;
  color: #18a058;
}

.receipt-status {
  font-size: 0.7rem;
  font-weight: 800;
  color: #18a058;
  background: #f0fdf4;
  padding: 4px 10px;
  border-radius: 8px;
  letter-spacing: 0.05em;
}

.receipt-amount-hero {
  text-align: center;
  margin-bottom: 40px;
}

.amount {
  font-size: 3.5rem;
  font-weight: 900;
  color: #1e293b;
}

.currency {
  font-size: 1.2rem;
  font-weight: 700;
  color: #94a3b8;
  margin-left: 8px;
}

.receipt-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 600;
}

.value {
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 700;
}

.receipt-divider {
  height: 2px;
  background: #f1f5f9;
  margin: 32px 0;
  border-radius: 1px;
}

.receipt-footer {
  text-align: center;
}

.receipt-footer p {
  margin: 0;
  font-weight: 700;
  color: #1e293b;
}

.footer-note {
  font-size: 0.75rem !important;
  color: #94a3b8 !important;
  font-weight: 500 !important;
  margin-top: 4px !important;
}

.share-btn {
  --border-radius: 16px;
  --color: #18a058;
  --border-color: #18a058;
}
</style>
