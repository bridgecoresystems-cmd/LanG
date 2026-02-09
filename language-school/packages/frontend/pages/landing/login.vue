<template>
  <div>
    <section class="section login-section">
      <div class="container">
        <div class="login-card">
          <h1 class="login-title">{{ $t('auth.login.title') }}</h1>
          <p class="login-subtitle">{{ $t('auth.login.subtitle') }}</p>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="username">{{ $t('auth.login.username') }}</label>
              <input
                id="username"
                v-model="credentials.username"
                type="text"
                :placeholder="$t('auth.login.usernamePlaceholder')"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="password">{{ $t('auth.login.password') }}</label>
              <input
                id="password"
                v-model="credentials.password"
                type="password"
                :placeholder="$t('auth.login.passwordPlaceholder')"
                required
                class="form-input"
              />
            </div>
            <div v-if="authStore.error" class="error-message">
              <i class="pi pi-exclamation-circle" />
              <span>{{ authStore.error }}</span>
            </div>
            <button
              type="submit"
              class="btn btn-primary login-button"
              :disabled="authStore.loading"
            >
              <i v-if="authStore.loading" class="pi pi-spin pi-spinner" />
              <span v-else>{{ $t('auth.login.submit') }}</span>
            </button>
          </form>
          <div class="q-mt-md text-center">
            Нет аккаунта? <NuxtLink to="/landing/register" class="text-primary">Зарегистрироваться</NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { LoginCredentials } from '~/types/user'

const authStore = useAuthStore()
const router = useRouter()

const credentials = ref<LoginCredentials>({
  username: '',
  password: '',
})

const handleLogin = async () => {
  const success = await authStore.login(credentials.value)
  if (success) {
    // Определяем путь на основе роли пользователя из store
    // После логина user уже должен быть установлен в store
    const user = authStore.user
    const isAdmin = user?.role === 'SUPERUSER'
    
    const path = isAdmin ? '/admin' : '/landing'
    
    if (isAdmin && import.meta.client) {
      sessionStorage.setItem('auth_just_logged_in', '1')
    }
    
    await navigateTo(path)
  }
}
</script>

<style scoped>
.login-section {
  padding: 4rem 0;
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
}

.login-card {
  max-width: 420px;
  margin: 0 auto;
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.95rem;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.login-button {
  padding: 14px 28px;
  font-size: 1rem;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
