<template>
  <!-- Боковое меню родителя -->
  <ion-menu content-id="parent-content" side="start" menu-id="parent-menu">
    <ion-content class="menu-content">
      <div class="menu-header">
        <div class="menu-avatar">
          <ion-icon :icon="personCircleOutline" class="menu-avatar-icon" />
        </div>
        <div class="menu-user-info">
          <p class="menu-user-name">{{ auth.fullName }}</p>
          <p class="menu-user-role">{{ $t('roles.PARENT') }}</p>
        </div>
      </div>

      <ion-list lines="none" class="menu-nav">
        <ion-item
          v-for="item in navItems"
          :key="item.path"
          :router-link="item.path"
          router-direction="root"
          class="menu-item"
          :class="{ 'menu-item--active': isActive(item.path) }"
          @click="closeMenu"
        >
          <ion-icon :icon="item.icon" slot="start" class="menu-item-icon" />
          <ion-label>{{ item.label }}</ion-label>
        </ion-item>
      </ion-list>

      <div class="menu-footer">
        <ion-item lines="none" class="menu-logout" button @click="handleLogout">
          <ion-icon :icon="logOutOutline" slot="start" color="danger" />
          <ion-label color="danger">{{ $t('auth.logout') }}</ion-label>
        </ion-item>
      </div>
    </ion-content>
  </ion-menu>

  <!-- Основной контент -->
  <ion-tabs>
    <ion-router-outlet id="parent-content" />
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonTabs, IonRouterOutlet, IonTabBar, IonTabButton,
  IonIcon, IonLabel, IonMenu, IonContent, IonList, IonItem,
  menuController,
} from '@ionic/vue'
import {
  homeOutline, peopleOutline, cardOutline, personOutline,
  personCircleOutline, logOutOutline,
} from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const navItems = computed(() => [
  { path: '/parent/dashboard', icon: homeOutline,   label: t('nav.home') },
  { path: '/parent/children',  icon: peopleOutline, label: t('nav.children') },
  { path: '/parent/payments',  icon: cardOutline,   label: t('nav.payments') },
  { path: '/parent/profile',   icon: personOutline, label: t('nav.profile') },
])

function isActive(path: string) {
  return route.path.startsWith(path)
}

async function closeMenu() {
  await menuController.close('parent-menu')
}

async function handleLogout() {
  await closeMenu()
  await auth.logout()
  router.replace('/auth/login')
}
</script>

<style>
.menu-user-role {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin: 0;
}
</style>
