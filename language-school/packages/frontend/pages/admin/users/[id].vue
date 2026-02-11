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
          <q-input v-model="form.username" label="Логин *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />

          <q-input v-model="form.password" label="Новый пароль (оставьте пустым, чтобы не менять)" type="password" outlined class="q-mb-md" autocomplete="new-password" hint="Минимум 6 символов" />

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

          <q-toggle v-model="form.is_active" label="Активен" class="q-mb-md" />

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
const { getById, update, getAll } = useAdminUsers()
const { getAll: getAllSchools } = useAdminSchools()

const schools = ref<any[]>([])
const parents = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)

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
  id: '' as string,
  role: '' as string,
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  school_id: null as number | null,
  parent_id: null as string | null,
  is_active: true
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
  parents.value.filter(p => p.id !== form.value.id).map(p => ({
    id: p.id,
    label: p.full_name || p.username || p.id
  }))
)

const onRoleChange = () => {
  if (!showSchoolField.value) form.value.school_id = null
  if (form.value.role !== 'STUDENT') form.value.parent_id = null
}

const handleSubmit = async () => {
  saving.value = true
  try {
    const body: Record<string, any> = {
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim(),
      email: form.value.email?.trim() || undefined,
      phone: form.value.phone?.trim() || undefined,
      username: form.value.username.trim(),
      role: form.value.role,
      is_active: form.value.is_active,
      school_id: form.value.school_id ?? undefined,
      parent_id: form.value.parent_id ?? undefined
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
      email: user.email || '',
      phone: user.phone || '',
      username: user.username || '',
      password: '',
      school_id: user.school_id ?? null,
      parent_id: user.parent_id ?? null,
      is_active: user.is_active ?? true
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
</style>
