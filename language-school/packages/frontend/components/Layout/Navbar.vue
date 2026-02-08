<template>
  <nav class="navbar">
    <div class="container">
      <div class="navbar-content">
        <div class="navbar-brand">
          <NuxtLink to="/landing" class="brand-link">
            <LayoutAnimatedLogo />
          </NuxtLink>
        </div>

        <div class="navbar-menu" :class="{ active: isMenuOpen }">
          <NuxtLink to="/landing" class="nav-link">{{ $t('navbar.home') }}</NuxtLink>
          <NuxtLink to="/landing/about" class="nav-link">{{ $t('navbar.about') }}</NuxtLink>
          <NuxtLink to="/landing/courses" class="nav-link">{{ $t('navbar.courses') }}</NuxtLink>
          <NuxtLink to="/landing/achievements" class="nav-link">{{
            $t('navbar.achievements') || 'Dostizheniya'
          }}</NuxtLink>
          <NuxtLink to="/landing/contact" class="nav-link">{{ $t('navbar.contact') }}</NuxtLink>
        </div>

        <div class="navbar-actions">
          <div class="language-selector">
            <select v-model="currentLang" @change="handleLanguageChange" class="lang-select">
              <option v-for="lang in languages" :key="lang.code" :value="lang.code">
                {{ lang.flag }} {{ lang.name }}
              </option>
            </select>
          </div>

          <div v-if="authStore.isAuthenticated" class="user-menu-wrapper">
            <button
              @click="toggleUserMenu"
              class="user-menu-button"
              :class="{ active: isUserMenuOpen }"
            >
              <div class="user-avatar-small">
                <img
                  v-if="authStore.userAvatar"
                  :src="authStore.userAvatar"
                  :alt="authStore.userFullName"
                  class="avatar-img"
                />
                <i v-else class="pi pi-user avatar-placeholder"></i>
              </div>
              <span class="user-name">{{ authStore.userFullName }}</span>
              <i class="pi pi-angle-down"></i>
            </button>

            <div v-if="isUserMenuOpen" class="user-dropdown">
              <NuxtLink
                v-if="!authStore.isSuperuser"
                :to="dashboardPath"
                class="dropdown-item"
                @click="closeUserMenu"
              >
                <i class="pi pi-home"></i>
                <span>{{ $t('cabinet.title') }}</span>
              </NuxtLink>
              <NuxtLink
                v-if="authStore.isSuperuser"
                to="/admin"
                class="dropdown-item"
                @click="closeUserMenu"
              >
                <i class="pi pi-cog"></i>
                <span>{{ $t('admin.title') }}</span>
              </NuxtLink>
              <button @click="handleLogout" class="dropdown-item logout-item">
                <i class="pi pi-sign-out"></i>
                <span>{{ $t('auth.logout') }}</span>
              </button>
            </div>
          </div>

          <NuxtLink v-else to="/landing/login" class="btn btn-primary login-link-small">
            {{ $t('common.login') }}
          </NuxtLink>

          <button
            v-if="isMobile"
            class="btn btn-secondary"
            @click="toggleMenu"
          >
            <i class="pi pi-bars"></i>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { locale, setLocale } = useI18n()
const authStore = useAuthStore()
const router = useRouter()

const languages = [
  { code: 'tm', name: 'Türkmen', flag: '🇹🇲' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
]

const currentLang = ref(locale.value)
const isMenuOpen = ref(false)
const isMobile = ref(false)
const isUserMenuOpen = ref(false)

const dashboardPath = computed(() => '/cabinet')

const handleLanguageChange = () => {
  setLocale(currentLang.value)
  if (import.meta.client) {
    localStorage.setItem('locale', currentLang.value)
  }
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const handleLogout = async () => {
  authStore.logout()
  closeUserMenu()
  await navigateTo('/landing')
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu-wrapper')) closeUserMenu()
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('click', handleClickOutside)
  currentLang.value = locale.value
  if (!authStore.user) {
    authStore.initializeAuth()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.navbar {
  background-color: var(--bg-primary);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 1rem 0;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.navbar-brand .brand-link {
  text-decoration: none;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  transition: opacity 0.3s ease;
}

.navbar-brand .brand-link:hover {
  opacity: 0.9;
}

.navbar-menu {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: var(--primary-color);
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.lang-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.9rem;
}

.user-menu-wrapper {
  position: relative;
}

.user-menu-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 25px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-primary);
}

.user-menu-button:hover,
.user-menu-button.active {
  border-color: var(--primary-color);
}

.user-avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-weight: 500;
  font-size: 0.95rem;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu-button.active i.pi-angle-down {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  overflow: hidden;
  z-index: 1000;
  border: 1px solid var(--border-color);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.3s ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-size: 0.95rem;
}

.dropdown-item:hover {
  background: var(--bg-secondary);
  color: var(--primary-color);
}

.logout-item {
  border-top: 1px solid var(--border-color);
  color: #dc3545;
}

.logout-item:hover {
  background: #fee;
  color: #c33;
}

.login-link-small {
  text-decoration: none;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .navbar-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--bg-primary);
    flex-direction: column;
    padding: 1rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }

  .navbar-menu.active {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .user-name {
    display: none;
  }
}
</style>
