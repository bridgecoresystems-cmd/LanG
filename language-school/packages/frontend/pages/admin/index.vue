<template>
  <div class="q-pa-md">
    <h1 class="text-h4">Админ-панель LanG</h1>
      <p class="text-subtitle1">Добро пожаловать в систему управления языковой школой.</p>
      
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12 col-md-4">
          <QCard class="bg-primary text-white">
            <QCardSection>
              <div class="text-h6">Категории курсов</div>
              <div class="text-h3">{{ categoriesCount }}</div>
            </QCardSection>
            <QCardActions align="right">
              <QBtn flat label="Управлять" to="/admin/landing/categories" />
            </QCardActions>
          </QCard>
        </div>
        <!-- More cards can be added here -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const $q = useQuasar()

const categoriesCount = ref(0)
const loading = ref(false)

onMounted(async () => {
  await new Promise(r => setTimeout(r, 100))
  try {
    const data = await $fetch<any[]>(`${apiBase}/admin/categories`, { 
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    })
    categoriesCount.value = data.length
  } catch (err: any) {
    console.error('Failed to load stats', err)
    categoriesCount.value = 0
    // Если 403, возможно сессия не передалась - попробуем обновить пользователя
    if (err.response?.status === 403) {
      const authStore = useAuthStore()
      await authStore.fetchCurrentUser()
    }
  }
})
</script>
