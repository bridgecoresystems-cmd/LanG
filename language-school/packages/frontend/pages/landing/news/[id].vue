<template>
  <div class="news-detail-page">
    <div class="container py-12">
      <div class="news-grid">
        <!-- Main Content -->
        <div class="main-content">
          <div v-if="loading" class="loading-container">
            <i class="pi pi-spin pi-spinner"></i>
            <p>{{ $t('common.loading') }}</p>
          </div>
          
          <div v-else-if="currentNews" class="news-article">
            <nav class="breadcrumb">
              <NuxtLink to="/landing" class="breadcrumb-link">{{ $t('common.home') }}</NuxtLink>
              <span class="breadcrumb-separator">/</span>
              <span class="breadcrumb-current">{{ currentNews.title }}</span>
            </nav>

            <h1 class="article-title">
              {{ currentNews.title }}
            </h1>

            <div class="article-meta">
              <div class="meta-item">
                <i class="pi pi-calendar"></i>
                <span>{{ formatDate(currentNews.created_at) }}</span>
              </div>
              <div class="meta-item">
                <i class="pi pi-eye"></i>
                <span>{{ formatViews(viewsCount || currentNews.views) }}</span>
              </div>
            </div>

            <div v-if="currentNews.image" class="article-image-container">
              <img :src="currentNews.image" :alt="currentNews.title" class="article-image" />
            </div>

            <div class="article-content">
              {{ currentNews.content }}
            </div>

            <div class="article-footer">
              <NuxtLink to="/landing" class="back-link">
                <i class="pi pi-arrow-left"></i>
                {{ $t('common.back') }}
              </NuxtLink>
            </div>
          </div>

          <div v-else class="not-found">
            <p>{{ $t('news.notFound') }}</p>
            <NuxtLink to="/landing" class="btn btn-primary">{{ $t('news.backToHome') }}</NuxtLink>
          </div>
        </div>

        <!-- Sidebar: Other News -->
        <div class="sidebar">
          <div class="sticky-sidebar">
            <h3 class="sidebar-title">
              <span class="title-indicator"></span>
              {{ $t('news.otherNews') }}
            </h3>
            
            <div class="other-news-list">
              <div v-for="item in otherNews" :key="item.id" class="other-news-item">
                <NuxtLink :to="`/landing/news/${item.id}`" class="other-news-link">
                  <div class="other-news-date">
                    {{ formatDate(item.created_at) }}
                  </div>
                  <h4 class="other-news-heading">
                    {{ item.title }}
                  </h4>
                  <div class="other-news-meta">
                    <i class="pi pi-eye"></i>
                    {{ formatViews(item.views) }}
                  </div>
                </NuxtLink>
              </div>
            </div>

            <div class="subscribe-card">
              <h4 class="subscribe-title">{{ $t('news.subscribeTitle') }}</h4>
              <p class="subscribe-text">{{ $t('news.subscribeText') }}</p>
              <form class="subscribe-form" @submit.prevent="handleSubscribe">
                <input 
                  v-model="subscribeEmail"
                  type="email" 
                  :placeholder="$t('news.subscribePlaceholder')" 
                  class="subscribe-input"
                  required
                  :disabled="submitting"
                />
                <button type="submit" class="subscribe-button" :disabled="submitting">
                  <i v-if="submitting" class="pi pi-spin pi-spinner"></i>
                  <i v-else class="pi pi-send"></i>
                </button>
              </form>
              <p v-if="subscribeStatus === 'success'" class="subscribe-msg success">
                {{ $t('news.subscribeSuccess') }}
              </p>
              <p v-if="subscribeStatus === 'error'" class="subscribe-msg error">
                {{ $t('news.subscribeError') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { News } from '~/types/news'

const route = useRoute()
const { locale } = useI18n()
const newsId = computed(() => Number(route.params.id))
const { news, loading, fetchNews, incrementViews, subscribeToNews } = useNews()
const viewsCount = ref(0)

// Subscription state
const subscribeEmail = ref('')
const submitting = ref(false)
const subscribeStatus = ref<'idle' | 'success' | 'error'>('idle')

const currentNews = computed(() => news.value.find(n => n.id === newsId.value))
const otherNews = computed(() => news.value.filter(n => n.id !== newsId.value).slice(0, 5))

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return dayjs(dateString).format('DD MMMM YYYY')
}

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M+`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k+`
  return `${views}+`
}

const handleSubscribe = async () => {
  if (!subscribeEmail.value) return
  submitting.value = true
  subscribeStatus.value = 'idle'
  try {
    await subscribeToNews(subscribeEmail.value)
    subscribeStatus.value = 'success'
    subscribeEmail.value = ''
  } catch (e) {
    subscribeStatus.value = 'error'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (news.value.length === 0) {
    await fetchNews()
  }
  
  if (currentNews.value) {
    viewsCount.value = currentNews.value.views
    try {
      const data = await incrementViews(currentNews.value.id)
      if ((data as any)?.views !== undefined) {
        viewsCount.value = (data as any).views
      }
    } catch (e) {
      console.error('Failed to increment views', e)
    }
  }
})

watch(newsId, async (newId) => {
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  if (currentNews.value) {
    viewsCount.value = currentNews.value.views
    try {
      const data = await incrementViews(currentNews.value.id)
      if ((data as any)?.views !== undefined) {
        viewsCount.value = (data as any).views
      }
    } catch (e) {
      console.error('Failed to increment views', e)
    }
  }
})

watch(locale, () => {
  fetchNews()
})

useHead({
  title: computed(() => currentNews.value ? `${currentNews.value.title} | LanG Academy` : 'LanG Academy'),
  meta: [
    { name: 'description', content: computed(() => currentNews.value?.preview || '') }
  ]
})
</script>

<style scoped>
.news-detail-page {
  background-color: #ffffff;
  min-height: 100vh;
}

.py-12 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.news-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
}

@media (min-width: 1024px) {
  .news-grid {
    grid-template-columns: 2fr 1fr;
  }
}

/* Main Content Styles */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 0;
}

.loading-container i {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.news-article {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.breadcrumb {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.breadcrumb-link {
  color: var(--primary-color);
  text-decoration: none;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
  color: #9ca3af;
}

.breadcrumb-current {
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.article-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  color: #6b7280;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-item i {
  color: var(--primary-color);
}

.article-image-container {
  margin-bottom: 2.5rem;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.article-image {
  width: 100%;
  height: auto;
  display: block;
  max-height: 500px;
  object-fit: cover;
}

.article-content {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #374151;
  white-space: pre-wrap;
}

.article-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #f3f4f6;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--primary-color);
  border-radius: 0.75rem;
}

.back-link:hover {
  background-color: var(--primary-color);
  color: white;
}

/* Sidebar Styles */
.sticky-sidebar {
  position: sticky;
  top: 6rem;
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-indicator {
  width: 4px;
  height: 1.5rem;
  background-color: var(--primary-color);
  border-radius: 9999px;
}

.other-news-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.other-news-item {
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 1.5rem;
}

.other-news-item:last-child {
  border-bottom: none;
}

.other-news-link {
  text-decoration: none;
  display: block;
}

.other-news-date {
  font-size: 0.875rem;
  color: var(--primary-color);
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.other-news-heading {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  transition: color 0.2s;
}

.other-news-link:hover .other-news-heading {
  color: var(--primary-color);
}

.other-news-meta {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.subscribe-card {
  margin-top: 2.5rem;
  padding: 1.5rem;
  background-color: rgba(0, 102, 204, 0.05);
  border-radius: 1rem;
  border: 1px solid rgba(0, 102, 204, 0.1);
}

.subscribe-title {
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.subscribe-text {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 1rem;
}

.subscribe-form {
  display: flex;
  gap: 0.5rem;
}

.subscribe-input {
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  font-size: 0.875rem;
  outline: none;
}

.subscribe-input:focus {
  border-color: var(--primary-color);
}

.subscribe-button {
  background-color: var(--primary-color);
  color: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.subscribe-button:hover:not(:disabled) {
  background-color: var(--secondary-color);
}

.subscribe-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.subscribe-msg {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.subscribe-msg.success {
  color: #18a058;
}

.subscribe-msg.error {
  color: #d03050;
}

.not-found {
  text-align: center;
  padding: 5rem 0;
}

.not-found p {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}
</style>
