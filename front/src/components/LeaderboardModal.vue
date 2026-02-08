<template>
  <transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <button class="modal-close" @click="close" aria-label="Close">
          <i class="pi pi-times"></i>
        </button>
        
        <div v-if="leaderboard" class="modal-content">
          <!-- Card Header -->
          <div class="modal-header bg-gradient-to-r from-blue-600 to-indigo-700">
            <div class="flex items-center gap-3 mb-2">
              <i class="pi pi-star-fill" style="color: #fbbf24;"></i>
              <span class="text-xs font-semibold uppercase tracking-wider" style="color: rgba(255, 255, 255, 0.9);">{{ leaderboard.course_name }}</span>
            </div>
            <h2 class="text-2xl font-bold line-clamp-1" style="color: #fef3c7; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">{{ leaderboard.title }}</h2>
            <p class="text-sm mt-1" style="color: #fef3c7; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">{{ leaderboard.exam_type_name }}</p>
          </div>

          <!-- Students List - Table Style -->
          <div class="students-list p-6">
            <div class="leaderboard-table">
              <div 
                v-for="(student, idx) in leaderboard.students" 
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
                      size="48px"
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
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import UserAvatar from './UserAvatar.vue'

interface Leaderboard {
  id: number
  title: string
  course_name: string
  exam_type_name: string
  students: Array<{
    student_name: string
    group_name: string
    score: number
    student_avatar_url?: string | null
    student_gender?: 'boy' | 'girl' | null
  }>
}

interface Props {
  isOpen: boolean
  leaderboard: Leaderboard | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const close = () => {
  emit('close')
}

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
  max-width: 950px;
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
  background: var(--primary-color, #4f46e5);
  color: white;
  transform: rotate(90deg);
}

.modal-content {
  width: 100%;
}

.modal-header {
  padding: 2rem;
  border-radius: 12px 12px 0 0;
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
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  gap: 1rem;
  min-height: 72px;
}

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

.rank-column {
  display: flex;
  justify-content: center;
  align-items: center;
}

.rank-badge {
  width: 48px;
  height: 48px;
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
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.student-group {
  font-size: 0.875rem;
  color: #6b7280;
}

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
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  min-width: 70px;
  text-align: center;
  white-space: nowrap;
}

/* Utility classes */
.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-3 {
  gap: 0.75rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.font-semibold {
  font-weight: 600;
}

.uppercase {
  text-transform: uppercase;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

.text-2xl {
  font-size: 1.5rem;
  line-height: 2rem;
}

.font-bold {
  font-weight: 700;
}

.line-clamp-1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

.p-6 {
  padding: 1.5rem;
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
  
  .modal-header {
    padding: 1.5rem;
  }
  
  .students-list {
    padding: 1rem;
  }
  
  .table-row {
    grid-template-columns: 50px 1fr 80px;
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .rank-badge {
    width: 40px;
    height: 40px;
  }
  
  .student-name {
    font-size: 0.9375rem;
  }
  
  .score-value {
    font-size: 1.125rem;
    padding: 0.375rem 0.75rem;
  }
}
</style>
