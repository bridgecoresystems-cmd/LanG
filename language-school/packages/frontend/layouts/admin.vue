<template>
  <QLayout view="hHh lpR fFf" class="admin-layout">
    <!-- Header -->
    <QHeader elevated class="admin-header text-white">
      <QToolbar>
        <QBtn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <QToolbarTitle class="admin-title">
          LanG Admin
        </QToolbarTitle>
        <QSpace />
        <div class="q-gutter-sm row items-center no-wrap">
          <QBtn round flat class="user-menu-button">
            <QAvatar size="28px">
              <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" alt="">
              <QIcon v-else name="person" />
            </QAvatar>
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

          <QExpansionItem icon="public" label="Лендинг" default-opened header-class="nav-section-header" expand-icon-class="text-dark">
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

          <QItem to="/admin/users" clickable v-ripple active-class="nav-item-active" class="nav-item">
            <QItemSection avatar>
              <QIcon name="people" />
            </QItemSection>
            <QItemSection>Пользователи</QItemSection>
          </QItem>

          <QItem clickable v-ripple @click="showPasswordDialog = true" class="nav-item">
            <QItemSection avatar>
              <QIcon name="security" />
            </QItemSection>
            <QItemSection>Безопасность</QItemSection>
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
    <QDialog v-model="showPasswordDialog">
      <QCard style="min-width: 350px">
        <QCardSection>
          <div class="text-h6">Смена пароля администратора</div>
        </QCardSection>

        <QCardSection class="q-pt-none">
          <QForm @submit="changePassword" class="q-gutter-md">
            <QInput
              v-model="passwordForm.currentPassword"
              type="password"
              label="Текущий пароль"
              outlined
              :rules="[val => !!val || 'Обязательное поле']"
            />
            <QInput
              v-model="passwordForm.newPassword"
              type="password"
              label="Новый пароль"
              outlined
              :rules="[
                val => !!val || 'Обязательное поле',
                val => val.length >= 6 || 'Минимум 6 символов'
              ]"
            />
            <QInput
              v-model="passwordForm.confirmPassword"
              type="password"
              label="Подтвердите новый пароль"
              outlined
              :rules="[
                val => !!val || 'Обязательное поле',
                val => val === passwordForm.newPassword || 'Пароли не совпадают'
              ]"
            />

            <div class="row justify-end q-mt-md">
              <QBtn flat label="Отмена" color="primary" v-close-popup />
              <QBtn label="Сменить" type="submit" color="primary" :loading="loading" />
            </div>
          </QForm>
        </QCardSection>
      </QCard>
    </QDialog>
  </QLayout>
</template>

<script setup lang="ts">
const leftDrawerOpen = ref(true)
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const $q = useQuasar()

const showPasswordDialog = ref(false)
const loading = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

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
  } else if (path.includes('/users')) {
    items.push({ label: 'Пользователи' })
  }

  return items
})

const changePassword = async () => {
  loading.value = true
  try {
    await $fetch(`${apiBase}/admin/change-password`, {
      method: 'POST',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      },
      credentials: 'include'
    })

    $q.notify({
      color: 'positive',
      message: 'Пароль успешно изменен',
      icon: 'check'
    })
    showPasswordDialog.value = false
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err: any) {
    console.error('Failed to change password', err)
    $q.notify({
      color: 'negative',
      message: err.data?.error || 'Ошибка при смене пароля',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

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
  font-size: 1.25rem;
  font-weight: 700;
  color: white !important;
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
</style>
