<template>
  <AdminLayout>
    <div class="admin-page">
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" @click="$router.back()" class="q-mr-sm" />
      <h1 class="text-h5 q-my-none">Транзакции баллов</h1>
    </div>

    <q-card flat bordered>
      <q-card-section class="text-center q-pa-xl">
        <q-icon name="swap_horiz" size="64px" color="grey-5" />
        <div class="text-h6 text-grey-7 q-mt-md">Раздел транзакций находится в разработке</div>
        <div class="text-subtitle2 text-grey-5">Здесь будет отображаться история всех начислений и списаний баллов.</div>
      </q-card-section>
    </q-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import AdminLayout from '../../layouts/AdminLayout.vue'
// Logic will be implemented later
</script>

