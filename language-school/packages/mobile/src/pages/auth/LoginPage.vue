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
              <div class="inputs-wrapper">
                <div class="float-input" :class="{ focused: usernameFocused || form.username }">
                  <ion-icon :icon="personOutline" class="input-icon" />
                  <ion-input
                    v-model="form.username"
                    type="text"
                    autocomplete="username"
                    @ionFocus="usernameFocused = true"
                    @ionBlur="usernameFocused = false"
                  />
                  <label class="float-label">{{ $t('auth.username') }}</label>
                </div>
                <div class="float-input float-input--password" :class="{ focused: passwordFocused || form.password }">
                  <ion-icon :icon="lockClosedOutline" class="input-icon" />
                  <ion-input
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    @ionFocus="passwordFocused = true"
                    @ionBlur="passwordFocused = false"
                  />
                  <label class="float-label">{{ $t('auth.password') }}</label>
                  <ion-button fill="clear" class="eye-btn" @click="showPassword = !showPassword">
                    <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" />
                  </ion-button>
                </div>
              </div>

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
const usernameFocused = ref(false)
const passwordFocused = ref(false)

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
  --background: #ffffff;
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
  background: rgba(24, 160, 88, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border: 2px solid rgba(24, 160, 88, 0.3);
}

.logo-text {
  font-size: 2.5rem;
  font-weight: 800;
  color: #18a058;
}

.app-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: 1px;
}

.app-subtitle {
  color: #64748b;
  margin-top: 8px;
  font-size: 1rem;
  font-weight: 500;
}

.login-form {
  flex: 1;
}

.login-form ion-card {
  --background: #e8f5e9;
  border-radius: 24px;
  margin: 0;
  box-shadow: 0 4px 16px rgba(24, 160, 88, 0.12);
}

.login-form :deep(ion-card-content) {
  --background: #e8f5e9;
  background: #e8f5e9 !important;
}

.inputs-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.float-input {
  position: relative;
  background: #ffffff;
  border-radius: 14px;
  padding: 16px 16px 8px 48px;
  min-height: 56px;
  display: flex;
  align-items: center;
}

.float-input .input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.3rem;
  color: #18a058;
}

.float-input ion-input {
  --padding-top: 8px;
  --padding-bottom: 8px;
  --padding-start: 0;
  --padding-end: 0;
}

.float-input--password ion-input {
  --padding-end: 40px;
}

.float-input ion-input::part(native) {
  font-size: 1rem;
  color: #1e293b;
}

.float-label {
  position: absolute;
  left: 48px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  color: #94a3b8;
  pointer-events: none;
  transition: all 0.2s ease;
}

.float-input.focused .float-label {
  top: 12px;
  transform: translateY(0);
  font-size: 0.7rem;
  font-weight: 700;
  color: #18a058;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.eye-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  --padding-start: 8px;
  --padding-end: 8px;
}

.eye-btn ion-icon {
  color: #18a058;
}

.login-btn {
  margin-top: 24px;
  --border-radius: 16px;
  --background: #18a058;
  --background-activated: #0c7a43;
  --box-shadow: 0 4px 12px rgba(24, 160, 88, 0.3);
  font-weight: 700;
  height: 56px;
  font-size: 1.1rem;
}

.error-text {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 12px;
  border-radius: 12px;
  text-align: center;
  margin-top: 16px;
  font-size: 0.9rem;
  font-weight: 600;
}

.login-footer {
  padding: 24px 0 8px;
  text-align: center;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
}
</style>
