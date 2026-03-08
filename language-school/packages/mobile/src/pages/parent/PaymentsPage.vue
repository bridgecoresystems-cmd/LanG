<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="parent-menu" color="light" />
        </ion-buttons>
        <ion-title>{{ $t('nav.payments') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <div v-for="payment in payments" :key="payment.id" class="payment-card">
        <div class="pay-left">
          <div class="pay-icon-wrap">
            <ion-icon :icon="cardOutline" class="pay-icon" />
          </div>
          <div>
            <p class="pay-desc">{{ payment.description }}</p>
            <p class="pay-child">{{ payment.childName }}</p>
            <p class="pay-date">{{ payment.date }}</p>
          </div>
        </div>
        <span class="pay-amount" :class="payment.amount > 0 ? 'positive' : 'negative'">
          {{ payment.amount > 0 ? '+' : '' }}{{ payment.amount }} TMT
        </span>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon,
  IonButtons, IonMenuButton,
} from '@ionic/vue'
import { cardOutline } from 'ionicons/icons'

// TODO: загружать с API
const payments = [
  { id: 1, description: 'Оплата за март', childName: 'Айгуль Мамедова', date: '01.03.2026', amount: -500 },
  { id: 2, description: 'Оплата за март', childName: 'Мурат Мамедов', date: '01.03.2026', amount: -500 },
  { id: 3, description: 'Оплата за февраль', childName: 'Айгуль Мамедова', date: '01.02.2026', amount: -500 },
  { id: 4, description: 'Оплата за февраль', childName: 'Мурат Мамедов', date: '01.02.2026', amount: -500 },
]
</script>

<style scoped>
.payment-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.pay-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pay-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(0, 102, 204, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pay-icon {
  font-size: 1.3rem;
  color: #0066cc;
}

.pay-desc {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
}

.pay-child {
  margin: 2px 0;
  font-size: 0.82rem;
  color: #0066cc;
}

.pay-date {
  margin: 0;
  font-size: 0.78rem;
  color: #999;
}

.pay-amount {
  font-weight: 700;
  font-size: 0.95rem;
}

.positive { color: #2dd36f; }
.negative { color: #eb445a; }
</style>
