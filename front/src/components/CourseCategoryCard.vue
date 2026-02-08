<template>
  <div class="book-card" @click="handleClick">
    <div class="book-cover">
      <div class="book-spine"></div>
      <div class="book-front">
        <img
          v-if="category.image"
          :src="category.image"
          :alt="category.name"
          class="book-cover-image"
          @error="handleImageError"
        />
        <div v-else class="book-cover-placeholder">
          <span class="book-icon">{{ category.icon || '📚' }}</span>
        </div>
        <div class="book-title-overlay">
          <h3 class="book-title">{{ category.name }}</h3>
        </div>
      </div>
    </div>
    <div class="book-info">
      <p v-if="category.description" class="book-description">
        {{ category.description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { CourseCategory } from '@/types/course'

interface Props {
  category: CourseCategory
}

const props = defineProps<Props>()
const router = useRouter()

const handleClick = () => {
  router.push(`/courses/category/${props.category.id}`)
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}
</script>

<style scoped>
.book-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  perspective: 1000px;
  height: 100%;
  width: 100%;
  max-width: 180px;
  margin: 0 auto;
}

.book-cover {
  position: relative;
  width: 100%;
  height: 240px;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.book-card:hover .book-cover {
  transform: rotateY(-15deg) translateZ(10px);
}

.book-spine {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%);
  transform: rotateY(-90deg) translateX(-3px);
  transform-origin: right center;
  border-radius: 2px 0 0 2px;
}

.book-front {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  border-radius: 4px;
  box-shadow: 
    0 8px 16px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.book-card:hover .book-front {
  box-shadow: 
    0 12px 24px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.book-cover-image {
  width: 100%;
  height: 75%;
  object-fit: cover;
  flex-shrink: 0;
  display: block;
}

.book-cover-placeholder {
  width: 100%;
  height: 75%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  flex-shrink: 0;
}

.book-icon {
  font-size: 2.5rem;
  opacity: 0.6;
}

.book-title-overlay {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0.5rem;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%);
  text-align: center;
}

.book-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-info {
  padding: 0.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
}

.book-description {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .book-title {
    font-size: 0.85rem;
  }
  
  .book-icon {
    font-size: 2rem;
  }
}
</style>
