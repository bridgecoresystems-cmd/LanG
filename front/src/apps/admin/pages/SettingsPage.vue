<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="page-header">
        <h1>{{ $t('admin.menu.settings') }}</h1>
      </div>

      <div class="settings-content">
        <p>{{ $t('admin.settings.comingSoon') }}</p>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from '../layouts/AdminLayout.vue'
</script>

<style scoped>
.admin-page {
  padding: 1rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  margin: 0;
  color: #333;
}

.settings-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  text-align: center;
  color: #666;
}
</style>

