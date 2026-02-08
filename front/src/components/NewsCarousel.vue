<template>
  <div class="news-carousel-wrapper">
    <swiper
      ref="swiperRef"
      :modules="modules"
      :slides-per-view="1"
      :space-between="30"
      :loop="true"
      :autoplay="isModalOpen ? false : autoplayOptions"
      :pagination="{
        clickable: true,
        dynamicBullets: true
      }"
      :navigation="true"
      :breakpoints="breakpoints"
      class="news-carousel"
      @swiper="onSwiper"
    >
      <swiper-slide v-for="item in news" :key="item.id">
        <NewsCard :news="item" @open-modal="handleOpenModal" />
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import type { Swiper as SwiperType } from 'swiper'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import NewsCard from './NewsCard.vue'
import type { News } from '@/types/news'

interface Props {
  news: News[]
}

defineProps<Props>()

const emit = defineEmits<{
  openModal: [news: News]
}>()

const swiperRef = ref<SwiperType | null>(null)
const isModalOpen = ref(false)

// Автопрокрутка запускается сразу
const autoplayOptions = {
  delay: 5000,
  disableOnInteraction: false,
  pauseOnMouseEnter: true,
  stopOnLastSlide: false
}

// Callback когда Swiper инициализирован
const onSwiper = (swiper: SwiperType) => {
  swiperRef.value = swiper
}

const handleOpenModal = (news: News) => {
  isModalOpen.value = true
  emit('openModal', news)
}

// Функция для возобновления автопрокрутки (будет вызвана из родителя)
const resumeAutoplay = () => {
  isModalOpen.value = false
}

defineExpose({
  resumeAutoplay
})

const modules = [Autoplay, Pagination, Navigation]

const breakpoints = {
  640: {
    slidesPerView: 1,
    spaceBetween: 20
  },
  768: {
    slidesPerView: 2,
    spaceBetween: 30
  },
  1024: {
    slidesPerView: 3,
    spaceBetween: 30
  },
  1400: {
    slidesPerView: 3,
    spaceBetween: 40
  }
}
</script>

<style scoped>
.news-carousel-wrapper {
  width: 100%;
  padding: 20px 0;
  position: relative;
}

.news-carousel {
  width: 100%;
  padding-bottom: 50px;
}

:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: var(--primary-color);
  background: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

:deep(.swiper-button-next:hover),
:deep(.swiper-button-prev:hover) {
  background: var(--primary-color);
  color: white;
  transform: scale(1.1);
}

:deep(.swiper-button-next::after),
:deep(.swiper-button-prev::after) {
  font-size: 18px;
  font-weight: bold;
}

:deep(.swiper-pagination-bullet) {
  background: var(--primary-color);
  opacity: 0.5;
  width: 12px;
  height: 12px;
  transition: all 0.3s ease;
}

:deep(.swiper-pagination-bullet-active) {
  opacity: 1;
  width: 24px;
  border-radius: 6px;
}

@media (max-width: 768px) {
  :deep(.swiper-button-next),
  :deep(.swiper-button-prev) {
    display: none;
  }
  
  .news-carousel {
    padding-bottom: 40px;
  }
}
</style>

