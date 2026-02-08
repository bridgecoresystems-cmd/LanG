<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <button class="modal-close" aria-label="Close" @click="close">
          <i class="pi pi-times"></i>
        </button>

        <div v-if="news?.image" class="modal-image-wrapper">
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
  </Transition>
</template>

<script setup lang="ts">
import type { News } from '~/types/news'
import dayjs from 'dayjs'

const props = defineProps<{ isOpen: boolean; news: News | null }>()
const emit = defineEmits<{ close: [] }>()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string

const viewsCount = ref(0)

const close = () => {
  emit('close')
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return dayjs(dateString).format('DD MMMM YYYY')
}

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M+`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k+`
  return `${views}+`
}

const incrementViews = async () => {
  if (!props.news?.id) return
  try {
    const data = (await $fetch<{ views: number }>(
      `${apiBase}/landing/news/${props.news!.id}/increment_views/`,
      { method: 'POST' }
    )) as { views: number }
    viewsCount.value = data.views
  } catch {
    viewsCount.value = props.news?.views || 0
  }
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.news) {
      viewsCount.value = props.news.views || 0
      incrementViews()
    }
  }
)

watch(
  () => props.news,
  (news) => {
    if (news) viewsCount.value = news.views || 0
  },
  { immediate: true }
)

watch(
  () => props.isOpen,
  (isOpen) => {
    if (import.meta.client) {
      document.body.style.overflow = isOpen ? 'hidden' : ''
    }
  }
)

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) close()
}

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('keydown', handleEscape)
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
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
}

.modal-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-text {
  line-height: 1.8;
  font-size: 1.1rem;
  white-space: pre-wrap;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
