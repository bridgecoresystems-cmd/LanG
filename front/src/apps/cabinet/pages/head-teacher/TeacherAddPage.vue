<template>
  <CabinetLayout>
    <div class="page-content">
      <div class="page-header">
        <h1>{{ $t('admin.actions.add') }} {{ $t('admin.models.teacher') }}</h1>
        <router-link to="/cabinet/head-teacher/teachers" class="btn btn-secondary">
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

        <div class="form-section">
          <h2>{{ $t('admin.teachers.professionalInfo') }}</h2>
          <div class="form-group">
            <label>{{ $t('admin.teachers.specialization') }} (TM) *</label>
            <input
              v-model="formData.specialization_tm"
              type="text"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.teachers.specialization') }} (RU) *</label>
            <input
              v-model="formData.specialization_ru"
              type="text"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.teachers.specialization') }} (EN) *</label>
            <input
              v-model="formData.specialization_en"
              type="text"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.teachers.biography') }} (TM) *</label>
            <textarea
              v-model="formData.bio_tm"
              required
              rows="4"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-group">
            <label>{{ $t('admin.teachers.biography') }} (RU) *</label>
            <textarea
              v-model="formData.bio_ru"
              required
              rows="4"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-group">
            <label>{{ $t('admin.teachers.biography') }} (EN) *</label>
            <textarea
              v-model="formData.bio_en"
              required
              rows="4"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-group">
            <label>{{ $t('admin.teachers.experience') }} *</label>
            <input
              v-model.number="formData.experience_years"
              type="number"
              min="0"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.teachers.hireDate') }}</label>
            <input
              v-model="formData.hire_date"
              type="date"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.teachers.video') }}</label>
            <input
              type="file"
              @change="handleVideoChange"
              accept="video/*"
              class="form-input"
            />
            <small class="form-hint">{{ $t('admin.teachers.videoHint') }}</small>
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
          <router-link to="/cabinet/head-teacher/teachers" class="btn btn-secondary">
            {{ $t('admin.actions.cancel') }}
          </router-link>
        </div>
      </form>
    </div>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { useAdminTeachers } from '@/composables/useAdminApi'

const router = useRouter()
const { t } = useI18n()
const { loading, error, createTeacher } = useAdminTeachers()

const formData = ref({
  username: '',
  password: '',
  password_confirmation: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  avatar: null as File | null,
  specialization_tm: '',
  specialization_ru: '',
  specialization_en: '',
  bio_tm: '',
  bio_ru: '',
  bio_en: '',
  experience_years: 0,
  hire_date: '',
  video: null as File | null
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

const handleVideoChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    formData.value.video = target.files[0]
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
      phone: formData.value.phone || '',
      specialization_tm: formData.value.specialization_tm,
      specialization_ru: formData.value.specialization_ru,
      specialization_en: formData.value.specialization_en,
      bio_tm: formData.value.bio_tm,
      bio_ru: formData.value.bio_ru,
      bio_en: formData.value.bio_en,
      experience_years: formData.value.experience_years,
      hire_date: formData.value.hire_date || null
    }

    if (formData.value.avatar) {
      dataToSend.avatar = formData.value.avatar
    }
    if (formData.value.video) {
      dataToSend.video = formData.value.video
    }

    await createTeacher(dataToSend)
    router.push('/cabinet/head-teacher/teachers')
  } catch (err: any) {
    console.error('Create teacher error:', err)
  }
}
</script>

<style scoped>
.page-content {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--primary-color);
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--secondary-color);
  border-color: var(--secondary-color);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.admin-form {
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--primary-color);
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
  color: var(--text-primary);
}

.form-input,
.form-textarea {
  width: 100%;
  max-width: 600px;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  max-width: 800px;
}

.form-input[type="number"],
.form-input[type="date"] {
  max-width: 300px;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.image-preview {
  margin-top: 0.5rem;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  border: 2px solid var(--border-color);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fee;
  border: 2px solid #fcc;
  border-radius: 8px;
  color: #c33;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
