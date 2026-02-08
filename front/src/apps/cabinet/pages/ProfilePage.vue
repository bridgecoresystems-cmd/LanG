<template>
  <CabinetLayout>
    <n-space vertical size="large" class="profile-page">
      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>
      
      <div v-else-if="error" class="error-state">
        <n-alert type="error" :title="$t('common.error')" closable>
          {{ error }}
        </n-alert>
      </div>
      
      <n-space v-else-if="user" vertical size="large" class="profile-content">
        <!-- Main Profile Info -->
        <n-card bordered class="profile-card">
          <n-grid cols="1 m:3" responsive="screen" :x-gap="24" :y-gap="24">
            <n-gi class="avatar-col">
              <n-space vertical align="center" size="medium">
                <UserAvatar
                  :src="user.avatar_url"
                  :gender="user.gender"
                  size="160px"
                  class="profile-avatar-large"
                />
                <n-tag :type="getRoleType(user.role)" size="large" strong round>
                  {{ $t(`cabinet.profile.roles.${user.role}`) }}
                </n-tag>
              </n-space>
            </n-gi>

            <n-gi span="2">
              <n-space vertical size="large">
                <div>
                  <n-h1 style="margin: 0;">{{ user.full_name }}</n-h1>
                  <n-text depth="3" size="large">{{ user.email }}</n-text>
                </div>

                <n-grid cols="1 s:2" :x-gap="24" :y-gap="24">
                  <n-gi>
                    <n-space vertical size="small">
                      <n-text depth="3" strong uppercase size="small">{{ $t('cabinet.profile.username') }}</n-text>
                      <n-text strong size="large">{{ user.username }}</n-text>
                    </n-space>
                  </n-gi>
                  <n-gi v-if="user.phone">
                    <n-space vertical size="small">
                      <n-text depth="3" strong uppercase size="small">{{ $t('cabinet.profile.phone') }}</n-text>
                      <n-space align="center" size="small">
                        <n-icon color="#18a058"><phone-icon /></n-icon>
                        <n-text strong size="large">{{ user.phone }}</n-text>
                      </n-space>
                    </n-space>
                  </n-gi>
                  <n-gi v-if="user.date_of_birth">
                    <n-space vertical size="small">
                      <n-text depth="3" strong uppercase size="small">{{ $t('cabinet.profile.dateOfBirth') }}</n-text>
                      <n-space align="center" size="small">
                        <n-icon color="#18a058"><birthday-icon /></n-icon>
                        <n-text strong size="large">{{ formatDate(user.date_of_birth) }}</n-text>
                      </n-space>
                    </n-space>
                  </n-gi>
                  <n-gi v-if="user.address">
                    <n-space vertical size="small">
                      <n-text depth="3" strong uppercase size="small">{{ $t('cabinet.profile.address') }}</n-text>
                      <n-space align="start" size="small">
                        <n-icon color="#18a058" style="margin-top: 4px;"><address-icon /></n-icon>
                        <n-text strong size="large">{{ user.address }}</n-text>
                      </n-space>
                    </n-space>
                  </n-gi>
                </n-grid>
              </n-space>
            </n-gi>
          </n-grid>
        </n-card>

        <!-- Change Password -->
        <n-card :title="$t('cabinet.profile.changePassword.title')" bordered class="password-card">
          <template #header-extra>
            <n-icon size="24" depth="3"><lock-icon /></n-icon>
          </template>

          <n-form
            ref="passwordFormRef"
            :model="passwordForm"
            label-placement="top"
            style="max-width: 480px"
          >
            <n-form-item
              :label="$t('cabinet.profile.changePassword.oldPassword')"
              :validation-status="passwordErrors.oldPassword ? 'error' : undefined"
              :feedback="passwordErrors.oldPassword"
            >
              <n-input
                v-model:value="passwordForm.oldPassword"
                type="password"
                show-password-on="click"
                :placeholder="$t('cabinet.profile.changePassword.oldPassword')"
              />
            </n-form-item>

            <n-form-item
              :label="$t('cabinet.profile.changePassword.newPassword')"
              :validation-status="passwordErrors.newPassword ? 'error' : undefined"
              :feedback="passwordErrors.newPassword"
            >
              <n-input
                v-model:value="passwordForm.newPassword"
                type="password"
                show-password-on="click"
                :placeholder="$t('cabinet.profile.changePassword.newPassword')"
              />
            </n-form-item>

            <n-form-item
              :label="$t('cabinet.profile.changePassword.newPasswordConfirmation')"
              :validation-status="passwordErrors.newPasswordConfirmation ? 'error' : undefined"
              :feedback="passwordErrors.newPasswordConfirmation"
            >
              <n-input
                v-model:value="passwordForm.newPasswordConfirmation"
                type="password"
                show-password-on="click"
                :placeholder="$t('cabinet.profile.changePassword.newPasswordConfirmation')"
              />
            </n-form-item>

            <n-space vertical size="medium">
              <n-alert v-if="passwordSuccess" type="success" closable>
                {{ passwordSuccess }}
              </n-alert>

              <n-alert v-if="passwordError" type="error" closable>
                {{ passwordError }}
              </n-alert>

              <n-button
                type="primary"
                attr-type="submit"
                :loading="changingPassword"
                @click="handleChangePassword"
                block
              >
                {{ $t('cabinet.profile.changePassword.submit') }}
              </n-button>
            </n-space>
          </n-form>
        </n-card>
      </n-space>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../layouts/CabinetLayout.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { 
  NSpace, NH1, NText, NGrid, NGi, NCard, NAvatar, NTag, NIcon, 
  NForm, NFormItem, NInput, NButton, NAlert, NSpin
} from 'naive-ui'
import { 
  PersonOutline as UserIcon,
  LockClosedOutline as LockIcon,
  CallOutline as PhoneIcon,
  CalendarOutline as BirthdayIcon,
  LocationOutline as AddressIcon
} from '@vicons/ionicons5'

const authStore = useAuthStore()
const { t } = useI18n()
const user = computed(() => authStore.user)
const loading = computed(() => authStore.loading)
const error = computed(() => authStore.error)

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  newPasswordConfirmation: ''
})

const passwordErrors = ref<{
  oldPassword?: string
  newPassword?: string
  newPasswordConfirmation?: string
}>({})

const passwordSuccess = ref('')
const passwordError = ref('')
const changingPassword = ref(false)

const getRoleType = (role: string | undefined) => {
  switch (role) {
    case 'student': return 'success'
    case 'teacher': return 'info'
    case 'director': return 'warning'
    case 'head_teacher': return 'error'
    case 'merchant': return 'primary'
    default: return 'default'
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const localeValue = useI18n().locale.value === 'ru' ? 'ru-RU' : useI18n().locale.value === 'tm' ? 'tk-TM' : 'en-US'
  return date.toLocaleDateString(localeValue, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handleChangePassword = async (e: Event) => {
  e.preventDefault()
  
  // Reset messages
  passwordSuccess.value = ''
  passwordError.value = ''
  passwordErrors.value = {}

  // Validate
  if (passwordForm.value.newPassword.length < 8) {
    passwordErrors.value.newPassword = t('cabinet.profile.changePassword.minLength')
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.newPasswordConfirmation) {
    passwordErrors.value.newPasswordConfirmation = t('cabinet.profile.changePassword.passwordsNotMatch')
    return
  }

  changingPassword.value = true

  try {
    const result = await authStore.changePassword(
      passwordForm.value.oldPassword,
      passwordForm.value.newPassword,
      passwordForm.value.newPasswordConfirmation
    )

    if (result.success) {
      passwordSuccess.value = t('cabinet.profile.changePassword.success')
      // Reset form
      passwordForm.value = {
        oldPassword: '',
        newPassword: '',
        newPasswordConfirmation: ''
      }
    } else {
      // Handle errors
      if (result.errors) {
        if (result.errors.old_password) {
          passwordErrors.value.oldPassword = Array.isArray(result.errors.old_password)
            ? result.errors.old_password[0]
            : result.errors.old_password
        }
        if (result.errors.new_password) {
          passwordErrors.value.newPassword = Array.isArray(result.errors.new_password)
            ? result.errors.new_password[0]
            : result.errors.new_password
        }
        if (result.errors.new_password_confirmation) {
          passwordErrors.value.newPasswordConfirmation = Array.isArray(result.errors.new_password_confirmation)
            ? result.errors.new_password_confirmation[0]
            : result.errors.new_password_confirmation
        }
      }
      passwordError.value = result.message || t('cabinet.profile.changePassword.error')
    }
  } catch (err: any) {
    passwordError.value = err.message || t('cabinet.profile.changePassword.error')
  } finally {
    changingPassword.value = false
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-card {
  padding: 12px;
}

.avatar-col {
  display: flex;
  justify-content: center;
  border-right: 1px solid #efeff5;
}

.profile-avatar-large {
  border: 4px solid #18a058;
  background-color: #f5f7f9;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}

@media (max-width: 768px) {
  .avatar-col {
    border-right: none;
    border-bottom: 1px solid #efeff5;
    padding-bottom: 24px;
  }
}
</style>
