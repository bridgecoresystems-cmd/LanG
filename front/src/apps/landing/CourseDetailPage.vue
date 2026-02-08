<template>
  <MainLayout>
    <section class="section">
      <div class="container">
        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>

        <div v-else-if="course" class="course-detail">
          <div class="course-header">
            <div v-if="course.image" class="course-header-image-wrapper">
              <img :src="course.image" :alt="course.title" class="course-header-image" />
            </div>
            <div class="course-header-content">
              <div class="course-breadcrumb">
                <span>{{ course.category_name }}</span>
                <i class="pi pi-angle-right"></i>
                <span>{{ course.subcategory_name }}</span>
              </div>
              <h1 class="course-title">{{ course.title }}</h1>
            </div>
            <button @click="$router.back()" class="back-button">
              <i class="pi pi-arrow-left"></i>
              {{ $t('common.back') }}
            </button>
          </div>

          <div class="course-info-grid">
            <div class="course-description-card">
              <h2>{{ $t('courses.description') }}</h2>
              <p class="course-description">{{ course.description }}</p>
            </div>

            <div class="course-details-card">
              <h2>{{ $t('courses.details') }}</h2>
              <div class="detail-item">
                <i class="pi pi-calendar"></i>
                <div>
                  <span class="detail-label">{{ $t('courses.duration') }}:</span>
                  <span class="detail-value">{{ course.duration_weeks }} {{ $t('courses.weeks') }}</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="pi pi-clock"></i>
                <div>
                  <span class="detail-label">{{ $t('courses.hoursPerWeek') }}:</span>
                  <span class="detail-value">{{ course.hours_per_week }} {{ $t('courses.hours') }}</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="pi pi-money-bill"></i>
                <div>
                  <span class="detail-label">{{ $t('courses.price') }}:</span>
                  <div class="price-container">
                    <span v-if="course.discount_price" class="original-price">
                      {{ course.price }} 💎
                    </span>
                    <span class="detail-value price" :class="{ 'discount-price': course.discount_price }">
                      {{ course.discount_price || course.price }} 💎
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/MainLayout.vue'
import { useCourses } from '@/composables/useCourses'

const route = useRoute()
const { locale } = useI18n()
const { course, loading, error, fetchCourse } = useCourses()

onMounted(async () => {
  const courseId = parseInt(route.params.id as string)
  if (courseId) {
    await fetchCourse(courseId)
  }
})

watch(locale, async () => {
  const courseId = parseInt(route.params.id as string)
  if (courseId) {
    await fetchCourse(courseId)
  }
})
</script>

<style scoped>
.section {
  padding: 3rem 0;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background: white;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  align-self: flex-start;
  height: fit-content;
  margin-left: auto;
}

.back-button:hover {
  background: var(--bg-secondary);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateX(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.course-detail {
  max-width: 1000px;
  margin: 0 auto;
}

.course-header {
  margin-bottom: 3rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 102, 204, 0.1);
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  position: relative;
}

.course-header-image-wrapper {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
}

.course-header-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-header-content {
  flex: 1;
}

.course-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.course-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.course-info-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.course-description-card,
.course-details-card {
  padding: 2.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 102, 204, 0.1);
}

.course-description-card h2,
.course-details-card h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.course-description {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-secondary);
  margin: 0;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.detail-label {
  display: block;
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.detail-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-value.price {
  color: var(--primary-color);
  font-size: 1.5rem;
}

.price-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.original-price {
  text-decoration: line-through;
  color: var(--text-secondary);
  font-size: 1.2rem;
  opacity: 0.7;
}

.detail-value.price.discount-price {
  color: var(--primary-color);
  font-weight: 700;
}

@media (max-width: 768px) {
  .course-header {
    flex-direction: column;
    align-items: center;
  }

  .back-button {
    align-self: flex-end;
    margin-left: 0;
    margin-top: 0.5rem;
  }

  .course-header-image-wrapper {
    width: 150px;
    height: 150px;
  }

  .course-info-grid {
    grid-template-columns: 1fr;
  }

  .course-title {
    font-size: 2rem;
  }
}
</style>

