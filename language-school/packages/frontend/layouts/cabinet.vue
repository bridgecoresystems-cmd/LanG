<template>
  <NConfigProvider :theme="null">
    <NLayout has-sider position="absolute" style="height: 100vh;">
      <NLayoutSider
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
          <NuxtLink to="/cabinet" class="logo-link">
            <NIcon v-if="isSidebarCollapsed" size="28" color="white">
              <component :is="HomeIcon" />
            </NIcon>
            <NH2 v-else style="margin: 0; font-weight: 700; color: white; font-size: 1.25rem;">
              LanG Academy
            </NH2>
          </NuxtLink>
        </div>

        <NMenu
          :collapsed="isSidebarCollapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :value="activeKey"
          @update:value="handleMenuUpdate"
          class="cabinet-menu"
        />

        <div class="sidebar-footer">
          <NButton
            v-if="!isSidebarCollapsed"
            block
            ghost
            type="error"
            @click="handleLogout"
            class="logout-btn"
          >
            <template #icon>
              <NIcon><component :is="LogoutIcon" /></NIcon>
            </template>
            Выйти
          </NButton>
          <NButton
            v-else
            circle
            ghost
            type="error"
            @click="handleLogout"
            class="logout-btn-collapsed"
          >
            <template #icon>
              <NIcon><component :is="LogoutIcon" /></NIcon>
            </template>
          </NButton>
        </div>
      </NLayoutSider>

      <NLayout>
        <NLayoutHeader bordered class="cabinet-header">
          <div class="header-left">
            <NH1 style="margin: 0; font-size: 1.5rem; font-weight: 600;">
              {{ activePageTitle }}
            </NH1>
          </div>
          <div class="header-right">
            <NSelect
              v-model:value="currentLang"
              :options="languageOptions"
              style="width: 150px;"
              @update:value="handleLanguageChange"
            />
            <NDropdown :options="userMenuOptions" @select="handleUserMenuSelect">
              <div class="user-profile">
                <NAvatar
                  round
                  :size="36"
                  :src="avatarSrc"
                  :fallback-src="avatarFallback"
                />
                <span v-if="userName" class="user-name">{{ userName }}</span>
                <NIcon size="14"><component :is="ChevronDownIcon" /></NIcon>
              </div>
            </NDropdown>
          </div>
        </NLayoutHeader>

        <NLayoutContent content-style="padding: 24px;" class="cabinet-main" :native-scrollbar="false">
          <NMessageProvider>
            <div class="cabinet-content-inner">
              <slot />
            </div>
          </NMessageProvider>
        </NLayoutContent>
      </NLayout>
    </NLayout>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { ref, computed, h, type Component } from 'vue'
import {
  NConfigProvider,
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NButton,
  NIcon,
  NSelect,
  NDropdown,
  NAvatar,
  NH1,
  NH2,
  NMessageProvider,
  type MenuOption,
} from 'naive-ui'
import {
  HomeOutline as HomeIcon,
  PersonOutline as PersonIcon,
  DocumentTextOutline as DocumentIcon,
  PeopleOutline as PeopleIcon,
  BarChartOutline as ChartIcon,
  BookOutline as BookIcon,
  CalendarOutline as CalendarIcon,
  LogOutOutline as LogoutIcon,
  ChevronDownOutline as ChevronDownIcon,
} from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/authStore'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { locale } = useI18n()
const route = useRoute()

const isSidebarCollapsed = ref(false)

const userName = computed(() => {
  const user = authStore.user
  if (!user) return 'Пользователь'
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
})

const avatarSrc = computed(() => authStore.user?.avatar || undefined)
const avatarFallback = computed(() => {
  const letter = (userName.value || 'U').charAt(0).toUpperCase()
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect fill='%2318a058' width='32' height='32'/><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' fill='white' font-size='14'>${letter}</text></svg>`
})

const availableLocales = [
  { label: 'Türkmen', value: 'tm' },
  { label: 'Русский', value: 'ru' },
  { label: 'English', value: 'en' },
]

const currentLang = ref(locale.value)

const languageOptions = computed(() =>
  availableLocales.map((l) => ({ label: l.label, value: l.value }))
)

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const userMenuOptions = [
  { label: 'Профиль', key: 'profile', icon: renderIcon(PersonIcon) },
  { label: 'Выйти', key: 'logout', icon: renderIcon(LogoutIcon) },
]

const menuOptions = computed<MenuOption[]>(() => {
  const user = authStore.user
  if (!user) return []

  const userRole = (user.role || '').toUpperCase()
  const options: MenuOption[] = []

  options.push(
    { label: 'Дашборд', key: '/cabinet', icon: renderIcon(HomeIcon) },
    { label: 'Профиль', key: '/cabinet/profile', icon: renderIcon(PersonIcon) }
  )

  const isEditor = ['EDITOR', 'SUPERUSER', 'HEAD_TEACHER'].includes(userRole)
  if (isEditor) {
    options.push({
      label: 'Контент сайта',
      key: 'content-group',
      icon: renderIcon(DocumentIcon),
      children: [
        { label: 'Все курсы', key: '/cabinet/editor/courses' },
        { label: 'Лента новостей', key: '/cabinet/editor/news' },
        { label: 'Категории', key: '/cabinet/editor/categories' },
        { label: 'Подкатегории', key: '/cabinet/editor/subcategories' },
        { label: 'Входящие сообщения', key: '/cabinet/editor/contact' },
      ],
    })
  }

  if (userRole === 'TEACHER') {
    options.push(
      { label: 'Группы', key: '/cabinet/teacher/groups', icon: renderIcon(PeopleIcon) },
      { label: 'Успеваемость', key: '/cabinet/teacher/journal', icon: renderIcon(ChartIcon) }
    )
  }

  if (userRole === 'STUDENT') {
    options.push(
      { label: 'Мои курсы', key: '/cabinet/student/courses', icon: renderIcon(BookIcon) },
      { label: 'Календарь', key: '/cabinet/student/calendar', icon: renderIcon(CalendarIcon) }
    )
  }

  return options
})

const activeKey = computed(() => {
  const path = route.path
  const options = menuOptions.value
  const leafKeys = options.flatMap((opt) =>
    opt.children ? opt.children.map((c) => c.key) : [opt.key]
  ).filter((k): k is string => typeof k === 'string' && k.startsWith('/'))
  const exact = leafKeys.find((k) => k === path)
  if (exact) return exact
  const sorted = [...leafKeys].sort((a, b) => b.length - a.length)
  const found = sorted.find((k) => path.startsWith(k) && (path === k || path[k.length] === '/'))
  return found || path
})

const activePageTitle = computed(() => {
  const path = route.path
  if (path === '/cabinet') return 'Обзор'
  if (path.includes('/profile')) return 'Мой профиль'
  if (path.includes('/news')) return 'Новости'
  if (path.includes('/courses')) return 'Курсы'
  if (path.includes('/contact')) return 'Сообщения'
  if (path.includes('/categories')) return 'Категории'
  if (path.includes('/subcategories')) return 'Подкатегории'
  return 'Рабочий стол'
})

function handleMenuUpdate(key: string) {
  if (key.startsWith('/')) {
    navigateTo(key)
  }
}

function handleLanguageChange(value: string) {
  locale.value = value
  currentLang.value = value
}

function handleUserMenuSelect(key: string) {
  if (key === 'profile') {
    navigateTo('/cabinet/profile')
  } else if (key === 'logout') {
    handleLogout()
  }
}

async function handleLogout() {
  await authStore.logout()
  await navigateTo('/landing/login')
}
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

.sidebar-header.header-collapsed {
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

.cabinet-content-inner {
  max-width: 1280px;
  margin: 0 auto;
}
</style>
