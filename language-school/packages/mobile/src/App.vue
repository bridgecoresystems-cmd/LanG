<template>
  <ion-app>
    <!-- Меню студента — прямой дочерний элемент IonApp, рядом с IonRouterOutlet -->
    <student-menu-drawer v-if="auth.isLoggedIn && auth.isStudent" />
    <ion-router-outlet id="main-content" />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { useAuthStore } from '@/stores/auth'
import StudentMenuDrawer from '@/components/StudentMenuDrawer.vue'

const auth = useAuthStore()
</script>
