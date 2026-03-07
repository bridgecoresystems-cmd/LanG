<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="dashboard" href="/parent/dashboard">
          <ion-icon :icon="homeOutline" />
          <ion-label>{{ $t('nav.home') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="children" href="/parent/children">
          <ion-icon :icon="peopleOutline" />
          <ion-label>{{ $t('nav.children') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="payments" href="/parent/payments">
          <ion-icon :icon="cardOutline" />
          <ion-label>{{ $t('nav.payments') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/parent/profile">
          <ion-icon :icon="personOutline" />
          <ion-label>{{ $t('nav.profile') }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonTabs, IonRouterOutlet, IonTabBar,
  IonTabButton, IonIcon, IonLabel,
} from '@ionic/vue'
import {
  homeOutline, peopleOutline, cardOutline, personOutline,
} from 'ionicons/icons'
</script>
