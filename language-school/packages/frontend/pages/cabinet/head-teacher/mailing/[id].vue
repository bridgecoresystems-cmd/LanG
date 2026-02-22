<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__top">
        <NButton circle secondary @click="navigateTo('/cabinet/head-teacher/mailing')">
          <template #icon>
            <NIcon><component :is="ArrowBackIcon" /></NIcon>
          </template>
        </NButton>
        <div>
          <NH2 class="page-header__title">{{ mailing?.title || 'Рассылка' }}</NH2>
          <p class="page-header__subtitle">Информация и получатели</p>
        </div>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <NSpin size="large" />
    </div>

    <NAlert v-else-if="error" type="error" closable>{{ error }}</NAlert>

    <NGrid v-else-if="mailing" cols="1 m:12" responsive="screen" :x-gap="24" :y-gap="24">
      <NGi span="1 m:8">
        <NCard bordered class="content-card">
          <template #header>
            <NSpace align="center">
              <NIcon size="24" color="#18a058"><component :is="ContentIcon" /></NIcon>
              <NH3 style="margin: 0;">Текст сообщения</NH3>
            </NSpace>
          </template>
          <div class="mailing-content-box">
            <NText style="white-space: pre-wrap; font-size: 1.05rem; line-height: 1.7;">
              {{ mailing.content }}
            </NText>
          </div>
        </NCard>

        <NCard v-if="mailing.is_sent && recipients.length > 0" bordered class="recipients-card">
          <template #header>
            <NSpace align="center">
              <NIcon size="24" color="#18a058"><component :is="PeopleIcon" /></NIcon>
              <NH3 style="margin: 0;">Получатели ({{ recipients.length }})</NH3>
            </NSpace>
          </template>
          <NList :show-divider="true">
            <NListItem v-for="r in recipients" :key="r.id">
              <NSpace justify="space-between" align="center" style="width: 100%;">
                <NSpace align="center">
                  <NAvatar round size="small" :style="{ backgroundColor: r.is_read ? '#18a058' : '#999' }">
                    {{ (r.recipient_name || r.recipient_username || '?')[0]?.toUpperCase() }}
                  </NAvatar>
                  <NSpace vertical size="small">
                    <NText strong>{{ r.recipient_name || r.recipient_username || '—' }}</NText>
                    <NText depth="3" style="font-size: 12px;">{{ r.recipient_username }}</NText>
                  </NSpace>
                </NSpace>
                <NSpace align="center">
                  <NTag :type="r.is_read ? 'success' : 'warning'" size="small" round>
                    {{ r.is_read ? 'Прочитано' : 'Не прочитано' }}
                  </NTag>
                  <NText v-if="r.read_at" depth="3" style="font-size: 12px;">
                    {{ formatDate(r.read_at) }}
                  </NText>
                </NSpace>
              </NSpace>
            </NListItem>
          </NList>
        </NCard>
      </NGi>

      <NGi span="1 m:4">
        <NCard bordered class="info-card">
          <template #header>
            <NSpace align="center">
              <NIcon size="24" color="#18a058"><component :is="InfoIcon" /></NIcon>
              <NH3 style="margin: 0;">Информация</NH3>
            </NSpace>
          </template>
          <NList :show-divider="false">
            <NListItem>
              <NSpace vertical size="small">
                <NText depth="3">Статус</NText>
                <NTag :type="mailing.is_sent ? 'success' : 'default'" round>
                  {{ mailing.is_sent ? 'Отправлено' : 'Черновик' }}
                </NTag>
              </NSpace>
            </NListItem>
            <NListItem>
              <NSpace vertical size="small">
                <NText depth="3">Получатели</NText>
                <NTag secondary round>{{ mailing.recipient_type_display }}</NTag>
              </NSpace>
            </NListItem>
            <NListItem v-if="mailing.scheduled_at">
              <NSpace vertical size="small">
                <NText depth="3">Запланировано</NText>
                <NText strong>{{ formatDate(mailing.scheduled_at) }}</NText>
              </NSpace>
            </NListItem>
            <NListItem v-if="mailing.sent_at">
              <NSpace vertical size="small">
                <NText depth="3">Отправлено</NText>
                <NText strong>{{ formatDate(mailing.sent_at) }}</NText>
              </NSpace>
            </NListItem>
            <NListItem>
              <NSpace vertical size="small">
                <NText depth="3">Статистика</NText>
                <NSpace>
                  <NBadge :value="mailing.total_recipients || recipients.length" type="info">
                    <NTag secondary>Получателей</NTag>
                  </NBadge>
                  <NBadge v-if="mailing.is_sent" :value="readCount" type="success">
                    <NTag secondary>Прочитано</NTag>
                  </NBadge>
                </NSpace>
                <NProgress
                  v-if="mailing.is_sent && mailing.total_recipients > 0"
                  type="line"
                  :percentage="readPercentage"
                  :status="readPercentage === 100 ? 'success' : 'default'"
                  :show-indicator="true"
                  class="q-mt-sm"
                />
              </NSpace>
            </NListItem>
          </NList>
        </NCard>
      </NGi>
    </NGrid>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCabinetMailing, type MailingMessage, type MailingRecipient } from '~/composables/useCabinetMailing'
import {
  NCard,
  NButton,
  NIcon,
  NH2,
  NH3,
  NText,
  NTag,
  NList,
  NListItem,
  NBadge,
  NAvatar,
  NProgress,
  NGrid,
  NGi,
  NSpace,
  NSpin,
  NAlert,
} from 'naive-ui'
import {
  ChevronBackOutline as ArrowBackIcon,
  DocumentTextOutline as ContentIcon,
  InformationCircleOutline as InfoIcon,
  PeopleOutline as PeopleIcon,
} from '@vicons/ionicons5'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const authStore = useAuthStore()
const { getById, getRecipients } = useCabinetMailing()

const mailing = ref<MailingMessage | null>(null)
const recipients = ref<MailingRecipient[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const readCount = computed(() => recipients.value.filter((r) => r.is_read).length)

const readPercentage = computed(() => {
  const total = mailing.value?.total_recipients || 0
  if (!total) return 0
  return Math.round((readCount.value / total) * 100)
})

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadMailing() {
  const id = parseInt(route.params.id as string)
  if (!id) return
  loading.value = true
  error.value = null
  try {
    mailing.value = await getById(id)
    if (mailing.value.is_sent) {
      recipients.value = await getRecipients(id)
    }
  } catch (e: any) {
    error.value = e?.message || 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
}

function canAccess() {
  const u = authStore.user
  if (!u) return false
  const hasHeadTeacher = u.role === 'HEAD_TEACHER' || (u.additional_roles || []).includes('HEAD_TEACHER')
  return hasHeadTeacher || u.role === 'SUPERUSER'
}

onMounted(() => {
  if (!canAccess()) {
    navigateTo('/cabinet')
    return
  }
  loadMailing()
})
</script>

<style scoped>
.cabinet-page { padding-bottom: 40px; }
.page-header { margin-bottom: 32px; }
.page-header__top { display: flex; align-items: center; gap: 20px; }
.page-header__title { margin: 0 0 8px; font-weight: 700; font-size: 1.5rem; }
.page-header__subtitle { margin: 0; color: var(--n-text-color-3); }

.loading-state { text-align: center; padding: 4rem 2rem; }
.content-card, .info-card, .recipients-card {
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.recipients-card { margin-top: 24px; }
.mailing-content-box {
  background: var(--n-color-embedded);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--n-border-color);
}
</style>
