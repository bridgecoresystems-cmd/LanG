<template>
  <div class="admin-page-content">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-ma-none">Добавить пользователя</h1>
      </div>
      <div class="col-auto">
        <q-btn outline color="grey-7" icon="arrow_back" label="Назад" to="/admin/users" />
      </div>
    </div>

    <q-card flat bordered class="admin-form-card">
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="admin-form">
          <div class="row q-col-gutter-md">
            <!-- Первая колонка -->
            <div class="col-6">
              <q-select
                v-model="form.role"
                :options="roleOptions"
                label="Роль *"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                outlined
                :rules="[val => !!val || 'Обязательно']"
                @update:model-value="onRoleChange"
                class="q-mb-md"
              />

              <q-input v-model="form.first_name" label="Имя *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />
              <q-input v-model="form.last_name" label="Фамилия *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />
              <q-input v-model="form.email" label="Email" type="email" outlined class="q-mb-md" />
              <q-input v-model="form.phone" label="Телефон" outlined class="q-mb-md" />

              <!-- Фото -->
              <div class="q-mb-md">
                <div class="text-subtitle2 q-mb-sm">Фото</div>
                <div class="row items-center q-gutter-md">
                  <div class="relative-position">
                    <img v-if="avatarPreview || form.avatar" :src="avatarPreview || avatarUrl(form.avatar) || form.avatar" alt="Avatar" class="add-user-avatar" />
                    <q-avatar v-else size="80px" icon="person" font-size="32px" color="grey-4" />
                    <q-btn round dense color="primary" icon="photo_camera" size="xs" class="absolute" style="bottom: 0; right: 0" @click="avatarInput?.click()" />
                    <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="handleAvatarSelect" />
                  </div>
                  <q-btn v-if="form.avatar || avatarPreview" flat densely color="negative" icon="delete" label="Удалить" @click="clearAvatar" />
                </div>
              </div>

              <!-- Автогенерация -->
              <template v-if="form.role === 'STUDENT'">
                <q-toggle v-model="form.auto_generate" label="Автогенерация логина и пароля (для потока учеников)" class="q-mb-md" />
              </template>

              <!-- Школа -->
              <q-select
                v-if="showSchoolField"
                v-model="form.school_id"
                :options="schoolOptions"
                label="Основная школа"
                option-label="label"
                option-value="id"
                emit-value
                map-options
                outlined
                clearable
                class="q-mb-md"
              />

              <q-select
                v-if="form.role === 'STUDENT'"
                v-model="form.additional_school_ids"
                :options="additionalSchoolOptions"
                label="Дополнительные школы"
                option-label="label"
                option-value="id"
                emit-value
                map-options
                outlined
                clearable
                multiple
                use-chips
                class="q-mb-md"
                hint="Ученик может учиться в нескольких школах"
              />

              <!-- Родитель -->
              <q-select
                v-if="form.role === 'STUDENT'"
                v-model="form.parent_id"
                :options="parentOptions"
                label="Родитель (привязка)"
                option-label="label"
                option-value="id"
                emit-value
                map-options
                outlined
                clearable
                class="q-mb-md"
              />

              <q-input
                v-if="form.role === 'STUDENT'"
                v-model="form.rfid_uid"
                label="RFID UID (браслет Mifare)"
                outlined
                class="q-mb-md"
                hint="UID с RC522 для оплаты гемов"
              />

              <!-- MERCHANT: Vendor / Terminal info -->
              <template v-if="form.role === 'MERCHANT'">
                <q-separator class="q-mb-md" />
                <div class="text-subtitle2 q-mb-md row items-center q-gutter-xs">
                  <q-icon name="point_of_sale" color="primary" />
                  <span>Точка продажи / Терминал</span>
                </div>
                <q-input
                  v-model="form.vendor_name"
                  label="Название точки *"
                  outlined
                  class="q-mb-md"
                  placeholder="Кантина, Буфет, Магазин..."
                  :rules="[val => !!val?.trim() || 'Обязательно для мерчанта']"
                  hint="Как называется точка продажи"
                />
                <q-input
                  v-model="form.vendor_address"
                  label="Адрес / местоположение"
                  outlined
                  class="q-mb-md"
                  placeholder="1-й этаж, столовая..."
                  hint="Где физически стоит терминал"
                >
                  <template v-slot:prepend><q-icon name="place" /></template>
                </q-input>
                <q-input
                  v-model="form.vendor_terminal_id"
                  label="Terminal ID"
                  outlined
                  class="q-mb-md"
                  placeholder="canteen_1, shop_main..."
                  hint="Латиница + _ (можно задать позже после прошивки ESP32)"
                >
                  <template v-slot:prepend><q-icon name="hardware" /></template>
                </q-input>
              </template>

              <!-- Логин и пароль -->
              <template v-if="form.role === 'STUDENT' && !form.auto_generate">
                <q-input v-model="form.username" label="Логин *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />
                <q-input v-model="form.password" label="Пароль *" type="password" outlined :rules="[val => (!!val && val.length >= 6) || 'Минимум 6 символов']" class="q-mb-md" autocomplete="new-password" />
              </template>
              <template v-else-if="form.role !== 'STUDENT'">
                <q-input v-model="form.username" label="Логин *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />
                <q-input v-model="form.password" label="Пароль *" type="password" outlined :rules="[val => (!!val && val.length >= 6) || 'Минимум 6 символов']" class="q-mb-md" autocomplete="new-password" />
              </template>
            </div>

            <!-- Вторая колонка -->
            <div class="col-6">
              <!-- Дополнительные роли -->
              <div class="q-mb-md">
                <div class="text-subtitle2 q-mb-sm">Дополнительные роли</div>
                <div v-for="(additionalRole, index) in form.additional_roles" :key="index" class="row q-gutter-sm q-mb-sm items-center">
                  <q-select
                    v-model="form.additional_roles[index]"
                    :options="getOptionsForAdditionalRole(index)"
                    label="Роль"
                    option-label="label"
                    option-value="value"
                    emit-value
                    map-options
                    outlined
                    dense
                    style="flex: 1"
                  />
                  <q-btn
                    round
                    dense
                    color="negative"
                    icon="close"
                    size="sm"
                    @click="removeAdditionalRole(index)"
                  />
                </div>
                <q-btn
                  outline
                  color="primary"
                  icon="add"
                  label="Добавить роль"
                  size="sm"
                  @click="addAdditionalRole"
                  :disable="!canAddMoreRoles"
                />
              </div>

              <!-- Экспорт в Excel -->
              <q-checkbox
                v-model="form.can_export_excel"
                label="Export to Excel"
                class="q-mb-md"
              />

              <!-- Видеть все школы (для бухгалтера) -->
              <q-checkbox
                v-if="form.role === 'ACCOUNTANT'"
                v-model="form.can_view_all_schools"
                label="Может видеть все школы"
                class="q-mb-md block"
              />
            </div>
          </div>

          <!-- Успешно создан — показываем credentials -->
          <q-banner v-if="createdCredentials" class="bg-positive text-white q-mb-md rounded-borders">
            <template v-slot:avatar>
              <q-icon name="check_circle" size="2em" />
            </template>
            <div class="text-weight-bold">Пользователь создан. Сохраните данные для входа:</div>
            <div class="q-mt-sm row items-center q-gutter-md">
              <div><span class="text-weight-medium">Логин:</span> <code class="q-px-sm q-py-xs bg-white rounded text-dark">{{ createdCredentials.username }}</code></div>
              <div><span class="text-weight-medium">Пароль:</span> <code class="q-px-sm q-py-xs bg-white rounded text-dark">{{ createdCredentials.password }}</code></div>
              <q-btn flat dense icon="content_copy" label="Копировать" color="white" @click="copyCredentials" />
            </div>
          </q-banner>

          <!-- MERCHANT: Terminal credentials after creation -->
          <q-banner v-if="createdVendor" class="bg-amber-2 q-mb-md rounded-borders" rounded>
            <template v-slot:avatar>
              <q-icon name="point_of_sale" color="amber-9" size="2em" />
            </template>
            <div class="text-weight-bold text-amber-9">Терминал создан! Данные для ESP32 (сохраните сейчас):</div>
            <div class="q-mt-sm column q-gutter-xs">
              <div class="row items-center q-gutter-sm">
                <span class="text-weight-medium text-dark">Terminal ID:</span>
                <code class="q-px-sm q-py-xs rounded" style="background:#fff8e1;color:#5f4700;">{{ createdVendor.terminalId || '(не задан — добавьте позже в разделе Терминалы)' }}</code>
              </div>
              <div class="row items-center q-gutter-sm">
                <span class="text-weight-medium text-dark">Auth Token:</span>
                <code class="q-px-sm q-py-xs rounded text-caption" style="background:#fff8e1;color:#5f4700;word-break:break-all;">{{ createdVendor.authToken }}</code>
                <q-btn flat dense size="xs" icon="content_copy" color="amber-9" @click="copyVendorToken" />
              </div>
            </div>
          </q-banner>

          <div class="row q-gutter-sm q-mt-lg">
            <q-btn type="submit" color="primary" label="Создать" :loading="saving" icon="save" :disable="!!createdCredentials || !!createdVendor" />
            <q-btn v-if="createdCredentials || createdVendor" color="primary" label="Создать ещё" icon="add" @click="resetForm" />
            <q-btn outline color="grey-7" label="К списку" to="/admin/users" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { avatarUrl } = useAvatarUrl()
const { create, getAll } = useAdminUsers()
const { getAll: getAllSchools } = useAdminSchools()
const { uploadFile } = useUpload()
const config = useRuntimeConfig()
const API = config.public.apiBase as string

const schools = ref<any[]>([])
const parents = ref<any[]>([])
const saving = ref(false)
const createdCredentials = ref<{ username: string; password: string } | null>(null)
const createdVendor = ref<{ authToken: string; terminalId?: string } | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)
const avatarFile = ref<File | null>(null)

const ROLE_LABELS: Record<string, string> = {
  SUPERUSER: 'Суперпользователь',
  GEN_DIRECTOR: 'Ген. директор',
  HEAD_ACCOUNTANT: 'Гл. бухгалтер',
  DIRECTOR: 'Директор',
  HEAD_TEACHER: 'Завуч',
  TEACHER: 'Учитель',
  STUDENT: 'Ученик',
  PARENT: 'Родитель',
  MERCHANT: 'Мерчант',
  SALES: 'Продажи',
  RECEPTIONIST: 'Рецепция',
  EDITOR: 'Редактор',
  ACCOUNTANT: 'Бухгалтер',
}

const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ label, value }))

// Для каждого дополнительного селекта: включаем выбранную роль в options, чтобы отображалось имя, а не код
const getOptionsForAdditionalRole = (index: number) => {
  const currentValue = form.value.additional_roles[index]
  const otherSelected = form.value.additional_roles.filter((_, i) => i !== index).filter(Boolean)
  const exclude = new Set([form.value.role, 'SUPERUSER', ...otherSelected])
  const base = roleOptions.filter(opt => !exclude.has(opt.value))
  // Включаем текущую выбранную роль, чтобы q-select показывал label, а не value
  if (currentValue) {
    const currentOpt = roleOptions.find(o => o.value === currentValue)
    if (currentOpt && !base.some(b => b.value === currentValue)) {
      return [currentOpt, ...base]
    }
  }
  return base
}

const canAddMoreRoles = computed(() => {
  return form.value.additional_roles.length < 5 && getOptionsForAdditionalRole(form.value.additional_roles.length).length > 0
})

const addAdditionalRole = () => {
  if (canAddMoreRoles.value) {
    form.value.additional_roles.push('')
  }
}

const removeAdditionalRole = (index: number) => {
  form.value.additional_roles.splice(index, 1)
}

const form = ref({
  role: 'STUDENT' as string,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  avatar: '',
  school_id: null as number | null,
  parent_id: null as string | null,
  auto_generate: true,
  additional_roles: [] as string[],
  additional_school_ids: [] as number[],
  can_export_excel: false,
  can_view_all_schools: false,
  rfid_uid: '',
  // MERCHANT fields
  vendor_name: '',
  vendor_address: '',
  vendor_terminal_id: '',
})

const showSchoolField = computed(() => {
  const r = form.value.role
  return ['STUDENT', 'TEACHER', 'HEAD_TEACHER', 'DIRECTOR', 'RECEPTIONIST', 'ACCOUNTANT', 'HEAD_ACCOUNTANT'].includes(r)
})

const schoolOptions = computed(() =>
  schools.value.map(s => ({
    id: s.id,
    label: s.name_tm || s.name_ru || s.name_en || s.name || `Школа #${s.id}`
  }))
)

const additionalSchoolOptions = computed(() => {
  const primaryId = form.value.school_id
  return schools.value
    .filter(s => s.id !== primaryId)
    .map(s => ({
      id: s.id,
      label: s.name_tm || s.name_ru || s.name_en || s.name || `Школа #${s.id}`
    }))
})

const parentOptions = computed(() =>
  parents.value.map(p => ({
    id: p.id,
    label: p.full_name || p.username || p.id
  }))
)

const handleAvatarSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  avatarPreview.value = URL.createObjectURL(file)
  avatarFile.value = file
  input.value = ''
}

const clearAvatar = () => {
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  avatarPreview.value = null
  avatarFile.value = null
  form.value.avatar = ''
}

const onRoleChange = () => {
  form.value.auto_generate = form.value.role === 'STUDENT'
  form.value.school_id = null
  form.value.parent_id = null
  // Удаляем дополнительные роли, которые совпадают с новой основной ролью
  form.value.additional_roles = form.value.additional_roles.filter(r => r !== form.value.role)
}

const copyCredentials = () => {
  if (!createdCredentials.value) return
  const text = `Логин: ${createdCredentials.value.username}\nПароль: ${createdCredentials.value.password}`
  navigator.clipboard.writeText(text)
}

const copyVendorToken = () => {
  if (!createdVendor.value) return
  const text = `Terminal ID: ${createdVendor.value.terminalId || ''}\nAuth Token: ${createdVendor.value.authToken}`
  navigator.clipboard.writeText(text)
}

const resetForm = () => {
  createdCredentials.value = null
  createdVendor.value = null
  clearAvatar()
  form.value = {
    role: form.value.role,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    avatar: '',
    school_id: form.value.school_id,
    parent_id: null,
    auto_generate: form.value.role === 'STUDENT',
    additional_roles: [],
    additional_school_ids: [],
    can_export_excel: false,
    can_view_all_schools: form.value.can_view_all_schools,
    rfid_uid: '',
    vendor_name: '',
    vendor_address: '',
    vendor_terminal_id: '',
  }
}

const handleSubmit = async () => {
  if (createdCredentials.value || createdVendor.value) return
  saving.value = true
  try {
    let avatarUrl = form.value.avatar
    if (avatarFile.value) {
      const res = await uploadFile(avatarFile.value)
      avatarUrl = (res as any).url
      if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
      avatarPreview.value = null
      avatarFile.value = null
    }
    const body: Record<string, any> = {
      role: form.value.role,
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim(),
      email: form.value.email?.trim() || undefined,
      phone: form.value.phone?.trim() || undefined,
      avatar: avatarUrl || undefined,
      school_id: form.value.school_id || undefined,
      parent_id: form.value.parent_id || undefined,
      additional_roles: form.value.additional_roles
        .filter(r => r && typeof r === 'string' && r.trim() && r !== form.value.role && r !== 'SUPERUSER'),
      additional_school_ids: form.value.role === 'STUDENT' ? (form.value.additional_school_ids || []).filter(id => id !== form.value.school_id) : undefined,
      can_export_excel: form.value.can_export_excel,
      can_view_all_schools: (form.value.role === 'ACCOUNTANT' || form.value.role === 'HEAD_ACCOUNTANT') ? form.value.can_view_all_schools : false
    }
    if (form.value.role === 'STUDENT' && form.value.rfid_uid?.trim()) {
      body.rfid_uid = form.value.rfid_uid.trim()
    }
  if (form.value.role === 'STUDENT' && form.value.auto_generate) {
    body.auto_generate = true
  } else {
    body.username = form.value.username?.trim()
    body.password = form.value.password
  }

    const res = await create(body)
    if ((res as any).credentials) {
      createdCredentials.value = (res as any).credentials
    }

    // If MERCHANT — auto-create vendor profile
    if (form.value.role === 'MERCHANT' && (res as any).user?.id) {
      try {
        const vendorRes = await $fetch<any>(`${API}/admin/terminals`, {
          method: 'POST',
          credentials: 'include',
          body: {
            userId: (res as any).user.id,
            name: form.value.vendor_name.trim(),
            address: form.value.vendor_address?.trim() || undefined,
            terminalId: form.value.vendor_terminal_id?.trim() || undefined,
          },
        })
        createdVendor.value = { authToken: vendorRes.authToken, terminalId: vendorRes.terminalId }
      } catch (ve: any) {
        alert('Пользователь создан, но ошибка при создании терминала: ' + (ve?.data?.error || ve?.message || 'Ошибка'))
      }
    }

    if (!(res as any).credentials && form.value.role !== 'MERCHANT') {
      navigateTo('/admin/users')
    }
  } catch (e: any) {
    // Eden Treaty throws an Error with .value = parsed response body
    const body = e?.value ?? e?.data
    const err = (body && typeof body === 'object')
      ? (body.error || body.message || body.summary || JSON.stringify(body))
      : (body ?? e?.message ?? 'Ошибка')
    console.error('User create error:', e)
    alert(err)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const [schoolsList, allUsers] = await Promise.all([
    getAllSchools(),
    getAll()
  ])
  schools.value = schoolsList as any[]
  parents.value = (allUsers as any[]).filter((u: any) => u.role === 'PARENT')
})
</script>

<style scoped>
.admin-form :deep(.q-input),
.admin-form :deep(.q-select) {
  max-width: 600px;
}
.add-user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
}
.hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>
