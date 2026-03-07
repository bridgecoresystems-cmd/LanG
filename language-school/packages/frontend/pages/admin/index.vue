<template>
  <div class="admin-dashboard">
    <!-- Hero -->
    <div class="admin-hero">
      <div class="admin-hero__content">
        <h1 class="admin-hero__title">
          С возвращением, {{ authStore.user?.first_name || 'админ' }}! 👋
        </h1>
        <p class="admin-hero__subtitle">Панель управления LanG Academy</p>
      </div>
    </div>

    <!-- Shortcuts -->
    <h2 class="admin-section-title">Быстрый доступ</h2>
    <div class="admin-shortcuts">
      <QCard
        v-for="card in shortcuts"
        :key="card.path"
        flat
        bordered
        class="admin-shortcut-card"
        clickable
        @click="navigateTo(card.path)"
      >
        <QCardSection class="q-pa-sm">
          <div class="admin-shortcut-card__inner">
            <div :class="['admin-shortcut-card__icon', card.iconBg]">
              <QIcon :name="card.icon" size="22px" />
            </div>
            <div class="admin-shortcut-card__body">
              <div class="admin-shortcut-card__label">{{ card.label }}</div>
              <div class="admin-shortcut-card__desc">{{ card.desc }}</div>
            </div>
            <QIcon name="chevron_right" size="18px" class="admin-shortcut-card__arrow text-grey-6" />
          </div>
        </QCardSection>
      </QCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const authStore = useAuthStore()

const shortcuts = [
  { label: 'Лендинг', desc: 'Категории, курсы, новости', path: '/admin/landing/categories', icon: 'public', iconBg: 'icon--landing' },
  { label: 'Сообщения', desc: 'Входящие с сайта', path: '/admin/landing/contact', icon: 'mail', iconBg: 'icon--contact' },
  { label: 'Школы', desc: 'Филиалы и настройки', path: '/admin/schools', icon: 'school', iconBg: 'icon--schools' },
  { label: 'Пользователи', desc: 'Учётные записи', path: '/admin/users', icon: 'people', iconBg: 'icon--users' },
  { label: 'Терминалы 💎', desc: 'ESP32, вендоры', path: '/admin/terminals', icon: 'point_of_sale', iconBg: 'icon--terminals' },
  { label: 'Главбух 💰', desc: 'Платежи, gems, долги, тарифы', path: '/admin/head-accountant', icon: 'account_balance', iconBg: 'icon--accountant' },
  { label: 'Заявки Gems 💎', desc: 'Пополнение главбуха', path: '/admin/gems/requests', icon: 'diamond', iconBg: 'icon--gems' },
  { label: 'Sales дневник', desc: 'Звонки менеджеров', path: '/admin/sales', icon: 'phone', iconBg: 'icon--sales' },
  { label: 'Changelog', desc: 'История изменений', path: '/admin/changelogs', icon: 'history', iconBg: 'icon--changelog' },
  { label: 'Профиль', desc: 'Настройки админа', path: '/admin/profile', icon: 'person', iconBg: 'icon--profile' },
]
</script>

<style scoped>
.admin-dashboard {
  animation: slideUp 0.35s ease-out;
}

.admin-hero {
  position: relative;
  background: linear-gradient(135deg, #417690 0%, #2d5168 50%, #1e3a4a 100%);
  border-radius: 12px;
  padding: 16px 24px;
  color: white;
  margin-bottom: 20px;
}

.admin-hero__title {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 2px;
  letter-spacing: -0.02em;
}

.admin-hero__subtitle {
  font-size: 0.8rem;
  opacity: 0.9;
  margin: 0;
}

.admin-section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px;
}

.admin-shortcuts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.admin-shortcut-card {
  border-radius: 10px;
  transition: box-shadow 0.2s, transform 0.2s;
}

.admin-shortcut-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.admin-shortcut-card__inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-shortcut-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.admin-shortcut-card__icon.icon--landing {
  background: #e3f2fd;
  color: #1976d2;
}

.admin-shortcut-card__icon.icon--contact {
  background: #f3e5f5;
  color: #7b1fa2;
}

.admin-shortcut-card__icon.icon--schools {
  background: #e8f5e9;
  color: #388e3c;
}

.admin-shortcut-card__icon.icon--users {
  background: #fff3e0;
  color: #e65100;
}

.admin-shortcut-card__icon.icon--terminals {
  background: #e0f7fa;
  color: #00838f;
}

.admin-shortcut-card__icon.icon--accountant {
  background: #e8f5e9;
  color: #2e7d32;
}
.admin-shortcut-card__icon.icon--gems {
  background: #f1f8e9;
  color: #689f38;
}

.admin-shortcut-card__icon.icon--sales {
  background: #fce4ec;
  color: #c2185b;
}

.admin-shortcut-card__icon.icon--changelog {
  background: #eceff1;
  color: #546e7a;
}

.admin-shortcut-card__icon.icon--profile {
  background: #e8eaf6;
  color: #3f51b5;
}

.admin-shortcut-card__body {
  flex: 1;
  min-width: 0;
}

.admin-shortcut-card__label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
}

.admin-shortcut-card__desc {
  font-size: 0.75rem;
  color: #757575;
  margin-top: 2px;
}

.admin-shortcut-card__arrow {
  flex-shrink: 0;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
