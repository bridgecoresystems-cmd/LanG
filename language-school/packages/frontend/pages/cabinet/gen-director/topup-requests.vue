<template>
  <div>
    <!-- Stats -->
    <div class="stats-row">
      <NCard class="stat-card" :bordered="false">
        <div class="stat-label">Всего заявок</div>
        <div class="stat-value">{{ allRequests.length }}</div>
      </NCard>
      <NCard class="stat-card stat-card--pending" :bordered="false">
        <div class="stat-label">Ожидают решения</div>
        <div class="stat-value">{{ pendingRequests.length }}</div>
      </NCard>
      <NCard class="stat-card stat-card--done" :bordered="false">
        <div class="stat-label">Одобрено (выполнено)</div>
        <div class="stat-value">{{ completedCount }}</div>
      </NCard>
      <NCard class="stat-card stat-card--sum" :bordered="false">
        <div class="stat-label">Сумма выполненных</div>
        <div class="stat-value">{{ completedSum }} 💎</div>
      </NCard>
    </div>

    <!-- Tabs -->
    <NTabs v-model:value="activeTab" type="line" animated style="margin-top: 24px;">

      <!-- Tab 1: Ожидают решения -->
      <NTabPane name="pending" :tab="`На рассмотрении (${pendingRequests.length})`">
        <NAlert v-if="!loading && pendingRequests.length === 0" type="success" style="margin-top: 12px;">
          Нет заявок, ожидающих вашего решения.
        </NAlert>

        <div v-for="req in pendingRequests" :key="req.id" class="request-card">
          <div class="request-card__header">
            <div class="request-card__meta">
              <NText strong style="font-size: 15px;">{{ req.title }}</NText>
              <NText depth="3" style="font-size: 12px; margin-left: 10px;">
                от {{ req.requesterName }} · {{ fmtDate(req.requestDate) }}
              </NText>
            </div>
            <div class="request-card__amount">{{ req.amount }} 💎</div>
          </div>
          <NText depth="3" style="font-size: 12px;">Создано: {{ fmtDateTime(req.createdAt) }}</NText>
          <NDivider style="margin: 10px 0;" />
          <NSpace>
            <NButton type="primary" size="small" :loading="acting === req.id + '_approve'" @click="handleApprove(req)">
              ✓ Одобрить
            </NButton>
            <NButton type="error" size="small" ghost :loading="acting === req.id + '_reject'" @click="openReject(req)">
              ✗ Отклонить
            </NButton>
          </NSpace>
        </div>
      </NTabPane>

      <!-- Tab 2: Все заявки (история) -->
      <NTabPane name="history" tab="История всех заявок">
        <NSpin v-if="loading" style="margin-top: 24px;" />

        <div v-for="req in allRequests" :key="req.id" class="request-card">
          <div class="request-card__header">
            <div class="request-card__meta">
              <NTag :type="statusType(req.status)" size="small" round style="margin-right: 8px;">
                {{ statusLabel(req.status) }}
              </NTag>
              <NText strong>{{ req.title }}</NText>
              <NText depth="3" style="font-size: 12px; margin-left: 8px;">
                от {{ req.requesterName }}
              </NText>
            </div>
            <div class="request-card__amount">{{ req.amount }} 💎</div>
          </div>

          <div class="request-card__dates">
            <span>Дата заявки: {{ fmtDate(req.requestDate) }}</span>
            <span v-if="req.directorActedAt"> · Решение директора: {{ fmtDate(req.directorActedAt) }}</span>
            <span v-if="req.adminActedAt"> · Выполнено: {{ fmtDate(req.adminActedAt) }}</span>
          </div>

          <div v-if="req.directorComment" class="request-card__comment">
            💬 Мой комментарий: <em>{{ req.directorComment }}</em>
          </div>

          <!-- Expandable logs -->
          <NCollapse style="margin-top: 8px;" :default-expanded-names="[]">
            <NCollapseItem :title="`История изменений (${req.logs.length})`" :name="req.id">
              <NTimeline>
                <NTimelineItem
                  v-for="log in req.logs"
                  :key="log.id"
                  :type="logType(log.action)"
                  :title="logLabel(log.action)"
                  :content="[log.actorName, log.actorRole].filter(Boolean).join(' · ') + (log.comment ? ': ' + log.comment : '')"
                  :time="fmtDateTime(log.createdAt)"
                />
              </NTimeline>
            </NCollapseItem>
          </NCollapse>
        </div>
      </NTabPane>

    </NTabs>

    <!-- Reject modal -->
    <NModal
      v-model:show="showRejectModal"
      preset="dialog"
      title="Отклонить заявку"
      positive-text="Отклонить"
      negative-text="Отмена"
      :positive-button-props="{ type: 'error' }"
      @positive-click="confirmReject"
      @negative-click="showRejectModal = false"
    >
      <NText depth="3" style="display: block; margin-bottom: 8px;">
        Заявка: <strong>{{ rejectingReq?.title }}</strong> · {{ rejectingReq?.amount }} 💎
      </NText>
      <NFormItem label="Комментарий для главбуха (необязательно)">
        <NInput
          v-model:value="rejectComment"
          type="textarea"
          :rows="3"
          placeholder="Причина отклонения..."
        />
      </NFormItem>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NTabs, NTabPane, NCard, NText, NTag, NButton, NSpace, NAlert,
  NModal, NInput, NFormItem, NTimeline, NTimelineItem,
  NCollapse, NCollapseItem, NDivider, NSpin, useMessage,
} from 'naive-ui'
import { useRuntimeConfig } from '#app'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const config = useRuntimeConfig()
const API = config.public.apiBase as string
const message = useMessage()

const loading = ref(false)
const acting = ref<string | null>(null)
const activeTab = ref('pending')
const allRequests = ref<any[]>([])

// Pending — те что ждут решения (подгружаем отдельно для кнопок)
const pendingRequests = ref<any[]>([])

const showRejectModal = ref(false)
const rejectComment = ref('')
const rejectingReq = ref<any>(null)

const completedCount = computed(() => allRequests.value.filter(r => r.status === 'completed').length)
const completedSum = computed(() => allRequests.value.filter(r => r.status === 'completed').reduce((s, r) => s + r.amount, 0))

// ── Helpers ──

function fmtDate(v: string | null) {
  return v ? new Date(v).toLocaleDateString('ru-RU') : '—'
}
function fmtDateTime(v: string | null) {
  return v ? new Date(v).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    pending_director: 'Ожидает директора',
    pending_admin: 'Ожидает пополнения',
    rejected: 'Отклонено',
    completed: 'Выполнено',
  }
  return m[s] || s
}

function statusType(s: string): 'info' | 'warning' | 'error' | 'success' | 'default' {
  const m: Record<string, 'info' | 'warning' | 'error' | 'success'> = {
    pending_director: 'info',
    pending_admin: 'warning',
    rejected: 'error',
    completed: 'success',
  }
  return m[s] || 'default'
}

function logLabel(action: string) {
  const m: Record<string, string> = {
    created: 'Заявка создана',
    resubmitted: 'Отправлено повторно',
    director_approved: 'Директор одобрил',
    director_rejected: 'Директор отклонил',
    admin_completed: 'Администратор пополнил баланс',
  }
  return m[action] || action
}

function logType(action: string): 'default' | 'info' | 'success' | 'error' | 'warning' {
  const m: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
    created: 'info',
    resubmitted: 'warning',
    director_approved: 'success',
    director_rejected: 'error',
    admin_completed: 'success',
  }
  return m[action] || 'default'
}

// ── Data loading ──

async function load() {
  loading.value = true
  try {
    const [pending, all] = await Promise.all([
      $fetch<any[]>(`${API}/cabinet/gems/topup-requests/for-director`, { credentials: 'include' }),
      $fetch<any[]>(`${API}/cabinet/gems/topup-requests/director-all`, { credentials: 'include' }),
    ])
    pendingRequests.value = Array.isArray(pending) ? pending : []
    allRequests.value = Array.isArray(all) ? all : []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// ── Actions ──

async function handleApprove(req: any) {
  acting.value = req.id + '_approve'
  try {
    await $fetch(`${API}/cabinet/gems/topup-requests/${req.id}/approve`, { method: 'POST', credentials: 'include' })
    message.success(`Заявка «${req.title}» одобрена и передана администратору`)
    await load()
    if (allRequests.value.filter(r => r.status === 'pending_director').length === 0) {
      activeTab.value = 'history'
    }
  } catch (e: any) {
    const body = e?.data ?? e?.value
    const err = body && typeof body === 'object' ? (body.error || JSON.stringify(body)) : (e?.message || 'Ошибка')
    message.error(err)
  } finally {
    acting.value = null
  }
}

function openReject(req: any) {
  rejectingReq.value = req
  rejectComment.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  if (!rejectingReq.value) return
  acting.value = rejectingReq.value.id + '_reject'
  try {
    await $fetch(`${API}/cabinet/gems/topup-requests/${rejectingReq.value.id}/reject`, {
      method: 'POST',
      credentials: 'include',
      body: { comment: rejectComment.value || undefined },
    })
    message.warning(`Заявка «${rejectingReq.value.title}» отклонена`)
    showRejectModal.value = false
    await load()
  } catch (e: any) {
    const body = e?.data ?? e?.value
    const err = body && typeof body === 'object' ? (body.error || JSON.stringify(body)) : (e?.message || 'Ошибка')
    message.error(err)
  } finally {
    acting.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 4px;
}

.stat-card {
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
}
.stat-card--pending { background: linear-gradient(135deg, #fff7ed, #fed7aa); }
.stat-card--done    { background: linear-gradient(135deg, #f0fdf4, #bbf7d0); }
.stat-card--sum     { background: linear-gradient(135deg, #eff6ff, #bfdbfe); }

.stat-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 26px;
  font-weight: 900;
  color: #111827;
}

.request-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px 18px;
  margin-top: 12px;
}
.request-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 4px;
  gap: 12px;
}
.request-card__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.request-card__amount {
  font-size: 18px;
  font-weight: 800;
  color: #15803d;
  white-space: nowrap;
}
.request-card__dates {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}
.request-card__comment {
  font-size: 13px;
  color: #b45309;
  background: #fef3c7;
  border-radius: 6px;
  padding: 6px 10px;
  margin-top: 8px;
}
</style>
