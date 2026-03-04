<template>
  <QLayout view="hHh lpR fFf" class="admin-layout">
    <!-- Header -->
    <QHeader elevated class="admin-header text-white">
      <QToolbar>
        <QBtn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <QToolbarTitle class="admin-title">
          Bridgecore SYSTEMS admin panel 
        </QToolbarTitle>
        <QSpace />
        <div class="q-gutter-sm row items-center no-wrap">
          <QBtn flat no-caps :to="'/admin/changelogs'" icon="history" label="Changelog" class="q-mr-sm" />
          <QBtn flat no-caps class="user-menu-button">
            <img
              v-if="avatarSrc"
              :src="avatarSrc"
              alt="User avatar"
              class="admin-header-avatar q-mr-sm"
            />
            <QAvatar v-else size="42px" class="q-mr-sm" icon="person" />
            <span class="text-body2 text-weight-medium">
              {{ authStore.user?.first_name || authStore.user?.last_name
                ? [authStore.user?.first_name, authStore.user?.last_name].filter(Boolean).join(' ')
                : authStore.user?.username || 'Админ' }}
            </span>
            <QIcon name="expand_more" size="20px" class="q-ml-xs" />
            <QMenu>
              <QList style="min-width: 140px">
                <QItem clickable v-close-popup @click="handleLogout">
                  <QItemSection avatar>
                    <QIcon name="logout" color="negative" />
                  </QItemSection>
                  <QItemSection>Выйти</QItemSection>
                </QItem>
              </QList>
            </QMenu>
          </QBtn>
        </div>
      </QToolbar>
    </QHeader>

    <!-- Sidebar -->
    <QDrawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="admin-sidebar"
      :width="250"
    >
      <QScrollArea class="fit">
        <QList padding>
          <QItemLabel header class="nav-section-header">Управление</QItemLabel>

          <QItem to="/admin" exact clickable v-ripple active-class="nav-item-active" class="nav-item">
            <QItemSection avatar>
              <QIcon name="dashboard" />
            </QItemSection>
            <QItemSection>Дашборд</QItemSection>
          </QItem>

          <QExpansionItem 
            icon="public" 
            label="Лендинг" 
            v-model="isLandingExpanded"
            header-class="nav-section-header" 
            expand-icon-class="text-dark"
          >
            <QItem to="/admin/landing/categories" clickable v-ripple :inset-level="1" active-class="nav-item-active" class="nav-subitem">
              <QItemSection avatar>
                <QIcon name="category" />
              </QItemSection>
              <QItemSection>Категории</QItemSection>
            </QItem>
            <QItem to="/admin/landing/subcategories" clickable v-ripple :inset-level="1" active-class="nav-item-active" class="nav-subitem">
              <QItemSection avatar>
                <QIcon name="list" />
              </QItemSection>
              <QItemSection>Подкатегории</QItemSection>
            </QItem>
            <QItem to="/admin/landing/courses" clickable v-ripple :inset-level="1" active-class="nav-item-active" class="nav-subitem">
              <QItemSection avatar>
                <QIcon name="book" />
              </QItemSection>
              <QItemSection>Курсы</QItemSection>
            </QItem>
            <QItem to="/admin/landing/news" clickable v-ripple :inset-level="1" active-class="nav-item-active" class="nav-subitem">
              <QItemSection avatar>
                <QIcon name="newspaper" />
              </QItemSection>
              <QItemSection>Новости</QItemSection>
            </QItem>
            <QItem to="/admin/landing/contact" clickable v-ripple :inset-level="1" active-class="nav-item-active" class="nav-subitem">
              <QItemSection avatar>
                <QIcon name="mail" />
              </QItemSection>
              <QItemSection>Сообщения</QItemSection>
            </QItem>
          </QExpansionItem>

          <QItem to="/admin/schools" clickable v-ripple active-class="nav-item-active" class="nav-item">
            <QItemSection avatar>
              <QIcon name="school" />
            </QItemSection>
            <QItemSection>Школы</QItemSection>
          </QItem>
          <QItem to="/admin/users" clickable v-ripple active-class="nav-item-active" class="nav-item">
            <QItemSection avatar>
              <QIcon name="people" />
            </QItemSection>
            <QItemSection>Пользователи</QItemSection>
          </QItem>

          <QItem to="/admin/terminals" clickable v-ripple active-class="nav-item-active" class="nav-item">
            <QItemSection avatar>
              <QIcon name="point_of_sale" />
            </QItemSection>
            <QItemSection>Терминалы 💎</QItemSection>
          </QItem>

          <QItem to="/admin/gems/requests" clickable v-ripple active-class="nav-item-active" class="nav-item">
            <QItemSection avatar>
              <QIcon name="diamond" />
            </QItemSection>
            <QItemSection>Заявки Gems 💎</QItemSection>
          </QItem>

          <QItem to="/admin/sales" clickable v-ripple active-class="nav-item-active" class="nav-item">
            <QItemSection avatar>
              <QIcon name="phone" />
            </QItemSection>
            <QItemSection>Sales дневник</QItemSection>
          </QItem>

          <QItem clickable v-ripple @click="router.push('/admin/profile')" class="nav-item">
            <QItemSection avatar>
              <QIcon name="person" />
            </QItemSection>
            <QItemSection>Профиль администратора</QItemSection>
          </QItem>
        </QList>
      </QScrollArea>
    </QDrawer>

    <!-- Main Content -->
    <QPageContainer>
      <QPage class="admin-page">
        <!-- Breadcrumb -->
        <QBreadcrumbs class="admin-breadcrumbs" separator="/" gutter="sm">
          <QBreadcrumbsEl label="Admin" icon="home" to="/admin" />
          <QBreadcrumbsEl
            v-for="(item, index) in breadcrumbItems"
            :key="index"
            :label="item.label"
            :to="item.path"
          />
        </QBreadcrumbs>

        <!-- Page Content -->
        <div class="admin-content-area">
          <slot />
        </div>
      </QPage>
    </QPageContainer>

    <!-- Password Dialog -->
  </QLayout>
</template>

<script setup lang="ts">
const leftDrawerOpen = ref(true)
const authStore = useAuthStore()
const router = useRouter()
const avatarSrc = computed(() => {
  const av = authStore.user?.avatar
  if (!av || av === '') return undefined
  // Если путь относительный (начинается с /), используем как есть
  // Если полный URL, используем как есть
  return av.startsWith('http') ? av : av
})
const route = useRoute()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const $q = useQuasar()

const loading = ref(false)

// Landing expansion state - ref для QExpansionItem
const isLandingExpanded = ref(false)

// Автоматически открывать Landing при навигации на landing страницы
watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/admin/landing')) {
    isLandingExpanded.value = true
  }
}, { immediate: true })

const breadcrumbItems = computed(() => {
  const items: Array<{ label: string; path?: string }> = []
  const path = route.path

  if (path.startsWith('/admin/landing')) {
    items.push({ label: 'Лендинг', path: '/admin/landing/categories' })
    if (path.includes('/categories')) items.push({ label: 'Категории' })
    if (path.includes('/courses')) items.push({ label: 'Курсы' })
    if (path.includes('/news')) {
      items.push({ label: 'Новости', path: '/admin/landing/news' })
      if (path.match(/\/news\/add$/)) items.push({ label: 'Добавить' })
      if (path.match(/\/news\/[\d]+$/)) items.push({ label: 'Редактировать' })
    }
    if (path.includes('/contact')) {
      items.push({ label: 'Сообщения', path: '/admin/landing/contact' })
      if (path.match(/\/contact\/[\d]+$/)) items.push({ label: 'Редактировать' })
    }
  } else if (path.includes('/schools')) {
    items.push({ label: 'Школы', path: '/admin/schools' })
    if (path.match(/\/schools\/add$/)) items.push({ label: 'Добавить' })
    if (path.match(/\/schools\/[\d]+$/) && !path.endsWith('/add')) items.push({ label: 'Редактировать' })
  } else if (path.includes('/users')) {
    items.push({ label: 'Пользователи', path: '/admin/users' })
    if (path.match(/\/users\/add$/)) items.push({ label: 'Добавить' })
    if (path.match(/\/users\/[^/]+$/) && !path.endsWith('/add')) items.push({ label: 'Редактировать' })
  } else if (path.includes('/terminals')) {
    items.push({ label: 'Терминалы', path: '/admin/terminals' })
    if (path.match(/\/terminals\/add$/)) items.push({ label: 'Добавить' })
  } else if (path.includes('/gems')) {
    items.push({ label: 'Заявки Gems 💎', path: '/admin/gems/requests' })
  } else if (path.includes('/sales')) {
    items.push({ label: 'Sales дневник', path: '/admin/sales' })
    if (path.match(/\/sales\/add$/)) items.push({ label: 'Добавить' })
    if (path.match(/\/sales\/[\d]+$/) && !path.endsWith('/add')) items.push({ label: 'Редактировать' })
  } else if (path.includes('/profile')) {
    items.push({ label: 'Профиль' })
  } else if (path.includes('/changelogs')) {
    items.push({ label: 'Changelog' })
  }

  return items
})

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/landing/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header {
  background: #417690 !important;
}

.admin-header :deep(.q-toolbar),
.admin-header :deep(.q-btn),
.admin-header :deep(.q-icon),
.admin-header :deep(.q-toolbar-title) {
  color: white !important;
}

.admin-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: white !important;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.user-menu-button {
  color: white !important;
}

.admin-sidebar {
  background: #ffffff !important;
  border-right: 1px solid #e0e0e0;
}

.admin-sidebar :deep(.q-drawer__content),
.admin-sidebar :deep(.q-scrollarea) {
  background: #ffffff !important;
}

.admin-sidebar :deep(.q-item),
.admin-sidebar :deep(.q-item-label),
.admin-sidebar :deep(.q-expansion-item),
.admin-sidebar :deep(.q-expansion-item__content),
.admin-sidebar :deep(.q-icon),
.admin-sidebar :deep(span) {
  color: #1a1a1a !important;
}

.nav-section-header {
  color: #666666 !important;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-item,
.nav-subitem {
  color: #1a1a1a !important;
}

.nav-item-active {
  background: rgba(65, 118, 144, 0.12) !important;
  border-left: 3px solid #417690;
  color: #417690 !important;
}

.admin-page {
  background: #f5f5f5;
}

.admin-breadcrumbs {
  padding: 0.75rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.admin-content-area {
  padding: 1.5rem;
  background: white;
  margin: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  min-height: calc(100vh - 200px);
}

.admin-header-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}
</style>
