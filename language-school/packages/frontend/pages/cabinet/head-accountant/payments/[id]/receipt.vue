<template>
  <div class="receipt-page">
    <div class="no-print actions-bar">
      <NButton @click="navigateTo('/cabinet/head-accountant/payments')">Назад</NButton>
      <NButton type="primary" @click="print">Печать / Скачать PDF</NButton>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="!payment" class="error">Квитанция не найдена</div>
    
    <div v-else class="receipt-container" id="receipt">
      <div class="receipt-header">
        <div class="company-info">
          <h1>LanG School</h1>
          <p>801 West End Avenue, Turkmenabat</p>
          <p>Turkmenistan</p>
          <p>+993 64 585958</p>
          <p>hi@lang-school.com</p>
        </div>
        <div class="invoice-meta">
          <h2>TÖLEG KWITANSIÝASY</h2>
          <div class="meta-row">
            <span class="label">Hasap belgisi:</span>
            <span class="value">INV-{{ new Date(payment.createdAt).getFullYear() }}-{{ payment.id }}</span>
          </div>
          <div class="meta-row">
            <span class="label">Tölene senesi:</span>
            <span class="value">{{ formatDate(payment.createdAt) }}</span>
          </div>
          <div class="meta-row" v-if="payment.isPartial">
            <span class="label">Töleg görnüşi:</span>
            <span class="value" style="color: #f0a020">Bölekleýin (Частями)</span>
          </div>
        </div>
      </div>

      <div class="bill-to">
        <h3>TÖLEÝJI</h3>
        <p class="payer-name">{{ getPayerName() }}</p>
        <p v-if="getPayerPhone()">{{ getPayerPhone() }}</p>
        <p v-if="payment.studentEmail">{{ payment.studentEmail }}</p>
      </div>

      <div class="payment-summary">
        <div class="summary-highlight">
          {{ formatMoney(payment.total) }} TMT tölendi {{ formatDate(payment.createdAt) }}
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>DÜŞÜNDIRIŞ</th>
            <th>MUKDAR</th>
            <th>BAHA</th>
            <th>JEMI</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="item-title">{{ payment.purpose }}</div>
              <div class="item-subtitle" v-if="payment.groupName">Topar: {{ payment.groupName }}</div>
            </td>
            <td>1</td>
            <td>{{ formatMoney(payment.amount) }} TMT</td>
            <td>{{ formatMoney(payment.amount) }} TMT</td>
          </tr>
        </tbody>
      </table>

      <div class="totals-section">
        <div class="totals-row">
          <span>Aralyk jemi</span>
          <span>{{ formatMoney(payment.amount) }} TMT</span>
        </div>
        <div class="totals-row discount" v-if="payment.discount > 0">
          <span>Arzanladyş</span>
          <span>-{{ formatMoney(payment.discount) }} TMT</span>
        </div>
        <div class="totals-row grand-total">
          <span>Jemi töleg</span>
          <span>{{ formatMoney(payment.total) }} TMT</span>
        </div>
        <div class="totals-row paid">
          <span>Tölendi</span>
          <span>{{ formatMoney(payment.total) }} TMT</span>
        </div>
      </div>

      <div class="payment-history">
        <h3>TÖLEG TARYHY</h3>
        <table class="history-table">
          <thead>
            <tr>
              <th>Töleg usuly</th>
              <th>Sene</th>
              <th>Tölene möçber</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ translateMethod(payment.method) }}</td>
              <td>{{ formatDate(payment.createdAt) }}</td>
              <td>{{ formatMoney(payment.total) }} TMT</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="receipt-footer">
        <div class="receipt-id">
          <span>Kwitansiýa belgisi:</span>
          <strong>{{ payment.id }}-{{ Math.random().toString(36).substr(2, 4).toUpperCase() }}</strong>
        </div>
        <p class="thank-you">LanG School saýlanyňyz üçin sag boluň!</p>
        <p class="disclaimer">Bu elektron usulda döredilen kwitansiýa we fiziki gol talap etmeýär.</p>
        <p class="purpose-line">Tölegiň maksady: {{ payment.purpose }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NButton } from 'naive-ui'
import { useEden } from '~/composables/useEden'

definePageMeta({ layout: 'empty', middleware: 'cabinet-auth' })

const route = useRoute()
const api = useEden()
const loading = ref(true)
const payment = ref<any>(null)

const loadPayment = async () => {
  loading.value = true
  try {
    const { data } = await api.api.v1.cabinet.accountant.payments({ id: route.params.id as string }).receipt.get()
    if (data && !data.error) {
      payment.value = data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const getPayerName = () => {
  if (payment.value.studentFirstName) {
    return `${payment.value.studentFirstName} ${payment.value.studentLastName || ''}`
  }
  return payment.value.payerName || 'Nämälim'
}

const getPayerPhone = () => {
  return payment.value.studentPhone || payment.value.payerPhone || ''
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const months = [
    'Ýanwar', 'Fewral', 'Mart', 'Aprel', 'Maý', 'Iýun',
    'Iýul', 'Awgust', 'Sentýabr', 'Oktýabr', 'Noýabr', 'Dekabr'
  ]
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

const formatMoney = (val: number) => {
  return val.toFixed(2)
}

const translateMethod = (method: string) => {
  const map: any = {
    cash: 'Nagt',
    card: 'Kart',
    bank_transfer: 'Bank geçirimi'
  }
  return map[method] || method
}

const print = () => {
  window.print()
}

onMounted(loadPayment)
</script>

<style scoped>
.receipt-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.actions-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.receipt-container {
  background: white;
  width: 210mm; /* A4 width */
  padding: 20mm;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  color: #333;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.4;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.company-info h1 {
  margin: 0 0 6px;
  font-size: 20px;
  color: #18a058;
}

.company-info p {
  margin: 2px 0;
  color: #666;
}

.invoice-meta {
  text-align: right;
}

.invoice-meta h2 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #333;
  text-transform: uppercase;
}

.meta-row {
  margin-bottom: 5px;
}

.meta-row .label {
  color: #888;
  margin-right: 10px;
  font-size: 12px;
  text-transform: uppercase;
}

.meta-row .value {
  font-weight: 600;
}

.bill-to {
  margin-bottom: 12px;
}

.bill-to h3 {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.payer-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
}

.payment-summary {
  background-color: #f9f9f9;
  padding: 10px;
  text-align: center;
  margin-bottom: 12px;
  border-radius: 4px;
}

.summary-highlight {
  font-size: 16px;
  font-weight: 600;
  color: #18a058;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}

.items-table th {
  text-align: left;
  padding: 6px 0;
  border-bottom: 2px solid #eee;
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
}

.items-table td {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.items-table th:last-child,
.items-table td:last-child {
  text-align: right;
}

.item-title {
  font-weight: 600;
}

.item-subtitle {
  font-size: 12px;
  color: #888;
}

.totals-section {
  width: 300px;
  margin-left: auto;
  margin-bottom: 12px;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
}

.totals-row.discount {
  color: #d03050;
}

.totals-row.grand-total {
  border-top: 2px solid #eee;
  margin-top: 10px;
  padding-top: 10px;
  font-weight: 700;
  font-size: 16px;
}

.totals-row.paid {
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.payment-history {
  margin-bottom: 12px;
}

.payment-history h3 {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  text-align: left;
  font-size: 12px;
  color: #888;
  padding-bottom: 5px;
}

.receipt-footer {
  text-align: center;
  color: #888;
  font-size: 12px;
  margin-top: 16px;
}

.receipt-id {
  margin-bottom: 8px;
}

.thank-you {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.purpose-line {
  margin-top: 10px;
  font-style: italic;
}

@media print {
  @page {
    size: A4;
    margin: 12mm;
  }
  .no-print {
    display: none !important;
  }
  .receipt-page {
    background: white;
    padding: 0;
    min-height: auto;
  }
  .receipt-container {
    box-shadow: none;
    padding: 12mm;
    width: 100%;
    max-width: 210mm;
    max-height: none;
    page-break-inside: avoid;
  }
}
</style>
