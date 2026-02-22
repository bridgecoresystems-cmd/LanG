<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH2 class="page-header__title">Добавить ученика или родителя</NH2>
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

    <NCard class="cabinet-card" :content-style="{ padding: '32px' }">
      <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
        <NFormItem label="Кого добавляем? *" path="role">
          <NRadioGroup v-model:value="form.role">
            <NSpace>
              <NRadio value="STUDENT">Ученика</NRadio>
              <NRadio value="PARENT">Родителя</NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItem>

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

        <NFormItem label="Email" path="email">
          <NInput v-model:value="form.email" placeholder="email@example.com" size="large" />
        </NFormItem>

        <NFormItem label="Телефон" path="phone">
          <NInput v-model:value="form.phone" placeholder="+993 ..." size="large" />
        </NFormItem>

        <template v-if="form.role === 'STUDENT'">
          <NFormItem label="Автогенерация логина и пароля">
            <NSwitch v-model:value="form.auto_generate" />
            <span class="q-ml-sm">Включена (рекомендуется для учеников)</span>
          </NFormItem>
          <template v-if="!form.auto_generate">
            <NFormItem label="Логин *" path="username">
              <NInput v-model:value="form.username" placeholder="Логин" size="large" />
            </NFormItem>
            <NFormItem label="Пароль *" path="password">
              <NInput
                v-model:value="form.password"
                type="password"
                placeholder="Минимум 6 символов"
                size="large"
              />
            </NFormItem>
          </template>
          <NFormItem label="Родитель (привязка)" path="parent_id">
            <NSelect
              v-model:value="form.parent_id"
              :options="parentOptions"
              placeholder="Выберите родителя (необязательно)"
              clearable
              size="large"
            />
          </NFormItem>
          <NFormItem label="RFID UID (браслет Mifare)" path="rfid_uid">
            <NInput v-model:value="form.rfid_uid" placeholder="UID с RC522" size="large" />
          </NFormItem>
        </template>

        <template v-else>
          <NFormItem label="Логин *" path="username">
            <NInput v-model:value="form.username" placeholder="Логин для входа" size="large" />
          </NFormItem>
          <NFormItem label="Пароль *" path="password">
            <NInput
              v-model:value="form.password"
              type="password"
              placeholder="Минимум 6 символов"
              size="large"
            />
          </NFormItem>
        </template>

        <NCard v-if="createdCredentials" class="created-card" style="margin-top: 16px" bordered>
          <template #header>
            <span style="color: var(--n-success-color)">Пользователь создан</span>
          </template>
          <p>Сохраните данные для входа:</p>
          <p><strong>Логин:</strong> {{ createdCredentials.username }}</p>
          <p><strong>Пароль:</strong> {{ createdCredentials.password }}</p>
          <NButton type="primary" @click="resetAndAddAnother">Добавить ещё</NButton>
        </NCard>

        <div v-else class="form-actions" style="margin-top: 24px">
          <NButton type="default" @click="navigateTo('/cabinet/head-teacher/users')">Отмена</NButton>
          <NButton type="primary" :loading="saving" @click="handleSubmit">
            <template #icon>
              <NIcon><component :is="SaveIcon" /></NIcon>
            </template>
            Создать
          </NButton>
        </div>
      </NForm>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCabinetHeadTeacher } from '~/composables/useCabinetHeadTeacher'
import {
  NCard,
  NButton,
  NInput,
  NForm,
  NFormItem,
  NIcon,
  NH2,
  NRadioGroup,
  NRadio,
  NSelect,
  NSwitch,
  NSpace,
  useMessage,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import { ArrowBackOutline as ArrowBackIcon, SaveOutline as SaveIcon, PersonOutline as PersonIcon, CameraOutline as CameraIcon } from '@vicons/ionicons5'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

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
const { getUsers, createUser } = useCabinetHeadTeacher()

const formRef = ref<FormInst | null>(null)
const saving = ref(false)
const createdCredentials = ref<{ username: string; password: string } | null>(null)
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
  auto_generate: true,
  parent_id: null as string | null,
  rfid_uid: '',
})

const parentOptions = computed(() =>
  parents.value
    .filter((p) => p.role === 'PARENT')
    .map((p) => ({
      label: p.full_name || p.username || p.id,
      value: p.id,
    }))
)

const rules: FormRules = {
  first_name: [{ required: true, message: 'Обязательно', trigger: 'blur' }],
  last_name: [{ required: true, message: 'Обязательно', trigger: 'blur' }],
  username: [
    {
      required: true,
      message: 'Обязательно',
      trigger: 'blur',
      validator: (_rule, value) => {
        if (form.value.role === 'STUDENT' && form.value.auto_generate) return true
        return !!value?.trim()
      },
    },
  ],
  password: [
    {
      required: true,
      message: 'Минимум 6 символов',
      trigger: 'blur',
      validator: (_rule, value) => {
        if (form.value.role === 'STUDENT' && form.value.auto_generate) return true
        return !!(value && value.length >= 6)
      },
    },
  ],
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

watch(
  () => form.value.role,
  () => {
    form.value.auto_generate = form.value.role === 'STUDENT'
    form.value.parent_id = null
  }
)

async function loadParents() {
  try {
    const list = (await getUsers()) as any[]
    parents.value = list
  } catch (e) {
    console.error(e)
  }
}

async function handleSubmit() {
  if (createdCredentials.value) return
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
        role: form.value.role,
        first_name: form.value.first_name.trim(),
        last_name: form.value.last_name.trim(),
        email: form.value.email?.trim() || undefined,
        phone: form.value.phone?.trim() || undefined,
        avatar: avatarUrlVal || undefined,
      }
      if (form.value.role === 'STUDENT') {
        body.auto_generate = form.value.auto_generate
        if (!form.value.auto_generate) {
          body.username = form.value.username?.trim()
          body.password = form.value.password
        }
        if (form.value.parent_id) body.parent_id = form.value.parent_id
        if (form.value.rfid_uid?.trim()) body.rfid_uid = form.value.rfid_uid.trim()
      } else {
        body.username = form.value.username?.trim()
        body.password = form.value.password
      }
      const res = (await createUser(body)) as any
      if (res?.credentials) {
        createdCredentials.value = res.credentials
        message.success('Пользователь создан')
      } else {
        message.success('Пользователь создан')
        navigateTo('/cabinet/head-teacher/users')
      }
    } catch (e: any) {
      const msg = e?.message || e?.value?.error || 'Ошибка'
      message.error(msg)
    } finally {
      saving.value = false
    }
  })
}

function resetAndAddAnother() {
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
      auto_generate: form.value.role === 'STUDENT',
      parent_id: null,
      rfid_uid: '',
    }
}

onMounted(() => {
  if (!canAccess()) {
    navigateTo('/cabinet')
    return
  }
  loadParents()
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
</style>
