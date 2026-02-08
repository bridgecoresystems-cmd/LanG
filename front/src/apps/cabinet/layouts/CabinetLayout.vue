<template>
  <n-layout has-sider position="absolute" style="height: 100vh;">
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="260"
      :collapsed="isSidebarCollapsed"
      show-trigger="arrow-circle"
      @collapse="isSidebarCollapsed = true"
      @expand="isSidebarCollapsed = false"
      class="cabinet-sider"
      :native-scrollbar="false"
    >
      <div class="sidebar-header" :class="{ 'header-collapsed': isSidebarCollapsed }">
        <router-link :to="dashboardPath" class="logo-link">
          <n-h2 v-if="!isSidebarCollapsed" style="margin: 0; font-weight: 700; color: white; font-size: 1.25rem;">
            {{ $t('cabinet.title') }}
          </n-h2>
          <n-icon v-else size="24" color="white">
            <home-icon />
          </n-icon>
        </router-link>
      </div>

      <!-- Gems Balance Display -->
      <div class="sidebar-balance" :class="{ 'balance-collapsed': isSidebarCollapsed }" v-if="authStore.user?.role !== 'admin'">
        <div v-if="!isSidebarCollapsed" class="balance-content">
          <div class="balance-label">{{ $t('cabinet.dashboard.stats.myBalance') }}</div>
          <div class="balance-value">
            <span class="amount">{{ wallet?.balance || '0.00' }}</span>
            <span class="symbol">💎</span>
          </div>
        </div>
        <n-tooltip v-else placement="right" trigger="hover">
          <template #trigger>
            <div class="balance-icon-only" @click="fetchMyWallet">
              <span class="symbol">💎</span>
            </div>
          </template>
          {{ wallet?.balance || '0.00' }} Gems
        </n-tooltip>
      </div>

      <n-menu
        :collapsed="isSidebarCollapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuUpdate"
        class="cabinet-menu"
      />

      <div class="sidebar-footer">
        <n-button
          v-if="!isSidebarCollapsed"
          block
          ghost
          type="error"
          @click="handleLogout"
          class="logout-btn"
        >
          <template #icon>
            <n-icon><logout-icon /></n-icon>
          </template>
          {{ $t('auth.logout') }}
        </n-button>
        <n-button
          v-else
          circle
          ghost
          type="error"
          @click="handleLogout"
          class="logout-btn-collapsed"
        >
          <template #icon>
            <n-icon><logout-icon /></n-icon>
          </template>
        </n-button>
      </div>
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered class="cabinet-header">
        <div class="header-left">
          <n-h1 style="margin: 0; font-size: 1.5rem; font-weight: 600;">
            {{ currentPageTitle }}
          </n-h1>
        </div>
        <div class="header-right">
          <n-select
            v-model:value="currentLang"
            :options="languageOptions"
            style="width: 150px;"
            @update:value="handleLanguageChange"
          />

          <n-dropdown :options="userMenuOptions" @select="handleUserMenuSelect">
            <div class="user-profile">
              <UserAvatar
                :src="userAvatar"
                :gender="authStore.user?.gender"
                size="medium"
              />
              <span class="user-name" v-if="userFullName">{{ userFullName }}</span>
              <n-icon size="14"><chevron-down-icon /></n-icon>
            </div>
          </n-dropdown>
        </div>
      </n-layout-header>

      <n-layout-content content-style="padding: 24px;" class="cabinet-main" :native-scrollbar="false">
        <slot />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h, Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, 
  NMenu, NIcon, NH1, NH2, NButton, NAvatar, NSelect, 
  NDropdown, NBadge, NTooltip, MenuOption
} from 'naive-ui'
import { 
  HomeOutline as HomeIcon,
  BookOutline as BookIcon,
  CalendarOutline as CalendarIcon,
  StarOutline as StarIcon,
  MailOutline as MailIcon,
  PersonOutline as UserIcon,
  PeopleOutline as TeachersIcon,
  SchoolOutline as StudentsIcon,
  BarChartOutline as ReportsIcon,
  LogOutOutline as LogoutIcon,
  ChevronDownOutline as ChevronDownIcon,
  GridOutline as GroupsIcon,
  PaperPlaneOutline as MailingIcon,
  CartOutline as VendorIcon,
  DiamondOutline as GemsIcon,
  CashOutline as CashIcon,
  HardwareChipOutline as RobotIcon,
  SettingsOutline as SettingsIcon
} from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/authStore'
import UserAvatar from '@/components/UserAvatar.vue'
import { useLanguage } from '@/composables/useLanguage'
import { useMailingStore } from '@/stores/mailingStore'
import { usePointsStore } from '@/stores/pointsStore'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()
const mailingStore = useMailingStore()
const pointsStore = usePointsStore()
const { languages, setLanguage, locale } = useLanguage()

// Initialize notifications
useNotifications()

const wallet = computed(() => pointsStore.wallet)
const fetchMyWallet = () => pointsStore.fetchMyWallet()

const isSidebarCollapsed = ref(false)
const currentLang = ref(locale)

const userFullName = computed(() => authStore.userFullName)
const userAvatar = computed(() => authStore.userAvatar)
const unreadCount = computed(() => mailingStore.unreadCount)

const dashboardPath = computed(() => {
  const role = authStore.user?.role || 'student'
  if (role === 'teacher') return '/cabinet/teacher'
  if (role === 'director') return '/cabinet/director'
  if (role === 'merchant') return '/cabinet/vendor'
  if (role === 'head_teacher') return '/cabinet/head-teacher/courses'
  return '/cabinet/student'
})

const activeKey = computed(() => {
  const path = route.path
  const options = menuOptions.value
  
  // First, try exact match
  const exactMatch = options.find(opt => opt.key === path)
  if (exactMatch) {
    return exactMatch.key as string
  }
  
  // Then, find the longest matching path (most specific match)
  // Sort by key length descending to match longer paths first
  const sortedOptions = [...options].filter(opt => opt.key && typeof opt.key === 'string')
    .sort((a, b) => (b.key as string).length - (a.key as string).length)
  
  const found = sortedOptions.find(opt => {
    const key = opt.key as string
    // Match if path starts with key and either:
    // - paths are equal, or
    // - next character after key is '/' (to avoid partial matches like /cabinet matching /cabinet/courses)
    return path.startsWith(key) && (path === key || path[key.length] === '/')
  })
  
  return found ? (found.key as string) : path
})

const currentPageTitle = computed(() => {
  return route.meta.title || t('cabinet.dashboard')
})

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = computed<MenuOption[]>(() => {
  const role = authStore.user?.role || 'student'
  
  const items: MenuOption[] = []
  
  // Dashboard
  items.push({
    label: role === 'merchant' ? 'Дашборд вендора' : t('cabinet.menu.dashboard'),
    key: dashboardPath.value,
    icon: role === 'merchant' ? renderIcon(VendorIcon) : renderIcon(HomeIcon)
  })

  if (role === 'student') {
    items.push(
      { label: t('cabinet.menu.courses'), key: '/cabinet/student/courses', icon: renderIcon(BookIcon) },
      { label: t('cabinet.menu.schedule'), key: '/cabinet/student/schedule', icon: renderIcon(CalendarIcon) },
      { label: t('cabinet.menu.grades'), key: '/cabinet/student/grades', icon: renderIcon(StarIcon) }
    )
  } else if (role === 'teacher') {
    items.push(
      { label: t('cabinet.menu.courses'), key: '/cabinet/teacher/courses', icon: renderIcon(BookIcon) },
      { label: t('cabinet.menu.schedule'), key: '/cabinet/teacher/schedule', icon: renderIcon(CalendarIcon) },
      { label: t('cabinet.menu.students'), key: '/cabinet/teacher/students', icon: renderIcon(StudentsIcon) },
      { label: t('cabinet.menu.grades'), key: '/cabinet/teacher/grades', icon: renderIcon(StarIcon) }
    )
  } else if (role === 'director') {
    items.push(
      { label: t('cabinet.menu.teachers'), key: '/cabinet/director/teachers', icon: renderIcon(TeachersIcon) },
      { label: t('cabinet.menu.students'), key: '/cabinet/director/students', icon: renderIcon(StudentsIcon) },
      { label: t('cabinet.menu.courses'), key: '/cabinet/director/courses', icon: renderIcon(BookIcon) },
      { label: t('cabinet.menu.schedule'), key: '/cabinet/director/schedule', icon: renderIcon(CalendarIcon) },
      {
        label: t('cabinet.menu.payments'),
        key: 'payments-group-dir',
        icon: renderIcon(CashIcon),
        children: [
          { label: t('cabinet.payments.reportTitle') || 'Отчеты по оплатам', key: '/cabinet/director/payments/reports' }
        ]
      },
      {
        label: t('cabinet.menu.gems'),
        key: 'gems-group-dir',
        icon: renderIcon(GemsIcon),
        children: [
          { label: t('cabinet.menu.gemsDistribution'), key: '/cabinet/director/gems' },
          { label: t('cabinet.menu.gemsReports'), key: '/cabinet/director/gems/reports' }
        ]
      },
      { label: t('cabinet.menu.reports'), key: '/cabinet/director/reports', icon: renderIcon(ReportsIcon) }
    )
  } else if (role === 'head_teacher') {
    items.push(
      { label: t('cabinet.menu.teachers'), key: '/cabinet/head-teacher/teachers', icon: renderIcon(TeachersIcon) },
      { label: t('cabinet.menu.students'), key: '/cabinet/head-teacher/students', icon: renderIcon(StudentsIcon) },
      { label: t('cabinet.menu.courses'), key: '/cabinet/head-teacher/courses', icon: renderIcon(BookIcon) },
      { label: t('cabinet.menu.groups'), key: '/cabinet/head-teacher/groups', icon: renderIcon(GroupsIcon) },
      {
        label: t('cabinet.menu.payments'),
        key: 'payments-group-ht',
        icon: renderIcon(CashIcon),
        children: [
          { label: t('cabinet.payments.addPayment'), key: '/cabinet/head-teacher/payments/add' },
          { label: t('cabinet.payments.reportTitle') || 'Отчеты по оплатам', key: '/cabinet/head-teacher/payments/reports' }
        ]
      },
      { label: t('cabinet.menu.gems'), key: '/cabinet/head-teacher/gems', icon: renderIcon(GemsIcon) },
      { label: t('cabinet.menu.mailing'), key: '/cabinet/head-teacher/mailing', icon: renderIcon(MailingIcon) },
      { label: t('cabinet.menu.examSettings'), key: '/cabinet/head-teacher/exam-settings', icon: renderIcon(SettingsIcon) }
    )
  } else if (role === 'merchant') {
    items.push(
      { label: 'Транзакции', key: '/cabinet/vendor/transactions', icon: renderIcon(ReportsIcon) }
    )
  }

  // Common items
  items.push({
    label: () => h(
      NBadge, 
      { value: unreadCount.value, processing: true, hidden: unreadCount.value === 0 }, 
      { default: () => t('cabinet.menu.messages') }
    ),
    key: '/cabinet/messages',
    icon: renderIcon(MailIcon)
  })
  
  items.push({
    label: t('cabinet.menu.profile'),
    key: '/cabinet/profile',
    icon: renderIcon(UserIcon)
  })

  items.push({
    label: 'AI Помощник',
    key: '/cabinet/ai-assistant',
    icon: renderIcon(RobotIcon)
  })

  return items
})

const languageOptions = computed(() => {
  return languages.map(lang => ({
    label: `${lang.flag} ${lang.name}`,
    value: lang.code
  }))
})

const userMenuOptions = computed(() => [
  { label: t('common.home'), key: 'home', icon: renderIcon(HomeIcon) },
  { label: t('auth.logout'), key: 'logout', icon: renderIcon(LogoutIcon) }
])

const handleMenuUpdate = (key: string) => {
  router.push(key)
}

const handleLanguageChange = (value: string) => {
  setLanguage(value)
}

const handleUserMenuSelect = async (key: string) => {
  if (key === 'home') {
    router.push('/')
  } else if (key === 'logout') {
    await handleLogout()
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    mailingStore.refreshUnreadCount()
    fetchMyWallet()
  }
})

onUnmounted(() => {
  // Balance is now updated via WebSocket
})
</script>

<style scoped>
.cabinet-sider {
  background: linear-gradient(180deg, #18a058 0%, #0c7a43 100%);
  min-height: 100vh;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.sidebar-balance {
  margin: 16px 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: white;
  transition: all 0.3s ease;
}

.balance-collapsed {
  margin: 16px 8px;
  padding: 8px 0;
  display: flex;
  justify-content: center;
  background: transparent;
}

.balance-icon-only {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  transition: transform 0.2s;
}

.balance-icon-only:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.3);
}

.balance-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.balance-label {
  font-size: 0.75rem;
  opacity: 0.85;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.balance-value {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1.25rem;
  font-weight: 700;
}

.balance-value .symbol {
  font-size: 1.1rem;
}

.header-collapsed {
  padding: 0;
  justify-content: center;
}

.logo-link {
  text-decoration: none;
  display: flex;
  align-items: center;
}

.cabinet-menu {
  margin-top: 10px;
}

/* Custom menu styling to match the green theme */
:deep(.n-menu-item-content--selected) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}
:deep(.n-menu-item-content) {
  color: rgba(255, 255, 255, 0.85) !important;
}
:deep(.n-menu-item-content:hover) {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
}
:deep(.n-menu-item-content--selected .n-menu-item-content-header) {
  color: white !important;
  font-weight: 600;
}
:deep(.n-menu-item-content--selected .n-icon) {
  color: white !important;
}
:deep(.n-menu-item-content .n-icon) {
  color: rgba(255, 255, 255, 0.8) !important;
}
:deep(.n-menu-item-content:hover .n-icon) {
  color: white !important;
}

.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-btn {
  color: white !important;
}

.logout-btn-collapsed {
  color: white !important;
  margin: 0 auto;
  display: block;
}

.cabinet-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.user-profile:hover {
  background-color: #f3f3f5;
}

.user-name {
  font-weight: 500;
  color: #333;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cabinet-main {
  background-color: #f5f7f9;
}
</style>
