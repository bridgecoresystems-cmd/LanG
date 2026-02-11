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

          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input v-model="form.first_name" label="Имя *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />
            </div>
            <div class="col-6">
              <q-input v-model="form.last_name" label="Фамилия *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />
            </div>
          </div>

          <q-input v-model="form.email" label="Email" type="email" outlined class="q-mb-md" />
          <q-input v-model="form.phone" label="Телефон" outlined class="q-mb-md" />

          <!-- Фото -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">Фото</div>
            <div class="row items-center q-gutter-md">
              <div class="relative-position">
                <img v-if="avatarPreview || form.avatar" :src="avatarPreview || form.avatar" alt="Avatar" class="add-user-avatar" />
                <q-avatar v-else size="80px" icon="person" font-size="32px" color="grey-4" />
                <q-btn round dense color="primary" icon="photo_camera" size="xs" class="absolute" style="bottom: 0; right: 0" @click="avatarInput?.click()" />
                <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="handleAvatarSelect" />
              </div>
              <q-btn v-if="form.avatar || avatarPreview" flat densely color="negative" icon="delete" label="Удалить" @click="clearAvatar" />
            </div>
          </div>

          <!-- Студент: автогенерация логина/пароля -->
          <template v-if="form.role === 'STUDENT'">
            <q-toggle v-model="form.auto_generate" label="Автогенерация логина и пароля (для потока учеников)" class="q-mb-md" />
            <template v-if="!form.auto_generate">
              <q-input v-model="form.username" label="Логин *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />
              <q-input v-model="form.password" label="Пароль *" type="password" outlined :rules="[val => (!!val && val.length >= 6) || 'Минимум 6 символов']" class="q-mb-md" autocomplete="new-password" />
            </template>
          </template>

          <!-- Родитель: логин и пароль -->
          <template v-else-if="form.role === 'PARENT'">
            <q-input v-model="form.username" label="Логин *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />
            <q-input v-model="form.password" label="Пароль *" type="password" outlined :rules="[val => (!!val && val.length >= 6) || 'Минимум 6 символов']" class="q-mb-md" autocomplete="new-password" />
          </template>

          <!-- Остальные роли: логин и пароль -->
          <template v-else>
            <q-input v-model="form.username" label="Логин *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />
            <q-input v-model="form.password" label="Пароль *" type="password" outlined :rules="[val => (!!val && val.length >= 6) || 'Минимум 6 символов']" class="q-mb-md" autocomplete="new-password" />
          </template>

          <!-- Школа — для учеников, учителей, завучей и т.д. -->
          <q-select
            v-if="showSchoolField"
            v-model="form.school_id"
            :options="schoolOptions"
            label="Школа"
            option-label="label"
            option-value="id"
            emit-value
            map-options
            outlined
            clearable
            class="q-mb-md"
          />

          <!-- Родитель ученика — для учеников -->
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

          <div class="row q-gutter-sm q-mt-lg">
            <q-btn type="submit" color="primary" label="Создать" :loading="saving" icon="save" :disable="!!createdCredentials" />
            <q-btn v-if="createdCredentials" color="primary" label="Создать ещё" icon="add" @click="resetForm" />
            <q-btn outline color="grey-7" label="К списку" to="/admin/users" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { create, getAll } = useAdminUsers()
const { getAll: getAllSchools } = useAdminSchools()
const { uploadFile } = useUpload()

const schools = ref<any[]>([])
const parents = ref<any[]>([])
const saving = ref(false)
const createdCredentials = ref<{ username: string; password: string } | null>(null)
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
}

const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ label, value }))

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
  auto_generate: true
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
}

const copyCredentials = () => {
  if (!createdCredentials.value) return
  const text = `Логин: ${createdCredentials.value.username}\nПароль: ${createdCredentials.value.password}`
  navigator.clipboard.writeText(text)
  // TODO: show toast
}

const resetForm = () => {
  createdCredentials.value = null
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
    auto_generate: form.value.role === 'STUDENT'
  }
}

const handleSubmit = async () => {
  if (createdCredentials.value) return
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
      parent_id: form.value.parent_id || undefined
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
    } else {
      navigateTo('/admin/users')
    }
  } catch (e: any) {
    const err = e?.data?.error || e?.message || 'Ошибка'
    console.error(e)
    // TODO: show error toast
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
