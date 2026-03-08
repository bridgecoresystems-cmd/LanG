<template>
  <ion-page>
    <ion-content class="login-content" :fullscreen="true">
      <div class="login-wrapper">
        <!-- Лого -->
        <div class="login-header">
          <div class="logo-circle">
            <span class="logo-text">L</span>
          </div>
          <h1 class="app-title">LanG</h1>
          <p class="app-subtitle">{{ $t('auth.subtitle') }}</p>
        </div>

        <!-- Форма -->
        <div class="login-form">
          <ion-card>
            <ion-card-content>
              <ion-list lines="none">
                <ion-item class="input-item">
                  <ion-icon :icon="personOutline" slot="start" color="primary" />
                  <ion-input
                    v-model="form.username"
                    type="text"
                    :placeholder="$t('auth.username')"
                    :clear-input="true"
                    autocomplete="username"
                  />
                </ion-item>
                <ion-item class="input-item">
                  <ion-icon :icon="lockClosedOutline" slot="start" color="primary" />
                  <ion-input
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    :placeholder="$t('auth.password')"
                  />
                  <ion-button
                    slot="end"
                    fill="clear"
                    @click="showPassword = !showPassword"
                  >
                    <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" />
                  </ion-button>
                </ion-item>
              </ion-list>

              <ion-button
                expand="block"
                class="login-btn"
                :disabled="loading"
                @click="handleLogin"
              >
                <ion-spinner v-if="loading" name="crescent" />
                <span v-else>{{ $t('auth.login') }}</span>
              </ion-button>
            </ion-card-content>
          </ion-card>

          <p v-if="error" class="error-text">{{ error }}</p>
        </div>

        <!-- Нижняя плашка -->
        <div class="login-footer">
          <p>BridgeCore SYSTEMS © 2025</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonContent, IonCard, IonCardContent,
  IonList, IonItem, IonInput, IonButton, IonIcon, IonSpinner,
} from '@ionic/vue'
import {
  personOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
} from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    error.value = 'Введите логин и пароль'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const user = await auth.login(form.value.username, form.value.password)
    if (user.role === 'STUDENT') {
      router.replace('/student')
    } else if (user.role === 'PARENT') {
      router.replace('/parent')
    } else {
      // Другие роли — пока на студенческий экран
      router.replace('/student')
    }
  } catch (e: any) {
    error.value = e?.message || 'Неверный логин или пароль'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-content {
  --background: linear-gradient(160deg, #0066cc 0%, #004499 50%, #003377 100%);
}

.login-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 40px 24px 24px;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0 32px;
}

.logo-circle {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.logo-text {
  font-size: 2.5rem;
  font-weight: 800;
  color: #ffffff;
}

.app-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  letter-spacing: 2px;
}

.app-subtitle {
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8px;
  font-size: 0.95rem;
}

.login-form {
  flex: 1;
}

.login-form ion-card {
  border-radius: 20px;
  margin: 0;
}

.input-item {
  --border-radius: 12px;
  --background: #f5f5f5;
  margin-bottom: 12px;
  border-radius: 12px;
}

.login-btn {
  margin-top: 16px;
  --border-radius: 12px;
  --background: #0066cc;
  --background-activated: #004499;
  font-weight: 600;
  height: 48px;
}

.error-text {
  color: #ff6b35;
  text-align: center;
  margin-top: 12px;
  font-size: 0.9rem;
}

.login-footer {
  padding: 24px 0 8px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}
</style>
