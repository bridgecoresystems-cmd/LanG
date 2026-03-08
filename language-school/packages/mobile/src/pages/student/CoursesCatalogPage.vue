<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary" />
        </ion-buttons>
        <ion-title>Каталог курсов</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding courses-content">
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner />
      </div>

      <div v-else class="courses-grid">
        <div v-for="c in courses" :key="c.id" class="course-card">
          <div class="course-image">
            <ion-icon :icon="bookOutline" />
          </div>
          <div class="course-body">
            <h3 class="course-name">{{ c.name_ru || c.name }}</h3>
            <p class="course-desc">{{ c.description_ru || c.description || 'Нет описания' }}</p>
            <div class="course-footer">
              <div class="course-price">
                <span class="price-val">{{ c.price || '0' }}</span>
                <span class="price-cur">TMT</span>
              </div>
              <ion-button size="small" fill="solid" color="primary">Записаться</ion-button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonSpinner, IonIcon, IonButton
} from '@ionic/vue'
import { bookOutline } from 'ionicons/icons'
import { api } from '@/composables/useApi'

const courses = ref<any[]>([])
const loading = ref(true)

async function loadCourses() {
  loading.value = true
  try {
    const data = await api.cabinet.courses()
    courses.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Failed to load courses', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadCourses)
</script>

<style scoped>
.courses-content {
  --background: #f8f9fc;
}

.courses-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.course-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.course-image {
  height: 120px;
  background: linear-gradient(135deg, #18a058 0%, #0c7a43 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  color: rgba(255,255,255,0.2);
}

.course-body {
  padding: 20px;
}

.course-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 8px;
}

.course-desc {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-price {
  display: flex;
  align-items: center;
  gap: 4px;
}

.price-val {
  font-size: 1.3rem;
  font-weight: 800;
  color: #1e293b;
}

.price-cur {
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
}
</style>
