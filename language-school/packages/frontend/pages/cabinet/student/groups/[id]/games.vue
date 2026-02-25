<script setup lang="ts">
import { NSpin } from 'naive-ui'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
onMounted(() => {
  const id = route.params.id
  if (id) navigateTo(`/cabinet/shared/groups/${id}/games`, { replace: true })
})
</script>

<template>
  <div class="redirect-placeholder"><NSpin size="medium" /></div>
</template>
