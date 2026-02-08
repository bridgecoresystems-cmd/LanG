<template>
  <div>
    <section class="hero-section" :style="{ backgroundImage: `url(${heroBackground})` }">
      <div class="hero-overlay" />
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">{{ $t('homepage.hero.title') }}</h1>
          <p class="hero-subtitle">{{ $t('homepage.hero.subtitle') }}</p>
          <NuxtLink to="/landing/courses" class="btn btn-primary hero-cta">
            {{ $t('homepage.hero.cta') }}
          </NuxtLink>
        </div>
      </div>
    </section>
    <section class="section about-section">
      <div class="container">
        <h2 class="section-title">{{ $t('homepage.about.title') }}</h2>
        <p class="about-description">{{ $t('homepage.about.description') }}</p>
      </div>
    </section>
    <section class="section courses-section">
      <div class="container">
        <h2 class="section-title">{{ $t('homepage.courses.title') }}</h2>
        <p class="section-subtitle">{{ $t('homepage.courses.subtitle') }}</p>
        <div v-if="categoriesLoading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem" />
        </div>
        <div v-else-if="categories.length === 0" class="empty-state">
          <p>{{ $t('courses.noCategories') }}</p>
        </div>
        <div v-else class="courses-grid">
          <CourseCategoryCard v-for="cat in categories.slice(0, 3)" :key="cat.id" :category="cat" />
        </div>
      </div>
    </section>
    <section class="section news-section">
      <div class="container">
        <h2 class="section-title">{{ $t('news.title') }}</h2>
        <p class="section-subtitle">{{ $t('news.subtitle') }}</p>
        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem" />
          <p>{{ $t('common.loading') }}</p>
        </div>
        <div v-else-if="error" class="error-state"><p>{{ error }}</p></div>
        <div v-else-if="news.length === 0" class="empty-state">
          <p>{{ $t('news.noNews') }}</p>
        </div>
        <div v-else>
          <NewsCarousel ref="carouselRef" :news="news" @open-modal="openNewsModal" />
          <NewsModal :is-open="isModalOpen" :news="selectedNews" @close="closeNewsModal" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { News } from '~/types/news'

const { locale } = useI18n()
const { news, loading, error, fetchNews } = useNews()
const { categories, loading: categoriesLoading, fetchCategories, fetchCourses } = useCourses()

const heroBackground = computed(() => {
  const map: Record<string, string> = { ru: '/hero-ru-moscow.jpg', en: '/hero-en-london.jpg', tm: '/hero-tm-ashgabat.jpg' }
  return map[locale.value] || map.ru
})

const isModalOpen = ref(false)
const selectedNews = ref<News | null>(null)
const carouselRef = ref<any>(null)

const openNewsModal = (item: News) => {
  selectedNews.value = item
  isModalOpen.value = true
}

const closeNewsModal = () => {
  isModalOpen.value = false
  selectedNews.value = null
  carouselRef.value?.resumeAutoplay?.()
}

onMounted(async () => {
  await Promise.all([fetchNews(), fetchCategories(), fetchCourses()])
})

watch(locale, () => {
  fetchNews()
  fetchCategories()
})
</script>

<style scoped>
.hero-section { position: relative; background-size: cover; background-position: center; color: white; padding: 120px 0; text-align: center; min-height: 500px; display: flex; align-items: center; }
.hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3)); z-index: 1; }
.hero-section .container { position: relative; z-index: 2; }
.hero-content { max-width: 800px; margin: 0 auto; }
.hero-title { font-size: 3.5rem; font-weight: 700; margin-bottom: 1.5rem; }
.hero-subtitle { font-size: 1.5rem; margin-bottom: 2rem; opacity: 0.9; }
.hero-cta { font-size: 1.2rem; padding: 15px 40px; }
.about-section { background: var(--bg-secondary); }
.about-description { max-width: 800px; margin: 0 auto; text-align: center; font-size: 1.1rem; color: var(--text-secondary); line-height: 1.8; }
.courses-section { background: var(--bg-primary); }
.courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
.news-section { background: var(--bg-secondary); }
.loading-state, .error-state, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
@media (min-width: 768px) { .courses-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 2rem; } }
@media (min-width: 1024px) { .courses-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); } }
@media (max-width: 768px) { .hero-section { padding: 80px 0; } .hero-title { font-size: 2.5rem; } .hero-subtitle { font-size: 1.2rem; } }
</style>
