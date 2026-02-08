<template>
  <MainLayout>
    <section class="section teacher-section">
      <div class="container">
        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
        </div>

        <div v-else-if="teacher" class="teacher-profile">
          <div class="teacher-header">
            <div class="teacher-avatar-large-wrapper">
              <img
                :src="teacher.avatar_url || '/placeholder-teacher.png'"
                :alt="teacher.full_name"
                class="teacher-avatar-large"
                @error="handleImageError"
              />
            </div>

            <div class="teacher-header-info">
              <h1 class="teacher-name-large">{{ teacher.full_name }}</h1>
              
              <div v-if="teacher.specialization" class="teacher-specialization">
                <i class="pi pi-book"></i>
                <span>{{ $t('teacher.specialization') }}: {{ teacher.specialization }}</span>
              </div>

              <div v-if="teacher.experience_years > 0" class="teacher-experience">
                <i class="pi pi-calendar"></i>
                <span>{{ $t('teacher.experience') }}: {{ teacher.experience_years }} {{ $t('teacher.years') }}</span>
              </div>

              <div class="teacher-stats-large">
                <div class="stat-item-large">
                  <i class="pi pi-eye"></i>
                  <span class="stat-label">{{ $t('teacher.views') }}:</span>
                  <span class="stat-value">{{ formatViews(teacher.views) }}</span>
                </div>

                <button
                  @click="handleLike($event)"
                  class="like-button-large"
                  :class="{ 
                    'liked': isLiked, 
                    'disabled': !isAuthenticated 
                  }"
                  :disabled="!isAuthenticated"
                  type="button"
                >
                  <i class="pi pi-heart"></i>
                  <span class="stat-label">{{ $t('teacher.likes') }}:</span>
                  <span class="like-count">{{ teacher.likes || 0 }}</span>
                </button>
              </div>

              <div v-if="teacher.video_url" class="teacher-video-button-wrapper">
                <button @click="openVideoModal" class="video-button-inline">
                  <i class="pi pi-play-circle"></i>
                  <span>{{ $t('teacher.watchVideo') }}</span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="teacher.bio" class="teacher-bio">
            <h2>{{ $t('teacher.bio') }}</h2>
            <p>{{ teacher.bio }}</p>
          </div>
          <div v-else class="teacher-bio">
            <p class="no-bio">{{ $t('teacher.noBio') }}</p>
          </div>

          <button @click="$router.back()" class="back-button">
            <i class="pi pi-arrow-left"></i>
            {{ $t('teacher.back') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Video Modal -->
    <div v-if="isVideoModalOpen" class="video-modal-overlay" @click.self="closeVideoModal">
      <div class="video-modal">
        <button @click="closeVideoModal" class="video-modal-close">
          <i class="pi pi-times"></i>
        </button>
        <div class="video-player-wrapper">
          <video
            v-if="teacher?.video_url"
            ref="videoPlayer"
            :src="teacher.video_url"
            controls
            class="video-player"
            @loadedmetadata="onVideoLoaded"
          >
            {{ $t('teacher.videoNotSupported') }}
          </video>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/MainLayout.vue'
import { useTeachers } from '@/composables/useTeachers'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { locale } = useI18n()
const { teacher, loading, error, fetchTeacher, incrementViews, likeTeacher } = useTeachers()
const { isAuthenticated } = useAuth()

const isLiked = computed(() => teacher.value?.is_liked || false)
const isVideoModalOpen = ref(false)
const videoPlayer = ref<HTMLVideoElement | null>(null)

const formatViews = (views: number): string => {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k`
  }
  return views.toString()
}

const createFloatingHearts = (event: MouseEvent) => {
  const button = event.currentTarget as HTMLElement
  if (!button) return

  const buttonRect = button.getBoundingClientRect()
  const startX = buttonRect.left + buttonRect.width / 2
  const startY = buttonRect.top + buttonRect.height / 2

  const directions = [-30, -15, 0, 15, 30]
  const emojis = ['❤️', '💖', '💕', '💗', '💝']
  
  for (let i = 0; i < 5; i++) {
    const heart = document.createElement('div')
    heart.className = 'floating-heart'
    heart.textContent = emojis[i] || '❤️'
    
    const direction = directions[i]
    
    heart.style.position = 'fixed'
    heart.style.left = `${startX}px`
    heart.style.top = `${startY}px`
    heart.style.fontSize = '2rem'
    heart.style.lineHeight = '1'
    heart.style.display = 'block'
    heart.style.marginLeft = '-1rem'
    heart.style.marginTop = '-1rem'
    heart.style.zIndex = '99999'
    heart.style.pointerEvents = 'none'
    
    const animationName = `floatUp${direction}`
    const styleId = `heart-animation-${direction}`
    
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @keyframes ${animationName} {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(0.8) rotate(0deg);
          }
          25% {
            opacity: 1;
            transform: translateY(-30px) translateX(${direction * 0.5}px) scale(1.2) rotate(-8deg);
          }
          50% {
            opacity: 1;
            transform: translateY(-60px) translateX(${direction * 1}px) scale(1.4) rotate(8deg);
          }
          75% {
            opacity: 0.8;
            transform: translateY(-90px) translateX(${direction * 1.3}px) scale(1.6) rotate(-5deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-120px) translateX(${direction * 1.5}px) scale(1.8) rotate(0deg);
          }
        }
      `
      document.head.appendChild(style)
    }
    
    document.body.appendChild(heart)
    
    void heart.offsetWidth
    
    heart.style.animation = `${animationName} 2s ease-out ${i * 0.1}s forwards`
    
    setTimeout(() => {
      if (heart.parentNode) {
        heart.parentNode.removeChild(heart)
      }
    }, 2500)
  }
}

const handleLike = async (event: MouseEvent) => {
  if (!teacher.value) {
    return
  }
  
  // Проверяем аутентификацию через store напрямую
  const store = useAuth()
  if (!store.isAuthenticated) {
    return
  }
  
  // Показываем анимацию сердечек только при добавлении лайка
  if (!isLiked.value) {
    createFloatingHearts(event)
  }
  
  try {
    const teacherId = teacher.value.user_id || teacher.value.id
    const result = await likeTeacher(teacherId)
    if (result && teacher.value) {
      teacher.value.likes = result.likes
      teacher.value.is_liked = result.is_liked
    }
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      console.log('Please login to like')
    }
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/placeholder-teacher.png'
}

const openVideoModal = () => {
  if (teacher.value?.video_url) {
    isVideoModalOpen.value = true
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
  }
}

const closeVideoModal = () => {
  isVideoModalOpen.value = false
  // Restore body scroll
  document.body.style.overflow = ''
  
  // Pause video when closing modal
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.currentTime = 0
  }
}

const onVideoLoaded = () => {
  // Video is ready
}

// Close modal on ESC key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isVideoModalOpen.value) {
    closeVideoModal()
  }
}

const loadTeacher = async () => {
  const teacherId = parseInt(route.params.id as string)
  if (teacherId) {
    await fetchTeacher(teacherId)
  }
}

onMounted(async () => {
  const teacherId = parseInt(route.params.id as string)
  if (teacherId) {
    await fetchTeacher(teacherId)
    if (teacher.value) {
      // Use user_id if available, otherwise fall back to id
      const viewTeacherId = teacher.value.user_id || teacherId
      await incrementViews(viewTeacherId)
    }
  }
  
  // Add keyboard listener
  window.addEventListener('keydown', handleKeyDown)
})

// Reload teacher data when language changes
watch(locale, () => {
  if (teacher.value) {
    loadTeacher()
  }
})

onUnmounted(() => {
  // Remove keyboard listener
  window.removeEventListener('keydown', handleKeyDown)
  // Restore body scroll in case modal was open
  document.body.style.overflow = ''
})
</script>

<style scoped>
.teacher-section {
  padding: 3rem 0;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.75rem;
  margin-top: 2rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background: white;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.back-button:hover {
  background: var(--bg-secondary);
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateX(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.teacher-profile {
  max-width: 900px;
  margin: 0 auto;
}

.teacher-header {
  display: flex;
  gap: 3rem;
  margin-bottom: 3rem;
  padding: 2.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 102, 204, 0.1);
  position: relative;
  overflow: hidden;
}

.teacher-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
}

.teacher-avatar-large-wrapper {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  overflow: hidden;
  border: 6px solid var(--primary-color);
  box-shadow: 0 8px 32px rgba(0, 102, 204, 0.3);
  flex-shrink: 0;
  position: relative;
  transition: all 0.4s ease;
}

.teacher-avatar-large-wrapper::after {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  border-radius: 50%;
  border: 3px solid transparent;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.teacher-header:hover .teacher-avatar-large-wrapper {
  transform: scale(1.05);
  box-shadow: 0 12px 40px rgba(0, 102, 204, 0.4);
}

.teacher-header:hover .teacher-avatar-large-wrapper::after {
  opacity: 0.3;
}

.teacher-avatar-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.teacher-name-large {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.teacher-specialization,
.teacher-experience {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, rgba(0, 102, 204, 0.1), rgba(0, 68, 153, 0.1));
  border-radius: 25px;
  color: var(--primary-color);
  font-size: 1rem;
  font-weight: 500;
  border: 1px solid rgba(0, 102, 204, 0.2);
}

.teacher-stats-large {
  display: flex;
  gap: 1.5rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
  padding-top: 1.5rem;
  border-top: 2px solid rgba(0, 0, 0, 0.05);
}

.teacher-video-button-wrapper {
  margin-top: 1rem;
  width: 100%;
}

.video-button-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 102, 204, 0.3);
}

.video-button-inline:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 102, 204, 0.4);
  background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
}

.video-button-inline:active {
  transform: translateY(-1px);
}

.video-button-inline i {
  font-size: 1.5rem;
}

.stat-item-large {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: rgba(0, 102, 204, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(0, 102, 204, 0.1);
}

.stat-item-large i {
  font-size: 1.2rem;
  color: var(--primary-color);
}

.stat-label {
  color: var(--text-secondary);
}

.stat-value {
  font-weight: 600;
  color: var(--text-primary);
}

.like-button-large {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border: 2px solid var(--border-color);
  border-radius: 25px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.like-button-large:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15);
}

.like-button-large.liked {
  border-color: #e91e63;
  background: linear-gradient(135deg, #fce4ec, #f8bbd0);
  color: #e91e63;
  box-shadow: 0 4px 12px rgba(233, 30, 99, 0.25);
}

.like-button-large.disabled,
.like-button-large:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: white;
  color: var(--text-secondary);
}

.like-button-large.disabled:hover,
.like-button-large:disabled:hover {
  transform: none;
  border-color: var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.teacher-bio {
  padding: 2.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 102, 204, 0.1);
  position: relative;
  overflow: hidden;
}

.teacher-bio::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
}

.teacher-bio h2 {
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.teacher-bio p {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-secondary);
}

.no-bio {
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}

@media (max-width: 768px) {
  .teacher-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
  }

  .teacher-avatar-large-wrapper {
    width: 150px;
    height: 150px;
  }

  .teacher-name-large {
    font-size: 1.5rem;
  }

  .teacher-stats-large {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }
}


/* Video Modal */
.video-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.video-modal {
  position: relative;
  width: 100%;
  max-width: 1200px;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.video-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10001;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: #000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: all 0.3s ease;
}

.video-modal-close:hover {
  background: white;
  transform: scale(1.1);
}

.video-player-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background: #000;
}

.video-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  outline: none;
}

@media (max-width: 768px) {
  .video-modal {
    border-radius: 0;
    max-width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .video-player-wrapper {
    flex: 1;
    padding-bottom: 0;
  }

  .video-player {
    position: relative;
    height: 100%;
  }

  .video-modal-close {
    top: 0.5rem;
    right: 0.5rem;
    width: 36px;
    height: 36px;
  }
}
</style>

