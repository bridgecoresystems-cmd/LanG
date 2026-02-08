<template>
  <MainLayout>
    <section class="section login-section">
      <div class="container">
        <div class="login-card">
          <h1 class="login-title">{{ $t('auth.login.title') }}</h1>
          <p class="login-subtitle">{{ $t('auth.login.subtitle') }}</p>

          <form @submit.prevent="handleLogin" class="login-form">
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

            <div v-if="error" class="error-message">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ error }}</span>
            </div>

            <button 
              type="submit" 
              class="btn btn-primary login-button"
              :disabled="loading"
            >
              <i v-if="loading" class="pi pi-spin pi-spinner"></i>
              <span v-else>{{ $t('auth.login.submit') }}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/MainLayout.vue'
import { useAuth } from '@/composables/useAuth'
import type { LoginCredentials } from '@/types/user'

const router = useRouter()
const authStore = useAuth()

const credentials = ref<LoginCredentials>({
  username: '',
  password: ''
})

const loading = computed(() => authStore.loading)
const error = computed(() => authStore.error)

const handleLogin = async () => {
  const success = await authStore.login(credentials.value)
  if (success) {
    // Wait for user data to be loaded
    const user = authStore.user
    if (!user) {
      // Wait a bit for user data to load (max 2 seconds)
      let attempts = 0
      while (!authStore.user && attempts < 40 && authStore.loading) {
        await new Promise(resolve => setTimeout(resolve, 50))
        attempts++
      }
    }

    const finalUser = authStore.user
    if (!finalUser) {
      console.error('Login successful but user data not loaded')
      router.push('/')
      return
    }

    // Check if there's a redirect query parameter
    const redirect = router.currentRoute.value.query.redirect as string
    if (redirect) {
      // Validate that user has access to the redirect path
      const { hasRouteAccess } = await import('@/utils/roleRedirect')
      if (hasRouteAccess(finalUser, redirect)) {
        router.push(redirect)
        return
      } else {
        console.warn(`User ${finalUser.username} does not have access to ${redirect}, using role-based redirect`)
      }
    }

    // Use centralized role-based redirect
    const { getRoleBasedRedirect } = await import('@/utils/roleRedirect')
    const redirectPath = getRoleBasedRedirect(finalUser)
    router.push(redirectPath)
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
  max-width: 450px;
  margin: 0 auto;
  padding: 3rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 102, 204, 0.1);
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  text-align: center;
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
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  color: var(--text-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  font-size: 0.95rem;
}

.login-button {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s ease;
}

.link:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .login-card {
    padding: 2rem 1.5rem;
  }

  .login-title {
    font-size: 1.75rem;
  }
}
</style>

