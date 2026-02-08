<template>
  <n-card bordered>
    <template #header>
      <n-space align="center" justify="space-between">
        <span>{{ $t('cabinet.menu.lessons') || 'Уроки' }}</span>
        <n-tag type="info" size="small" :bordered="false">
          {{ $t('common.readOnly') || 'Только просмотр' }}
        </n-tag>
      </n-space>
    </template>
    <n-empty :description="$t('common.comingSoon') || 'Скоро здесь будут уроки'" />
  </n-card>
</template>

<script setup lang="ts">
import { NCard, NSpace, NTag, NEmpty } from 'naive-ui'

defineProps<{
  groupId: number
}>()
</script>
