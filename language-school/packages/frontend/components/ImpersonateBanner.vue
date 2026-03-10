<template>
  <div v-if="isImpersonating" class="impersonate-banner">
    <div class="impersonate-banner__content">
      <span class="impersonate-banner__icon">👤</span>
      <span class="impersonate-banner__text">
        Вы вошли под учётной записью
        <strong>{{ authStore.user?.username }}</strong>
        ({{ authStore.user?.role }})
      </span>
    </div>
    <NButton
      size="small"
      type="warning"
      :loading="stopping"
      @click="handleStop"
    >
      ← Вернуться в админку
    </NButton>
  </div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import { useAuthStore } from '~/stores/authStore'

const authStore = useAuthStore()
const { isImpersonating, stopImpersonating } = useImpersonate()
const stopping = ref(false)

async function handleStop() {
  stopping.value = true
  try {
    await stopImpersonating()
  } finally {
    stopping.value = false
  }
}
</script>

<style scoped>
.impersonate-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(90deg, #ff6b00, #ff9900);
  color: white;
  padding: 10px 24px;
  font-size: 0.9rem;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(255, 107, 0, 0.4);
}

.impersonate-banner__content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.impersonate-banner__icon {
  font-size: 1.2rem;
}

.impersonate-banner__text strong {
  font-weight: 700;
  text-decoration: underline;
}
</style>
