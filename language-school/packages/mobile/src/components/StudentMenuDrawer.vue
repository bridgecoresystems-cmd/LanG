<template>
  <ion-menu id="student-menu" content-id="main-content" side="start" menu-id="student-menu">
    <ion-content class="menu-content">
      <!-- Шапка: имя + gems -->
      <div class="menu-header">
        <div class="menu-avatar">
          <ion-icon :icon="personCircleOutline" class="menu-avatar-icon" />
        </div>
        <div class="menu-user-info">
          <p class="menu-user-name">{{ auth.fullName }}</p>
          <div class="menu-gems" @click="goProfile">
            <ion-icon :icon="diamondOutline" class="menu-gems-icon" />
            <span>{{ gemsBalance }} 💎</span>
          </div>
        </div>
      </div>

      <!-- Селектор группы -->
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
          :key="item.label"
          :router-link="item.disabled ? undefined : item.path"
          router-direction="root"
          class="menu-item"
          :class="{ 'menu-item--active': isActive(item.path), 'menu-item--disabled': item.disabled }"
          @click="handleNavItemClick(item)"
        >
          <ion-icon :icon="item.icon" slot="start" class="menu-item-icon" />
          <ion-label><span class="menu-item-text">{{ item.label }}</span></ion-label>
        </ion-item>
      </ion-list>

      <!-- Выход -->
      <div class="menu-footer">
        <div class="menu-logout-wrap">
          <ion-item lines="none" class="menu-logout" button @click="handleLogout">
            <ion-icon :icon="logOutOutline" slot="start" />
            <ion-label>{{ $t('auth.logout') }}</ion-label>
          </ion-item>
        </div>
      </div>
    </ion-content>
  </ion-menu>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonMenu, IonContent, IonList, IonItem, IonIcon, IonLabel, menuController } from '@ionic/vue'
import {
  homeOutline, calendarOutline, statsChartOutline, personOutline,
  personCircleOutline, diamondOutline, logOutOutline,
  bookOutline, cardOutline, chevronDownOutline, mailOutline,
  gameControllerOutline,
} from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'
import { useContextStore } from '@/stores/context'
import { useGems } from '@/composables/useGems'
import { useStudentGroups } from '@/composables/useStudentGroups'

const auth = useAuthStore()
const contextStore = useContextStore()
const router = useRouter()
const route = useRoute()
const gems = useGems()
const { groups: studentGroups, fetchGroups } = useStudentGroups()

// Gems — начальное значение + WebSocket обновления
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
    gemsWs.onclose = () => { gemsWs = null; setTimeout(connectGemsWs, 5000) }
    gemsWs.onerror = () => gemsWs?.close()
  } catch { setTimeout(connectGemsWs, 5000) }
}

onMounted(async () => {
  await gems.fetchBalance()
  gemsBalance.value = gems.balance.value
  connectGemsWs()
  await fetchGroups()
  contextStore.setGroups(studentGroups.value as any[])
})

onUnmounted(() => { if (gemsWs) gemsWs.close() })

const groupOptions = computed(() =>
  contextStore.availableGroups.map(g => ({ label: g.course_name || g.name, value: g.id }))
)

function handleGroupChange(e: Event) {
  contextStore.setSelectedGroup(parseInt((e.target as HTMLSelectElement).value))
}

const navItems = computed(() => {
  const groupId = contextStore.selectedGroupId
  const base = groupId ? `/student/groups/${groupId}` : null
  return [
    { path: '/student/dashboard',      icon: homeOutline,           label: 'Дашборд' },
    { path: '/student/courses',        icon: bookOutline,           label: 'Мои курсы' },
    { path: base ? `${base}/lessons` : '#', icon: calendarOutline,  label: 'Уроки и материалы', disabled: !groupId },
    { path: base ? `${base}/grades`  : '#', icon: statsChartOutline, label: 'Моя успеваемость',  disabled: !groupId },
    { path: base ? `${base}/games`   : '#', icon: gameControllerOutline, label: 'Игры',          disabled: !groupId },
    { path: '/student/profile',        icon: diamondOutline,        label: 'Мои гемы' },
    { path: '/student/payments',       icon: cardOutline,           label: 'Мои платежи' },
    { path: '/student/schedule',       icon: calendarOutline,       label: 'Расписание' },
    { path: '/student/profile',        icon: personOutline,         label: 'Профиль' },
  ]
})

function isActive(path: string) { return path !== '#' && route.path.startsWith(path) }

async function closeMenu() { await menuController.close('student-menu') }

async function goProfile() { await closeMenu(); router.push('/student/profile') }

function handleNavItemClick(item: { disabled?: boolean }) {
  if (item.disabled) return
  closeMenu()
}

async function handleLogout() {
  await closeMenu()
  await auth.logout()
  router.replace('/auth/login')
}
</script>

<style>
ion-menu#student-menu {
  --width: 85vw;
  --max-width: 300px;
}

/* Принудительно переопределяем тему — меню всегда зелёное */
ion-menu#student-menu ion-content.menu-content {
  --background: linear-gradient(180deg, #18a058 0%, #0c7a43 100%);
  --ion-background-color: #18a058;
  background: linear-gradient(180deg, #18a058 0%, #0c7a43 100%) !important;
}

ion-menu#student-menu ion-item {
  --background: transparent;
  --ion-item-background: transparent;
}

ion-menu#student-menu .menu-header {
  padding: 48px 20px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

ion-menu#student-menu .menu-avatar-icon {
  font-size: 48px;
  opacity: 0.9;
}

ion-menu#student-menu .menu-user-name {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
}

ion-menu#student-menu .menu-gems {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.15);
  padding: 6px 12px;
  border-radius: 10px;
  margin-top: 6px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
}

ion-menu#student-menu .menu-group-selector {
  padding: 0 20px 16px;
}

ion-menu#student-menu .selector-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

ion-menu#student-menu .selector-wrapper {
  position: relative;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 10px 14px;
}

ion-menu#student-menu .native-select {
  width: 100%;
  background: transparent;
  border: none;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  appearance: none;
  outline: none;
}

ion-menu#student-menu .selector-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  pointer-events: none;
}

ion-menu#student-menu .menu-nav {
  background: transparent;
  padding: 0 8px;
}

ion-menu#student-menu .menu-nav ion-item {
  --background: transparent !important;
  --color: rgba(255,255,255,0.9) !important;
  --ion-color-base: rgba(255,255,255,0.9) !important;
  --padding-start: 12px;
  --min-height: 48px;
  margin-bottom: 2px;
  border-radius: 10px;
  color: rgba(255,255,255,0.9) !important;
}

ion-menu#student-menu .menu-nav ion-item.menu-item--active {
  --background: white !important;
  --color: #18a058 !important;
  background: white !important;
  color: #18a058 !important;
  font-weight: 700;
}

ion-menu#student-menu .menu-nav ion-item.menu-item--active .menu-item-icon,
ion-menu#student-menu .menu-nav ion-item.menu-item--active ion-icon,
ion-menu#student-menu .menu-nav ion-item.menu-item--active ion-label,
ion-menu#student-menu .menu-nav ion-item.menu-item--active .menu-item-text {
  color: #18a058 !important;
}

ion-menu#student-menu .menu-item--disabled {
  --color: rgba(255,255,255,0.4) !important;
  color: rgba(255,255,255,0.4) !important;
  pointer-events: none;
}

ion-menu#student-menu .menu-item-icon {
  font-size: 1.2rem;
  margin-right: 12px;
  color: inherit !important;
}

ion-menu#student-menu .menu-nav ion-label,
ion-menu#student-menu .menu-nav .menu-item-text {
  color: inherit !important;
}

ion-menu#student-menu .menu-footer {
  padding: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

ion-menu#student-menu .menu-logout-wrap {
  border: 2px solid #ff4d4f;
  border-radius: 12px;
  margin: 0 8px;
  overflow: hidden;
}

ion-menu#student-menu .menu-logout {
  --background: transparent !important;
  --color: #ff4d4f !important;
  --inner-padding-end: 0;
  color: #ff4d4f !important;
  font-weight: 700;
}

ion-menu#student-menu .menu-logout ion-icon,
ion-menu#student-menu .menu-logout ion-label {
  color: #ff4d4f !important;
}
</style>
