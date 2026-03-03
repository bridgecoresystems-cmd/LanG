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

        <div v-if="!isSidebarCollapsed && groupOptions.length > 0" class="group-selector-container">
          <div class="group-selector-label">Текущая группа:</div>
          <NSelect
            :key="'group-' + groupOptions.length"
            :value="groupSelectValue"
            :options="groupOptions"
            size="small"
            placeholder="Выберите группу"
            @update:value="handleGroupChange"
            class="group-selector"
          />
          <NDivider style="margin: 12px 0 0 0; background-color: rgba(255,255,255,0.1);" />
        </div>

        <NMenu
          :collapsed="isSidebarCollapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :value="activeKey"
          :render-label="renderMenuLabel"
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

      <!-- Floating student chat button (visible on all student pages) -->
      <ChatStudentButton v-if="hasRole(authStore.user, 'STUDENT')" />

      <NLayout>
        <NLayoutHeader bordered class="cabinet-header">
          <div class="header-left">
            <NH1 style="margin: 0; font-size: 1.5rem; font-weight: 600;">
              {{ activePageTitle }}
            </NH1>
          </div>
          <div class="header-right">
            <div v-if="rolesDisplay.length" class="header-roles">
              <NTag
                v-for="(label, idx) in rolesDisplay"
                :key="idx"
                :type="idx === 0 ? 'primary' : 'default'"
                size="small"
                round
              >
                {{ label }}
              </NTag>
            </div>
            <NSelect
              v-model:value="currentLang"
              :options="languageOptions"
              style="width: 150px;"
              @update:value="handleLanguageChange"
            />
            <NDropdown :options="userMenuOptions" trigger="click" @select="handleUserMenuSelect">
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
import { ref, computed, h, onMounted, nextTick, type Component } from 'vue'
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
  NTag,
  NMessageProvider,
  NDivider,
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
  CallOutline as CallIcon,
  MailOutline as MailIcon,
  GameControllerOutline as GameIcon,
  ListOutline as ListIcon,
  AddOutline as AddIcon,
  CardOutline as PaymentIcon,
} from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/authStore'
import { useContextStore } from '~/stores/contextStore'
import { useCabinetProfile } from '~/composables/useCabinetProfile'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const contextStore = useContextStore()
const profileApi = useCabinetProfile()
const { locale } = useI18n()
const route = useRoute()

const isSidebarCollapsed = ref(false)

// Загрузка групп при монтировании (единый источник для layout и страниц)
onMounted(async () => {
  if (hasAnyRole(authStore.user, ['TEACHER', 'STUDENT'])) {
    try {
      const groups = await profileApi.getMyGroups()
      const normalized = Array.isArray(groups) ? groups.map((g: any) => ({
        ...g,
        course_name: g.course_name ?? g.courseName
      })) : []
      contextStore.setGroups(normalized)
    } catch (e) {
      console.error('Failed to load groups for context', e)
    }
  }
})

const groupOptions = computed(() => {
  return contextStore.availableGroups.map(g => ({
    label: g.name, // Делаем короче, только имя группы
    value: g.id
  }))
})

// Безопасное значение для NSelect — только если группа есть в списке (избегаем ошибок naive-ui)
const groupSelectValue = computed(() => {
  const id = contextStore.selectedGroupId
  if (!id || !groupOptions.value.some(g => g.value === id)) return null
  return id
})

const handleGroupChange = (value: number | null) => {
  if (value == null) return
  const prevId = contextStore.selectedGroupId
  contextStore.setSelectedGroup(value)

  // Если текущая страница привязана к группе — перезагружаем её с новой группой
  const path = route?.path ?? ''
  const teacherMatch = path.match(/^\/cabinet\/teacher\/groups\/\d+\/([^/]+)(?:\/.*)?$/)
  const studentMatch = path.match(/^\/cabinet\/student\/groups\/\d+\/([^/]+)(?:\/.*)?$/)
  const match = teacherMatch || studentMatch
  if (match && prevId !== value) {
    const page = match[1] // students, lessons, attendance, grades, games
    const base = teacherMatch ? '/cabinet/teacher' : '/cabinet/student'
    navigateTo(`${base}/groups/${value}/${page}`)
  }
}

const userName = computed(() => {
  const user = authStore.user
  if (!user) return 'Пользователь'
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
})

const ROLE_LABELS: Record<string, string> = {
  SUPERUSER: 'Суперпользователь',
  GEN_DIRECTOR: 'Ген. директор',
  HEAD_ACCOUNTANT: 'Гл. бухгалтер',
  DIRECTOR: 'Директор',
  HEAD_TEACHER: 'Завуч',
  TEACHER: 'Учитель',
  STUDENT: 'Ученик',
  PARENT: 'Родитель',
  MERCHANT: 'Мерчант',
  SALES: 'Продажи',
  RECEPTIONIST: 'Рецепция',
  EDITOR: 'Редактор',
}

const rolesDisplay = computed(() => {
  const user = authStore.user
  if (!user) return []
  const main = (user.role || '').toUpperCase()
  const mainLabel = ROLE_LABELS[main] || main || ''
  const additional = (user.additional_roles || [])
    .map((r: string) => (r || '').toUpperCase())
    .filter((r: string) => r && r !== main)
  const additionalLabels = additional.map((r: string) => ROLE_LABELS[r] || r)
  return [mainLabel, ...additionalLabels].filter(Boolean)
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

// Хелпер для проверки роли (основная или дополнительная)
const hasRole = (user: any, role: string): boolean => {
  if (!user) return false
  const mainRole = (user.role || '').toUpperCase()
  const additionalRoles = (user.additional_roles || []).map((r: string) => (r || '').toUpperCase())
  const roleUpper = role.toUpperCase()
  return mainRole === roleUpper || additionalRoles.includes(roleUpper)
}

// Хелпер для проверки наличия любой из ролей
const hasAnyRole = (user: any, roles: string[]): boolean => {
  return roles.some(role => hasRole(user, role))
}

const menuOptions = computed<MenuOption[]>(() => {
  const user = authStore.user
  if (!user) return []

  const userRole = (user.role || '').toUpperCase()
  const options: MenuOption[] = []

  options.push(
    { label: 'Дашборд', key: '/cabinet', icon: renderIcon(HomeIcon) }
  )

  // EDITOR и SUPERUSER видят контент; HEAD_TEACHER — нет (только ученики и родители)
  const isEditor = hasAnyRole(user, ['EDITOR', 'SUPERUSER'])
  if (isEditor) {
    options.push({
      label: 'Контент сайта',
      key: 'content-group',
      icon: renderIcon(DocumentIcon),
      children: [
        { label: 'Все курсы', key: '/cabinet/editor/courses', icon: renderIcon(BookIcon) },
        { label: 'Лента новостей', key: '/cabinet/editor/news', icon: renderIcon(DocumentIcon) },
        { label: 'Категории', key: '/cabinet/editor/categories', icon: renderIcon(ChartIcon) },
        { label: 'Подкатегории', key: '/cabinet/editor/subcategories', icon: renderIcon(HomeIcon) },
        { label: 'Входящие сообщения', key: '/cabinet/editor/contact', icon: renderIcon(PeopleIcon) },
      ],
    })
  }

  // Завуч: ученики, родители, курсы, рассылки
  if (hasRole(user, 'HEAD_TEACHER')) {
    options.push(
      {
        label: 'Ученики и родители',
        key: '/cabinet/head-teacher/users',
        icon: renderIcon(PeopleIcon),
      },
      {
        label: 'Курсы',
        key: '/cabinet/head-teacher/courses',
        icon: renderIcon(BookIcon),
      },
      {
        label: 'Группы',
        key: '/cabinet/head-teacher/groups',
        icon: renderIcon(PeopleIcon),
      },
      {
        label: 'Уроки',
        key: '/cabinet/head-teacher/lessons',
        icon: renderIcon(CalendarIcon),
      },
      {
        label: 'Рассылки',
        key: '/cabinet/head-teacher/mailing',
        icon: renderIcon(MailIcon),
      },
      {
        label: 'Экзамены',
        key: '/cabinet/head-teacher/exam-settings',
        icon: renderIcon(ListIcon),
      }
    )
  }

  if (hasRole(user, 'TEACHER')) {
    options.push(
      { label: 'Мои курсы', key: '/cabinet/teacher/courses', icon: renderIcon(BookIcon) },
      { label: 'Расписание', key: '/cabinet/schedule', icon: renderIcon(CalendarIcon) }
    )
    // Если выбрана группа, показываем плоский список меню для учителя
    if (contextStore.selectedGroupId) {
      options.push(
        { label: 'Список учеников', key: `/cabinet/teacher/groups/${contextStore.selectedGroupId}/students`, icon: renderIcon(PeopleIcon) },
        { label: 'Журнал / Уроки', key: `/cabinet/teacher/groups/${contextStore.selectedGroupId}/lessons`, icon: renderIcon(CalendarIcon) },
        { label: 'Посещаемость', key: `/cabinet/teacher/groups/${contextStore.selectedGroupId}/attendance`, icon: renderIcon(DocumentIcon) },
        { label: 'Оценки', key: `/cabinet/teacher/groups/${contextStore.selectedGroupId}/grades`, icon: renderIcon(ChartIcon) },
        { label: 'Игры', key: `/cabinet/teacher/groups/${contextStore.selectedGroupId}/games`, icon: renderIcon(GameIcon) },
      )
    }
    
    // Рассылки (Mailing) для учителя
    options.push(
      { label: 'Рассылки', key: '/cabinet/mailing', icon: renderIcon(MailIcon) }
    )
  }

  if (hasRole(user, 'STUDENT')) {
    const studentGroupId = contextStore.selectedGroupId ?? contextStore.availableGroups[0]?.id
    options.push(
      { label: 'Мои курсы', key: '/cabinet/student/courses', icon: renderIcon(BookIcon) },
      ...(studentGroupId ? [
        { label: 'Уроки и материалы', key: `/cabinet/student/groups/${studentGroupId}/lessons`, icon: renderIcon(CalendarIcon) },
        { label: 'Моя успеваемость', key: `/cabinet/student/groups/${studentGroupId}/grades`, icon: renderIcon(ChartIcon) },
        { label: 'Игры', key: `/cabinet/student/groups/${studentGroupId}/games`, icon: renderIcon(GameIcon) },
      ] : []),
      { label: 'Мои платежи', key: '/cabinet/student/payments', icon: renderIcon(PaymentIcon) },
      { label: 'Расписание', key: '/cabinet/schedule', icon: renderIcon(CalendarIcon) },
      { label: 'Сообщения', key: '/cabinet/mailing', icon: renderIcon(MailIcon) }
    )
  }

  if (hasRole(user, 'PARENT')) {
    options.push(
      { label: 'Мои дети', key: '/cabinet/children', icon: renderIcon(PeopleIcon) },
      { label: 'Сообщения', key: '/cabinet/mailing', icon: renderIcon(MailIcon) }
    )
  }

  // Проверяем роль SALES в основной или дополнительных ролях
  if (hasRole(user, 'SALES')) {
    options.push(
      { label: 'Дневник звонков', key: '/cabinet/sales', icon: renderIcon(CallIcon) }
    )
  }

  // Бухгалтер (Accountant)
  if (hasRole(user, 'ACCOUNTANT')) {
    options.push({
      label: 'Оплата',
      key: 'payment-group',
      icon: renderIcon(DocumentIcon),
      children: [
        { label: 'Принять оплату', key: '/cabinet/accountant/payments/add', icon: renderIcon(AddIcon) },
        { label: 'Отчёт по оплатам', key: '/cabinet/accountant/payments', icon: renderIcon(ChartIcon) },
        { label: 'Контроль оплаты', key: '/cabinet/accountant/debts', icon: renderIcon(ChartIcon) },
        { label: 'Тарифы', key: '/cabinet/accountant/tariffs', icon: renderIcon(DocumentIcon) },
      ],
    })
  }

  // Главный бухгалтер (Head Accountant)
  if (hasRole(user, 'HEAD_ACCOUNTANT')) {
    options.push({
      label: 'Бухгалтерия',
      key: 'head-payment-group',
      icon: renderIcon(DocumentIcon),
      children: [
        { label: 'Все транзакции', key: '/cabinet/head-accountant/payments', icon: renderIcon(ChartIcon) },
        { label: 'Принять оплату', key: '/cabinet/head-accountant/payments/add', icon: renderIcon(AddIcon) },
        { label: 'Контроль оплаты', key: '/cabinet/head-accountant/debts', icon: renderIcon(ChartIcon) },
        { label: 'Тарифы', key: '/cabinet/head-accountant/tariffs', icon: renderIcon(DocumentIcon) },
      ],
    })
  }

  // Профиль всегда в самом низу
  options.push(
    { label: 'Профиль', key: '/cabinet/profile', icon: renderIcon(PersonIcon) }
  )

  return options
})

const activeKey = computed(() => {
  const path = route?.path ?? ''
  const options = menuOptions.value
  const leafKeys = options.flatMap((opt) =>
    opt.children ? opt.children.map((c) => c.key) : [opt.key]
  ).filter((k): k is string => typeof k === 'string' && k.startsWith('/'))
  const exact = leafKeys.find((k) => k === path)
  if (exact) return exact
  const sorted = [...leafKeys].sort((a, b) => b.length - a.length)
  const found = sorted.find((k) => path && path.startsWith(k) && (path === k || path[k.length] === '/'))
  return found || path
})

const activePageTitle = computed(() => {
  const path = route?.path ?? ''
  if (path === '/cabinet') return 'Обзор'
  if (path.includes('/profile')) return 'Мой профиль'
  if (path.includes('/sales')) return 'Sales дневник'
  if (path.includes('/news')) return 'Новости'
  if (path.includes('/courses')) return 'Курсы'
  if (path.includes('/students')) return 'Список учеников'
  if (path.includes('/contact')) return 'Сообщения'
  if (path.includes('/categories')) return 'Категории'
  if (path.includes('/subcategories')) return 'Подкатегории'
  if (path.includes('/head-teacher/users')) return 'Ученики и родители'
  if (path.includes('/head-teacher/courses')) return 'Курсы'
  if (path.includes('/head-teacher/groups')) return 'Группы'
  if (path.includes('/head-teacher/lessons')) return 'Уроки'
  if (path.includes('/head-teacher/mailing')) return 'Рассылки'
  if (path.includes('/head-teacher/exam-settings')) return 'Настройки экзаменов'
  if (path.includes('/cabinet/mailing')) return 'Сообщения'
  if (path.includes('/sales')) return 'Sales дневник'
  return 'Рабочий стол'
})

function renderMenuLabel(option: MenuOption) {
  const key = option.key
  if (typeof key === 'string' && key.startsWith('/')) {
    return h('div', {
      class: 'menu-link',
      role: 'link',
      onClick: (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        navigateTo(key)
      },
    }, option.label as string)
  }
  return option.label as string
}

function handleMenuUpdate(key: string) {
  if (typeof key === 'string' && key.startsWith('/')) {
    navigateTo(key)
  }
}

function handleLanguageChange(value: string) {
  locale.value = value
  currentLang.value = value
}

function handleUserMenuSelect(key: string) {
  nextTick(() => {
    if (key === 'profile') {
      navigateTo('/cabinet/profile')
    } else if (key === 'logout') {
      handleLogout()
    }
  })
}

async function handleLogout() {
  await authStore.logout()
  await nextTick()
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

.group-selector-container {
  padding: 12px 16px;
}

.group-selector-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
  font-weight: 600;
}

.group-selector :deep(.n-base-selection) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.group-selector :deep(.n-base-selection-label) {
  color: white !important;
}

.group-selector :deep(.n-base-selection__placeholder) {
  color: rgba(255, 255, 255, 0.5) !important;
}

.group-selector :deep(.n-base-selection__suffix-arrow) {
  color: rgba(255, 255, 255, 0.7) !important;
}

.cabinet-menu {
  margin-top: 10px;
}

.menu-link {
  display: block;
  width: 100%;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}

:deep(.n-menu-item-content .menu-link) {
  color: rgba(255, 255, 255, 0.85);
}

:deep(.n-menu-item-content:hover .menu-link),
:deep(.n-menu-item-content--selected .menu-link) {
  color: #18a058;
}

:deep(.n-menu-item-content) {
  color: rgba(255, 255, 255, 0.85) !important;
}
:deep(.n-menu-item-content-header) {
  color: rgba(255, 255, 255, 0.85) !important;
}
:deep(.n-menu-item-content .n-icon) {
  color: rgba(255, 255, 255, 0.8) !important;
}
:deep(.n-menu-item-content .n-menu-item-content__arrow) {
  color: rgba(255, 255, 255, 0.6) !important;
}

:deep(.n-menu-item-content:hover) {
  background-color: rgba(255, 255, 255, 0.9) !important;
}
:deep(.n-menu-item-content--selected) {
  background-color: rgba(255, 255, 255, 1) !important;
}
:deep(.n-menu-item-content:hover .n-menu-item-content-header),
:deep(.n-menu-item-content--selected .n-menu-item-content-header) {
  color: #18a058 !important;
  font-weight: 600;
}
:deep(.n-menu-item-content:hover .n-icon),
:deep(.n-menu-item-content--selected .n-icon),
:deep(.n-menu-item-content--child-active .n-icon) {
  color: #18a058 !important;
}
:deep(.n-menu-item-content:hover .n-menu-item-content__arrow),
:deep(.n-menu-item-content--selected .n-menu-item-content__arrow),
:deep(.n-menu-item-content--child-active .n-menu-item-content__arrow) {
  color: #18a058 !important;
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

.header-roles {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
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
  width: 100%;
  min-width: 0;
}
</style>
