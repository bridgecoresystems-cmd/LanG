<template>
  <div class="admin-page-content">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div class="col">
        <div class="row items-center q-gutter-sm">
          <q-btn flat dense round icon="arrow_back" @click="navigateTo('/admin/users')" />
          <h1 class="text-h5 q-ma-none">Профиль пользователя</h1>
        </div>
      </div>
      <div class="col-auto row q-gutter-sm">
        <q-btn
          v-if="user && canImpersonateUser"
          outline color="teal"
          icon="manage_accounts"
          label="Войти под пользователем"
          @click="handleImpersonate"
        />
        <q-btn
          outline color="primary"
          icon="edit"
          label="Редактировать"
          :to="`/admin/users/${userId}`"
        />
        <q-btn
          outline color="negative"
          icon="delete"
          label="Удалить"
          @click="handleDelete"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="row justify-center q-pa-xl">
      <q-spinner size="50px" color="primary" />
    </div>

    <template v-else-if="user">
      <!-- User Hero Card -->
      <q-card flat bordered class="q-mb-lg">
        <q-card-section>
          <div class="row items-center q-gutter-lg">
            <!-- Avatar -->
            <div class="col-auto">
              <q-avatar size="80px" v-if="avatarSrc">
                <img :src="avatarSrc" />
              </q-avatar>
              <q-avatar size="80px" color="primary" text-color="white" font-size="28px" v-else>
                {{ initials }}
              </q-avatar>
            </div>
            <!-- Name + roles -->
            <div class="col">
              <div class="text-h5 text-weight-bold">{{ user.full_name || user.username }}</div>
              <div class="text-caption text-grey-6 q-mb-sm">@{{ user.username }}</div>
              <div class="row q-gutter-xs">
                <q-badge :color="getRoleColor(user.role)" class="text-caption q-px-sm">
                  {{ getRoleLabel(user.role) }}
                </q-badge>
                <q-badge
                  v-for="role in user.additional_roles"
                  :key="role"
                  color="grey-6"
                  class="text-caption q-px-sm"
                >
                  {{ getRoleLabel(role) }}
                </q-badge>
              </div>
            </div>
            <!-- Status -->
            <div class="col-auto text-right">
              <q-chip
                :color="user.is_active ? 'positive' : 'negative'"
                text-color="white"
                :icon="user.is_active ? 'check_circle' : 'cancel'"
                :label="user.is_active ? 'Активен' : 'Заблокирован'"
              />
              <div class="text-caption text-grey-6 q-mt-sm">
                Создан: {{ formatDate(user.created_at) }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Tabs -->
      <q-card flat bordered>
        <q-tabs
          v-model="tab"
          dense
          align="left"
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          narrow-indicator
        >
          <q-tab name="info" icon="person" label="Информация" />
          <q-tab name="activity" icon="history" label="Активность" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <!-- Tab 1: Info -->
          <q-tab-panel name="info" class="q-pa-lg">
            <div class="row q-col-gutter-lg">
              <!-- Left column -->
              <div class="col-12 col-md-6">
                <div class="info-section">
                  <div class="info-section-title">
                    <q-icon name="badge" color="primary" size="18px" />
                    Личные данные
                  </div>
                  <div class="info-grid">
                    <div class="info-row">
                      <span class="info-label">Имя</span>
                      <span class="info-value">{{ user.first_name || '—' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Фамилия</span>
                      <span class="info-value">{{ user.last_name || '—' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Логин</span>
                      <span class="info-value mono">{{ user.username }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Email</span>
                      <span class="info-value">{{ user.email || '—' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Телефон</span>
                      <span class="info-value">{{ user.phone || '—' }}</span>
                    </div>
                  </div>
                </div>

                <div class="info-section q-mt-lg">
                  <div class="info-section-title">
                    <q-icon name="school" color="primary" size="18px" />
                    Учебная информация
                  </div>
                  <div class="info-grid">
                    <div class="info-row">
                      <span class="info-label">Школа</span>
                      <span class="info-value">{{ user.school_name || '—' }}</span>
                    </div>
                    <div v-if="user.role === 'STUDENT'" class="info-row">
                      <span class="info-label">Родитель</span>
                      <span class="info-value">
                        <template v-if="user.parent_name">
                          <q-btn
                            flat dense no-caps size="sm" color="primary"
                            :label="user.parent_name"
                            @click="navigateTo(`/admin/users/view/${user.parent_id}`)"
                          />
                        </template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div v-if="user.role === 'STUDENT' && user.rfid_uid" class="info-row">
                      <span class="info-label">RFID UID</span>
                      <span class="info-value mono">{{ user.rfid_uid }}</span>
                    </div>
                    <div v-if="user.additional_school_names?.length" class="info-row">
                      <span class="info-label">Доп. школы</span>
                      <div class="info-value row q-gutter-xs">
                        <q-badge
                          v-for="name in user.additional_school_names"
                          :key="name"
                          color="blue-1"
                          text-color="blue-8"
                        >{{ name }}</q-badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right column -->
              <div class="col-12 col-md-6">
                <div class="info-section">
                  <div class="info-section-title">
                    <q-icon name="manage_accounts" color="primary" size="18px" />
                    Доступ и права
                  </div>
                  <div class="info-grid">
                    <div class="info-row">
                      <span class="info-label">Основная роль</span>
                      <span class="info-value">
                        <q-badge :color="getRoleColor(user.role)">{{ getRoleLabel(user.role) }}</q-badge>
                      </span>
                    </div>
                    <div v-if="user.additional_roles?.length" class="info-row">
                      <span class="info-label">Доп. роли</span>
                      <div class="info-value row q-gutter-xs">
                        <q-badge
                          v-for="role in user.additional_roles"
                          :key="role"
                          color="grey-5"
                        >{{ getRoleLabel(role) }}</q-badge>
                      </div>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Экспорт Excel</span>
                      <span class="info-value">
                        <q-icon
                          :name="user.can_export_excel ? 'check_circle' : 'cancel'"
                          :color="user.can_export_excel ? 'positive' : 'grey-4'"
                        />
                      </span>
                    </div>
                    <div v-if="user.role === 'ACCOUNTANT'" class="info-row">
                      <span class="info-label">Все школы</span>
                      <span class="info-value">
                        <q-icon
                          :name="user.can_view_all_schools ? 'check_circle' : 'cancel'"
                          :color="user.can_view_all_schools ? 'positive' : 'grey-4'"
                        />
                      </span>
                    </div>
                  </div>
                </div>

                <div class="info-section q-mt-lg">
                  <div class="info-section-title">
                    <q-icon name="diamond" color="amber-8" size="18px" />
                    💎 Гемы
                  </div>
                  <div class="info-grid">
                    <div class="info-row">
                      <span class="info-label">Баланс</span>
                      <span class="info-value text-weight-bold" :class="gemsBalance > 0 ? 'text-positive' : ''">
                        {{ gemsBalance }} 💎
                      </span>
                    </div>
                  </div>
                </div>

                <div class="info-section q-mt-lg">
                  <div class="info-section-title">
                    <q-icon name="info" color="primary" size="18px" />
                    Системная информация
                  </div>
                  <div class="info-grid">
                    <div class="info-row">
                      <span class="info-label">ID</span>
                      <span class="info-value mono text-caption">{{ user.id }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Создан</span>
                      <span class="info-value">{{ formatDate(user.created_at) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Обновлён</span>
                      <span class="info-value">{{ formatDate(user.updated_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-tab-panel>

          <!-- Tab 2: Activity (placeholder) -->
          <q-tab-panel name="activity" class="q-pa-lg">
            <div class="row justify-center q-pa-xl text-grey-5 column items-center">
              <q-icon name="history" size="4rem" class="q-mb-md" />
              <div class="text-h6">Скоро</div>
              <div class="text-body2">История действий пользователя будет здесь</div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </template>

    <!-- Not found -->
    <div v-else class="row justify-center q-pa-xl">
      <div class="text-center">
        <q-icon name="person_off" size="4rem" color="grey-4" />
        <div class="text-h6 q-mt-md text-grey-6">Пользователь не найден</div>
        <q-btn flat color="primary" label="Назад к списку" icon="arrow_back" @click="navigateTo('/admin/users')" class="q-mt-sm" />
      </div>
    </div>

    <!-- Delete confirm -->
    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Удалить пользователя?</div>
          <p class="q-mt-sm q-mb-none text-body2">
            {{ user?.full_name || user?.username }} будет удалён без возможности восстановления.
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn flat label="Удалить" color="negative" :loading="deleting" @click="confirmDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const $q = useQuasar()
const { avatarUrl } = useAvatarUrl()
const { getById, remove } = useAdminUsers()
const { impersonate } = useImpersonate()
const config = useRuntimeConfig()
const API = config.public.apiBase as string

const userId = computed(() => route.params.id as string)
const user = ref<any>(null)
const loading = ref(true)
const tab = ref('info')
const gemsBalance = ref(0)
const showDeleteConfirm = ref(false)
const deleting = ref(false)

const ROLE_LABELS: Record<string, string> = {
  SUPERUSER: 'Суперпользователь', GEN_DIRECTOR: 'Ген. директор',
  HEAD_ACCOUNTANT: 'Гл. бухгалтер', DIRECTOR: 'Директор',
  HEAD_TEACHER: 'Завуч', TEACHER: 'Учитель', STUDENT: 'Ученик',
  PARENT: 'Родитель', MERCHANT: 'Мерчант', SALES: 'Продажи',
  RECEPTIONIST: 'Рецепция', EDITOR: 'Редактор', ACCOUNTANT: 'Бухгалтер',
}

const ROLE_COLORS: Record<string, string> = {
  SUPERUSER: 'deep-purple', GEN_DIRECTOR: 'purple', HEAD_ACCOUNTANT: 'indigo',
  DIRECTOR: 'blue-9', HEAD_TEACHER: 'teal', TEACHER: 'green',
  STUDENT: 'light-blue', PARENT: 'orange', MERCHANT: 'amber-9',
  SALES: 'cyan', RECEPTIONIST: 'pink', EDITOR: 'lime-9', ACCOUNTANT: 'blue-grey',
}

const getRoleLabel = (role: string) => ROLE_LABELS[role] || role
const getRoleColor = (role: string) => ROLE_COLORS[role] || 'grey'

const avatarSrc = computed(() => user.value?.avatar ? avatarUrl(user.value.avatar) : null)
const initials = computed(() => {
  const u = user.value
  if (!u) return '?'
  return ((u.first_name?.[0] || '') + (u.last_name?.[0] || '')).toUpperCase() || u.username?.[0]?.toUpperCase() || '?'
})

const canImpersonateUser = computed(() => user.value?.role !== 'SUPERUSER')

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function handleDelete() {
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!user.value) return
  deleting.value = true
  try {
    await remove(userId.value as any)
    navigateTo('/admin/users')
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Ошибка при удалении' })
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

async function handleImpersonate() {
  $q.dialog({
    title: 'Войти под пользователем',
    message: `Вы войдёте под учётной записью <b>${user.value?.full_name || user.value?.username}</b>.`,
    html: true,
    cancel: true,
    ok: { label: 'Войти', color: 'teal' },
  }).onOk(async () => {
    try {
      await impersonate(userId.value)
    } catch (e: any) {
      $q.notify({ type: 'negative', message: e?.data?.error || 'Ошибка при входе' })
    }
  })
}

onMounted(async () => {
  try {
    const data = await getById(userId.value as any)
    if (!data) { navigateTo('/admin/users'); return }
    user.value = data

    // Load gems balance
    try {
      const gems = await $fetch<{ balance: number }>(`${API}/admin/users/${userId.value}/gems`, {
        credentials: 'include',
      })
      gemsBalance.value = gems?.balance ?? 0
    } catch { /* no gems wallet yet */ }
  } catch {
    navigateTo('/admin/users')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.info-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 12px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.info-label {
  font-size: 0.82rem;
  color: #94a3b8;
  font-weight: 500;
  min-width: 130px;
  flex-shrink: 0;
}

.info-value {
  font-size: 0.9rem;
  color: #1e293b;
  font-weight: 500;
  flex: 1;
}

.info-value.mono {
  font-family: monospace;
  font-size: 0.85rem;
}
</style>
