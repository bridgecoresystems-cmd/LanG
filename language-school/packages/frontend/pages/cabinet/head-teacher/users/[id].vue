<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Редактировать {{ form.role === 'STUDENT' ? 'ученика' : 'родителя' }}</NH2>
      </div>
      <div class="page-header__actions">
        <NButton type="default" @click="navigateTo('/cabinet/head-teacher/users')">
          <template #icon>
            <NIcon><component :is="ArrowBackIcon" /></NIcon>
          </template>
          Назад
        </NButton>
      </div>
    </header>

    <NSpin :show="loading">
      <NCard v-if="!loading || form.first_name" class="cabinet-card" :content-style="{ padding: '32px' }">
        <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
          <NFormItem label="Имя *" path="first_name">
            <NInput v-model:value="form.first_name" placeholder="Имя" size="large" />
          </NFormItem>

          <NFormItem label="Фамилия *" path="last_name">
            <NInput v-model:value="form.last_name" placeholder="Фамилия" size="large" />
          </NFormItem>

          <NFormItem label="Фото" path="avatar">
            <div class="avatar-upload">
              <div class="avatar-preview-wrap">
                <img
                  v-if="avatarPreview || form.avatar"
                  :src="avatarPreview || avatarUrl(form.avatar) || form.avatar"
                  alt="Avatar"
                  class="avatar-img"
                />
                <div v-else class="avatar-placeholder">
                  <NIcon :component="PersonIcon" size="48" />
                </div>
                <NButton
                  type="primary"
                  size="small"
                  circle
                  class="avatar-upload-btn"
                  @click="avatarInput?.click()"
                >
                  <template #icon>
                    <NIcon :component="CameraIcon" />
                  </template>
                </NButton>
              </div>
              <NButton v-if="form.avatar || avatarPreview" type="error" secondary size="small" @click="clearAvatar">
                Удалить фото
              </NButton>
            </div>
            <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="handleAvatarSelect" />
          </NFormItem>

          <NFormItem label="Логин">
            <NInput :value="form.username" disabled size="large" />
          </NFormItem>

          <NFormItem label="Email" path="email">
            <NInput v-model:value="form.email" placeholder="email@example.com" size="large" />
          </NFormItem>

          <NFormItem label="Телефон" path="phone">
            <NInput v-model:value="form.phone" placeholder="+993 ..." size="large" />
          </NFormItem>

          <NFormItem v-if="form.role === 'STUDENT'" label="Родитель (привязка)" path="parent_id">
            <NSelect
              v-model:value="form.parent_id"
              :options="parentOptions"
              placeholder="Выберите родителя (необязательно)"
              clearable
              size="large"
            />
          </NFormItem>

          <NFormItem v-if="form.role === 'STUDENT'" label="RFID UID (браслет Mifare)" path="rfid_uid">
            <div class="rfid-row">
              <NInput v-model:value="form.rfid_uid" placeholder="UID с RC522" size="large" :readonly="scanning" />
              <NButton
                :type="scanning ? 'warning' : 'primary'"
                ghost
                size="large"
                :loading="scanning"
                @click="startScan"
              >
                {{ scanning ? 'Отмена' : '📡 Сканировать' }}
              </NButton>
            </div>
            <div v-if="scanning" class="rfid-hint rfid-hint--scanning">
              ⏳ Поднесите браслет к считывателю...
            </div>
            <div v-else-if="scanError" class="rfid-hint rfid-hint--error">
              ⚠️ {{ scanError }}
            </div>
            <div v-else-if="form.rfid_uid" class="rfid-hint rfid-hint--ok">
              ✅ UID: {{ form.rfid_uid }}
            </div>
          </NFormItem>

          <NFormItem label="Новый пароль" path="password">
            <NInput
              v-model:value="form.password"
              type="password"
              placeholder="Оставьте пустым, чтобы не менять"
              size="large"
            />
          </NFormItem>

          <div class="form-actions" style="margin-top: 24px">
            <NButton type="default" @click="navigateTo('/cabinet/head-teacher/users')">Отмена</NButton>
            <NButton type="primary" :loading="saving" @click="handleSubmit">
              <template #icon>
                <NIcon><component :is="SaveIcon" /></NIcon>
              </template>
              Сохранить
            </NButton>
          </div>
        </NForm>
      </NCard>
    </NSpin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCabinetHeadTeacher } from '~/composables/useCabinetHeadTeacher'
import {
  NCard,
  NButton,
  NInput,
  NForm,
  NFormItem,
  NIcon,
  NH2,
  NSelect,
  NSpin,
  useMessage,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import { ArrowBackOutline as ArrowBackIcon, SaveOutline as SaveIcon, PersonOutline as PersonIcon, CameraOutline as CameraIcon } from '@vicons/ionicons5'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const authStore = useAuthStore()
const message = useMessage()
const { avatarUrl } = useAvatarUrl()
const { uploadFile } = useUpload()

const avatarInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)
const avatarFile = ref<File | null>(null)

function canAccess() {
  const u = authStore.user
  if (!u) return false
  const hasHeadTeacher = u.role === 'HEAD_TEACHER' || (u.additional_roles || []).includes('HEAD_TEACHER')
  return hasHeadTeacher || u.role === 'SUPERUSER'
}

const { getUsers, getById, updateUser } = useCabinetHeadTeacher()

const formRef = ref<FormInst | null>(null)

const loading = ref(true)
const saving = ref(false)
const parents = ref<any[]>([])

const form = ref({
  role: 'STUDENT' as 'STUDENT' | 'PARENT',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  username: '',
  password: '',
  avatar: '',
  parent_id: null as string | null,
  rfid_uid: '',
})

const rfidUidRef = computed({
  get: () => form.value.rfid_uid,
  set: (v: string) => { form.value.rfid_uid = v },
})
const { scanning, scanError, startScan } = useRfidScanner(rfidUidRef)

const parentOptions = computed(() =>
  parents.value
    .filter((p) => p.role === 'PARENT' && p.id !== route.params.id)
    .map((p) => ({
      label: p.full_name || p.username || p.id,
      value: p.id,
    }))
)

const rules: FormRules = {
  first_name: [{ required: true, message: 'Обязательно', trigger: 'blur' }],
  last_name: [{ required: true, message: 'Обязательно', trigger: 'blur' }],
}

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

async function loadUser() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    const user = (await getById(id)) as any
    if (!user) {
      message.error('Пользователь не найден')
      navigateTo('/cabinet/head-teacher/users')
      return
    }
    form.value = {
      role: user.role,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      username: user.username || '',
      password: '',
      avatar: user.avatar || '',
      parent_id: user.parent_id || null,
      rfid_uid: user.rfid_uid || '',
    }
  } catch (e) {
    console.error(e)
    message.error('Ошибка загрузки')
    navigateTo('/cabinet/head-teacher/users')
  } finally {
    loading.value = false
  }
}

async function loadParents() {
  try {
    const list = (await getUsers()) as any[]
    parents.value = list
  } catch (e) {
    console.error(e)
  }
}

async function handleSubmit() {
  await formRef.value?.validate(async (err) => {
    if (err) return
    saving.value = true
    try {
      let avatarUrlVal = form.value.avatar
      if (avatarFile.value) {
        const res = await uploadFile(avatarFile.value)
        avatarUrlVal = (res as any).url
        if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
        avatarPreview.value = null
        avatarFile.value = null
      }
      const body: any = {
        first_name: form.value.first_name.trim(),
        last_name: form.value.last_name.trim(),
        email: form.value.email?.trim() || undefined,
        phone: form.value.phone?.trim() || undefined,
        avatar: avatarUrlVal || undefined,
        parent_id: form.value.parent_id,
      }
      if (form.value.role === 'STUDENT') {
        body.rfid_uid = form.value.rfid_uid?.trim() || null
      }
      if (form.value.password?.trim() && form.value.password.length >= 6) {
        body.password = form.value.password
      }
      await updateUser(route.params.id as string, body)
      message.success('Сохранено')
      navigateTo('/cabinet/head-teacher/users')
    } catch (e: any) {
      const msg = e?.message || e?.value?.error || 'Ошибка'
      message.error(msg)
    } finally {
      saving.value = false
    }
  })
}

onMounted(async () => {
  if (!canAccess()) {
    navigateTo('/cabinet')
    return
  }
  await Promise.all([loadUser(), loadParents()])
})
</script>

<style scoped>
.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
}
.avatar-preview-wrap {
  position: relative;
  width: 80px;
  height: 80px;
}
.avatar-img,
.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-placeholder {
  background: var(--n-color-embedded);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--n-text-color-3);
}
.avatar-upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
}
.hidden {
  display: none;
}

.rfid-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
.rfid-row .n-input {
  flex: 1;
}
.rfid-hint {
  margin-top: 6px;
  font-size: 13px;
  border-radius: 6px;
  padding: 4px 8px;
}
.rfid-hint--scanning { color: #d46b08; background: #fff7e6; }
.rfid-hint--error    { color: #cf1322; background: #fff1f0; }
.rfid-hint--ok       { color: #389e0d; background: #f6ffed; }
</style>
