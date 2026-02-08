<template>
  <CabinetLayout>
    <div class="page-content">
      <div class="page-header">
        <h1>{{ $t('admin.actions.edit') }} {{ $t('admin.models.teachers') }}</h1>
        <router-link to="/cabinet/head-teacher/teachers" class="btn btn-secondary">
          <i class="pi pi-arrow-left"></i>
          {{ $t('common.back') }}
        </router-link>
      </div>

      <div v-if="loading && !formData.username" class="loading-state">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="admin-form">
        <div class="form-section">
          <h2>{{ $t('admin.forms.basicInfo') }}</h2>
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
            <label>{{ $t('admin.forms.email') }} *</label>
            <input
              v-model="formData.email"
              type="email"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.forms.password') }}</label>
            <input
              v-model="formData.password"
              type="password"
              class="form-input"
              :placeholder="$t('admin.forms.passwordPlaceholder')"
              @input="passwordChanged = true"
            />
            <small class="form-hint">{{ $t('admin.forms.passwordHint') }}</small>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('admin.forms.firstName') }}</label>
              <input
                v-model="formData.first_name"
                type="text"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>{{ $t('admin.forms.lastName') }}</label>
              <input
                v-model="formData.last_name"
                type="text"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>{{ $t('admin.teachers.profile') }}</h2>
          <div class="form-group">
            <label>{{ $t('admin.forms.image') }}</label>
            <input
              type="file"
              @change="handleImageChange"
              accept="image/*"
              class="form-input"
            />
            <div v-if="previewImage || currentImage" class="image-preview">
              <img :src="previewImage || currentImage || undefined" alt="Preview" />
            </div>
          </div>
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
            <label>{{ $t('admin.teachers.experience') }} ({{ $t('admin.teachers.years') }})</label>
            <input
              v-model.number="formData.experience_years"
              type="number"
              min="0"
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
        </div>

        <div class="form-section">
          <h2>{{ $t('admin.teachers.biography') }}</h2>
          <div class="form-group">
            <label>{{ $t('admin.forms.contentTm') }} *</label>
            <textarea
              v-model="formData.bio_tm"
              required
              rows="6"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-group">
            <label>{{ $t('admin.forms.contentRu') }} *</label>
            <textarea
              v-model="formData.bio_ru"
              required
              rows="6"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-group">
            <label>{{ $t('admin.forms.contentEn') }} *</label>
            <textarea
              v-model="formData.bio_en"
              required
              rows="6"
              class="form-textarea"
            ></textarea>
          </div>
        </div>

        <div class="form-section">
          <h2>{{ $t('admin.teachers.video') }}</h2>
          <div class="form-group">
            <label>{{ $t('admin.teachers.video') }}</label>
            <input
              type="file"
              @change="handleVideoChange"
              accept="video/*"
              class="form-input"
            />
            <div v-if="currentVideo" class="video-preview">
              <video :src="currentVideo" controls style="max-width: 400px; max-height: 300px;"></video>
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
          <router-link to="/cabinet/head-teacher/teachers" class="btn btn-secondary">
            {{ $t('admin.actions.cancel') }}
          </router-link>
        </div>
      </form>
    </div>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { useAdminUsers, useAdminTeachers } from '@/composables/useAdminApi'

const route = useRoute()
const router = useRouter()
const { updateUser } = useAdminUsers()
const { loading, error, fetchTeacher, updateTeacher } = useAdminTeachers()
const previewImage = ref<string | null>(null)
const currentImage = ref<string | null>(null)
const currentVideo = ref<string | null>(null)

const formData = ref({
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  avatar: null as File | null,
  specialization_tm: '',
  specialization_ru: '',
  specialization_en: '',
  experience_years: 0,
  hire_date: '',
  bio_tm: '',
  bio_ru: '',
  bio_en: '',
  video: null as File | null
})

// Track if password field has been manually changed
const passwordChanged = ref(false)

const handleImageChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    formData.value.avatar = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImage.value = e.target?.result as string
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
  try {
    error.value = null
    const id = parseInt(route.params.id as string)
    
    // Get teacher to get user ID first
    const teacher = await fetchTeacher(id)
    // user_id should be available from serializer, but fallback to id (which is user.id in TeacherProfileSerializer)
    const userId = teacher.user_id || teacher.id || teacher.user?.id
    
    if (!userId) {
      error.value = 'User ID not found for this teacher'
      console.error('User ID not found. Teacher object:', teacher)
      return
    }
    
    console.log('Updating user with ID:', userId)
    console.log('Username from form:', formData.value.username?.trim())
    console.log('Email from form:', formData.value.email?.trim())
    
    // Update user - send required fields
    const userFormData = new FormData()
    
    // Required fields - always send for proper validation
    if (formData.value.username && formData.value.username.trim()) {
      userFormData.append('username', formData.value.username.trim())
    } else {
      error.value = 'Username is required'
      return
    }
    if (formData.value.email && formData.value.email.trim()) {
      userFormData.append('email', formData.value.email.trim())
    } else {
      error.value = 'Email is required'
      return
    }
    
    // Password - only send if it was manually changed and is not empty
    if (passwordChanged.value && formData.value.password && formData.value.password.trim() !== '') {
      const passwordValue = formData.value.password.trim()
      userFormData.append('password', passwordValue)
      console.log('Sending password update - password length:', passwordValue.length)
      console.log('FormData entries:', Array.from(userFormData.entries()).map(([k, v]) => [k, k === 'password' ? '***' : v]))
    } else {
      console.log('Password not changed or empty, skipping password update', {
        passwordChanged: passwordChanged.value,
        passwordValue: formData.value.password,
        passwordTrimmed: formData.value.password?.trim() || ''
      })
    }
    
    // Optional fields
    if (formData.value.first_name && formData.value.first_name.trim()) {
      userFormData.append('first_name', formData.value.first_name.trim())
    }
    if (formData.value.last_name && formData.value.last_name.trim()) {
      userFormData.append('last_name', formData.value.last_name.trim())
    }
    if (formData.value.avatar) {
      userFormData.append('avatar', formData.value.avatar)
    }
    
    await updateUser(userId, userFormData)
    
    // Update teacher profile
    const teacherFormData = new FormData()
    teacherFormData.append('specialization_tm', formData.value.specialization_tm)
    teacherFormData.append('specialization_ru', formData.value.specialization_ru)
    teacherFormData.append('specialization_en', formData.value.specialization_en)
    teacherFormData.append('experience_years', formData.value.experience_years.toString())
    if (formData.value.hire_date) {
      teacherFormData.append('hire_date', formData.value.hire_date)
    }
    teacherFormData.append('bio_tm', formData.value.bio_tm)
    teacherFormData.append('bio_ru', formData.value.bio_ru)
    teacherFormData.append('bio_en', formData.value.bio_en)
    if (formData.value.video) {
      teacherFormData.append('video', formData.value.video)
    }
    
    await updateTeacher(id, teacherFormData)
    
    // Reset password field after successful update
    formData.value.password = ''
    passwordChanged.value = false
    // Reset image preview after successful update
    previewImage.value = null
    formData.value.avatar = null
    
    router.push('/cabinet/head-teacher/teachers')
  } catch (err: any) {
    console.error('Update teacher error:', err)
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
        error.value = errorMessages.join('; ') || 'Failed to update teacher'
      } else {
        error.value = errorData || 'Failed to update teacher'
      }
    } else {
      error.value = err.message || 'Failed to update teacher'
    }
  }
}

onMounted(async () => {
  const id = parseInt(route.params.id as string)
  if (id) {
    try {
      const teacher = await fetchTeacher(id)
      formData.value.username = teacher.username || ''
      formData.value.email = teacher.email || ''
      formData.value.first_name = teacher.first_name || ''
      formData.value.last_name = teacher.last_name || ''
      formData.value.specialization_tm = teacher.specialization_tm || ''
      formData.value.specialization_ru = teacher.specialization_ru || ''
      formData.value.specialization_en = teacher.specialization_en || ''
      formData.value.experience_years = teacher.experience_years || 0
      formData.value.hire_date = teacher.hire_date || ''
      formData.value.bio_tm = teacher.bio_tm || ''
      formData.value.bio_ru = teacher.bio_ru || ''
      formData.value.bio_en = teacher.bio_en || ''
      // Explicitly set password to empty and reset change tracking
      formData.value.password = ''
      passwordChanged.value = false
      if (teacher.avatar_url) {
        currentImage.value = teacher.avatar_url
      }
      if (teacher.video_url) {
        currentVideo.value = teacher.video_url
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message || 'Failed to load teacher'
    }
  }
})
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
  border-radius: 8px;
  padding: 2rem;
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
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
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
  box-shadow: 0 0 0 3px rgba(65, 118, 144, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
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

.image-preview,
.video-preview {
  margin-top: 1rem;
}

.image-preview img {
  max-width: 300px;
  max-height: 200px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
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
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

