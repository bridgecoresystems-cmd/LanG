<template>
  <div
    class="cube-container"
    @mouseenter="pauseRotation"
    @mouseleave="resumeRotation"
  >
    <div class="cube" :style="{ transform: cubeTransform }">
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
const currentRotation = ref(0)
const isPaused = ref(false)
let rotationInterval: ReturnType<typeof setInterval> | null = null

const cubeTransform = computed(() => `rotateY(${currentRotation.value}deg)`)

const startAutoRotation = () => {
  if (rotationInterval || isPaused.value) return
  rotationInterval = setInterval(() => {
    currentRotation.value += 90
  }, 5000)
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
  cursor: pointer;
}

.cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.cube-face {
  position: absolute;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
}

.cube-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cube-face-front {
  transform: rotateY(0deg) translateZ(20px);
}
.cube-face-right {
  transform: rotateY(90deg) translateZ(20px);
}
.cube-face-back {
  transform: rotateY(180deg) translateZ(20px);
}
.cube-face-left {
  transform: rotateY(-90deg) translateZ(20px);
}

@media (max-width: 768px) {
  .cube-container,
  .cube-face {
    width: 35px;
    height: 35px;
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
