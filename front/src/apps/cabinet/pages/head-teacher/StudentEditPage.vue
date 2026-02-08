<template>
  <CabinetLayout>
    <div class="page-content">
      <div class="page-header">
        <h1>{{ $t('admin.actions.edit') }} {{ $t('admin.models.students') }}</h1>
        <router-link to="/cabinet/head-teacher/students" class="btn btn-secondary">
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
          <div class="form-group">
            <label>{{ $t('admin.forms.gender') }}</label>
            <select v-model="formData.gender" class="form-input">
              <option :value="null">{{ $t('common.select') || 'Выберите...' }}</option>
              <option value="boy">{{ $t('admin.forms.genderBoy') }}</option>
              <option value="girl">{{ $t('admin.forms.genderGirl') }}</option>
            </select>
          </div>
        </div>

        <div class="form-section">
          <h2>{{ $t('admin.forms.personalInfo') }}</h2>
          <div class="form-group">
            <label>{{ $t('admin.forms.phone') }}</label>
            <input
              v-model="formData.phone"
              type="tel"
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
            <div class="image-preview">
              <UserAvatar 
                :src="previewAvatar || currentImage" 
                :gender="formData.gender" 
                size="large" 
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>{{ $t('admin.students.parentsInfo') }}</h2>
          <div class="form-group">
            <label>{{ $t('admin.students.parent1Name') }}</label>
            <input
              v-model="formData.parent1_name"
              type="text"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.students.parent1Phone') }}</label>
            <input
              v-model="formData.parent1_phone"
              type="tel"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.students.parent2Name') }}</label>
            <input
              v-model="formData.parent2_name"
              type="text"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('admin.students.parent2Phone') }}</label>
            <input
              v-model="formData.parent2_phone"
              type="tel"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-section">
          <h2>{{ $t('admin.students.rfidBracelet') || 'RFID Браслет' }}</h2>
          <div class="form-group">
            <label>{{ $t('admin.students.rfidUid') || 'UID браслета' }}</label>
            <div class="rfid-input-group">
              <input
                v-model="formData.rfid_uid"
                type="text"
                class="form-input"
                :placeholder="$t('admin.students.rfidUidPlaceholder') || 'Нажмите кнопку ниже для сканирования или введите вручную'"
                :readonly="scanning"
              />
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="scanning"
                @click="handleScanRFID"
                style="margin-left: 8px;"
              >
                <i v-if="scanning" class="pi pi-spin pi-spinner"></i>
                <i v-else class="pi pi-barcode"></i>
                {{ scanning ? ($t('admin.students.scanning') || 'Сканирование...') : ($t('admin.students.scanRFID') || 'Сканировать RFID') }}
              </button>
            </div>
            <div class="form-group" style="margin-top: 0.5rem;">
              <label style="font-size: 0.875rem;">{{ $t('admin.students.esp32Ip') || 'IP адрес ESP32' }}</label>
              <input
                v-model="esp32Ip"
                type="text"
                class="form-input"
                placeholder="192.168.4.1"
                style="max-width: 200px;"
              />
              <small class="form-hint">
                {{ $t('admin.students.esp32IpHint') || 'IP адрес ESP32 сканера (по умолчанию: 192.168.4.1). Подключитесь к WiFi сети RFID_Scanner_XXXX' }}
              </small>
            </div>
            <small class="form-hint" v-if="scanError">
              <span style="color: #d32f2f;">{{ scanError }}</span>
            </small>
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
          <router-link to="/cabinet/head-teacher/students" class="btn btn-secondary">
            {{ $t('admin.actions.cancel') }}
          </router-link>
        </div>
      </form>
    </div>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useAdminUsers, useAdminStudents } from '@/composables/useAdminApi'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { updateUser } = useAdminUsers()
const { loading, error, fetchStudent, updateStudent } = useAdminStudents()

const formData = ref({
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone: '',
  gender: null as string | null,
  avatar: null as File | null,
  parent1_name: '',
  parent1_phone: '',
  parent2_name: '',
  parent2_phone: '',
  rfid_uid: ''
})

const previewAvatar = ref<string | null>(null)
const currentImage = ref<string | null>(null)

// Track if password field has been manually changed
const passwordChanged = ref(false)

// RFID scanning state
const scanning = ref(false)
const esp32Ip = ref('192.168.4.1')
const scanError = ref('')
let scanInterval: number | null = null

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
  try {
    error.value = null
    const id = parseInt(route.params.id as string)
    
    // Get student to get user ID first
    const student = await fetchStudent(id)
    const userId = student.user_id || student.id
    
    if (!userId) {
      error.value = 'User ID not found for this student'
      console.error('User ID not found. Student object:', student)
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
    if (formData.value.phone && formData.value.phone.trim()) {
      userFormData.append('phone', formData.value.phone.trim())
    }
    if (formData.value.gender) {
      userFormData.append('gender', formData.value.gender)
    }
    if (formData.value.avatar) {
      userFormData.append('avatar', formData.value.avatar)
      console.log('Sending avatar file:', formData.value.avatar.name, formData.value.avatar.size)
    }
    
    console.log('FormData entries before updateUser:', Array.from(userFormData.entries()).map(([k, v]) => [k, k === 'password' ? '***' : (v instanceof File ? `File: ${v.name}` : String(v))]))
    await updateUser(userId, userFormData)
    
    // Update student profile
    const studentFormData = new FormData()
    if (formData.value.parent1_name && formData.value.parent1_name.trim()) {
      studentFormData.append('parent1_name', formData.value.parent1_name.trim())
    }
    if (formData.value.parent1_phone && formData.value.parent1_phone.trim()) {
      studentFormData.append('parent1_phone', formData.value.parent1_phone.trim())
    }
    if (formData.value.parent2_name && formData.value.parent2_name.trim()) {
      studentFormData.append('parent2_name', formData.value.parent2_name.trim())
    }
    if (formData.value.parent2_phone && formData.value.parent2_phone.trim()) {
      studentFormData.append('parent2_phone', formData.value.parent2_phone.trim())
    }
    
    // Include RFID UID if provided
    if (formData.value.rfid_uid && formData.value.rfid_uid.trim()) {
      studentFormData.append('rfid_uid', formData.value.rfid_uid.trim().toUpperCase())
    }
    
    // Stop scanning before submitting
    stopScanning()
    
    await updateStudent(id, studentFormData)
    
    // Reset password field after successful update
    formData.value.password = ''
    passwordChanged.value = false
    // Reset avatar preview after successful update
    previewAvatar.value = null
    formData.value.avatar = null
    
    router.push('/cabinet/head-teacher/students')
  } catch (err: any) {
    console.error('Update student error:', err)
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
        error.value = errorMessages.join('; ') || 'Failed to update student'
      } else {
        error.value = errorData || 'Failed to update student'
      }
    } else {
      error.value = err.message || 'Failed to update student'
    }
  }
}

onMounted(async () => {
  const id = parseInt(route.params.id as string)
  if (id) {
    try {
      const student = await fetchStudent(id)
      formData.value.username = student.username || ''
      formData.value.email = student.email || ''
      formData.value.first_name = student.first_name || ''
      formData.value.last_name = student.last_name || ''
      formData.value.phone = student.phone || ''
      formData.value.parent1_name = student.parent1_name || ''
      formData.value.parent1_phone = student.parent1_phone || ''
      formData.value.parent2_name = student.parent2_name || ''
      formData.value.parent2_phone = student.parent2_phone || ''
      formData.value.rfid_uid = student.rfid_uid || ''
      formData.value.gender = student.gender || null
      // Explicitly set password to empty and reset change tracking
      formData.value.password = ''
      passwordChanged.value = false
      if (student.avatar_url) {
        currentImage.value = student.avatar_url
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message || 'Failed to load student'
    }
  }
})

// RFID scanning functions (WiFi version)
const handleScanRFID = async () => {
  if (scanning.value) {
    // Stop scanning
    stopScanning()
    return
  }

  scanning.value = true
  scanError.value = ''
  
  const ip = esp32Ip.value.trim() || '192.168.4.1'
  const baseUrl = `http://${ip}`
  
  // Start polling for UID
  let lastCheckedUid = ''
  let attempts = 0
  const maxAttempts = 300 // 30 seconds (100ms * 300)
  
  scanInterval = window.setInterval(async () => {
    try {
      attempts++
      
      // Check status first
      const statusResponse = await fetch(`${baseUrl}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (!statusResponse.ok) {
        throw new Error(`HTTP ${statusResponse.status}`)
      }
      
      const status = await statusResponse.json()
      
      // If we have a new UID
      if (status.last_uid && status.last_uid !== lastCheckedUid && status.last_uid.length > 0) {
        formData.value.rfid_uid = status.last_uid.toUpperCase()
        stopScanning()
        alert(t('admin.students.rfidScanned') || `UID браслета отсканирован: ${status.last_uid}`)
        return
      }
      
      // Update last checked UID
      if (status.last_uid) {
        lastCheckedUid = status.last_uid
      }
      
      // Timeout after max attempts
      if (attempts >= maxAttempts) {
        stopScanning()
        scanError.value = t('admin.students.scanTimeout') || 'Таймаут сканирования. Убедитесь, что ESP32 подключен и карта поднесена к считывателю.'
      }
    } catch (err: any) {
      console.error('Scan error:', err)
      if (attempts === 1) {
        // First attempt failed - show error immediately
        scanError.value = t('admin.students.esp32ConnectionError') || `Не удалось подключиться к ESP32 (${ip}). Проверьте подключение к WiFi сети RFID_Scanner_XXXX.`
        stopScanning()
      }
    }
  }, 100) // Poll every 100ms
}

const stopScanning = () => {
  scanning.value = false
  if (scanInterval !== null) {
    clearInterval(scanInterval)
    scanInterval = null
  }
}

// Cleanup on component unmount
onBeforeUnmount(() => {
  stopScanning()
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
  min-height: 80px;
  max-width: 800px;
}

.form-input[type="number"],
.form-input[type="date"] {
  max-width: 300px;
}

.rfid-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rfid-input-group .form-input {
  flex: 1;
}

.rfid-input-group .btn {
  white-space: nowrap;
  min-width: 150px;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.image-preview {
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

