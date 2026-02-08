<template>
  <MainLayout>
    <section class="section">
      <div class="container">
        <h1 class="section-title">{{ $t('navbar.contact') }}</h1>
        
        <div class="contact-wrapper">
          <!-- Contact Form -->
          <div class="contact-form-container">
            <h2 class="form-title">{{ $t('contact.formTitle') }}</h2>
            <p class="form-subtitle">{{ $t('contact.formSubtitle') }}</p>
            
            <form @submit.prevent="submitForm" class="contact-form">
              <div class="form-group">
                <label for="name" class="form-label">
                  {{ $t('contact.name') }} <span class="required">*</span>
                </label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  class="form-input"
                  :placeholder="$t('contact.namePlaceholder')"
                  required
                />
              </div>

              <div class="form-group">
                <label for="phone" class="form-label">
                  {{ $t('contact.phone') }} <span class="required">*</span>
                </label>
                <input
                  id="phone"
                  v-model="form.phone"
                  type="tel"
                  class="form-input"
                  :placeholder="$t('contact.phonePlaceholder')"
                  required
                />
              </div>

              <div class="form-group">
                <label for="email" class="form-label">
                  {{ $t('contact.email') }} <span class="required">*</span>
                </label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  class="form-input"
                  data-placeholder="example mail.ru"
                  required
                />
                <span class="input-hint">{{ $t('contact.emailHint') }}</span>
              </div>

              <div class="form-group">
                <label for="message" class="form-label">
                  {{ $t('contact.message') }} <span class="required">*</span>
                </label>
                <textarea
                  id="message"
                  v-model="form.message"
                  class="form-textarea"
                  :placeholder="$t('contact.messagePlaceholder')"
                  rows="6"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                class="submit-button"
                :disabled="loading"
              >
                <span v-if="loading" class="loading-spinner"></span>
                <span v-else>{{ $t('contact.submit') }}</span>
              </button>

              <div v-if="submitSuccess" class="success-message">
                <i class="pi pi-check-circle"></i>
                {{ $t('contact.successMessage') }}
              </div>

              <div v-if="submitError" class="error-message">
                <i class="pi pi-exclamation-circle"></i>
                {{ submitError }}
              </div>
            </form>
          </div>

          <!-- Contact Info -->
          <div class="contact-info">
            <h3>{{ $t('footer.contact') }}</h3>
            <ul class="contact-list">
              <li>
                <i class="pi pi-map-marker"></i>
                <span>{{ $t('footer.address') }}</span>
              </li>
              <li>
                <i class="pi pi-phone"></i>
                <span>+993 12 34 56 78</span>
              </li>
              <li>
                <i class="pi pi-envelope"></i>
                <span>info@langschool.tm</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Approved Messages/Reviews -->
        <div v-if="messages.length > 0" class="reviews-section">
          <h2 class="reviews-title">{{ $t('contact.reviews') }}</h2>
          
          <div class="reviews-block">
            <div
              v-for="(message, index) in messages"
              :key="message.id"
              class="review-item"
              :class="{ 'last-item': index === messages.length - 1 }"
            >
              <div class="review-content">
                <div class="review-header">
                  <span class="review-author">{{ message.name }}</span>
                  <span class="review-date">{{ formatDate(message.created_at) }}</span>
                </div>
                <p class="review-message">{{ message.message }}</p>
                <div class="review-footer">
                  <button
                    @click.stop="likeMessage(message, $event)"
                    class="like-button"
                    :class="{ 
                      'liked': message.is_liked, 
                      'disabled': !isAuthenticated 
                    }"
                    type="button"
                  >
                    <i class="pi pi-heart"></i>
                    <span class="like-count">{{ message.likes || 0 }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="pagination">
            <button
              @click="loadPage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage === 1"
              class="pagination-button"
            >
              <i class="pi pi-chevron-left"></i>
            </button>
            
            <span class="pagination-info">
              {{ $t('contact.page') }} {{ pagination.currentPage }} {{ $t('contact.of') }} {{ pagination.totalPages }}
            </span>
            
            <button
              @click="loadPage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage === pagination.totalPages"
              class="pagination-button"
            >
              <i class="pi pi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/MainLayout.vue'
import axios from 'axios'
import dayjs from 'dayjs'
import type { ContactMessage, ContactMessageCreate } from '@/types/contact'
import { useAuth } from '@/composables/useAuth'

const { t } = useI18n()
const authStore = useAuth()
const isAuthenticated = computed(() => authStore.isAuthenticated)

const API_BASE_URL = 'http://localhost:8000/api/v1'

const form = reactive<ContactMessageCreate>({
  name: '',
  phone: '',
  email: '',
  message: ''
})

const loading = ref(false)
const submitSuccess = ref(false)
const submitError = ref<string | null>(null)
const messages = ref<ContactMessage[]>([])

const pagination = reactive({
  currentPage: 1,
  totalPages: 1,
  pageSize: 10
})

const submitForm = async () => {
  loading.value = true
  submitError.value = null
  submitSuccess.value = false

  try {
    const response = await axios.post(
      `${API_BASE_URL}/landing/contact-messages/`,
      form,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.status === 201) {
      submitSuccess.value = true
      // Reset form
      form.name = ''
      form.phone = ''
      form.email = ''
      form.message = ''
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        submitSuccess.value = false
      }, 5000)
    }
  } catch (error: any) {
    submitError.value = error.response?.data?.message || t('contact.errorMessage')
  } finally {
    loading.value = false
  }
}

const fetchMessages = async (page = 1) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/landing/contact-messages/`, {
      params: {
        page: page,
        page_size: pagination.pageSize
      }
    })
    
    if (response.data.results) {
      messages.value = response.data.results
      pagination.currentPage = page
      pagination.totalPages = Math.ceil(response.data.count / pagination.pageSize)
    } else if (Array.isArray(response.data)) {
      messages.value = response.data
      pagination.totalPages = 1
    } else {
      messages.value = []
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    messages.value = []
  }
}

const loadPage = (page: number) => {
  if (page >= 1 && page <= pagination.totalPages) {
    fetchMessages(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const likeMessage = async (message: ContactMessage, event: MouseEvent) => {
  event.stopPropagation()
  
  console.log('likeMessage called', { isAuthenticated: isAuthenticated.value, messageId: message.id, isLiked: message.is_liked })
  
  if (!isAuthenticated.value) {
    console.log('User not authenticated')
    return
  }
  
  // Показываем анимацию сердечек только при добавлении лайка
  if (!message.is_liked) {
    createFloatingHearts(event)
  }

  try {
    console.log('Calling like API for message:', message.id)
    const response = await axios.post(
      `${API_BASE_URL}/landing/contact-messages/${message.id}/like/`
    )
    
    console.log('Like API response:', response.data)
    
    if (response.status === 200) {
      message.likes = response.data.likes
      message.is_liked = response.data.is_liked
    }
  } catch (error: any) {
    console.error('Error liking message:', error)
    if (error.response?.status === 401) {
      console.log('Please login to like')
    }
  }
}

const createFloatingHearts = (event: MouseEvent) => {
  console.log('💖 createFloatingHearts called', event)
  
  const button = event.currentTarget as HTMLElement
  if (!button) {
    console.error('❌ Button not found!')
    return
  }

  console.log('✅ Button found:', button)

  // Get button center position relative to viewport
  const buttonRect = button.getBoundingClientRect()
  const startX = buttonRect.left + buttonRect.width / 2
  const startY = buttonRect.top + buttonRect.height / 2

  console.log('📍 Position:', startX, startY)

  // Create 5 floating hearts with different directions
  const directions = [-30, -15, 0, 15, 30]
  const emojis = ['❤️', '💖', '💕', '💗', '💝']
  
  for (let i = 0; i < 5; i++) {
    const heart = document.createElement('div')
    heart.className = 'floating-heart'
    heart.textContent = emojis[i] || '❤️'
    
    const direction = directions[i]
    
    // Set all styles inline to ensure they apply
    heart.style.position = 'fixed'
    heart.style.left = `${startX}px`
    heart.style.top = `${startY}px`
    heart.style.fontSize = '2rem'
    heart.style.lineHeight = '1'
    heart.style.display = 'block'
    heart.style.marginLeft = '-1rem' // Center the heart
    heart.style.marginTop = '-1rem'
    
    // Create unique keyframes for each heart with specific direction
    const animationName = `floatUp${direction}`
    const styleId = `heart-animation-${direction}`
    
    // Create style element for this specific animation if it doesn't exist
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @keyframes ${animationName} {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(0.8) rotate(0deg);
          }
          25% {
            opacity: 1;
            transform: translateY(-30px) translateX(${direction * 0.5}px) scale(1.2) rotate(-8deg);
          }
          50% {
            opacity: 1;
            transform: translateY(-60px) translateX(${direction * 1}px) scale(1.4) rotate(8deg);
          }
          75% {
            opacity: 0.8;
            transform: translateY(-90px) translateX(${direction * 1.3}px) scale(1.6) rotate(-5deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-120px) translateX(${direction * 1.5}px) scale(1.8) rotate(0deg);
          }
        }
      `
      document.head.appendChild(style)
    }
    
    // Append to body
    document.body.appendChild(heart)
    
    // Force reflow
    void heart.offsetWidth
    
    // Apply animation
    heart.style.animation = `${animationName} 2s ease-out ${i * 0.1}s forwards`
    
    // Remove heart after animation completes
    setTimeout(() => {
      if (heart.parentNode) {
        heart.parentNode.removeChild(heart)
      }
    }, 2500)
  }
  
  console.log('✅ All 5 hearts created!')
}

const formatDate = (dateString: string) => {
  return dayjs(dateString).format('DD MMMM YYYY')
}

onMounted(() => {
  fetchMessages()
  
  // Set email placeholder via JavaScript to avoid @ symbol issue
  const emailInput = document.getElementById('email') as HTMLInputElement
  if (emailInput) {
    emailInput.setAttribute('placeholder', 'example@mail.ru')
  }
})
</script>

<style scoped>
.contact-wrapper {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
  margin-bottom: 4rem;
}

.contact-form-container {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.form-subtitle {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: 1rem;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.required {
  color: #e74c3c;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.input-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: -0.25rem;
}

.submit-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  max-width: 200px;
  align-self: flex-start;
}

.submit-button:hover:not(:disabled) {
  background: var(--secondary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.success-message,
.error-message {
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.success-message {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.contact-info {
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 16px;
  height: fit-content;
}

.contact-info h3 {
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  font-size: 1.5rem;
}

.contact-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.contact-list li {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1rem;
  color: var(--text-primary);
}

.contact-list i {
  color: var(--primary-color);
  font-size: 1.5rem;
}

.reviews-section {
  margin-top: 4rem;
  padding-top: 3rem;
  border-top: 2px solid var(--border-color);
}

.reviews-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: var(--text-primary);
}

.reviews-block {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.review-item {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.review-item.last-item {
  border-bottom: none;
}

.review-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.review-author {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.review-date {
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.review-message {
  color: var(--text-primary);
  line-height: 1.6;
  font-size: 1rem;
  margin: 0;
}

.review-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.like-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 2px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  color: var(--text-secondary);
  position: relative;
}

.like-button:hover:not(.disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: scale(1.05);
}

.like-button.liked {
  background: #ff6b9d;
  border-color: #ff6b9d;
  color: white;
}

.like-button.liked i {
  color: white;
}

.like-button.disabled,
.like-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: none;
  color: var(--text-secondary);
}

.like-button.disabled:hover,
.like-button:disabled:hover {
  transform: none;
  border-color: var(--border-color);
}

.like-button i {
  font-size: 1rem;
  transition: transform 0.3s ease;
}

.like-button:active i {
  transform: scale(1.3);
}

.like-count {
  font-weight: 600;
}

.floating-heart {
  position: fixed;
  font-size: 2rem;
  line-height: 1;
  display: block;
  animation: floatUp 2s ease-out forwards;
  pointer-events: none;
  will-change: transform, opacity;
  transform-origin: center center;
  white-space: nowrap;
  user-select: none;
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translateY(0) translateX(0) scale(0.8) rotate(0deg);
  }
  25% {
    opacity: 1;
    transform: translateY(-30px) translateX(calc(var(--random-x, 0) * 0.5px)) scale(1.2) rotate(-8deg);
  }
  50% {
    opacity: 1;
    transform: translateY(-60px) translateX(calc(var(--random-x, 0) * 1px)) scale(1.4) rotate(8deg);
  }
  75% {
    opacity: 0.8;
    transform: translateY(-90px) translateX(calc(var(--random-x, 0) * 1.3px)) scale(1.6) rotate(-5deg);
  }
  100% {
    opacity: 0;
    transform: translateY(-120px) translateX(calc(var(--random-x, 0) * 1.5px)) scale(1.8) rotate(0deg);
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-button {
  background: white;
  border: 2px solid var(--border-color);
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-button:hover:not(:disabled) {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

@media (max-width: 968px) {
  .contact-wrapper {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .review-item {
    padding: 1.25rem 1.5rem;
  }
  
  .review-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .contact-form-container {
    padding: 1.5rem;
  }
  
  .form-title {
    font-size: 1.5rem;
  }
  
  .reviews-title {
    font-size: 1.5rem;
  }
}
</style>
