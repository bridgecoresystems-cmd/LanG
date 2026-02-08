<template>
  <div class="teacher-card" @click="handleClick">
    <div class="teacher-avatar-wrapper">
      <img
        :src="localTeacher.avatar_url || '/placeholder-teacher.png'"
        :alt="localTeacher.full_name"
        class="teacher-avatar"
        @error="handleImageError"
      />
    </div>
    
    <div class="teacher-info">
      <h3 class="teacher-name">{{ localTeacher.full_name }}</h3>
      
      <div v-if="localTeacher.specialization" class="teacher-specialization-card">
        <i class="pi pi-book"></i>
        <span>{{ localTeacher.specialization }}</span>
      </div>
      
      <div class="teacher-stats">
        <div class="stat-item">
          <i class="pi pi-eye"></i>
          <span class="stat-value">{{ formatViews(localTeacher.views) }}</span>
        </div>
        
        <button
          @click.stop="handleLike($event)"
          class="like-button"
          :class="{ 
            'liked': isLiked, 
            'disabled': !isAuthenticated 
          }"
          type="button"
        >
          <i class="pi pi-heart"></i>
          <span class="like-count">{{ localTeacher.likes || 0 }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { TeacherList } from '@/types/teacher'
import { useTeachers } from '@/composables/useTeachers'
import { useAuth } from '@/composables/useAuth'

interface Props {
  teacher: TeacherList
}

const props = defineProps<Props>()
const router = useRouter()
const { likeTeacher } = useTeachers()
const authStore = useAuth()
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Локальная реактивная копия для обновления счетчика
const localTeacher = ref<TeacherList>({ ...props.teacher })

// Вычисляемое свойство для is_liked
const isLiked = computed(() => localTeacher.value.is_liked || false)

// Синхронизируем с prop при изменении
watch(() => props.teacher, (newTeacher) => {
  Object.assign(localTeacher.value, newTeacher)
}, { deep: true, immediate: true })

const formatViews = (views: number): string => {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k`
  }
  return views.toString()
}

const handleClick = () => {
  // Use user_id instead of id because API lookup uses user.id
  // The API returns user_id in the list, but we need to use it for navigation
  const teacherId = localTeacher.value.user_id || localTeacher.value.id
  router.push(`/teacher/${teacherId}`)
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
  event.stopPropagation()
  
  console.log('handleLike called', { isAuthenticated: isAuthenticated.value, isLiked: isLiked.value })
  
  if (!isAuthenticated.value) {
    console.log('User not authenticated')
    return
  }
  
  // Показываем анимацию сердечек только при добавлении лайка
  if (!isLiked.value) {
    createFloatingHearts(event)
  }
  
  try {
    const teacherId = localTeacher.value.user_id || localTeacher.value.id
    console.log('Calling likeTeacher with id:', teacherId)
    const result = await likeTeacher(teacherId)
    console.log('likeTeacher result:', result)
    if (result) {
      localTeacher.value.likes = result.likes
      localTeacher.value.is_liked = result.is_liked
    }
  } catch (error: any) {
    console.error('Error in handleLike:', error)
    if (error.message === 'Authentication required') {
      console.log('Please login to like')
    }
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/placeholder-teacher.png'
}
</script>

<style scoped>
.teacher-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem;
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  max-width: 300px;
  margin: 0 auto;
  border: 1px solid rgba(0, 102, 204, 0.1);
  position: relative;
  overflow: hidden;
}

.teacher-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.teacher-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 102, 204, 0.2);
  border-color: rgba(0, 102, 204, 0.3);
}

.teacher-card:hover::before {
  opacity: 1;
}

.teacher-avatar-wrapper {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1.5rem;
  border: 5px solid var(--primary-color);
  box-shadow: 0 8px 24px rgba(0, 102, 204, 0.25);
  position: relative;
  transition: all 0.4s ease;
}

.teacher-card:hover .teacher-avatar-wrapper {
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(0, 102, 204, 0.35);
  border-color: var(--secondary-color);
}

.teacher-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-info {
  text-align: center;
  width: 100%;
}

.teacher-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.teacher-specialization-card {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, rgba(0, 102, 204, 0.1), rgba(0, 68, 153, 0.1));
  border-radius: 20px;
  color: var(--primary-color);
  font-size: 0.9rem;
  font-weight: 500;
}

.teacher-specialization-card i {
  font-size: 1rem;
}

.teacher-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  width: 100%;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.stat-item i {
  font-size: 1.1rem;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 500;
}

.like-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border: 2px solid var(--border-color);
  border-radius: 25px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.like-button:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15);
}

.like-button.liked {
  border-color: #e91e63;
  background: linear-gradient(135deg, #fce4ec, #f8bbd0);
  color: #e91e63;
  box-shadow: 0 4px 12px rgba(233, 30, 99, 0.25);
}

.like-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: white;
  color: var(--text-secondary);
}

.like-button.disabled:hover {
  transform: none;
  border-color: var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.like-button i {
  font-size: 1.1rem;
}

.like-count {
  font-size: 0.95rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .teacher-card {
    max-width: 100%;
    padding: 1rem;
  }

  .teacher-avatar-wrapper {
    width: 120px;
    height: 120px;
  }

  .teacher-name {
    font-size: 1.1rem;
  }
}
</style>

