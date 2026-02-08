<template>
    <MainLayout>
        <div class="achievements-page">
            <div class="container py-8">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">{{ $t('leaderboard.achievements_title') || 'Наши Достижения' }}</h1>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                    {{ $t('leaderboard.achievements_subtitle') || 'Лучшие ученики по результатам последних экзаменов. Мы гордимся нашими студентами!' }}
                </p>
            </div>

            <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
                <ProgressSpinner />
            </div>

            <div v-else-if="leaderboards.length === 0" class="text-center py-12">
                <i class="pi pi-trophy text-6xl text-gray-300 mb-4"></i>
                <p class="text-xl text-gray-500">{{ $t('leaderboard.no_data') || 'Пока нет активных результатов.' }}</p>
            </div>

            <div v-else>
                <div class="leaderboard-carousel-wrapper">
                    <swiper
                        ref="swiperRef"
                        :modules="modules"
                        slides-per-view="auto"
                        :space-between="30"
                        :loop="leaderboards.length > 1"
                        :autoplay="isModalOpen ? false : autoplayOptions"
                        :pagination="{
                            clickable: true,
                            dynamicBullets: true
                        }"
                        :navigation="true"
                        :breakpoints="breakpoints"
                        class="leaderboard-carousel"
                        @swiper="onSwiper"
                    >
                        <swiper-slide v-for="leaderboard in leaderboards" :key="leaderboard.id">
                            <div class="leaderboard-card-wrapper p-4">
                                <div 
                                    class="leaderboard-card bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer"
                                    @click="openModal(leaderboard)"
                                >
                                    <!-- Card Header -->
                                    <div class="card-header p-6 bg-gradient-to-r from-blue-600 to-indigo-700">
                                        <div class="flex items-center gap-3 mb-2">
                                            <i class="pi pi-star-fill" style="color: #fbbf24;"></i>
                                            <span class="text-xs font-semibold uppercase tracking-wider" style="color: rgba(255, 255, 255, 0.9);">{{ leaderboard.course_name }}</span>
                                        </div>
                                        <h3 class="text-xl font-bold line-clamp-1" style="color: #fef3c7; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">{{ leaderboard.title }}</h3>
                                        <p class="text-sm mt-1" style="color: #fef3c7; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">{{ leaderboard.exam_type_name }}</p>
                                    </div>

                                    <!-- Students List - Table Style -->
                                    <div class="students-list p-4 flex-grow">
                                        <div class="leaderboard-table">
                                            <div 
                                                v-for="(student, idx) in leaderboard.students.slice(0, 5)" 
                                                :key="idx" 
                                                class="table-row"
                                                :class="{
                                                    'row-gold': Number(idx) === 0,
                                                    'row-silver': Number(idx) === 1,
                                                    'row-bronze': Number(idx) === 2,
                                                    'row-even': Number(idx) > 2 && Number(idx) % 2 === 0,
                                                    'row-odd': Number(idx) > 2 && Number(idx) % 2 === 1
                                                }"
                                            >
                                                <!-- Column 1: Rank/Medal -->
                                                <div class="rank-column">
                                                    <div 
                                                        class="rank-badge"
                                                        :class="{
                                                            'rank-gold': Number(idx) === 0,
                                                            'rank-silver': Number(idx) === 1,
                                                            'rank-bronze': Number(idx) === 2,
                                                            'rank-default': Number(idx) > 2
                                                        }"
                                                    >
                                                        <span v-if="Number(idx) === 0" class="medal-icon">🥇</span>
                                                        <span v-else-if="Number(idx) === 1" class="medal-icon">🥈</span>
                                                        <span v-else-if="Number(idx) === 2" class="medal-icon">🥉</span>
                                                        <span v-else class="rank-number">{{ Number(idx) + 1 }}</span>
                                                    </div>
                                                </div>

                                                <!-- Column 2: Student Name with Avatar -->
                                                <div class="name-column">
                                                    <div class="name-row">
                                                        <UserAvatar
                                                            :src="student.student_avatar_url || null"
                                                            :gender="student.student_gender || 'boy'"
                                                            size="40px"
                                                            :round="true"
                                                        />
                                                        <div class="student-info">
                                                            <div class="student-name">{{ student.student_name }}</div>
                                                            <div class="student-group">{{ student.group_name }}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Column 3: Score -->
                                                <div class="score-column">
                                                    <div class="score-value">{{ student.score }}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="leaderboard.students.length > 5" class="text-center mt-4">
                                            <span class="text-sm text-gray-500">
                                                {{ $t('leaderboard.andMore', { count: leaderboard.students.length - 5 }) }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Footer -->
                                    <div class="card-footer p-4 bg-gray-50 border-t border-gray-100 text-center">
                                        <span class="text-xs text-gray-400">{{ $t('leaderboard.clickToView') || 'Нажмите для просмотра' }}</span>
                                    </div>
                                </div>
                            </div>
                        </swiper-slide>
                    </swiper>
                </div>
                
                <LeaderboardModal 
                    :is-open="isModalOpen"
                    :leaderboard="selectedLeaderboard"
                    @close="closeModal"
                />
            </div>
        </div>
    </div>
    </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import type { Swiper as SwiperType } from 'swiper'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import ProgressSpinner from 'primevue/progressspinner'
import MainLayout from '@/components/MainLayout.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import LeaderboardModal from '@/components/LeaderboardModal.vue'
import api from '@/services/api'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const leaderboards = ref<any[]>([])
const loading = ref(true)
const swiperRef = ref<SwiperType | null>(null)
const isModalOpen = ref(false)
const selectedLeaderboard = ref<any | null>(null)

// Автопрокрутка
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

const openModal = (leaderboard: any) => {
    selectedLeaderboard.value = leaderboard
    isModalOpen.value = true
}

const closeModal = () => {
    isModalOpen.value = false
    selectedLeaderboard.value = null
    // Возобновляем автопрокрутку карусели
    if (swiperRef.value && swiperRef.value.autoplay) {
        swiperRef.value.autoplay.start()
    }
}

const modules = [Autoplay, Pagination, Navigation]

// Используем 'auto' для slidesPerView, чтобы карточки могли быть любой ширины
const breakpoints = {
    640: {
        slidesPerView: 'auto' as const,
        spaceBetween: 20
    },
    768: {
        slidesPerView: 'auto' as const,
        spaceBetween: 30
    },
    1024: {
        slidesPerView: 'auto' as const,
        spaceBetween: 30
    },
    1400: {
        slidesPerView: 'auto' as const,
        spaceBetween: 40
    }
}

const loadLeaderboards = async () => {
    loading.value = true
    try {
        const response = await api.get('/landing/leaderboards/', {
            params: { lang: locale.value }
        })
        leaderboards.value = Array.isArray(response.data) ? response.data : response.data.results || []
    } catch (error) {
        console.error('Error loading leaderboards:', error)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadLeaderboards()
})
</script>

<style scoped>
.achievements-page {
    background-color: #f8fafc;
    min-height: calc(100vh - 80px);
}

.leaderboard-carousel-wrapper {
    width: 100%;
    padding: 20px 0;
    position: relative;
}

.leaderboard-carousel {
    width: 100%;
    padding-bottom: 50px;
}

/* Убираем ограничение ширины слайда от Swiper */
:deep(.swiper-slide) {
    width: auto !important;
    height: auto;
    display: flex;
    align-items: stretch;
}

.leaderboard-card-wrapper {
    padding: 0.5rem;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: stretch;
    width: 520px;
    min-width: 520px;
    max-width: 520px;
}

.leaderboard-card {
    max-width: 520px;
    width: 100%;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
}

.leaderboard-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.cursor-pointer {
    cursor: pointer;
}

/* Swiper Navigation Buttons */
:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
    color: var(--primary-color, #4f46e5);
    background: white;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

:deep(.swiper-button-next:hover),
:deep(.swiper-button-prev:hover) {
    background: var(--primary-color, #4f46e5);
    color: white;
    transform: scale(1.1);
}

:deep(.swiper-button-next::after),
:deep(.swiper-button-prev::after) {
    font-size: 18px;
    font-weight: bold;
}

:deep(.swiper-pagination-bullet) {
    background: var(--primary-color, #4f46e5);
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

/* Leaderboard Table Styles */
.leaderboard-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.table-row {
    display: grid;
    grid-template-columns: 50px 1fr auto;
    align-items: center;
    padding: 0.875rem 1rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    gap: 1rem;
    min-height: 64px;
}

/* Medal/Medal Colors */
.row-gold {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 2px solid #fbbf24;
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
}

.row-silver {
    background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
    border: 2px solid #9ca3af;
    box-shadow: 0 2px 8px rgba(156, 163, 175, 0.3);
}

.row-bronze {
    background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
    border: 2px solid #f97316;
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
}

.row-even {
    background-color: #e0e7ff;
}

.row-odd {
    background-color: #ffffff;
}

/* Rank Badge Styles */
.rank-column {
    display: flex;
    justify-content: center;
    align-items: center;
}

.rank-badge {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-weight: 700;
    font-size: 0.875rem;
}

.rank-gold {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #78350f;
    box-shadow: 0 2px 6px rgba(251, 191, 36, 0.4);
}

.rank-silver {
    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(156, 163, 175, 0.4);
}

.rank-bronze {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(249, 115, 22, 0.4);
}

.rank-default {
    background-color: #f3f4f6;
    color: #6b7280;
}

.medal-icon {
    font-size: 1.5rem;
    line-height: 1;
}

.rank-number {
    font-size: 0.875rem;
}

/* Name Column */
.name-column {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    flex: 1;
    min-width: 0;
}

.student-info {
    flex: 1;
    min-width: 0;
}

.student-name {
    font-weight: 600;
    color: #111827;
    font-size: 0.9375rem;
    margin-bottom: 0.25rem;
}

.student-group {
    font-size: 0.75rem;
    color: #6b7280;
}

/* Score Column */
.score-column {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-shrink: 0;
}

.score-value {
    font-weight: 700;
    font-size: 1.125rem;
    color: #4f46e5;
    background-color: #eef2ff;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    min-width: 70px;
    text-align: center;
    white-space: nowrap;
}

/* Tailwind-like classes since we don't have Tailwind but project uses some custom styles */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding-left: 1rem;
    padding-right: 1rem;
}

.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-8 { margin-bottom: 2rem; }
.mt-1 { margin-top: 0.25rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.text-center { text-align: center; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-2xl { border-radius: 1rem; }
.rounded-full { border-radius: 9999px; }
.bg-white { background-color: #ffffff; }
.bg-gray-50 { background-color: #f9fafb; }
.bg-indigo-50 { background-color: #eef2ff; }
.text-gray-900 { color: #111827; }
.text-gray-600 { color: #4b5563; }
.text-gray-500 { color: #6b7280; }
.text-gray-400 { color: #9ca3af; }
.text-indigo-600 { color: #4f46e5; }
.shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
.border-t { border-top-width: 1px; }
.border-gray-100 { border-color: #f3f4f6; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

@media (max-width: 768px) {
    .leaderboard-carousel-wrapper {
        padding: 10px 0;
    }
    
    .leaderboard-carousel {
        padding-bottom: 40px;
    }
    
    :deep(.swiper-button-next),
    :deep(.swiper-button-prev) {
        display: none;
    }
    
    .leaderboard-card-wrapper {
        width: 100% !important;
        min-width: auto !important;
        max-width: 100% !important;
        padding: 0.25rem;
    }
    
    .leaderboard-card {
        max-width: 100%;
        transform: none;
    }
    
    .leaderboard-card:hover {
        transform: translateY(-2px);
    }
}
</style>

