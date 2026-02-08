<template>
  <q-layout view="hHh lpR fFf" class="admin-layout">
    <!-- Header -->
    <q-header elevated class="admin-header text-white" style="background: #417690 !important;">
      <q-toolbar>
        <q-toolbar-title class="admin-title text-white">
          {{ $t('admin.title') }}
        </q-toolbar-title>

        <q-space />

        <!-- Language Selector -->
        <q-select
          v-model="currentLang"
          :options="languageOptions"
          option-label="label"
          option-value="code"
          emit-value
          map-options
          dense
          borderless
          class="q-mr-md text-white"
          dark
          @update:model-value="handleLanguageChange"
        >
          <template v-slot:selected>
            <div class="row items-center no-wrap">
              <span class="q-mr-xs">{{ getCurrentLanguageFlag() }}</span>
              <span>{{ getCurrentLanguageName() }}</span>
            </div>
          </template>
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <span>{{ scope.opt.flag }}</span>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- User Menu -->
        <q-btn-dropdown
          flat
          no-caps
          class="user-menu-button text-white"
        >
          <template v-slot:label>
            <div class="row items-center no-wrap">
              <q-avatar size="32px" class="q-mr-sm">
                <img v-if="userAvatar" :src="userAvatar" :alt="userFullName" />
                <q-icon v-else name="person" />
              </q-avatar>
              <span class="user-name">{{ userFullName }}</span>
            </div>
          </template>

          <q-list>
            <q-item clickable v-close-popup to="/">
              <q-item-section avatar>
                <q-icon name="home" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('common.home') }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />

            <q-item clickable v-close-popup @click="handleLogout">
              <q-item-section avatar>
                <q-icon name="logout" color="negative" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-negative">{{ $t('auth.logout') }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <!-- Sidebar -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="admin-sidebar text-white"
      style="background: #417690 !important;"
      :width="250"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <!-- Landing Section -->

          <!-- Landing Section -->
          <q-expansion-item
            v-model="isLandingExpanded"
            :label="$t('admin.sections.landing') || 'Landing'"
            header-class="nav-section-header"
            expand-icon-class="text-white"
            icon="public"
          >
            <q-item
              v-for="item in landingMenuItems"
              :key="item.path"
              clickable
              v-ripple
              :to="item.path"
              :active="route.path.startsWith(item.path)"
              active-class="nav-item-active"
              class="nav-subitem"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>

          <q-separator spaced />

          <!-- Users Section -->
          <q-expansion-item
            v-model="isUsersExpanded"
            :label="$t('admin.sections.users')"
            header-class="nav-section-header"
            expand-icon-class="text-white"
            icon="people"
          >
            <q-item
              v-for="item in usersMenuItems"
              :key="item.path"
              clickable
              v-ripple
              :to="item.path"
              :active="route.path.startsWith(item.path)"
              active-class="nav-item-active"
              class="nav-subitem"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>

          <q-separator spaced />

          <!-- Points Section -->
          <q-expansion-item
            v-model="isPointsExpanded"
            :label="t('admin.sections.points') || 'Баллы & RFID'"
            header-class="nav-section-header"
            expand-icon-class="text-white"
            icon="monetization_on"
          >
            <q-item
              v-for="item in pointsMenuItems"
              :key="item.path"
              clickable
              v-ripple
              :to="item.path"
              :active="route.path.startsWith(item.path)"
              active-class="nav-item-active"
              class="nav-subitem"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>

          <q-separator spaced />

          <!-- System Section -->
          <q-expansion-item
            v-model="isSystemExpanded"
            :label="$t('admin.sections.system')"
            header-class="nav-section-header"
            expand-icon-class="text-white"
            icon="settings"
          >
            <q-item
              v-for="item in systemMenuItems"
              :key="item.path"
              clickable
              v-ripple
              :to="item.path"
              :active="route.path.startsWith(item.path)"
              active-class="nav-item-active"
              class="nav-subitem"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Main Content -->
    <q-page-container>
      <q-page class="admin-page">
        <!-- Breadcrumb -->
        <q-breadcrumbs class="q-pa-md bg-white" separator="/" gutter="sm">
          <q-breadcrumbs-el
            :label="$t('admin.title')"
            icon="home"
            to="/management"
          />
          <q-breadcrumbs-el
            v-for="(item, index) in breadcrumbItems"
            :key="index"
            :label="item.label"
            :to="item.path"
          />
        </q-breadcrumbs>

        <!-- Page Content -->
        <div class="content-area">
          <slot />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { useLanguage } from '@/composables/useLanguage'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuth()
const { languages, setLanguage, locale: initialLocale } = useLanguage()

const leftDrawerOpen = ref(true)
const isLandingExpanded = ref(false)
const isUsersExpanded = ref(false)
const isPointsExpanded = ref(false)
const isSystemExpanded = ref(false)
const currentLang = ref(initialLocale)

const userFullName = computed(() => authStore.userFullName)
const userAvatar = computed(() => authStore.userAvatar)

const languageOptions = computed(() =>
  languages.map((lang: any) => ({
    code: lang.code,
    label: lang.name,
    flag: lang.flag
  }))
)

const getCurrentLanguageFlag = () => {
  const lang = languages.find((l: any) => l.code === currentLang.value)
  return lang?.flag || '🌐'
}

const getCurrentLanguageName = () => {
  const lang = languages.find((l: any) => l.code === currentLang.value)
  return lang?.name || currentLang.value
}

const landingMenuItems = computed(() => [
  {
    path: '/management/landing/courses',
    label: t('admin.menu.courses'),
    icon: 'book'
  },
  {
    path: '/management/landing/news',
    label: t('admin.menu.news'),
    icon: 'newspaper'
  },
  {
    path: '/management/landing/course-categories',
    label: t('admin.menu.courseCategories'),
    icon: 'list'
  },
  {
    path: '/management/landing/course-subcategories',
    label: t('admin.menu.courseSubCategories'),
    icon: 'list'
  },
  {
    path: '/management/landing/contact-messages',
    label: t('admin.menu.contactMessages'),
    icon: 'mail'
  },
  {
    path: '/management/landing/leaderboards',
    label: t('admin.menu.leaderboards') || 'Лидерборды',
    icon: 'emoji_events'
  }
])

const pointsMenuItems = computed(() => [
  {
    path: '/management/vendors',
    label: t('admin.menu.vendors') || 'Вендоры',
    icon: 'storefront'
  },
  {
    path: '/management/points/transactions',
    label: t('admin.menu.transactions') || 'Транзакции',
    icon: 'swap_horiz'
  },
  {
    path: '/management/points/reports',
    label: t('admin.menu.reports') || 'Отчеты',
    icon: 'bar_chart'
  }
])

const usersMenuItems = computed(() => [
  {
    path: '/management/teachers',
    label: t('admin.menu.teachers'),
    icon: 'person'
  },
  {
    path: '/management/students',
    label: t('admin.menu.students'),
    icon: 'person'
  },
  {
    path: '/management/directors',
    label: t('admin.menu.directors'),
    icon: 'person_add'
  },
  {
    path: '/management/head-teachers',
    label: t('admin.menu.headTeachers'),
    icon: 'group'
  },
  {
    path: '/management/administrators',
    label: t('admin.menu.administrators'),
    icon: 'admin_panel_settings'
  },
  {
    path: '/management/merchants',
    label: t('admin.menu.merchants'),
    icon: 'store'
  }
])

const systemMenuItems = computed(() => [
  {
    path: '/management/mailing',
    label: t('admin.menu.mailing'),
    icon: 'send'
  },
  {
    path: '/management/activity-logs',
    label: t('admin.menu.activityLogs'),
    icon: 'history'
  },
  {
    path: '/management/settings',
    label: t('admin.menu.settings'),
    icon: 'settings'
  }
])

// Auto-expand sections based on current route
watch(() => route.path, (newPath) => {
  const landingPaths = landingMenuItems.value.map(item => item.path)
  if (landingPaths.some(path => newPath.startsWith(path))) {
    isLandingExpanded.value = true
  }
  
  const usersPaths = usersMenuItems.value.map(item => item.path)
  if (usersPaths.some(path => newPath.startsWith(path))) {
    isUsersExpanded.value = true
  }

  const pointsPaths = pointsMenuItems.value.map(item => item.path)
  if (pointsPaths.some(path => newPath.startsWith(path))) {
    isPointsExpanded.value = true
  }
  
  const systemPaths = systemMenuItems.value.map(item => item.path)
  if (systemPaths.some(path => newPath.startsWith(path))) {
    isSystemExpanded.value = true
  }
}, { immediate: true })

const breadcrumbItems = computed(() => {
  const items: Array<{ label: string; path?: string }> = []
  const pathParts = route.path.split('/').filter(Boolean)
  
  if (pathParts.length > 1 && pathParts[0] === 'management') {
    // Handle landing section
    if (pathParts[1] === 'landing' && pathParts.length > 2) {
      items.push({
        label: t('admin.sections.landing') || 'Landing',
        path: `/management/landing`
      })
      const modelName = pathParts[2]
      items.push({
        label: t(`admin.models.${modelName}`) || modelName,
        path: `/management/landing/${modelName}`
      })
      
      if (pathParts.length > 3) {
        items.push({
          label: pathParts[3] === 'add' ? t('admin.actions.add') : pathParts[3] === 'change' ? t('admin.actions.edit') : pathParts[3]
        })
      }
    } else if (pathParts[1] === 'points' && pathParts.length > 2) {
      // Handle points section
      items.push({
        label: t('admin.sections.points') || 'Points & RFID',
        path: `/management/points`
      })
      const subPath = pathParts[2]
      items.push({
        label: t(`admin.menu.${subPath}`) || subPath,
        path: `/management/points/${subPath}`
      })
    } else {
      // Handle regular paths
      const modelName = pathParts[1]
      items.push({
        label: t(`admin.models.${modelName}`) || modelName,
        path: `/management/${modelName}`
      })
      
      if (pathParts.length > 2) {
        items.push({
          label: pathParts[2] === 'add' ? t('admin.actions.add') : pathParts[2] === 'change' ? t('admin.actions.edit') : pathParts[2]
        })
      }
    }
  }
  
  return items
})

const handleLanguageChange = () => {
  setLanguage(currentLang.value)
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header,
.admin-header :deep(.q-header),
.admin-header :deep(.q-toolbar) {
  background: #417690 !important;
  color: white !important;
}

.admin-header :deep(.q-toolbar-title),
.admin-header :deep(.q-btn),
.admin-header :deep(.q-select),
.admin-header :deep(.q-field),
.admin-header :deep(.q-field__label),
.admin-header :deep(.q-item),
.admin-header :deep(.q-item-label),
.admin-header :deep(span),
.admin-header :deep(.q-icon) {
  color: white !important;
}

.admin-header :deep(.q-field__native) {
  color: white !important;
}

.admin-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white !important;
}

.user-menu-button {
  color: white;
}

.user-name {
  font-weight: 500;
  font-size: 0.9rem;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-sidebar,
.admin-sidebar :deep(.q-drawer),
.admin-sidebar :deep(.q-drawer__content),
.admin-sidebar :deep(.q-scrollarea),
.admin-sidebar :deep(.q-list) {
  background: #417690 !important;
}

.admin-sidebar :deep(.q-item),
.admin-sidebar :deep(.q-item-label),
.admin-sidebar :deep(.q-expansion-item),
.admin-sidebar :deep(.q-expansion-item__header),
.admin-sidebar :deep(span),
.admin-sidebar :deep(.q-icon) {
  color: white !important;
}

.nav-section-header {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-section-title {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.5rem 1.5rem;
}

.nav-subitem {
  padding-left: 2.5rem !important;
}

.nav-item-active {
  background: rgba(255, 255, 255, 0.15) !important;
  border-left: 3px solid #ffc107;
  color: white !important;
}

.admin-page {
  background: #f5f5f5;
}

.content-area {
  padding: 1.5rem;
  background: white;
  margin: 1rem;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 200px);
}
</style>
