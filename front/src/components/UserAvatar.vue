<script setup lang="ts">
import { computed } from 'vue';
import boyImg from '@/assets/images/boy.png';
import girlImg from '@/assets/images/girl.png';

interface Props {
  src?: string | null;
  gender?: 'boy' | 'girl' | string | null;
  size?: 'small' | 'medium' | 'large' | string;
  round?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  gender: 'boy',
  size: 'medium',
  round: true
});

const avatarSize = computed(() => {
  switch (props.size) {
    case 'small': return '32px';
    case 'medium': return '48px';
    case 'large': return '128px';
    default: return props.size;
  }
});

const isBoy = computed(() => props.gender === 'boy' || !props.gender);
const isGirl = computed(() => props.gender === 'girl');
</script>

<template>
  <div 
    class="user-avatar" 
    :class="{ 'is-round': round }"
    :style="{ width: avatarSize, height: avatarSize }"
  >
    <img v-if="src" :src="src" class="avatar-image" alt="User avatar" />
    
    <!-- Default images based on gender -->
    <img v-else-if="isGirl" :src="girlImg" class="avatar-image default" alt="Girl avatar" />
    <img v-else :src="boyImg" class="avatar-image default" alt="Boy avatar" />
  </div>
</template>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--bg-secondary, #f5f5f5);
  flex-shrink: 0;
}

.user-avatar.is-round {
  border-radius: 50%;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-image.default {
  padding: 10%; /* Give some space for default icons if needed */
  background-color: var(--bg-secondary, #f5f7f9);
}
</style>

