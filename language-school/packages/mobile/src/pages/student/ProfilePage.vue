<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t('nav.profile') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Аватар блок -->
      <div class="profile-hero">
        <div class="avatar-wrap">
          <ion-icon :icon="personCircleOutline" class="avatar-icon" />
        </div>
        <h2 class="profile-name">{{ auth.user?.name }}</h2>
        <ion-chip color="primary">
          <ion-icon :icon="schoolOutline" />
          <ion-label>{{ $t('roles.STUDENT') }}</ion-label>
        </ion-chip>
      </div>

      <!-- Gems балans -->
      <ion-card class="gems-card">
        <ion-card-content>
          <div class="gems-row">
            <ion-icon :icon="diamondOutline" class="gems-icon" />
            <div>
              <p class="gems-label">{{ $t('student.profile.gems') }}</p>
              <p class="gems-value">240</p>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Настройки -->
      <ion-list class="settings-list">
        <ion-item button>
          <ion-icon :icon="notificationsOutline" slot="start" color="primary" />
          <ion-label>{{ $t('student.profile.notifications') }}</ion-label>
          <ion-icon :icon="chevronForwardOutline" slot="end" />
        </ion-item>
        <ion-item button>
          <ion-icon :icon="languageOutline" slot="start" color="primary" />
          <ion-label>{{ $t('student.profile.language') }}</ion-label>
          <ion-icon :icon="chevronForwardOutline" slot="end" />
        </ion-item>
      </ion-list>

      <!-- Выход -->
      <div class="ion-padding">
        <ion-button expand="block" fill="outline" color="danger" @click="handleLogout">
          <ion-icon :icon="logOutOutline" slot="start" />
          {{ $t('auth.logout') }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonList, IonItem, IonLabel,
  IonIcon, IonChip, IonButton,
} from '@ionic/vue'
import {
  personCircleOutline, schoolOutline, diamondOutline,
  notificationsOutline, languageOutline, chevronForwardOutline, logOutOutline,
} from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.replace('/auth/login')
}
</script>

<style scoped>
.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px 24px;
  background: linear-gradient(160deg, #0066cc, #004499);
}

.avatar-icon {
  font-size: 80px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
}

.profile-name {
  color: white;
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 8px;
}

.gems-card {
  margin: 16px;
}

.gems-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.gems-icon {
  font-size: 2.5rem;
  color: #ff6b35;
}

.gems-label {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

.gems-value {
  margin: 2px 0 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff6b35;
}

.settings-list {
  margin: 0 16px;
  border-radius: 12px;
  overflow: hidden;
}
</style>
