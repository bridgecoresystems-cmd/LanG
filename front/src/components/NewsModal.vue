<template>
  <transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <button class="modal-close" @click="close" aria-label="Close">
          <i class="pi pi-times"></i>
        </button>
        
        <div class="modal-image-wrapper" v-if="news?.image">
          <img :src="news.image" :alt="news?.title" class="modal-image" />
        </div>
        
        <div class="modal-content">
          <h2 class="modal-title">{{ news?.title }}</h2>
          
          <div class="modal-meta">
            <span class="modal-date">
              <i class="pi pi-calendar"></i>
              {{ formatDate(news?.created_at) }}
            </span>
            <span class="modal-views">
              <i class="pi pi-eye"></i>
              {{ formatViews(viewsCount || news?.views || 0) }}
            </span>
          </div>
          
          <div class="modal-text">
            {{ news?.content }}
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted, ref } from 'vue'
import type { News } from '@/types/news'
import dayjs from 'dayjs'
import axios from 'axios'

interface Props {
  isOpen: boolean
  news: News | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const viewsCount = ref(0)

const close = () => {
  emit('close')
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return dayjs(dateString).format('DD MMMM YYYY')
}

const formatViews = (views: number) => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M+`
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k+`
  }
  return `${views}+`
}

// Увеличиваем счетчик просмотров при открытии модального окна
const incrementViews = async () => {
  if (!props.news?.id) return
  
  try {
    const response = await axios.post(
      `http://localhost:8000/api/v1/landing/news/${props.news.id}/increment_views/`
    )
    viewsCount.value = response.data.views
  } catch (error) {
    console.error('Error incrementing views:', error)
    // Используем текущее значение из пропса, если запрос не удался
    viewsCount.value = props.news?.views || 0
  }
}

// Отслеживаем открытие модального окна
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.news) {
    viewsCount.value = props.news.views || 0
    // Увеличиваем просмотры при открытии
    incrementViews()
  }
})

// Инициализируем счетчик при монтировании
watch(() => props.news, (news) => {
  if (news) {
    viewsCount.value = news.views || 0
  }
}, { immediate: true })

// Закрытие по Escape
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

// Блокировка прокрутки body при открытом модальном окне
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  overflow-y: auto;
}

.modal-container {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10001;
  transition: all 0.3s ease;
  color: var(--text-primary);
  font-size: 1.2rem;
}

.modal-close:hover {
  background: var(--primary-color);
  color: white;
  transform: rotate(90deg);
}

.modal-image-wrapper {
  width: 100%;
  height: 300px;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.modal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-content {
  padding: 2rem;
}

.modal-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-primary);
  line-height: 1.3;
}

.modal-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-date,
.modal-views {
  color: var(--text-secondary);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.modal-views i {
  color: var(--primary-color);
}

.modal-text {
  color: var(--text-primary);
  line-height: 1.8;
  font-size: 1.1rem;
  white-space: pre-wrap;
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    margin: 10px;
    max-height: 95vh;
  }
  
  .modal-image-wrapper {
    height: 200px;
  }
  
  .modal-content {
    padding: 1.5rem;
  }
  
  .modal-title {
    font-size: 1.5rem;
  }
  
  .modal-text {
    font-size: 1rem;
  }
}
</style>

