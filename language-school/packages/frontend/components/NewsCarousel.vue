<template>
  <div class="news-carousel-wrapper">
    <Swiper
      :modules="[Autoplay, Pagination, Navigation]"
      :slides-per-view="1"
      :space-between="30"
      :loop="true"
      :autoplay="isModalOpen ? false : autoplayOptions"
      :pagination="{ clickable: true, dynamicBullets: true }"
      :navigation="true"
      :breakpoints="breakpoints"
      class="news-carousel"
    >
      <SwiperSlide v-for="item in news" :key="item.id">
        <NewsCard :news="item" @open-modal="handleOpenModal" />
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
const emit = defineEmits<{ openModal: [news: News] }>()

const isModalOpen = ref(false)

const autoplayOptions = {
  delay: 5000,
  disableOnInteraction: false,
  pauseOnMouseEnter: true,
}

const handleOpenModal = (news: News) => {
  isModalOpen.value = true
  emit('openModal', news)
}

defineExpose({
  resumeAutoplay: () => {
    isModalOpen.value = false
  },
})

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
  color: var(--primary-color);
  background: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

:deep(.swiper-pagination-bullet) {
  background: var(--primary-color);
  opacity: 0.5;
}

:deep(.swiper-pagination-bullet-active) {
  opacity: 1;
}
</style>
