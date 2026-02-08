<template>
  <CabinetLayout>
    <n-space vertical size="large" class="cabinet-page">
      <n-h1>{{ $t('cabinet.students.title') }}</n-h1>
      <n-card bordered content-style="padding: 4rem 2rem;">
        <n-empty :description="$t('cabinet.teachers.comingSoon')" />
      </n-card>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import CabinetLayout from '../../layouts/CabinetLayout.vue'
import { NSpace, NH1, NCard, NEmpty } from 'naive-ui'
</script>

<style scoped>
.cabinet-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
