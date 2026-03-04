<template>
  <div class="vendors-page">

    <!-- Page header -->
    <header class="page-header">
      <div class="page-header__text">
        <h1 class="page-header__title">Вендоры</h1>
        <p class="page-header__subtitle">Точки приёма гемов — кантина, буфет, магазин при школе</p>
      </div>
      <NButton type="primary" @click="openCreate" class="add-btn">
        <template #icon><NIcon><component :is="AddIcon" /></NIcon></template>
        Добавить вендора
      </NButton>
    </header>

    <!-- Stats -->
    <div class="stats-row">
      <NCard class="stat-card" :bordered="false">
        <div class="stat-card__label">Всего вендоров</div>
        <div class="stat-card__value">{{ vendors.length }}</div>
      </NCard>
      <NCard class="stat-card" :bordered="false">
        <div class="stat-card__label">Активных</div>
        <div class="stat-card__value stat-card__value--green">{{ activeCount }}</div>
      </NCard>
    </div>

    <!-- Vendors table -->
    <NCard bordered class="vendors-card">
      <template #header>
        <span class="card-header__title">Список вендоров</span>
      </template>
      <NDataTable
        :columns="columns"
        :data="vendors"
        :loading="loading"
        :bordered="false"
        :row-key="(r: any) => r.id"
        class="vendors-table"
      />
      <div v-if="!loading && vendors.length === 0" class="empty-state">
        <p class="empty-state__text">Вендоры ещё не созданы</p>
        <p class="empty-state__hint">Вендор — это точка приёма гемов (кантина, буфет). Добавьте первого вендора, чтобы ученики могли тратить гемы.</p>
        <NButton type="primary" @click="openCreate" style="margin-top: 16px;">
          <template #icon><NIcon><component :is="AddIcon" /></NIcon></template>
          Добавить вендора
        </NButton>
      </div>
    </NCard>

    <!-- Create / Edit Modal -->
    <NModal v-model:show="showModal" preset="card" style="width: 500px;" :title="editingId ? 'Редактировать вендора' : 'Новый вендор'">
      <div class="vendor-form">
        <div class="vendor-form__field">
          <div class="vendor-form__label">Название точки <span style="color:#ef4444">*</span></div>
          <NInput v-model:value="form.name" placeholder="Кантина, Буфет, Магазин..." />
        </div>
        <div v-if="!editingId" class="vendor-form__field">
          <div class="vendor-form__label">Пользователь вендора <span style="color:#ef4444">*</span></div>
          <NSelect
            v-model:value="form.userId"
            :options="merchantOptions"
            filterable
            placeholder="Выберите пользователя с ролью MERCHANT"
            :loading="loadingMerchants"
          />
          <div class="vendor-form__hint">Создайте пользователя с ролью MERCHANT заранее</div>
        </div>
        <div class="vendor-form__field">
          <div class="vendor-form__label">Terminal ID <span style="color:#9ca3af">(прошить в ESP32)</span></div>
          <NInput v-model:value="form.terminalId" placeholder="canteen_1, shop_main..." />
          <div class="vendor-form__hint">Уникальный идентификатор. Прошивается в ESP32 при настройке.</div>
        </div>
        <div v-if="createdVendor" class="vendor-token-box">
          <div class="vendor-token-box__title">🔑 Auth Token (сохраните сейчас!)</div>
          <div class="vendor-token-box__token">{{ createdVendor.authToken }}</div>
          <div class="vendor-token-box__note">Этот токен показывается только один раз. Прошейте его в ESP32 вместе с Terminal ID.</div>
        </div>
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton size="medium" @click="closeModal">{{ createdVendor ? 'Готово' : 'Отмена' }}</NButton>
          <NButton v-if="!createdVendor" type="primary" size="medium" :loading="saving" :disabled="!form.name || (!editingId && !form.userId)" @click="doSave">
            {{ editingId ? 'Сохранить' : 'Создать' }}
          </NButton>
        </NSpace>
      </template>
    </NModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import { NCard, NDataTable, NButton, NIcon, NModal, NInput, NInputNumber, NSelect, NSpace, NTag, useMessage, NSwitch } from 'naive-ui'
import { AddOutline as AddIcon, CreateOutline as EditIcon } from '@vicons/ionicons5'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const config = useRuntimeConfig()
const API = config.public.apiBase as string
const message = useMessage()

const loading = ref(true)
const vendors = ref<any[]>([])
const loadingMerchants = ref(false)
const merchants = ref<any[]>([])

const showModal = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const createdVendor = ref<any>(null)

const form = ref({ name: '', userId: null as string | null, terminalId: '' })

const activeCount = computed(() => vendors.value.filter((v: any) => v.isActive).length)

const merchantOptions = computed(() =>
  merchants.value.map((m) => ({
    label: m.name || m.id,
    value: m.id,
  }))
)

const columns = computed(() => [
  {
    title: 'Название',
    key: 'name',
    render: (row: any) => h('span', { class: 'vendor-name' }, row.name),
  },
  {
    title: 'Пользователь',
    key: 'userName',
    render: (row: any) => row.userName || row.userId,
  },
  {
    title: 'Terminal ID',
    key: 'terminalId',
    render: (row: any) => row.terminalId
      ? h('code', { class: 'code-badge' }, row.terminalId)
      : h('span', { class: 'text-muted' }, 'Не задан'),
  },
  {
    title: 'Auth Token',
    key: 'authToken',
    render: (row: any) => h('code', { class: 'code-badge code-badge--small' }, (row.authToken || '').slice(0, 16) + '...'),
  },
  {
    title: 'Статус',
    key: 'isActive',
    width: 100,
    render: (row: any) => h(NTag, { type: row.isActive ? 'success' : 'default', size: 'small', round: true }, { default: () => row.isActive ? 'Активен' : 'Отключён' }),
  },
  {
    title: '',
    key: 'actions',
    width: 160,
    render: (row: any) => h('div', { class: 'actions-cell' }, [
      h(NButton, { size: 'small', quaternary: true, onClick: () => openEdit(row) }, { default: () => 'Изменить', icon: () => h(NIcon, null, { default: () => h(EditIcon) }) }),
      h(NButton, {
        size: 'small',
        type: row.isActive ? 'warning' : 'success',
        ghost: true,
        onClick: () => toggleActive(row),
      }, { default: () => row.isActive ? 'Отключить' : 'Включить' }),
    ]),
  },
])

function openCreate() {
  editingId.value = null
  createdVendor.value = null
  form.value = { name: '', userId: null, terminalId: '' }
  loadMerchants()
  showModal.value = true
}

function openEdit(vendor: any) {
  editingId.value = vendor.id
  createdVendor.value = null
  form.value = { name: vendor.name, userId: vendor.userId, terminalId: vendor.terminalId || '' }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  createdVendor.value = null
}

async function doSave() {
  saving.value = true
  try {
    if (editingId.value) {
      await $fetch(`${API}/cabinet/gems/vendors/${editingId.value}`, {
        method: 'PATCH',
        credentials: 'include',
        body: { name: form.value.name, terminalId: form.value.terminalId || undefined },
      })
      message.success('Вендор обновлён')
      showModal.value = false
    } else {
      const res = await $fetch<any>(`${API}/cabinet/gems/vendors`, {
        method: 'POST',
        credentials: 'include',
        body: { name: form.value.name, userId: form.value.userId, terminalId: form.value.terminalId || undefined },
      })
      createdVendor.value = res
      message.success('Вендор создан!')
    }
    await loadVendors()
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    saving.value = false
  }
}

async function toggleActive(vendor: any) {
  try {
    await $fetch(`${API}/cabinet/gems/vendors/${vendor.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: { isActive: !vendor.isActive },
    })
    vendor.isActive = !vendor.isActive
  } catch {
    message.error('Ошибка')
  }
}

async function loadMerchants() {
  loadingMerchants.value = true
  try {
    // Load users with MERCHANT role — reuse users-to-send but filtered (or all-wallets endpoint)
    const data = await $fetch<any[]>(`${API}/cabinet/gems/all-wallets`, { credentials: 'include' })
    merchants.value = (Array.isArray(data) ? data : [])
      .filter((u) => (u.role || '').toUpperCase() === 'MERCHANT')
      .map((u) => ({ id: u.userId, name: u.name }))
  } catch {
    merchants.value = []
  } finally {
    loadingMerchants.value = false
  }
}

async function loadVendors() {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/gems/vendors`, { credentials: 'include' })
    vendors.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Vendors load failed', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadVendors)
</script>

<style scoped>
.vendors-page {
  padding-bottom: 60px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.page-header__title {
  margin: 0 0 4px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--n-text-color-1);
}

.page-header__subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--n-text-color-3);
}

.add-btn {
  flex-shrink: 0;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 14px;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
}

.stat-card__label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-card__value {
  font-size: 28px;
  font-weight: 900;
  color: #111827;
}

.stat-card__value--green {
  color: #15803d;
}

.vendors-card {
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.card-header__title {
  font-weight: 700;
  font-size: 16px;
}

.vendors-table :deep(.n-data-table-th) {
  background: #f8fafc !important;
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  padding: 12px 16px !important;
  white-space: nowrap;
  border-bottom: 1px solid #e2e8f0;
}

.vendors-table :deep(.n-data-table-td) {
  padding: 14px 16px !important;
  font-size: 0.9rem;
  border-bottom: 1px solid #f1f5f9;
}

.vendors-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: #f8fafc !important;
}

.vendor-name {
  font-weight: 600;
  color: var(--n-text-color-1);
}

.code-badge {
  font-size: 12px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: ui-monospace, monospace;
  color: #334155;
}

.code-badge--small {
  font-size: 11px;
}

.text-muted {
  color: var(--n-text-color-3);
}

.actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.actions-cell .n-button {
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-state__text {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--n-text-color-1);
}

.empty-state__hint {
  margin: 0;
  font-size: 14px;
  color: var(--n-text-color-3);
  line-height: 1.6;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.vendor-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.vendor-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vendor-form__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color-1);
}

.vendor-form__hint {
  font-size: 12px;
  color: var(--n-text-color-3);
}

.vendor-token-box {
  background: #fefce8;
  border: 1px solid #fbbf24;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vendor-token-box__title {
  font-size: 14px;
  font-weight: 700;
  color: #92400e;
}

.vendor-token-box__token {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  word-break: break-all;
  background: white;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 10px 12px;
  color: #1f2937;
}

.vendor-token-box__note {
  font-size: 12px;
  color: #92400e;
  line-height: 1.5;
}

/* Dark mode */
.dark .stat-card {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08));
}

.dark .stat-card__value {
  color: var(--n-text-color-1);
}

.dark .stat-card__value--green {
  color: #4ade80;
}

.dark .vendors-table :deep(.n-data-table-th) {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #94a3b8;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.dark .code-badge {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}
</style>
