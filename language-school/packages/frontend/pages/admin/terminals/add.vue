<template>
  <div class="admin-page-content">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-ma-none">Добавить терминал</h1>
        <p class="text-grey q-ma-none q-mt-xs">Терминал привязывается к пользователю с ролью MERCHANT</p>
      </div>
      <div class="col-auto">
        <q-btn outline color="grey-7" icon="arrow_back" label="Назад" to="/admin/terminals" />
      </div>
    </div>

    <!-- Step indicator -->
    <div class="steps-row q-mb-lg">
      <div class="step" :class="{ 'step--active': !created, 'step--done': !!created }">
        <div class="step__num">1</div>
        <div class="step__label">Данные терминала</div>
      </div>
      <div class="step-line"></div>
      <div class="step" :class="{ 'step--active': !!created }">
        <div class="step__num">2</div>
        <div class="step__label">Credentials для ESP32</div>
      </div>
    </div>

    <!-- Step 1: Form -->
    <q-card v-if="!created" flat bordered class="admin-form-card">
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="admin-form">
          <div class="row q-col-gutter-md">
            <!-- Left col -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle1 text-weight-bold q-mb-md">
                <q-icon name="person" class="q-mr-sm" />Мерчант
              </div>

              <q-select
                v-model="form.userId"
                :options="merchantOptions"
                label="Пользователь (MERCHANT) *"
                option-label="label"
                option-value="id"
                emit-value
                map-options
                outlined
                :loading="loadingMerchants"
                :rules="[val => !!val || 'Выберите мерчанта']"
                class="q-mb-md"
                hint="Только пользователи с ролью MERCHANT без терминала"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Нет доступных мерчантов. <q-btn flat dense color="primary" label="Создать" to="/admin/users/add" />
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-avatar size="32px" color="primary" text-color="white" font-size="13px">
                        {{ scope.opt.label.charAt(0).toUpperCase() }}
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.phone || scope.opt.email || scope.opt.username }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <q-btn
                v-if="!loadingMerchants && merchantOptions.length === 0"
                color="primary"
                outline
                icon="person_add"
                label="Создать нового мерчанта"
                to="/admin/users/add"
                class="q-mb-md"
              />
            </div>

            <!-- Right col -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle1 text-weight-bold q-mb-md">
                <q-icon name="point_of_sale" class="q-mr-sm" />Точка продажи
              </div>

              <q-input
                v-model="form.name"
                label="Название точки *"
                outlined
                :rules="[val => !!val?.trim() || 'Обязательно']"
                class="q-mb-md"
                placeholder="Кантина, Буфет, Магазин, Книжная лавка..."
              />

              <q-input
                v-model="form.address"
                label="Адрес / местоположение"
                outlined
                class="q-mb-md"
                placeholder="1-й этаж, столовая / ул. Пушкина 15..."
                hint="Для вашего удобства — где физически стоит терминал"
              >
                <template v-slot:prepend><q-icon name="place" /></template>
              </q-input>

              <q-input
                v-model="form.terminalId"
                label="Terminal ID"
                outlined
                class="q-mb-md"
                placeholder="canteen_1, shop_main, library_1..."
                hint="Латиница + цифры + _ (без пробелов). Можно задать позже."
              >
                <template v-slot:prepend><q-icon name="hardware" /></template>
              </q-input>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="row q-gutter-sm">
            <q-btn type="submit" color="primary" label="Создать терминал" :loading="saving" icon="save" />
            <q-btn outline color="grey-7" label="Отмена" to="/admin/terminals" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Step 2: Credentials (shown after creation) -->
    <q-card v-else flat bordered class="admin-form-card">
      <q-card-section>
        <div class="credentials-success">
          <q-icon name="check_circle" size="3rem" color="positive" />
          <div class="text-h5 q-mt-md">Терминал создан!</div>
          <div class="text-body2 text-grey q-mt-xs">Сохраните эти данные — <strong>Auth Token показывается только один раз</strong></div>
        </div>

        <q-banner class="bg-amber-1 q-mt-lg rounded-borders" rounded>
          <template v-slot:avatar>
            <q-icon name="warning" color="amber-9" size="28px" />
          </template>
          <div class="text-weight-bold text-amber-9 q-mb-sm">Данные для прошивки ESP32</div>
          <div class="credentials-grid">
            <div class="cred-row">
              <span class="cred-label">Terminal ID:</span>
              <code class="cred-value">{{ created.terminalId || '(не задан — задайте позже)' }}</code>
              <q-btn v-if="created.terminalId" flat dense size="xs" icon="content_copy" color="amber-9" @click="copy(created.terminalId)" />
            </div>
            <div class="cred-row">
              <span class="cred-label">Auth Token:</span>
              <code class="cred-value token">{{ created.authToken }}</code>
              <q-btn flat dense size="xs" icon="content_copy" color="amber-9" @click="copy(created.authToken)" />
            </div>
          </div>
        </q-banner>

        <q-banner class="bg-blue-1 q-mt-md rounded-borders" rounded>
          <template v-slot:avatar>
            <q-icon name="developer_board" color="blue" />
          </template>
          <div class="text-caption">
            <strong>ESP32 Arduino/PlatformIO код (пример конфига):</strong>
            <pre class="code-block q-mt-xs">{{ esp32Config }}</pre>
          </div>
        </q-banner>

        <div class="row q-gutter-sm q-mt-lg">
          <q-btn color="primary" icon="add" label="Добавить ещё терминал" @click="resetForm" />
          <q-btn outline color="grey-7" icon="list" label="К списку терминалов" to="/admin/terminals" />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const config = useRuntimeConfig()
const API = config.public.apiBase as string

const loadingMerchants = ref(true)
const merchants = ref<any[]>([])
const saving = ref(false)
const created = ref<any>(null)

const form = ref({
  userId: null as string | null,
  name: '',
  address: '',
  terminalId: '',
})

const merchantOptions = computed(() =>
  merchants.value.map((m) => ({
    id: m.id,
    label: m.name || m.username,
    phone: m.phone,
    email: m.email,
    username: m.username,
  }))
)

const esp32Config = computed(() => {
  if (!created.value) return ''
  return `const char* TERMINAL_ID  = "${created.value.terminalId || 'ВАШ_TERMINAL_ID'}";
const char* AUTH_TOKEN   = "${created.value.authToken}";
const char* SERVER_URL   = "https://yourserver.com/api/v1/terminal/payment";`
})

async function loadMerchants() {
  loadingMerchants.value = true
  try {
    const data = await $fetch<any[]>(`${API}/admin/terminals/merchants`, { credentials: 'include' })
    merchants.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
  } finally {
    loadingMerchants.value = false
  }
}

async function handleSubmit() {
  if (!form.value.userId || !form.value.name?.trim()) return
  saving.value = true
  try {
    const res = await $fetch<any>(`${API}/admin/terminals`, {
      method: 'POST',
      credentials: 'include',
      body: {
        userId: form.value.userId,
        name: form.value.name.trim(),
        address: form.value.address?.trim() || undefined,
        terminalId: form.value.terminalId?.trim() || undefined,
      },
    })
    created.value = res
  } catch (e: any) {
    alert(e?.data?.error || 'Ошибка создания терминала')
  } finally {
    saving.value = false
  }
}

function resetForm() {
  created.value = null
  form.value = { userId: null, name: '', address: '', terminalId: '' }
  loadMerchants()
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
}

onMounted(loadMerchants)
</script>

<style scoped>
.steps-row {
  display: flex;
  align-items: center;
  gap: 0;
}
.step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: #f3f4f6;
  opacity: 0.5;
}
.step--active { opacity: 1; background: #eff6ff; }
.step--done { opacity: 1; background: #f0fdf4; }
.step__num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #d1d5db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}
.step--active .step__num { background: #3b82f6; }
.step--done .step__num { background: #16a34a; }
.step__label { font-size: 13px; font-weight: 500; }
.step-line { flex: 1; height: 2px; background: #e5e7eb; }

.credentials-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0 8px;
}

.credentials-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}
.cred-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.cred-label {
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  min-width: 100px;
}
.cred-value {
  font-family: monospace;
  font-size: 12px;
  background: white;
  border: 1px solid #fbbf24;
  border-radius: 4px;
  padding: 3px 8px;
  color: #1f2937;
  flex: 1;
}
.cred-value.token {
  word-break: break-all;
  font-size: 11px;
}
.code-block {
  font-family: monospace;
  font-size: 11px;
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px 14px;
  border-radius: 6px;
  white-space: pre;
  overflow-x: auto;
  margin: 0;
}
</style>
