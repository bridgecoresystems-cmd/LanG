<template>
  <div>
    <section class="section">
      <div class="container">
        <h1 class="section-title">{{ $t('navbar.contact') }}</h1>
        <div class="contact-wrapper">
          <div class="contact-form-container">
            <h2 class="form-title">{{ $t('contact.formTitle') }}</h2>
            <form class="contact-form" @submit.prevent="submitForm">
              <div class="form-group">
                <label for="name" class="form-label">{{ $t('contact.name') }} *</label>
                <input id="name" v-model="form.name" type="text" required class="form-input" />
              </div>
              <div class="form-group">
                <label for="phone" class="form-label">{{ $t('contact.phone') }} *</label>
                <input id="phone" v-model="form.phone" type="tel" required class="form-input" />
              </div>
              <div class="form-group">
                <label for="email" class="form-label">{{ $t('contact.email') }} *</label>
                <input id="email" v-model="form.email" type="email" required class="form-input" />
              </div>
              <div class="form-group">
                <label for="message" class="form-label">{{ $t('contact.message') }} *</label>
                <textarea id="message" v-model="form.message" rows="6" required class="form-textarea" />
              </div>
              <button type="submit" class="submit-button" :disabled="loading">
                {{ loading ? '...' : $t('contact.submit') }}
              </button>
              <div v-if="submitSuccess" class="success-message">{{ $t('contact.successMessage') }}</div>
              <div v-if="submitError" class="error-message">{{ submitError }}</div>
            </form>
          </div>
          <div class="contact-info">
            <h3>{{ $t('footer.contact') }}</h3>
            <ul class="contact-list">
              <li><i class="pi pi-map-marker" /> {{ $t('footer.address') }}</li>
              <li><i class="pi pi-phone" /> +993 12 34 56 78</li>
              <li><i class="pi pi-envelope" /> info@langschool.tm</li>
            </ul>
          </div>
        </div>

        <!-- Approved Messages / Reviews -->
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
                    type="button"
                    class="like-button"
                    @click="likeMessage(message)"
                  >
                    <i class="pi pi-heart" />
                    <span class="like-count">{{ message.likes || 0 }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="pagination">
            <button
              class="pagination-button"
              :disabled="pagination.currentPage === 1"
              @click="loadPage(pagination.currentPage - 1)"
            >
              <i class="pi pi-chevron-left" />
            </button>
            <span class="pagination-info">
              {{ $t('contact.page') }} {{ pagination.currentPage }} {{ $t('contact.of') }} {{ pagination.totalPages }}
            </span>
            <button
              class="pagination-button"
              :disabled="pagination.currentPage === pagination.totalPages"
              @click="loadPage(pagination.currentPage + 1)"
            >
              <i class="pi pi-chevron-right" />
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string

const form = reactive({ name: '', phone: '', email: '', message: '' })
const loading = ref(false)
const submitSuccess = ref(false)
const submitError = ref<string | null>(null)

const messages = ref<Array<{ id: number; name: string; message: string; likes: number; created_at: string }>>([])
const pagination = reactive({
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const fetchMessages = async (page = 1) => {
  try {
    const res = await $fetch<{ results: any[]; count: number }>(`${apiBase}/landing/contact-messages`, {
      query: { page: String(page), page_size: String(pagination.pageSize) },
    })
    messages.value = res.results || []
    pagination.totalPages = Math.ceil((res.count || 0) / pagination.pageSize) || 1
    pagination.currentPage = page
  } catch (_) {
    messages.value = []
  }
}

const loadPage = (page: number) => {
  if (page >= 1 && page <= pagination.totalPages) {
    fetchMessages(page)
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }
}

const likeMessage = async (message: any) => {
  try {
    const res = await $fetch<any>(`${apiBase}/landing/contact-messages/${message.id}/like`, { method: 'POST' })
    if (res?.likes !== undefined) message.likes = res.likes
  } catch (_) {}
}

const submitForm = async () => {
  loading.value = true
  submitError.value = null
  submitSuccess.value = false
  try {
    await $fetch(`${apiBase}/landing/contact-messages`, { method: 'POST', body: form })
    submitSuccess.value = true
    form.name = form.phone = form.email = form.message = ''
    setTimeout(() => { submitSuccess.value = false }, 5000)
  } catch (err: any) {
    submitError.value = err.data?.message || 'Error'
  } finally {
    loading.value = false
  }
}

// WebSocket: when admin approves, refresh messages in real-time
const { connect: connectWs, disconnect: disconnectWs } = useContactWs('public', (data) => {
  if (data.type === 'message_approved') {
    fetchMessages(pagination.currentPage)
  }
})

onMounted(() => {
  fetchMessages()
  connectWs()
})

onUnmounted(() => {
  disconnectWs()
})
</script>

<style scoped>
.contact-wrapper {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
  margin-bottom: 4rem;
  align-items: start;
}

.contact-form-container {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.form-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
  margin-bottom: 0.4rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
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

.submit-button {
  background: var(--primary-color);
  color: white;
  padding: 14px 28px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-top: 0.5rem;
}

.submit-button:hover:not(:disabled) {
  background: var(--secondary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.25);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message,
.error-message {
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 1rem;
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
  background: linear-gradient(180deg, #f8f9fa 0%, #f0f2f5 100%);
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid var(--border-color);
}

.contact-info h3 {
  margin-bottom: 1.25rem;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  color: var(--text-primary);
}

.contact-list i {
  color: var(--primary-color);
  font-size: 1.25rem;
  flex-shrink: 0;
}

.reviews-section {
  margin-top: 4rem;
  padding-top: 3rem;
  border-top: 2px solid var(--border-color);
}

.reviews-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.reviews-block {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-item {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
}

.review-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.review-author {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.review-date {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.review-message {
  margin: 0.5rem 0;
  line-height: 1.6;
  color: var(--text-primary);
}

.review-footer {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.like-button {
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #888;
  font-size: 0.9rem;
  padding: 0.25rem 0;
  transition: color 0.2s ease;
}

.like-button:hover {
  color: #e91e63;
}

.like-count {
  font-weight: 600;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.pagination-button {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: white;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(0, 102, 204, 0.05);
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
  }
  .contact-form-container {
    padding: 1.5rem;
  }
  .reviews-section {
    margin-top: 3rem;
    padding-top: 2rem;
  }
}
</style>
