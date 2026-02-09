<template>
  <div class="q-pa-md">
    <h1 class="text-h4">Личный кабинет</h1>
    <p class="text-body1">Добро пожаловать, {{ authStore.userFullName }}!</p>
    <p class="text-caption text-grey">Роль: {{ authStore.user?.role || '—' }}</p>
    <q-btn :to="'/cabinet/profile'" color="primary" icon="person" label="Профиль" class="q-mt-md" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'cabinet-auth' })

const authStore = useAuthStore()
</script>
