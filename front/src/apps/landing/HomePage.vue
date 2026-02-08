<template>
  <MainLayout>
    <!-- Hero Section -->
    <section class="hero-section" :style="{ backgroundImage: `url(${heroBackground})` }">
      <div class="hero-overlay"></div>
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">{{ $t('homepage.hero.title') }}</h1>
          <p class="hero-subtitle">{{ $t('homepage.hero.subtitle') }}</p>
          <router-link to="/courses" class="btn btn-primary hero-cta">
            {{ $t('homepage.hero.cta') }}
          </router-link>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="section about-section">
      <div class="container">
        <h2 class="section-title">{{ $t('homepage.about.title') }}</h2>
        <p class="about-description">{{ $t('homepage.about.description') }}</p>
      </div>
    </section>

    <!-- Courses Section -->
    <section class="section courses-section">
      <div class="container">
        <h2 class="section-title">{{ $t('homepage.courses.title') }}</h2>
        <p class="section-subtitle">{{ $t('homepage.courses.subtitle') }}</p>
        
        <div v-if="categoriesLoading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>
        
        <div v-else-if="categories.length === 0" class="empty-state">
          <p>{{ $t('courses.noCategories') }}</p>
        </div>
        
        <div v-else class="courses-grid">
          <CourseCategoryCard
            v-for="category in categories.slice(0, 3)"
            :key="category.id"
            :category="category"
          />
        </div>
      </div>
    </section>

    <!-- News Section -->
    <section class="section news-section">
      <div class="container">
        <h2 class="section-title">{{ $t('news.title') }}</h2>
        <p class="section-subtitle">{{ $t('news.subtitle') }}</p>
        
        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
          <p>Loading news...</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>
        
        <div v-else-if="news.length === 0" class="empty-state">
          <p>{{ $t('news.noNews') }}</p>
        </div>
        
        <div v-else-if="news.length > 0">
          <NewsCarousel 
            ref="carouselRef"
            :news="news" 
            @open-modal="openNewsModal"
          />
          <NewsModal 
            :is-open="isModalOpen"
            :news="selectedNews"
            @close="closeNewsModal"
          />
        </div>
        
        <!-- Статичная сетка как fallback (опционально) -->
        <!-- 
        <div v-else class="news-grid">
          <NewsCard 
            v-for="item in news" 
            :key="item.id" 
            :news="item"
          />
        </div>
        -->
      </div>
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/MainLayout.vue'
import NewsCard from '@/components/NewsCard.vue'
import NewsCarousel from '@/components/NewsCarousel.vue'
import NewsModal from '@/components/NewsModal.vue'
import CourseCategoryCard from '@/components/CourseCategoryCard.vue'
import { useNews } from '@/composables/useNews'
import { useCourses } from '@/composables/useCourses'
import type { News } from '@/types/news'

// Импорт локальных изображений
import heroRuMoscow from '@/assets/images/hero-ru-moscow.jpg'
import heroEnLondon from '@/assets/images/hero-en-london.jpg'
import heroTmAshgabat from '@/assets/images/hero-tm-ashgabat.jpg'

const router = useRouter()
const { locale } = useI18n()
const { news, loading, error, fetchNews } = useNews()
const { categories, courses, loading: categoriesLoading, fetchCategories, fetchCourses } = useCourses()

// Фоновые изображения для разных языков
const heroBackground = computed(() => {
  const backgrounds: Record<string, string> = {
    ru: heroRuMoscow, // Москва, Кремль
    en: heroEnLondon, // Лондон
    tm: heroTmAshgabat // Ашхабад
  }
  return backgrounds[locale.value] || backgrounds.ru
})


const isModalOpen = ref(false)
const selectedNews = ref<News | null>(null)
const carouselRef = ref<InstanceType<typeof NewsCarousel> | null>(null)

const openNewsModal = (newsItem: News) => {
  selectedNews.value = newsItem
  isModalOpen.value = true
}

const closeNewsModal = () => {
  isModalOpen.value = false
  selectedNews.value = null
  // Возобновляем автопрокрутку карусели
  if (carouselRef.value) {
    carouselRef.value.resumeAutoplay()
  }
}

// Загружаем новости и категории при монтировании
onMounted(async () => {
  fetchNews()
  fetchCategories()
  fetchCourses()
})

// Перезагружаем новости и категории при смене языка
watch(locale, () => {
  fetchNews()
  fetchCategories()
})
</script>

<style scoped>
.hero-section {
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: white;
  padding: 120px 0;
  text-align: center;
  min-height: 500px;
  display: flex;
  align-items: center;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 100%);
  z-index: 1;
}

.hero-section .container {
  position: relative;
  z-index: 2;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-cta {
  font-size: 1.2rem;
  padding: 15px 40px;
}

.about-section {
  background-color: var(--bg-secondary);
}

.about-description {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.8;
}

.courses-section {
  background-color: var(--bg-primary);
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
  max-width: 100%;
}

@media (min-width: 768px) {
  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 2rem;
  }
}

@media (min-width: 1024px) {
  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

.news-section {
  background-color: var(--bg-secondary);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 400px));
  gap: 2rem;
  margin-top: 3rem;
  justify-content: center;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}


@media (max-width: 768px) {
  .hero-section {
    padding: 80px 0;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

}
</style>

