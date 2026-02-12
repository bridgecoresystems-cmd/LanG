<template>
  <div class="profile-page">
    <!-- Header -->
    <header class="profile-header">
      <div class="profile-header__text">
        <NH2 class="profile-header__title">Настройки профиля</NH2>
        <p class="profile-header__subtitle">Управляйте своими личными данными и тем, как вас видят другие.</p>
      </div>
      <div class="profile-header__actions">
        <NButton type="default" class="profile-header__btn profile-header__btn--cancel" @click="navigateTo('/cabinet')">Отмена</NButton>
        <NButton type="primary" :loading="saving" @click="saveProfile" class="profile-header__btn">
          <template #icon>
            <NIcon><component :is="CheckmarkIcon" /></NIcon>
          </template>
          Сохранить изменения
        </NButton>
      </div>
    </header>

    <div class="profile-grid">
      <!-- Left: Avatar card -->
      <div class="profile-grid__aside">
        <NCard class="profile-card profile-card--avatar" :content-style="avatarCardStyle">
          <div class="profile-avatar-wrap">
            <NAvatar
              round
              :size="128"
              :src="form.avatar || undefined"
              :fallback-src="avatarFallback"
              class="profile-avatar"
            />
          </div>
          <NH3 class="profile-card__name">{{ authStore.userFullName }}</NH3>
          <p class="profile-card__role">{{ roleLabel }}</p>
        </NCard>

        <!-- Video card (teacher/superuser) -->
        <NCard
          v-if="showVideoBlock"
          class="profile-card"
          :content-style="videoCardStyle"
        >
          <template #header>
            <div class="profile-card-video__header">
              <NIcon :component="VideocamIcon" size="18" />
              <span>Видео-визитка</span>
            </div>
          </template>
          <div class="profile-card-video__body">
            <div v-if="videoSrc" class="profile-video-preview">
              <video :src="videoSrc" controls class="profile-video" />
            </div>
            <div v-else class="profile-video-placeholder">
              <NIcon :component="VideocamOffIcon" size="40" class="profile-video-placeholder__icon" />
              <span>Видео не загружено</span>
            </div>
            <div class="profile-video-form">
              <label class="profile-video-form__label">Ссылка или файл</label>
              <NInput v-model:value="form.video" placeholder="https://youtube.com/..." clearable class="profile-video-form__input" />
              <NButton secondary block class="profile-video-form__upload" @click="triggerVideoInput">
                <template #icon>
                  <NIcon><component :is="CloudUploadIcon" /></NIcon>
                </template>
                Загрузить видеофайл
              </NButton>
              <input ref="videoInput" type="file" accept="video/*" class="sr-only" @change="handleVideoSelect" />
              <NButton v-if="videoSrc" quaternary type="error" size="small" block @click="clearVideo">
                Сбросить видео
              </NButton>
            </div>
          </div>
        </NCard>
      </div>

      <!-- Right: Form card -->
      <div class="profile-grid__main">
        <NCard class="profile-card profile-card--form" content-style="padding: 32px;">
          <NForm label-placement="top" label-width="auto" class="profile-form">
            <div class="profile-form-grid">
              <NFormItem label="Имя" required>
                <NInput v-model:value="form.first_name" placeholder="Введите имя" size="large" disabled />
              </NFormItem>
              <NFormItem label="Фамилия" required>
                <NInput v-model:value="form.last_name" placeholder="Введите фамилию" size="large" disabled />
              </NFormItem>
              <NFormItem label="Email" class="profile-form-item--full">
                <NInput v-model:value="form.email" type="email" placeholder="example@mail.com" size="large" />
              </NFormItem>
              <NFormItem label="Телефон">
                <NInput v-model:value="form.phone" placeholder="+993 ..." size="large" />
              </NFormItem>
              <NFormItem label="Логин (нельзя изменить)">
                <NInput v-model:value="form.username" disabled size="large" />
              </NFormItem>
            </div>

            <NDivider :style="dividerStyle" />

            <div class="profile-security">
              <NH4 class="profile-security__title">Безопасность</NH4>
              <NButton type="default" class="profile-security__btn" @click="showPasswordModal = true">
                <template #icon>
                  <NIcon><component :is="KeyIcon" /></NIcon>
                </template>
                Сменить пароль
              </NButton>
            </div>
          </NForm>
        </NCard>
      </div>
    </div>

    <!-- Password Change Modal -->
    <NModal v-model:show="showPasswordModal" preset="card" title="Сменить пароль" style="width: 500px;">
      <NForm ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-placement="top">
        <NFormItem label="Текущий пароль" path="currentPassword">
          <NInput
            v-model:value="passwordForm.currentPassword"
            type="password"
            placeholder="Введите текущий пароль"
            size="large"
            show-password-on="click"
          />
        </NFormItem>
        <NFormItem label="Новый пароль" path="newPassword">
          <NInput
            v-model:value="passwordForm.newPassword"
            type="password"
            placeholder="Введите новый пароль (минимум 6 символов)"
            size="large"
            show-password-on="click"
          />
        </NFormItem>
        <NFormItem label="Подтвердите новый пароль" path="confirmPassword">
          <NInput
            v-model:value="passwordForm.confirmPassword"
            type="password"
            placeholder="Повторите новый пароль"
            size="large"
            show-password-on="click"
          />
        </NFormItem>
        <div class="password-modal-actions">
          <NButton type="default" @click="showPasswordModal = false">Отмена</NButton>
          <NButton type="primary" :loading="changingPassword" @click="handleChangePassword">
            Сменить пароль
          </NButton>
        </div>
      </NForm>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  NCard,
  NButton,
  NInput,
  NForm,
  NFormItem,
  NAvatar,
  NIcon,
  NH2,
  NH3,
  NH4,
  NDivider,
  NModal,
  useMessage,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import {
  VideocamOutline as VideocamIcon,
  VideocamOffOutline as VideocamOffIcon,
  CloudUploadOutline as CloudUploadIcon,
  KeyOutline as KeyIcon,
  CheckmarkCircleOutline as CheckmarkIcon,
} from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/authStore'
import { useEden } from '~/composables/useEden'

definePageMeta({
  layout: 'cabinet',
  middleware: 'cabinet-auth',
})

const authStore = useAuthStore()
const message = useMessage()
const { get: getProfile, update: updateProfile } = useCabinetProfile()
const { uploadFile } = useUpload()

const form = ref({
  id: '',
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  avatar: '',
  video: '',
  role: '',
})

const saving = ref(false)
const showPasswordModal = ref(false)
const changingPassword = ref(false)
const passwordFormRef = ref<FormInst | null>(null)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const avatarCardStyle = { padding: '32px' }
const videoCardStyle = { padding: '24px' }
const formCardStyle = { padding: '32px' }
const dividerStyle = { margin: '32px 0 24px' }
const videoInput = ref<HTMLInputElement | null>(null)
const videoFile = ref<File | null>(null)
const videoPreview = ref<string | null>(null)
const api = useEden()

const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: 'Введите текущий пароль', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: 'Введите новый пароль', trigger: 'blur' },
    { min: 6, message: 'Пароль должен содержать минимум 6 символов', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: 'Подтвердите новый пароль', trigger: 'blur' },
    {
      validator: (rule, value) => {
        return value === passwordForm.value.newPassword
      },
      message: 'Пароли не совпадают',
      trigger: ['blur', 'input'],
    },
  ],
}

const showVideoBlock = computed(() =>
  ['TEACHER', 'SUPERUSER'].includes(authStore.user?.role?.toUpperCase() ?? '')
)

const roleLabel = computed(() => {
  const r = form.value.role
  const labels: Record<string, string> = {
    STUDENT: 'Студент',
    TEACHER: 'Учитель',
    EDITOR: 'Редактор',
    SUPERUSER: 'Администратор',
  }
  return labels[r] || r || 'Пользователь'
})

const avatarFallback = computed(() => {
  const name = authStore.userFullName || 'U'
  const letter = name.charAt(0).toUpperCase()
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect fill='%2318a058' width='32' height='32'/><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' fill='white' font-size='14'>${encodeURIComponent(letter)}</text></svg>`
})

const videoSrc = computed(() => {
  if (videoPreview.value) return videoPreview.value
  const v = form.value.video
  if (!v) return ''
  if (v.startsWith('http') || v.startsWith('/') || v.startsWith('blob:')) return v
  return ''
})

function triggerVideoInput() {
  if (videoInput.value) videoInput.value.click()
}

async function fetchProfile() {
  try {
    const data = await getProfile()
    if (data) {
      const d = data as any
      form.value = {
        id: d.id ?? '',
        username: d.username ?? '',
        email: d.email ?? '',
        first_name: d.first_name ?? '',
        last_name: d.last_name ?? '',
        phone: d.phone ?? '',
        avatar: d.avatar ?? '',
        video: d.video ?? '',
        role: d.role ?? '',
      }
    }
  } catch (e) {
    console.error('Fetch profile error:', e)
    message.error('Не удалось загрузить данные профиля')
  }
}

function handleVideoSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (videoPreview.value) URL.revokeObjectURL(videoPreview.value)
  videoPreview.value = URL.createObjectURL(file)
  videoFile.value = file
  form.value.video = ''
  input.value = ''
}

function clearVideo() {
  if (videoPreview.value) URL.revokeObjectURL(videoPreview.value)
  videoPreview.value = null
  videoFile.value = null
  form.value.video = ''
}

async function saveProfile() {
  saving.value = true
  try {
    if (videoFile.value) {
      const res = await uploadFile(videoFile.value)
      form.value.video = (res as any).url
      if (videoPreview.value) URL.revokeObjectURL(videoPreview.value)
      videoPreview.value = null
      videoFile.value = null
    }
    await updateProfile({
      phone: form.value.phone,
      video: form.value.video,
      email: form.value.email,
    })
    message.success('Профиль успешно обновлён')
    await authStore.fetchCurrentUser()
  } catch (err: any) {
    console.error('Save profile error:', err)
    message.error(err.message || 'Проверьте данные и попробуйте снова')
  } finally {
    saving.value = false
  }
}

async function handleChangePassword() {
  if (!passwordFormRef.value) return
  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true
    const { data, error } = await api.api.v1.cabinet['change-password'].post({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    })
    if (error) {
      throw new Error((error.value as any)?.error || 'Ошибка при смене пароля')
    }
    message.success('Пароль успешно изменён')
    showPasswordModal.value = false
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  } catch (err: any) {
    console.error('Change password error:', err)
    if (err.message) {
      message.error(err.message)
    } else {
      message.error('Ошибка при смене пароля. Проверьте данные и попробуйте снова.')
    }
  } finally {
    changingPassword.value = false
  }
}

onMounted(() => fetchProfile())

onBeforeUnmount(() => {
  if (videoPreview.value) URL.revokeObjectURL(videoPreview.value)
})
</script>

<style scoped>
.profile-page {
  max-width: 56rem;
  margin: 0 auto;
  padding-bottom: 48px;
}

.profile-header {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}
@media (min-width: 768px) {
  .profile-header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

.profile-header__title {
  margin: 0 0 8px;
  font-size: 1.25rem;
  font-weight: 600;
}
.profile-header__subtitle {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--n-text-color-3);
}

.profile-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.profile-header__btn {
  font-weight: 500;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}
@media (min-width: 1024px) {
  .profile-grid {
    grid-template-columns: 320px 1fr;
    gap: 32px;
  }
}

.profile-grid__aside {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.profile-grid__main {
  min-width: 0;
}

.profile-card--avatar {
  text-align: center;
}
.profile-avatar-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 24px;
}
.profile-avatar {
  border: 3px solid var(--n-border-color);
}
.profile-avatar__camera {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: #18a058;
  color: white;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}
.profile-avatar__camera:hover {
  background: #0c7a43;
  transform: scale(1.05);
}

.profile-card__name {
  margin: 0 0 8px;
  font-size: 1.25rem;
  font-weight: 600;
}
.profile-card__role {
  margin: 0 0 24px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #18a058;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.profile-card__avatar-actions {
  padding-top: 24px;
  border-top: 1px solid var(--n-border-color);
}

.profile-card-video__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--n-text-color-3);
}
.profile-card-video__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.profile-video-preview {
  aspect-ratio: 16/10;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}
.profile-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.profile-video-placeholder {
  aspect-ratio: 16/10;
  border-radius: 12px;
  border: 2px dashed var(--n-border-color);
  background: var(--n-color-modal);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--n-text-color-3);
  font-size: 0.875rem;
}
.profile-video-placeholder__icon {
  opacity: 0.5;
}
.profile-video-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.profile-video-form__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--n-text-color-2);
}
.profile-video-form__input {
  margin-top: 2px;
}
.profile-video-form__upload {
  margin-top: 4px;
}

.profile-form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0 24px;
}
@media (min-width: 640px) {
  .profile-form-grid {
    grid-template-columns: 1fr 1fr;
  }
  .profile-form-item--full {
    grid-column: 1 / -1;
  }
}

.profile-security {
  margin-top: 0;
}
.profile-security__title {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 600;
}
.profile-security__btn {
  background: #f5f5f5;
  color: #333;
  border-color: #d9d9d9;
}
.profile-security__btn:hover {
  background: #e6e6e6;
  border-color: #bfbfbf;
}

.password-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
