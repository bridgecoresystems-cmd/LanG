<template>
  <div class="admin-page-content">
    <h1 class="text-h4 q-ma-none q-mb-md">Профиль администратора</h1>

    <div class="row q-col-gutter-lg">
      <!-- Блок: Фото и основная информация -->
      <div class="col-12 col-md-5">
        <QCard flat bordered>
          <QCardSection>
            <div class="text-h6 q-mb-md">Фото и данные</div>
            <div class="column items-center q-gutter-md">
              <div class="relative-position">
                <img
                  v-if="avatarPreview || (form.avatar && form.avatar !== '')"
                  :src="avatarPreview || form.avatar"
                  alt="Profile avatar"
                  class="profile-avatar"
                />
                <QAvatar
                  v-else
                  size="180px"
                  icon="person"
                  font-size="72px"
                  color="grey-4"
                  class="q-mb-sm"
                />
                <QBtn
                  round
                  dense
                  color="primary"
                  icon="photo_camera"
                  size="sm"
                  class="absolute"
                  style="bottom: 0; right: 0"
                  @click="avatarInput?.click()"
                />
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleAvatarSelect"
                />
                <div v-if="avatarPreview" class="text-caption text-grey q-mt-xs">Фото будет сохранено при нажатии «Сохранить»</div>
              </div>
              <QInput
                v-model="form.first_name"
                label="Имя"
                outlined
                dense
                class="full-width"
              />
              <QInput
                v-model="form.last_name"
                label="Фамилия"
                outlined
                dense
                class="full-width"
              />
              <QInput
                v-model="form.phone"
                label="Телефон"
                outlined
                dense
                class="full-width"
              />
              <QInput
                v-model="form.username"
                label="Логин"
                outlined
                dense
                disabled
                class="full-width"
              />
              <QInput
                v-model="form.email"
                label="Email"
                outlined
                dense
                type="email"
                class="full-width"
              />
              <QBtn
                color="primary"
                label="Сохранить изменения"
                :loading="savingProfile"
                @click="saveProfile"
              />
            </div>
          </QCardSection>
        </QCard>
      </div>

      <!-- Блок: Смена пароля -->
      <div class="col-12 col-md-5">
        <QCard flat bordered>
          <QCardSection>
            <div class="text-h6 q-mb-md">Безопасность</div>
            <QForm @submit="changePassword" class="q-gutter-md">
              <QInput
                v-model="passwordForm.currentPassword"
                type="password"
                label="Текущий пароль"
                outlined
                dense
                :rules="[val => !!val || 'Обязательное поле']"
              />
              <QInput
                v-model="passwordForm.newPassword"
                type="password"
                label="Новый пароль"
                outlined
                dense
                :rules="[
                  val => !!val || 'Обязательное поле',
                  val => val.length >= 6 || 'Минимум 6 символов'
                ]"
              />
              <QInput
                v-model="passwordForm.confirmPassword"
                type="password"
                label="Подтвердите новый пароль"
                outlined
                dense
                :rules="[
                  val => !!val || 'Обязательное поле',
                  val => val === passwordForm.newPassword || 'Пароли не совпадают'
                ]"
              />
              <QBtn
                label="Сменить пароль"
                type="submit"
                color="primary"
                :loading="savingPassword"
              />
            </QForm>
          </QCardSection>
        </QCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const $q = useQuasar()

const form = ref({
  id: '',
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  avatar: ''
})

const savingProfile = ref(false)
const savingPassword = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)
const avatarFile = ref<File | null>(null)

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const fetchProfile = async () => {
  try {
    const data = await $fetch<any>(`${apiBase}/admin/profile`, { credentials: 'include' })
    form.value = {
      id: data.id ?? '',
      username: data.username ?? '',
      email: data.email ?? '',
      first_name: data.first_name ?? '',
      last_name: data.last_name ?? '',
      phone: data.phone ?? '',
      avatar: data.avatar ?? ''
    }
  } catch (e) {
    console.error('Fetch profile error:', e)
    $q.notify({ color: 'negative', message: 'Ошибка загрузки профиля', icon: 'error' })
  }
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

const saveProfile = async () => {
  savingProfile.value = true
  try {
    if (avatarFile.value) {
      const fd = new FormData()
      fd.append('file', avatarFile.value)
      const res = await $fetch<{ url: string }>(`${apiBase}/upload`, {
        method: 'POST',
        body: fd,
        credentials: 'include'
      })
      form.value.avatar = res.url
      if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
      avatarPreview.value = null
      avatarFile.value = null
    }

    await $fetch(`${apiBase}/admin/profile`, {
      method: 'PATCH',
      body: {
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        phone: form.value.phone,
        avatar: form.value.avatar,
        email: form.value.email
      },
      credentials: 'include'
    })
    $q.notify({ color: 'positive', message: 'Профиль сохранён', icon: 'check' })
    await useAuthStore().fetchCurrentUser()
  } catch (err: any) {
    console.error('Save profile error:', err)
    $q.notify({
      color: 'negative',
      message: err.data?.error || 'Ошибка сохранения',
      icon: 'error'
    })
  } finally {
    savingProfile.value = false
  }
}

const changePassword = async () => {
  savingPassword.value = true
  try {
    await $fetch(`${apiBase}/admin/change-password`, {
      method: 'POST',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      },
      credentials: 'include'
    })
    $q.notify({ color: 'positive', message: 'Пароль успешно изменён', icon: 'check' })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err: any) {
    console.error('Change password error:', err)
    $q.notify({
      color: 'negative',
      message: err.data?.error || 'Ошибка при смене пароля',
      icon: 'error'
    })
  } finally {
    savingPassword.value = false
  }
}

onMounted(() => {
  fetchProfile()
})

onBeforeUnmount(() => {
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
})
</script>

<style scoped>
.profile-avatar {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e0e0e0;
  margin-bottom: 0.5rem;
}
</style>
