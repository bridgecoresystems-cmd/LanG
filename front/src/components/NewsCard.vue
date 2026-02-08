<template>
  <div class="news-card" :class="{ featured: news.is_featured }">
    <div class="news-image-wrapper">
      <img 
        :src="news.image" 
        :alt="news.title"
        class="news-image"
        @error="handleImageError"
      />
      <div v-if="news.is_featured" class="featured-badge">
        <i class="pi pi-star"></i> Featured
      </div>
    </div>
    
    <div class="news-content">
      <h3 class="news-title">{{ news.title }}</h3>
      <p class="news-preview">
        {{ news.preview }}
      </p>
      <div class="news-footer">
        <span class="news-date">
          <i class="pi pi-calendar"></i>
          {{ formatDate(news.created_at) }}
        </span>
        <button 
          class="btn-read-more" 
          @click.stop="openModal"
          type="button"
        >
          <span>{{ $t('news.readMore') }}</span>
          <i class="pi pi-arrow-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { News } from '@/types/news'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'

interface Props {
  news: News
}

const props = defineProps<Props>()
const { t } = useI18n()

const emit = defineEmits<{
  openModal: [news: News]
}>()

const openModal = () => {
  emit('openModal', props.news)
}

const formatDate = (dateString: string) => {
  return dayjs(dateString).format('DD MMMM YYYY')
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-news.jpg' // Fallback image
}
</script>

<style scoped>
.news-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 100%;
}

.news-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.news-card.featured {
  border: 2px solid var(--primary-color);
}

.news-image-wrapper {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
  flex-shrink: 0;
}

.news-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.3s ease;
}

.news-card:hover .news-image {
  transform: scale(1.05);
}

.featured-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background: var(--primary-color);
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}

.news-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.news-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: calc(1.4em * 3); /* Фиксированная высота для 3 строк */
  word-break: break-word;
}

.news-preview {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1rem;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: calc(1.7em * 3); /* Фиксированная высота для 3 строк */
  word-break: break-word;
}

.news-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.news-date {
  color: var(--text-secondary);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-read-more {
  background: var(--primary-color);
  border: 2px solid var(--primary-color);
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  box-shadow: 0 2px 8px rgba(0, 102, 204, 0.2);
}

.btn-read-more:hover {
  background: var(--secondary-color);
  border-color: var(--secondary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
}

.btn-read-more:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 102, 204, 0.2);
}

.btn-read-more i {
  font-size: 0.9rem;
  transition: transform 0.3s ease;
}

.btn-read-more:hover i {
  transform: translateX(3px);
}

.btn-read-more span {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .news-image-wrapper {
    height: 200px;
  }
  
  .news-title {
    font-size: 1.25rem;
    height: calc(1.4em * 3 * 0.83); /* Пропорционально уменьшаем высоту */
  }
  
  .news-preview {
    height: calc(1.7em * 3 * 0.94); /* Пропорционально уменьшаем высоту */
  }
  
  .news-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .btn-read-more {
    width: 100%;
    justify-content: center;
  }
}

@media (min-width: 1200px) {
  .news-card {
    max-width: 400px;
  }
}
</style>

