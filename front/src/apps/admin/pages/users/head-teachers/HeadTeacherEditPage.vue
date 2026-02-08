<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="page-header">
        <h1>{{ $t('admin.actions.edit') }} {{ $t('admin.models.headTeacher') }}</h1>
        <router-link to="/management/head-teachers" class="btn btn-secondary">
          <i class="pi pi-arrow-left"></i>
          {{ $t('common.back') }}
        </router-link>
      </div>

      <div v-if="loading && !headTeacher" class="loading-state">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="admin-form">
        <div class="form-section">
          <h2>{{ $t('admin.forms.accountInfo') }}</h2>
          <div class="form-group">
            <label>{{ $t('admin.forms.username') }} *</label>
            <input
              v-model="formData.username"
              type="text"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.forms.password') }}</label>
            <input
              v-model="formData.password"
              type="password"
              minlength="8"
              class="form-input"
              @input="passwordChanged = true"
            />
            <small class="form-hint">{{ $t('admin.forms.passwordHint') }}</small>
          </div>
          <div class="form-group">
            <label>{{ $t('admin.forms.passwordConfirmation') }}</label>
            <input
              v-model="formData.password_confirmation"
              type="password"
              minlength="8"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-section">
          <h2>{{ $t('admin.forms.personalInfo') }}</h2>
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('admin.forms.firstName') }} *</label>
              <input
                v-model="formData.first_name"
                type="text"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>{{ $t('admin.forms.lastName') }} *</label>
              <input
                v-model="formData.last_name"
                type="text"
                required
                class="form-input"
              />
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('admin.forms.phone') }}</label>
            <input
              v-model="formData.phone"
              type="tel"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.forms.email') }} *</label>
            <input
              v-model="formData.email"
              type="email"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.forms.photo') }}</label>
            <input
              type="file"
              @change="handleAvatarChange"
              accept="image/*"
              class="form-input"
            />
            <div v-if="previewAvatar || currentAvatar" class="image-preview">
              <img :src="previewAvatar || currentAvatar" alt="Avatar preview" />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>{{ $t('admin.forms.status') }}</h2>
          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="formData.is_active"
                type="checkbox"
                class="form-checkbox"
              />
              <span>{{ $t('admin.forms.isActive') }}</span>
            </label>
          </div>
        </div>

        <div v-if="error" class="error-message">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ error }}</span>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <i v-if="loading" class="pi pi-spin pi-spinner"></i>
            <span v-else>{{ $t('admin.actions.save') }}</span>
          </button>
          <router-link to="/management/head-teachers" class="btn btn-secondary">
            {{ $t('admin.actions.cancel') }}
          </router-link>
        </div>
      </form>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminHeadTeachers } from '@/composables/useAdminApi'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { loading, error, fetchHeadTeacher, updateHeadTeacher } = useAdminHeadTeachers()

const headTeacher = ref<any>(null)
const formData = ref({
  username: '',
  password: '',
  password_confirmation: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  avatar: null as File | null,
  is_active: true
})

const previewAvatar = ref<string | null>(null)
const currentAvatar = ref<string | null>(null)

// Track if password field has been manually changed
const passwordChanged = ref(false)

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    formData.value.avatar = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      previewAvatar.value = e.target?.result as string
    }
    reader.readAsDataURL(target.files[0])
  }
}

const loadHeadTeacher = async () => {
  try {
    const id = parseInt(route.params.id as string)
    const data = await fetchHeadTeacher(id)
    headTeacher.value = data
    formData.value = {
      username: data.username || '',
      password: '',
      password_confirmation: '',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      phone: data.phone || '',
      avatar: null,
      is_active: data.is_active !== false
    }
    // Reset password change tracking
    passwordChanged.value = false
    if (data.avatar_url) {
      currentAvatar.value = data.avatar_url
    }
  } catch (err) {
    console.error('Load head teacher error:', err)
  }
}

const handleSubmit = async () => {
  error.value = null
  
  // Validate password confirmation only if password was changed
  if (passwordChanged.value && formData.value.password) {
    if (formData.value.password !== formData.value.password_confirmation) {
      error.value = t('admin.forms.passwordMismatch')
      return
    }
  }

  try {
    const dataToSend: any = {
      username: formData.value.username?.trim() || '',
      first_name: formData.value.first_name?.trim() || '',
      last_name: formData.value.last_name?.trim() || '',
      email: formData.value.email?.trim() || '',
      phone: formData.value.phone?.trim() || '',
      is_active: formData.value.is_active
    }

    // Password - only send if it was manually changed and is not empty
    if (passwordChanged.value && formData.value.password && formData.value.password.trim() !== '') {
      dataToSend.password = formData.value.password.trim()
      dataToSend.password_confirmation = formData.value.password_confirmation?.trim() || ''
    }

    if (formData.value.avatar) {
      dataToSend.avatar = formData.value.avatar
    }

    await updateHeadTeacher(parseInt(route.params.id as string), dataToSend)
    
    // Reset password field after successful update
    formData.value.password = ''
    formData.value.password_confirmation = ''
    passwordChanged.value = false
    
    // Reset avatar preview
    previewAvatar.value = null
    formData.value.avatar = null
    
    router.push('/management/head-teachers')
  } catch (err: any) {
    console.error('Update head teacher error:', err)
    // Format error message
    if (err.response?.data) {
      const errorData = err.response.data
      if (typeof errorData === 'object') {
        const errorMessages: string[] = []
        for (const [key, value] of Object.entries(errorData)) {
          if (Array.isArray(value)) {
            errorMessages.push(`${key}: ${value.join(', ')}`)
          } else if (typeof value === 'string') {
            errorMessages.push(`${key}: ${value}`)
          } else {
            errorMessages.push(`${key}: ${JSON.stringify(value)}`)
          }
        }
        error.value = errorMessages.join('; ') || 'Failed to update head teacher'
      } else {
        error.value = errorData || 'Failed to update head teacher'
      }
    } else {
      error.value = err.message || 'Failed to update head teacher'
    }
  }
}

onMounted(() => {
  loadHeadTeacher()
})
</script>

<style scoped>
.admin-page {
  padding: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  margin: 0;
  color: #333;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #417690;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #205067;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.admin-form {
  background: white;
  padding: 2rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #333;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-input {
  width: 100%;
  max-width: 600px;
  padding: 0.625rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-input[type="number"],
.form-input[type="date"] {
  max-width: 300px;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #666;
}

.image-preview {
  margin-top: 0.5rem;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

