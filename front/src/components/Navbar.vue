<template>
  <nav class="navbar">
    <div class="container">
      <div class="navbar-content">
        <div class="navbar-brand">
          <router-link to="/" class="brand-link">
            <AnimatedLogo />
          </router-link>
        </div>

        <div class="navbar-menu" :class="{ active: isMenuOpen }">
          <router-link to="/" class="nav-link">{{ $t('navbar.home') }}</router-link>
          <router-link to="/about" class="nav-link">{{ $t('navbar.about') }}</router-link>
          <router-link to="/courses" class="nav-link">{{ $t('navbar.courses') }}</router-link>
          <router-link to="/achievements" class="nav-link">{{ $t('navbar.achievements') || 'Dostizheniya' }}</router-link>
          <router-link to="/contact" class="nav-link">{{ $t('navbar.contact') }}</router-link>
        </div>

        <div class="navbar-actions">
          <div class="language-selector">
            <select v-model="currentLang" @change="handleLanguageChange" class="lang-select">
              <option v-for="lang in languages" :key="lang.code" :value="lang.code">
                {{ lang.flag }} {{ lang.name }}
              </option>
            </select>
          </div>

          <!-- User menu if authenticated -->
          <div v-if="isAuthenticated" class="user-menu-wrapper">
            <button 
              @click="toggleUserMenu" 
              class="user-menu-button"
              :class="{ active: isUserMenuOpen }"
            >
              <div class="user-avatar-small">
                <img 
                  v-if="userAvatar" 
                  :src="userAvatar" 
                  :alt="userFullName"
                  class="avatar-img"
                />
                <i v-else class="pi pi-user avatar-placeholder"></i>
              </div>
              <span class="user-name">{{ userFullName }}</span>
              <i class="pi pi-angle-down"></i>
            </button>

            <div v-if="isUserMenuOpen" class="user-dropdown">
              <router-link 
                v-if="!isSuperuser"
                :to="dashboardPath" 
                class="dropdown-item"
                @click="closeUserMenu"
              >
                <i class="pi pi-home"></i>
                <span>{{ $t('cabinet.title') }}</span>
              </router-link>
              <router-link 
                v-if="isSuperuser"
                to="/management" 
                class="dropdown-item"
                @click="closeUserMenu"
              >
                <i class="pi pi-cog"></i>
                <span>{{ $t('admin.title') }}</span>
              </router-link>
              <button 
                @click="handleLogout" 
                class="dropdown-item logout-item"
              >
                <i class="pi pi-sign-out"></i>
                <span>{{ $t('auth.logout') }}</span>
              </button>
            </div>
          </div>

          <!-- Login button if not authenticated -->
          <router-link 
            v-else 
            to="/login" 
            class="btn btn-primary login-link-small"
          >
            {{ $t('common.login') }}
          </router-link>

          <button class="btn btn-secondary" @click="toggleMenu" v-if="isMobile">
            <i class="pi pi-bars"></i>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguage } from '@/composables/useLanguage'
import { useAuth } from '@/composables/useAuth'
import AnimatedLogo from './AnimatedLogo.vue'

const router = useRouter()
const { languages, setLanguage, locale } = useLanguage()
const authStore = useAuth()

const currentLang = ref(locale)
const isMenuOpen = ref(false)
const isMobile = ref(false)
const isUserMenuOpen = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isSuperuser = computed(() => authStore.isSuperuser)
const userFullName = computed(() => authStore.userFullName)
const userAvatar = computed(() => authStore.userAvatar)

const dashboardPath = computed(() => {
  const role = authStore.user?.role || 'student'
  if (role === 'teacher') return '/cabinet/teacher'
  if (role === 'director') return '/cabinet/director'
  if (role === 'merchant') return '/cabinet/vendor'
  if (role === 'head_teacher') return '/cabinet/head-teacher/courses'
  return '/cabinet/student'
})

const handleLanguageChange = () => {
  setLanguage(currentLang.value)
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
  await authStore.logout()
  closeUserMenu()
  router.push('/')
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu-wrapper')) {
    closeUserMenu()
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('click', handleClickOutside)
  // Initialize auth if token exists
  if (authStore.accessToken && !authStore.user) {
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
  position: relative;
}

.nav-link:hover {
  color: var(--primary-color);
}

.nav-link.router-link-active {
  color: var(--primary-color);
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.language-selector {
  position: relative;
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

.lang-select:focus {
  outline: none;
  border-color: var(--primary-color);
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

.user-menu-button:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 102, 204, 0.1);
}

.user-menu-button.active {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 102, 204, 0.15);
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

.avatar-placeholder {
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.user-name {
  font-weight: 500;
  font-size: 0.95rem;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu-button i.pi-angle-down {
  font-size: 0.8rem;
  transition: transform 0.3s ease;
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

.dropdown-item i {
  font-size: 1.1rem;
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

  .navbar-content {
    flex-wrap: wrap;
  }

  .user-name {
    display: none;
  }

  .user-dropdown {
    right: -1rem;
  }
}
</style>

