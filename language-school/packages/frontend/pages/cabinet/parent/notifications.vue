<template>
  <div class="parent-notifications-page">

    <!-- Coming soon alert -->
    <NAlert type="info" :bordered="false" class="coming-soon-alert" title="Скоро здесь появятся реальные уведомления">
      В будущем здесь будут отображаться уведомления об оценках, гемах и активности вашего ребёнка в реальном времени.
    </NAlert>

    <!-- Mock notifications list -->
    <NCard class="notifications-card" :content-style="{ padding: 0 }">
      <div class="notifications-header">
        <span class="notifications-header__title">Уведомления</span>
        <NTag size="small" type="default">{{ mockNotifications.length }}</NTag>
      </div>

      <NList :show-divider="true" class="notifications-list">
        <NListItem v-for="item in mockNotifications" :key="item.id">
          <template #prefix>
            <div class="notif-icon" :style="{ backgroundColor: item.color + '20' }">
              <span>{{ item.emoji }}</span>
            </div>
          </template>
          <div class="notif-body">
            <div class="notif-body__main">
              <NTag
                :color="{ color: item.color + '20', textColor: item.color, borderColor: 'transparent' }"
                size="small"
                round
              >
                {{ item.type }}
              </NTag>
              <span class="notif-body__text">{{ item.text }}</span>
            </div>
            <div class="notif-body__time">{{ item.time }}</div>
          </div>
        </NListItem>
      </NList>
    </NCard>

  </div>
</template>

<script setup lang="ts">
import { NAlert, NCard, NList, NListItem, NTag } from 'naive-ui'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const mockNotifications = [
  {
    id: 1,
    emoji: '📝',
    type: 'Оценка',
    text: 'Иван получил оценку 5.0 по разделу "Writing" в группе Advanced English',
    time: 'Сегодня, 10:30',
    color: '#18a058',
  },
  {
    id: 2,
    emoji: '💎',
    type: 'Гемы получены',
    text: 'Иван получил 10 💎 от учителя за отличный ответ на уроке',
    time: 'Сегодня, 09:15',
    color: '#3b82f6',
  },
  {
    id: 3,
    emoji: '🛍️',
    type: 'Гемы потрачены',
    text: 'Иван потратил 5 💎 в школьном магазине',
    time: 'Вчера, 14:20',
    color: '#f59e0b',
  },
  {
    id: 4,
    emoji: '✅',
    type: 'Посещаемость',
    text: 'Иван присутствовал на уроке "Advanced English" 7 марта',
    time: 'Вчера, 11:00',
    color: '#18a058',
  },
  {
    id: 5,
    emoji: '❌',
    type: 'Пропуск',
    text: 'Иван не явился на урок "Advanced English" 5 марта',
    time: '5 марта, 09:00',
    color: '#ef4444',
  },
]
</script>

<style scoped>
.parent-notifications-page {
  padding-bottom: 60px;
}

.coming-soon-alert {
  margin-bottom: 24px;
  border-radius: 12px;
}

.notifications-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--n-border-color);
}

.notifications-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--n-border-color);
}

.notifications-header__title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.notifications-list {
  padding: 0;
}

.notif-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.notif-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.notif-body__main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.notif-body__text {
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
}

.notif-body__time {
  font-size: 12px;
  color: #9ca3af;
}
</style>
