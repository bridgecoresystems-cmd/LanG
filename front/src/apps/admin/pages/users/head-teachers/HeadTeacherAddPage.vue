<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="page-header">
        <h1>{{ $t('admin.actions.add') }} {{ $t('admin.models.headTeacher') }}</h1>
        <router-link to="/management/head-teachers" class="btn btn-secondary">
          <i class="pi pi-arrow-left"></i>
          {{ $t('common.back') }}
        </router-link>
      </div>

      <form @submit.prevent="handleSubmit" class="admin-form">
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
            <label>{{ $t('admin.forms.password') }} *</label>
            <input
              v-model="formData.password"
              type="password"
              required
              minlength="8"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.forms.passwordConfirmation') }} *</label>
            <input
              v-model="formData.password_confirmation"
              type="password"
              required
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
            <div v-if="previewAvatar" class="image-preview">
              <img :src="previewAvatar" alt="Avatar preview" />
            </div>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminHeadTeachers } from '@/composables/useAdminApi'

const router = useRouter()
const { t } = useI18n()
const { loading, error, createHeadTeacher } = useAdminHeadTeachers()

const formData = ref({
  username: '',
  password: '',
  password_confirmation: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  avatar: null as File | null
})

const previewAvatar = ref<string | null>(null)

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

const handleSubmit = async () => {
  if (formData.value.password !== formData.value.password_confirmation) {
    error.value = t('admin.forms.passwordMismatch')
    return
  }

  try {
    const dataToSend: any = {
      username: formData.value.username,
      password: formData.value.password,
      password_confirmation: formData.value.password_confirmation,
      first_name: formData.value.first_name,
      last_name: formData.value.last_name,
      email: formData.value.email,
      phone: formData.value.phone || ''
    }

    if (formData.value.avatar) {
      dataToSend.avatar = formData.value.avatar
    }

    await createHeadTeacher(dataToSend)
    router.push('/management/head-teachers')
  } catch (err: any) {
    console.error('Create head teacher error:', err)
  }
}
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

