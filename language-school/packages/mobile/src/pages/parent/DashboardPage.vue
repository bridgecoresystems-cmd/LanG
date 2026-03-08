<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="parent-menu" color="light" />
        </ion-buttons>
        <ion-title>{{ $t('parent.dashboard.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <!-- Приветствие -->
      <div class="greeting-card">
        <p class="greeting-text">{{ $t('parent.dashboard.greeting') }},</p>
        <h2 class="parent-name">{{ auth.fullName }}</h2>
      </div>

      <!-- Дети -->
      <ion-card class="section-card">
        <ion-card-header>
          <ion-card-title>{{ $t('parent.dashboard.children') }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div
            v-for="child in children"
            :key="child.id"
            class="child-item"
            @click="$router.push('/parent/children')"
          >
            <div class="child-avatar">{{ child.name[0] }}</div>
            <div class="child-info">
              <p class="child-name">{{ child.name }}</p>
              <p class="child-group">{{ child.group }}</p>
            </div>
            <div class="child-gems">
              <ion-icon :icon="diamondOutline" color="warning" />
              <span>{{ child.gems }}</span>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Платежи -->
      <ion-card class="section-card">
        <ion-card-header>
          <ion-card-title>{{ $t('parent.dashboard.recentPayments') }}</ion-card-title>
          <ion-card-subtitle @click="$router.push('/parent/payments')" class="see-all">
            {{ $t('common.seeAll') }}
          </ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <div v-for="pay in recentPayments" :key="pay.id" class="payment-item">
            <div class="pay-info">
              <p class="pay-desc">{{ pay.description }}</p>
              <p class="pay-date">{{ pay.date }}</p>
            </div>
            <span class="pay-amount" :class="pay.amount > 0 ? 'positive' : 'negative'">
              {{ pay.amount > 0 ? '+' : '' }}{{ pay.amount }} TMT
            </span>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButtons, IonMenuButton, IonIcon,
} from '@ionic/vue'
import { diamondOutline } from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// TODO: загружать с API
const children = [
  { id: '1', name: 'Айгуль Мамедова', group: 'Английский A1', gems: 240 },
  { id: '2', name: 'Мурат Мамедов', group: 'Математика 3кл', gems: 180 },
]

const recentPayments = [
  { id: 1, description: 'Оплата за март', date: '01.03.2026', amount: -500 },
  { id: 2, description: 'Оплата за февраль', date: '01.02.2026', amount: -500 },
]
</script>

<style scoped>
.greeting-card {
  background: linear-gradient(135deg, #0066cc, #004499);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  color: white;
}

.greeting-text {
  font-size: 0.9rem;
  opacity: 0.85;
  margin: 0;
}

.parent-name {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 4px 0 0;
}

.section-card {
  margin: 0 0 16px;
}

.child-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.child-item:last-child {
  border-bottom: none;
}

.child-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #0066cc;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
}

.child-info {
  flex: 1;
}

.child-name {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
}

.child-group {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #666;
}

.child-gems {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #ff6b35;
}

.see-all {
  cursor: pointer;
  color: #0066cc !important;
}

.payment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.payment-item:last-child {
  border-bottom: none;
}

.pay-desc {
  margin: 0;
  font-weight: 500;
  font-size: 0.95rem;
}

.pay-date {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #666;
}

.pay-amount {
  font-weight: 700;
  font-size: 0.95rem;
}

.positive { color: #2dd36f; }
.negative { color: #eb445a; }
</style>
