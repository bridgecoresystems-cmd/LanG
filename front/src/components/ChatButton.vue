<template>
  <div class="chat-button-container">
    <n-badge :value="unreadCount" :show-zero="false" :max="99">
      <n-button
        circle
        type="primary"
        size="large"
        class="chat-button"
        @click="$emit('click')"
      >
        <template #icon>
          <n-icon :size="24">
            <chat-icon />
          </n-icon>
        </template>
      </n-button>
    </n-badge>
  </div>
</template>

<script setup lang="ts">
import { NButton, NIcon, NBadge } from 'naive-ui'
import { ChatbubbleEllipsesOutline as ChatIcon } from '@vicons/ionicons5'

interface Props {
  unreadCount?: number
}

withDefaults(defineProps<Props>(), {
  unreadCount: 0
})

defineEmits<{
  click: []
}>()
</script>

<style scoped>
.chat-button-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999;
}

.chat-button {
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chat-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.chat-button:active {
  transform: translateY(0);
}
</style>
