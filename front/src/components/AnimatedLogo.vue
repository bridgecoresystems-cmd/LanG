<template>
  <div class="cube-container" @mouseenter="pauseRotation" @mouseleave="resumeRotation">
    <div 
      class="cube" 
      :style="{ transform: cubeTransform }"
    >
      <!-- Грани куба -->
      <div class="cube-face cube-face-front">
        <img src="/logo-tm.png" alt="Türkmen" class="cube-logo" />
      </div>
      <div class="cube-face cube-face-right">
        <img src="/logo-ru.png" alt="Русский" class="cube-logo" />
      </div>
      <div class="cube-face cube-face-back">
        <img src="/logo-en.png" alt="English" class="cube-logo" />
      </div>
      <div class="cube-face cube-face-left">
        <img src="/logo-de.png" alt="Deutsch" class="cube-logo" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const currentRotation = ref(0) // Текущий угол поворота в градусах (накапливается бесконечно)
const isPaused = ref(false)
let rotationInterval: number | null = null

// Текущая трансформация куба
const cubeTransform = computed(() => {
  // Просто используем угол напрямую, CSS сам обработает большие значения
  return `rotateY(${currentRotation.value}deg)`
})

// Автоматическое вращение (каждые 5 секунд поворот на 90 градусов)
const startAutoRotation = () => {
  if (rotationInterval || isPaused.value) return
  
  rotationInterval = window.setInterval(() => {
    // Просто увеличиваем угол на 90 градусов каждые 5 секунд
    // Угол накапливается бесконечно: 0, 90, 180, 270, 360, 450, 540...
    currentRotation.value = currentRotation.value + 90
  }, 5000) // 5 секунд между поворотами
}

const stopAutoRotation = () => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
    rotationInterval = null
  }
}

const pauseRotation = () => {
  isPaused.value = true
  stopAutoRotation()
}

const resumeRotation = () => {
  isPaused.value = false
  startAutoRotation()
}

onMounted(() => {
  // Начинаем с 0 градусов
  currentRotation.value = 0
  // Запускаем автоматическое вращение
  startAutoRotation()
})

onUnmounted(() => {
  stopAutoRotation()
})
</script>

<style scoped>
.cube-container {
  width: 40px;
  height: 40px;
  perspective: 200px;
  perspective-origin: center center;
  cursor: pointer;
}

.cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.cube-face {
  position: absolute;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.cube-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* Передняя грань (TM) */
.cube-face-front {
  transform: rotateY(0deg) translateZ(20px);
}

/* Правая грань (RU) */
.cube-face-right {
  transform: rotateY(90deg) translateZ(20px);
}

/* Задняя грань (EN) */
.cube-face-back {
  transform: rotateY(180deg) translateZ(20px);
}

/* Левая грань (DE) */
.cube-face-left {
  transform: rotateY(-90deg) translateZ(20px);
}

@media (max-width: 768px) {
  .cube-container {
    width: 35px;
    height: 35px;
  }
  
  .cube-face {
    width: 35px;
    height: 35px;
  }
  
  .cube-face-front,
  .cube-face-right,
  .cube-face-back,
  .cube-face-left {
    transform-style: preserve-3d;
  }
  
  .cube-face-front {
    transform: rotateY(0deg) translateZ(17.5px);
  }
  
  .cube-face-right {
    transform: rotateY(90deg) translateZ(17.5px);
  }
  
  .cube-face-back {
    transform: rotateY(180deg) translateZ(17.5px);
  }
  
  .cube-face-left {
    transform: rotateY(-90deg) translateZ(17.5px);
  }
}
</style>
