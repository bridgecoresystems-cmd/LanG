<template>
  <div class="news-carousel-wrapper">
    <Swiper
      :modules="[Autoplay, Pagination, Navigation]"
      :slides-per-view="1"
      :space-between="30"
      :loop="true"
      :autoplay="autoplayOptions"
      :pagination="{ clickable: true, dynamicBullets: true }"
      :navigation="true"
      :breakpoints="breakpoints"
      class="news-carousel"
    >
      <SwiperSlide v-for="item in news" :key="item.id">
        <NewsCard :news="item" />
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import type { News } from '~/types/news'

const props = defineProps<{ news: News[] }>()

const autoplayOptions = {
  delay: 5000,
  disableOnInteraction: false,
  pauseOnMouseEnter: true,
}

const breakpoints = {
  640: { slidesPerView: 1, spaceBetween: 20 },
  768: { slidesPerView: 2, spaceBetween: 30 },
  1024: { slidesPerView: 3, spaceBetween: 30 },
  1400: { slidesPerView: 3, spaceBetween: 40 },
}
</script>

<style scoped>
.news-carousel-wrapper {
  width: 100%;
  padding: 20px 0;
}

.news-carousel {
  width: 100%;
  padding-bottom: 50px;
}

:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: white !important;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color, #004499) 100%) !important;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  box-shadow: 0 6px 20px rgba(0, 102, 204, 0.4);
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

:deep(.swiper-button-next):hover,
:deep(.swiper-button-prev):hover {
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(0, 102, 204, 0.5);
}

:deep(.swiper-button-next::after),
:deep(.swiper-button-prev::after) {
  font-size: 18px;
  font-weight: bold;
}

:deep(.swiper-pagination-bullet) {
  background: var(--primary-color);
  opacity: 0.5;
  width: 10px;
  height: 10px;
  transition: all 0.3s ease;
}

:deep(.swiper-pagination-bullet:hover) {
  opacity: 0.8;
}

:deep(.swiper-pagination-bullet-active) {
  opacity: 1;
  transform: scale(1.2);
}
</style>
