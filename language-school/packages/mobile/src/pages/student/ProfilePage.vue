<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary" />
        </ion-buttons>
        <ion-title>Мой профиль</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="profile-content">
      <div class="profile-wrapper">
        <!-- Hero Section -->
        <div class="profile-hero">
          <div class="avatar-container">
            <div class="avatar-circle">
              <ion-icon :icon="personCircleOutline" />
            </div>
            <div class="role-badge">STUDENT</div>
          </div>
          <h2 class="user-name">{{ auth.fullName }}</h2>
          <p class="user-username">@{{ auth.user?.username }}</p>
        </div>

        <!-- Gems Balance Card -->
        <div class="gems-balance-card" @click="router.push('/student/dashboard')">
          <div class="gems-icon-wrap">
            <ion-icon :icon="diamondOutline" />
          </div>
          <div class="gems-info">
            <span class="gems-label">Мой баланс</span>
            <h3 class="gems-value">{{ gems.balance }} 💎</h3>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="arrow-icon" />
        </div>

        <!-- Settings List -->
        <div class="settings-section">
          <h3 class="section-title">НАСТРОЙКИ</h3>
          <ion-list lines="none" class="custom-list">
            <ion-item button class="custom-item">
              <div class="item-icon-wrap notifications">
                <ion-icon :icon="notificationsOutline" />
              </div>
              <ion-label>Уведомления</ion-label>
              <ion-icon :icon="chevronForwardOutline" slot="end" class="item-arrow" />
            </ion-item>
            <ion-item button class="custom-item">
              <div class="item-icon-wrap language">
                <ion-icon :icon="languageOutline" />
              </div>
              <ion-label>Язык приложения</ion-label>
              <ion-icon :icon="chevronForwardOutline" slot="end" class="item-arrow" />
            </ion-item>
            <ion-item button class="custom-item">
              <div class="item-icon-wrap security">
                <ion-icon :icon="lockClosedOutline" />
              </div>
              <ion-label>Безопасность</ion-label>
              <ion-icon :icon="chevronForwardOutline" slot="end" class="item-arrow" />
            </ion-item>
          </ion-list>
        </div>

        <!-- Logout Button -->
        <div class="ion-padding logout-container">
          <ion-button expand="block" fill="clear" color="danger" class="logout-btn" @click="handleLogout">
            <ion-icon :icon="logOutOutline" slot="start" />
            Выйти из аккаунта
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonList, IonItem, IonLabel,
  IonIcon, IonButton
} from '@ionic/vue'
import {
  personCircleOutline, diamondOutline,
  notificationsOutline, languageOutline, chevronForwardOutline,
  logOutOutline, lockClosedOutline
} from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'
import { useGems } from '@/composables/useGems'

const auth = useAuthStore()
const router = useRouter()
const gems = useGems()

onMounted(() => gems.fetchBalance())

async function handleLogout() {
  await auth.logout()
  router.replace('/auth/login')
}
</script>

<style scoped>
.profile-content {
  --background: #f8f9fc;
}

.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: white;
  border-radius: 0 0 32px 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  margin-bottom: 24px;
}

.avatar-container {
  position: relative;
  margin-bottom: 16px;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem;
  color: #cbd5e1;
}

.role-badge {
  position: absolute;
  bottom: -5px;
  background: #18a058;
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 10px;
  border: 3px solid white;
}

.user-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.user-username {
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 4px 0 0;
  font-weight: 600;
}

.gems-balance-card {
  background: white;
  margin: 0 20px 24px;
  padding: 20px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.gems-icon-wrap {
  width: 50px;
  height: 50px;
  background: #fff7ed;
  color: #ea580c;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
}

.gems-info { flex: 1; }
.gems-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.gems-value { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin: 2px 0 0; }

.arrow-icon { color: #cbd5e1; font-size: 1.2rem; }

.settings-section { padding: 0 20px; }
.section-title { font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-bottom: 12px; letter-spacing: 0.05em; }

.custom-list { background: transparent; }
.custom-item {
  --background: white;
  --padding-start: 16px;
  --padding-end: 16px;
  --inner-padding-end: 0;
  --min-height: 64px;
  border-radius: 20px;
  margin-bottom: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.item-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  margin-right: 16px;
}

.item-icon-wrap.notifications { background: #eff6ff; color: #2563eb; }
.item-icon-wrap.language { background: #f0fdf4; color: #18a058; }
.item-icon-wrap.security { background: #faf5ff; color: #9333ea; }

.item-arrow { color: #cbd5e1; font-size: 1rem; }

.logout-container { margin-top: 20px; }
.logout-btn {
  --color: #ef4444;
  font-weight: 700;
  font-size: 0.95rem;
}
</style>
