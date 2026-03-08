<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="dashboard" href="/student/dashboard">
          <ion-icon :icon="homeOutline" />
          <ion-label>{{ $t('nav.home') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="schedule" href="/student/schedule">
          <ion-icon :icon="calendarOutline" />
          <ion-label>{{ $t('nav.schedule') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="grades" href="/student/grades">
          <ion-icon :icon="statsChartOutline" />
          <ion-label>{{ $t('nav.grades') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/student/profile">
          <ion-icon :icon="personOutline" />
          <ion-label>{{ $t('nav.profile') }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/vue'
import { homeOutline, calendarOutline, statsChartOutline, personOutline } from 'ionicons/icons'
</script>
