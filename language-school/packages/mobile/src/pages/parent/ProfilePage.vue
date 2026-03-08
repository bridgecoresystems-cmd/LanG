<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ $t('nav.profile') }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="profile-hero">
        <ion-icon :icon="personCircleOutline" class="avatar-icon" />
        <h2 class="profile-name">{{ auth.fullName }}</h2>
        <ion-chip color="tertiary">
          <ion-icon :icon="peopleOutline" />
          <ion-label>{{ $t('roles.PARENT') }}</ion-label>
        </ion-chip>
      </div>

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
  IonList, IonItem, IonLabel, IonIcon, IonChip, IonButton,
} from '@ionic/vue'
import {
  personCircleOutline, peopleOutline,
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

.settings-list {
  margin: 16px;
  border-radius: 12px;
  overflow: hidden;
}
</style>
