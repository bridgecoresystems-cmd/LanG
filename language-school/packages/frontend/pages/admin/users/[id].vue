<template>
  <div class="admin-page-content">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-ma-none">Редактировать пользователя</h1>
      </div>
      <div class="col-auto">
        <q-btn outline color="grey-7" icon="arrow_back" label="Назад" to="/admin/users" />
      </div>
    </div>

    <q-inner-loading :showing="loading && !form.username">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>

    <q-card v-if="!loading || form.username" flat bordered class="admin-form-card">
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
                    <img v-if="avatarPreview || form.avatar" :src="avatarPreview || avatarUrl(form.avatar) || form.avatar" alt="Avatar" class="edit-user-avatar" />
                    <q-avatar v-else size="80px" icon="person" font-size="32px" color="grey-4" />
                    <q-btn round dense color="primary" icon="photo_camera" size="xs" class="absolute" style="bottom: 0; right: 0" @click="avatarInput?.click()" />
                    <input ref="avatarInput" type="file" accept="image/*" class="hidden-input" @change="handleAvatarSelect" />
                  </div>
                  <q-btn v-if="form.avatar || avatarPreview" flat densely color="negative" icon="delete" label="Удалить" @click="clearAvatar" />
                </div>
              </div>

              <q-input v-model="form.username" label="Логин *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />
              <q-input v-model="form.password" label="Новый пароль (оставьте пустым, чтобы не менять)" type="password" outlined class="q-mb-md" autocomplete="new-password" hint="Минимум 6 символов" />

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

              <q-toggle v-model="form.is_active" label="Активен" class="q-mb-md" />
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
            </div>
          </div>

          <div class="row q-gutter-sm q-mt-lg">
            <q-btn type="submit" color="primary" label="Сохранить" :loading="saving" icon="save" />
            <q-btn outline color="grey-7" label="Отмена" to="/admin/users" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const { avatarUrl } = useAvatarUrl()
const { getById, update, getAll } = useAdminUsers()
const { getAll: getAllSchools } = useAdminSchools()
const { uploadFile } = useUpload()

const schools = ref<any[]>([])
const parents = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)

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
  id: '' as string,
  role: '' as string,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  avatar: '',
  school_id: null as number | null,
  parent_id: null as string | null,
  is_active: true,
      additional_roles: [] as string[],
      additional_school_ids: [] as number[],
      can_export_excel: false,
      rfid_uid: ''
})

const showSchoolField = computed(() => {
  const r = form.value.role
  return ['STUDENT', 'TEACHER', 'HEAD_TEACHER', 'DIRECTOR', 'RECEPTIONIST'].includes(r)
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
  parents.value.filter(p => p.id !== form.value.id).map(p => ({
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
  if (!showSchoolField.value) form.value.school_id = null
  if (form.value.role !== 'STUDENT') form.value.parent_id = null
  // Удаляем дополнительные роли, которые совпадают с новой основной ролью
  form.value.additional_roles = form.value.additional_roles.filter(r => r !== form.value.role)
}

const handleSubmit = async () => {
  saving.value = true
  try {
    let avatarUrl = form.value.avatar
    if (avatarFile.value) {
      const res = await uploadFile(avatarFile.value)
      avatarUrl = (res as any).url
    }

    // Фильтруем дополнительные роли: убираем пустые, дубликаты основной роли и SUPERUSER
    const cleanAdditionalRoles = form.value.additional_roles
      .filter(r => r && typeof r === 'string' && r.trim() && r !== form.value.role && r !== 'SUPERUSER')
    
    const body: Record<string, any> = {
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim(),
      email: form.value.email?.trim() || undefined,
      phone: form.value.phone?.trim() || undefined,
      username: form.value.username.trim(),
      role: form.value.role,
      avatar: avatarUrl || '',
      is_active: form.value.is_active,
      school_id: form.value.school_id ?? undefined,
      parent_id: form.value.parent_id ?? undefined,
      additional_roles: cleanAdditionalRoles,
      additional_school_ids: form.value.role === 'STUDENT' ? (form.value.additional_school_ids || []).filter((id: number) => id !== form.value.school_id) : undefined,
      can_export_excel: form.value.can_export_excel
    }
    if (form.value.role === 'STUDENT') {
      body.rfid_uid = form.value.rfid_uid?.trim() || null
    }
    if (form.value.password?.length >= 6) {
      body.password = form.value.password
    }
    await update(form.value.id as any, body)
    navigateTo('/admin/users')
  } catch (e: any) {
    const err = e?.data?.error || e?.message || 'Ошибка'
    console.error(e)
    alert(err)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const id = route.params.id as string
  if (!id) {
    loading.value = false
    navigateTo('/admin/users')
    return
  }
  try {
    const [user, schoolsList, allUsers] = await Promise.all([
      getById(id as any),
      getAllSchools(),
      getAll()
    ])
    
    if (!user) {
      navigateTo('/admin/users')
      return
    }
    schools.value = schoolsList as any[]
    parents.value = (allUsers as any[]).filter(u => u.role === 'PARENT')
    form.value = {
      id: user.id,
      role: user.role || 'STUDENT',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      avatar: user.avatar || '',
      email: user.email || '',
      phone: user.phone || '',
      username: user.username || '',
      password: '',
      school_id: user.school_id ?? null,
      parent_id: user.parent_id ?? null,
      is_active: user.is_active ?? true,
      additional_roles: Array.isArray((user as any).additional_roles) ? (user as any).additional_roles.filter((r: string) => r && r.trim()) : [],
      additional_school_ids: Array.isArray((user as any).additional_school_ids) ? (user as any).additional_school_ids : [],
      can_export_excel: (user as any).can_export_excel === true,
      rfid_uid: (user as any).rfid_uid || ''
    }
  } catch (e) {
    console.error('Load user error:', e)
    navigateTo('/admin/users')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-form :deep(.q-input),
.admin-form :deep(.q-select) {
  max-width: 600px;
}
.edit-user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
}
.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>
