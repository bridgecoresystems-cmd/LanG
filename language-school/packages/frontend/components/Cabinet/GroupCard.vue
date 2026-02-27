<template>
  <div class="group-card" @click="$emit('click')">
    <div class="book-container">
      <div class="book-cover">
        <div class="book-spine"></div>
        <div class="book-front">
          <div class="book-content">
            <div class="book-icon-wrapper">
              <UIcon name="i-heroicons-academic-cap" class="book-icon" />
            </div>
            <div class="book-title-wrapper">
              <h3 class="book-title">{{ group.course_name || 'Курс' }}</h3>
            </div>
          </div>
          <div class="book-footer">
            <div class="group-name-tag">{{ group.name }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="group-info">
      <div class="info-row">
        <UIcon name="i-heroicons-clock" class="info-icon" />
        <span>{{ group.time_slot || 'Не задано' }}</span>
      </div>
      <div class="info-row">
        <UIcon name="i-heroicons-calendar-days" class="info-icon" />
        <span>{{ group.week_days || 'Расписание' }}</span>
      </div>
      
      <div class="action-area">
        <div class="enter-label">Войти в кабинет</div>
        <UIcon name="i-heroicons-arrow-right" class="arrow-icon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  group: {
    id: number
    name: string
    course_name?: string
    time_slot?: string
    week_days?: string
  }
}>()

defineEmits(['click'])
</script>

<style scoped>
.group-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  perspective: 1000px;
  width: 100%;
  max-width: 220px;
  min-width: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.book-container {
  position: relative;
  width: 100%;
  height: 260px;
  margin-bottom: 1rem;
}

.book-cover {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.group-card:hover .book-cover {
  transform: rotateY(-20deg) translateZ(15px);
}

.book-spine {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%);
  background-color: #18a058;
  transform: rotateY(-90deg) translateX(-4px);
  transform-origin: right center;
  border-radius: 3px 0 0 3px;
}

.book-front {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
  border-radius: 4px 8px 8px 4px;
  box-shadow: 
    5px 10px 20px rgba(0, 0, 0, 0.1),
    0 2px 5px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(24, 160, 88, 0.1);
}

.book-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  text-align: center;
}

.book-icon-wrapper {
  background-color: rgba(24, 160, 88, 0.1);
  padding: 1rem;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.book-icon {
  width: 3rem;
  height: 3rem;
  color: #18a058;
}

.book-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1a202c;
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-footer {
  background-color: #18a058;
  padding: 0.75rem;
  display: flex;
  justify-content: center;
}

.group-name-tag {
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.group-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 0.5rem;
  min-width: 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #718096;
}

.info-icon {
  color: #18a058;
  width: 1rem;
  height: 1rem;
}

.action-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #edf2f7;
  color: #18a058;
  font-weight: 700;
  font-size: 0.85rem;
}

.arrow-icon {
  transition: transform 0.3s ease;
}

.group-card:hover .arrow-icon {
  transform: translateX(5px);
}

@media (max-width: 640px) {
  .book-container {
    height: 220px;
  }
}
</style>
