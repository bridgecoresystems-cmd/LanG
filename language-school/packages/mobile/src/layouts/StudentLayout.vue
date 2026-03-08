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
          <div class="menu-gems" @click="closeMenu(); $router.push('/student/profile')">
            <ion-icon :icon="diamondOutline" class="menu-gems-icon" />
            <span>{{ gemsBalance }} 💎</span>
          </div>
        </div>
      </div>

      <!-- Селектор группы (как в вебе) -->
      <div v-if="groupOptions.length > 0" class="menu-group-selector">
        <p class="selector-label">ТЕКУЩАЯ ГРУППА:</p>
        <div class="selector-wrapper">
          <select :value="contextStore.selectedGroupId" @change="handleGroupChange" class="native-select">
            <option v-for="g in groupOptions" :key="g.value" :value="g.value">
              {{ g.label }}
            </option>
          </select>
          <ion-icon :icon="chevronDownOutline" class="selector-arrow" />
        </div>
      </div>

      <!-- Навигация -->
      <ion-list lines="none" class="menu-nav">
        <ion-item
          v-for="item in navItems"
          :key="item.path"
          :router-link="item.disabled ? undefined : item.path"
          router-direction="root"
          class="menu-item"
          :class="{ 
            'menu-item--active': isActive(item.path),
            'menu-item--disabled': item.disabled 
          }"
          @click="handleNavItemClick(item)"
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
  <ion-tabs>
    <ion-router-outlet id="student-content" />
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
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonTabs, IonRouterOutlet, IonTabBar, IonTabButton,
  IonIcon, IonLabel, IonMenu, IonContent, IonList, IonItem,
  menuController,
} from '@ionic/vue'
import {
  homeOutline, calendarOutline, statsChartOutline, personOutline,
  personCircleOutline, diamondOutline, logOutOutline,
  bookOutline, cardOutline, chevronDownOutline, mailOutline,
  gameControllerOutline
} from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'
import { useContextStore } from '@/stores/context'
import { useGems } from '@/composables/useGems'
import { useStudentGroups } from '@/composables/useStudentGroups'
import { useI18n } from 'vue-i18n'

const auth = useAuthStore()
const contextStore = useContextStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const gems = useGems()
const { groups: studentGroups, fetchGroups } = useStudentGroups()

// Gems Balance (Real-time via WebSocket)
const gemsBalance = ref<number>(0)
let gemsWs: WebSocket | null = null

function connectGemsWs() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8010'
  const wsUrl = `${API_URL.replace(/^https?/, 'ws')}/api/v1/ws/gems`
  
  try {
    gemsWs = new WebSocket(wsUrl)
    
    gemsWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'balance_update' && typeof data.balance === 'number') {
          gemsBalance.value = data.balance
        }
      } catch (_) {}
    }
    
    gemsWs.onclose = (e) => {
      console.log('Gems WS closed, reconnecting...', e.reason)
      gemsWs = null
      setTimeout(connectGemsWs, 5000) // Увеличил интервал до 5с
    }

    gemsWs.onerror = (err) => {
      console.error('Gems WS error:', err)
      gemsWs?.close()
    }
  } catch (err) {
    console.error('Failed to create WebSocket:', err)
    setTimeout(connectGemsWs, 5000)
  }
}

onMounted(async () => {
  // 1. Load Initial Gems
  await gems.fetchBalance()
  gemsBalance.value = gems.balance.value
  connectGemsWs()

  // 2. Load Groups for Context
  await fetchGroups()
  contextStore.setGroups(studentGroups.value as any[])
})

onUnmounted(() => {
  if (gemsWs) gemsWs.close()
})

const groupOptions = computed(() => {
  return contextStore.availableGroups.map(g => ({
    label: g.course_name || g.name,
    value: g.id
  }))
})

function handleGroupChange(e: any) {
  const val = parseInt(e.target.value)
  contextStore.setSelectedGroup(val)
}

const navItems = computed(() => {
  const groupId = contextStore.selectedGroupId
  const base = groupId ? `/student/groups/${groupId}` : '/student/dashboard'
  
  return [
    { path: '/student/dashboard', icon: homeOutline,      label: 'Дашборд' },
    { path: '/student/courses',   icon: bookOutline,      label: 'Мои курсы' },
    { path: `${base}/lessons`,    icon: calendarOutline,  label: 'Уроки и материалы', disabled: !groupId },
    { path: `${base}/grades`,     icon: statsChartOutline, label: 'Моя успеваемость',  disabled: !groupId },
    { path: `${base}/games`,      icon: gameControllerOutline, label: 'Игры',          disabled: !groupId },
    { path: '/student/profile',   icon: diamondOutline,   label: 'Мои гемы' },
    { path: '/student/payments',  icon: cardOutline,      label: 'Мои платежи' },
    { path: '/student/schedule',  icon: calendarOutline,   label: 'Расписание' },
    { path: '/student/mailing',   icon: mailOutline,      label: 'Сообщения' },
    { path: '/student/profile',   icon: personOutline,     label: 'Профиль' },
  ]
})

function handleNavItemClick(item: any) {
  if (item.disabled) {
    // Можно добавить уведомление: "Пожалуйста, выберите группу в меню"
    return
  }
  closeMenu()
}

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

<style scoped>
ion-menu {
  --width: 85vw;
  --max-width: 300px;
}

.menu-content {
  --background: #18a058; /* Green like in web */
}

.menu-header {
  padding: 40px 20px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.menu-avatar-icon {
  font-size: 48px;
  opacity: 0.9;
}

.menu-user-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.menu-gems {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 10px;
  margin-top: 6px;
  font-weight: 700;
  font-size: 0.9rem;
}

.menu-group-selector {
  padding: 0 20px 20px;
}

.selector-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

.selector-wrapper {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 10px 14px;
}

.native-select {
  width: 100%;
  background: transparent;
  border: none;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  appearance: none;
  outline: none;
}

.selector-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  pointer-events: none;
}

.menu-nav {
  background: transparent;
  padding: 0 8px;
}

.menu-item {
  --background: transparent;
  --color: rgba(255, 255, 255, 0.85);
  --padding-start: 12px;
  --min-height: 48px;
  margin-bottom: 2px;
  border-radius: 10px;
}

.menu-item--active {
  --background: white;
  --color: #18a058;
  font-weight: 700;
}

.menu-item-icon {
  font-size: 1.2rem;
  margin-right: 12px;
}

.menu-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.menu-logout {
  --background: transparent;
  --color: #ff4d4f;
}
.menu-item--disabled {
  --color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
}
</style>
