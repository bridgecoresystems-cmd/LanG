<template>
  <div>
    <section class="section register-section">
      <div class="container">
        <div class="register-card">
          <h1 class="register-title">{{ $t('auth.register.title') }}</h1>
          <p class="register-subtitle">{{ $t('auth.register.subtitle') }}</p>

          <form class="register-form" @submit.prevent="handleRegister">
            <div class="form-group">
              <label for="username">{{ $t('auth.register.username') }}</label>
              <input
                id="username"
                v-model="credentials.username"
                type="text"
                :placeholder="$t('auth.register.usernamePlaceholder')"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="email">{{ $t('auth.register.email') }}</label>
              <input
                id="email"
                v-model="credentials.email"
                type="email"
                :placeholder="$t('auth.register.emailPlaceholder')"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="password">{{ $t('auth.register.password') }}</label>
              <input
                id="password"
                v-model="credentials.password"
                type="password"
                :placeholder="$t('auth.register.passwordPlaceholder')"
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
              class="btn btn-primary register-button"
              :disabled="authStore.loading"
            >
              <i v-if="authStore.loading" class="pi pi-spin pi-spinner" />
              <span v-else>{{ $t('auth.register.submit') }}</span>
            </button>
          </form>
          <div class="q-mt-md text-center">
            Уже есть аккаунт? <NuxtLink to="/landing/login" class="text-primary">Войти</NuxtLink>
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

const credentials = ref<LoginCredentials & { email?: string }>({
  username: '',
  password: '',
  email: ''
})

const handleRegister = async () => {
  const success = await authStore.register(credentials.value)
  if (success) {
    const path = authStore.isSuperuser ? '/admin' : '/landing'
    await navigateTo(path)
  }
}
</script>

<style scoped>
.register-section {
  padding: 4rem 0;
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
}

.register-card {
  max-width: 420px;
  margin: 0 auto;
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.register-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.register-subtitle {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.register-form {
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

.register-button {
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
