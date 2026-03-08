<template>
  <!-- Боковое меню -->
  <ion-menu content-id="student-content" side="start" menu-id="student-menu">
    <ion-content class="menu-content">
      <!-- Шапка меню: имя + gems -->
      <div class="menu-header">
        <div class="menu-avatar">
          <ion-icon :icon="personCircleOutline" class="menu-avatar-icon" />
        </div>
        <div class="menu-user-info">
          <p class="menu-user-name">{{ auth.fullName }}</p>
          <div class="menu-gems">
            <ion-icon :icon="diamondOutline" class="menu-gems-icon" />
            <span>{{ gemsBalance }}</span>
          </div>
        </div>
      </div>

      <!-- Навигация -->
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

      <!-- Выход -->
      <div class="menu-footer">
        <ion-item lines="none" class="menu-logout" button @click="handleLogout">
          <ion-icon :icon="logOutOutline" slot="start" color="danger" />
          <ion-label color="danger">{{ $t('auth.logout') }}</ion-label>
        </ion-item>
      </div>
    </ion-content>
  </ion-menu>

  <!-- Основной контент -->
  <ion-page id="student-content">
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
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton,
  IonIcon, IonLabel, IonMenu, IonContent, IonList, IonItem,
  menuController,
} from '@ionic/vue'
import {
  homeOutline, calendarOutline, statsChartOutline, personOutline,
  personCircleOutline, diamondOutline, logOutOutline,
} from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'
import { useGems } from '@/composables/useGems'
import { useI18n } from 'vue-i18n'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const gems = useGems()

const gemsBalance = computed(() => gems.balance ?? 0)

onMounted(() => gems.fetchBalance())

const navItems = computed(() => [
  { path: '/student/dashboard', icon: homeOutline,      label: t('nav.home') },
  { path: '/student/grades',    icon: statsChartOutline, label: t('nav.grades') },
  { path: '/student/schedule',  icon: calendarOutline,   label: t('nav.schedule') },
  { path: '/student/profile',   icon: personOutline,     label: t('nav.profile') },
])

function isActive(path: string) {
  return route.path.startsWith(path)
}

async function closeMenu() {
  await menuController.close('student-menu')
}

async function handleLogout() {
  await closeMenu()
  await auth.logout()
  router.replace('/auth/login')
}
</script>

<style>
ion-menu {
  --width: 80vw;
  --max-width: 320px;
}

.menu-content {
  --background: #ffffff;
}

.menu-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 48px 20px 24px;
  background: linear-gradient(160deg, #0066cc, #004499);
}

.menu-avatar-icon {
  font-size: 56px;
  color: rgba(255,255,255,0.9);
}

.menu-user-name {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 6px;
}

.menu-gems {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ff6b35;
  font-weight: 600;
  font-size: 0.95rem;
}

.menu-gems-icon {
  font-size: 1.1rem;
}

.menu-nav {
  padding: 12px 0;
}

.menu-item {
  --padding-start: 20px;
  --min-height: 52px;
  --color: #333333;
  margin: 2px 12px;
  border-radius: 10px;
}

.menu-item--active {
  --background: rgba(0, 102, 204, 0.1);
  --color: #0066cc;
  font-weight: 600;
}

.menu-item-icon {
  font-size: 1.3rem;
  margin-right: 4px;
  color: inherit;
}

.menu-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

.menu-logout {
  --padding-start: 20px;
  --min-height: 52px;
  border-radius: 10px;
}
</style>
