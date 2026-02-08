<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="row q-mb-lg">
        <div class="col-12">
          <h1 class="text-h4 q-mb-sm">{{ $t('admin.sections.landing') || 'Управление лендингом' }}</h1>
          <p class="text-body1 text-grey-7">Управление контентом главной страницы, новостями и курсами.</p>
        </div>
      </div>

      <div class="row q-col-gutter-lg">
        <div v-for="item in landingSections" :key="item.path" class="col-12 col-sm-6 col-md-4">
          <q-card flat bordered class="landing-action-card cursor-pointer" @click="router.push(item.path)">
            <q-card-section class="text-center q-pa-xl">
              <q-icon :name="item.icon" size="64px" :color="item.color" />
              <div class="text-h6 q-mt-md">{{ item.label }}</div>
              <div class="text-caption text-grey-7 q-mt-sm">{{ item.description }}</div>
            </q-card-section>
            <q-separator />
            <q-card-actions align="center">
              <q-btn flat color="primary" :label="$t('admin.actions.view') || 'Перейти'" />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../layouts/AdminLayout.vue'

const router = useRouter()
const { t } = useI18n()

const landingSections = computed(() => [
  {
    path: '/management/landing/news',
    label: t('admin.menu.news'),
    icon: 'newspaper',
    color: 'primary',
    description: 'Управление новостями и событиями школы'
  },
  {
    path: '/management/landing/courses',
    label: t('admin.menu.courses'),
    icon: 'book',
    color: 'positive',
    description: 'Список курсов, доступных для записи на сайте'
  },
  {
    path: '/management/landing/course-categories',
    label: t('admin.menu.courseCategories'),
    icon: 'category',
    color: 'info',
    description: 'Категории и направления обучения'
  },
  {
    path: '/management/landing/course-subcategories',
    label: t('admin.menu.courseSubCategories'),
    icon: 'account_tree',
    color: 'accent',
    description: 'Подкатегории и уровни сложности курсов'
  },
  {
    path: '/management/landing/contact-messages',
    label: t('admin.menu.contactMessages'),
    icon: 'mail',
    color: 'warning',
    description: 'Заявки и сообщения с формы обратной связи'
  },
  {
    path: '/management/landing/leaderboards',
    label: 'Лидерборды (Достижения)',
    icon: 'emoji_events',
    color: 'orange',
    description: 'Управление каруселью достижений на главной странице'
  }
])
</script>

<style scoped>
.landing-action-card {
  transition: all 0.3s ease;
}

.landing-action-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: var(--q-primary);
}
</style>

