<template>
  <CabinetLayout>
    <div class="page-content">
      <div class="page-header">
        <h1>{{ $t('admin.actions.add') }} {{ $t('admin.models.student') }}</h1>
        <router-link to="/cabinet/head-teacher/students" class="btn btn-secondary">
          <i class="pi pi-arrow-left"></i>
          {{ $t('common.back') }}
        </router-link>
      </div>

      <form @submit.prevent="handleSubmit" class="admin-form">
        <div class="form-section">
          <div class="section-header-with-action">
            <h2>{{ $t('admin.forms.accountInfo') }}</h2>
            <div class="manual-toggle">
              <input type="checkbox" id="manual-entry" v-model="manualEntry" />
              <label for="manual-entry">{{ $t('admin.forms.manualEntry') || 'Ввести вручную' }}</label>
            </div>
          </div>

          <div v-if="!manualEntry" class="auto-gen-info">
            <i class="pi pi-info-circle"></i>
            <span>{{ $t('admin.forms.autoGenInfo') || 'Логин и пароль будут сгенерированы автоматически и отправлены на email ученика.' }}</span>
          </div>

          <template v-if="manualEntry">
            <div class="form-group">
              <label>{{ $t('admin.forms.username') }} *</label>
              <input
                v-model="formData.username"
                type="text"
                :required="manualEntry"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>{{ $t('admin.forms.password') }} *</label>
              <input
                v-model="formData.password"
                type="password"
                :required="manualEntry"
                minlength="8"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>{{ $t('admin.forms.passwordConfirmation') }} *</label>
              <input
                v-model="formData.password_confirmation"
                type="password"
                :required="manualEntry"
                minlength="8"
                class="form-input"
              />
            </div>
          </template>
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
            <label>{{ $t('admin.forms.gender') }}</label>
            <select v-model="formData.gender" class="form-input">
              <option :value="null">{{ $t('common.select') || 'Выберите...' }}</option>
              <option value="boy">{{ $t('admin.forms.genderBoy') }}</option>
              <option value="girl">{{ $t('admin.forms.genderGirl') }}</option>
            </select>
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
            <div class="image-preview">
              <UserAvatar 
                :src="previewAvatar" 
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
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useAdminStudents } from '@/composables/useAdminApi'

const router = useRouter()
const { t } = useI18n()
const { loading, error, createStudent } = useAdminStudents()

const manualEntry = ref(false)

const formData = ref({
  username: '',
  password: '',
  password_confirmation: '',
  first_name: '',
  last_name: '',
  email: '',
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
  if (manualEntry.value && formData.value.password !== formData.value.password_confirmation) {
    error.value = t('admin.forms.passwordMismatch')
    return
  }

  try {
    const dataToSend: any = {
      first_name: formData.value.first_name.trim(),
      last_name: formData.value.last_name.trim(),
      email: formData.value.email.trim(),
      phone: formData.value.phone?.trim() || '',
      gender: formData.value.gender
    }

    if (manualEntry.value) {
      dataToSend.username = formData.value.username.trim()
      dataToSend.password = formData.value.password
      dataToSend.password_confirmation = formData.value.password_confirmation
    }

    // Only include parent fields if they have values
    if (formData.value.parent1_name?.trim()) {
      dataToSend.parent1_name = formData.value.parent1_name.trim()
    }
    if (formData.value.parent1_phone?.trim()) {
      dataToSend.parent1_phone = formData.value.parent1_phone.trim()
    }
    if (formData.value.parent2_name?.trim()) {
      dataToSend.parent2_name = formData.value.parent2_name.trim()
    }
    if (formData.value.parent2_phone?.trim()) {
      dataToSend.parent2_phone = formData.value.parent2_phone.trim()
    }

    // Include RFID UID if provided
    if (formData.value.rfid_uid?.trim()) {
      dataToSend.rfid_uid = formData.value.rfid_uid.trim().toUpperCase()
    }

    if (formData.value.avatar) {
      dataToSend.avatar = formData.value.avatar
    }

    // Stop scanning before submitting
    stopScanning()

    await createStudent(dataToSend)
    router.push('/cabinet/head-teacher/students')
  } catch (err: any) {
    console.error('Create student error:', err)
    const errorMessage = err.response?.data?.username?.[0] || 
                        err.response?.data?.email?.[0] || 
                        err.response?.data?.password_confirmation?.[0] ||
                        err.response?.data?.detail ||
                        err.message ||
                        'Failed to create student'
    error.value = errorMessage
  }
}

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

.section-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header-with-action h2 {
  margin-bottom: 0;
}

.manual-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.manual-toggle input {
  cursor: pointer;
}

.auto-gen-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #e3f2fd;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  color: #0050b3;
  margin-bottom: 1.5rem;
}

.auto-gen-info i {
  font-size: 1.25rem;
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

.form-input {
  width: 100%;
  max-width: 600px;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
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
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
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
