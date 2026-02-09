<template>
  <div class="cabinet-profile q-pa-md">
    <h1 class="text-h4 q-ma-none q-mb-md">{{ $t('cabinet.profile') || 'Профиль' }}</h1>

    <div class="row q-col-gutter-lg">
      <!-- Фото и видео -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">Фото и видео</div>

            <!-- Аватар -->
            <div class="q-mb-lg">
              <div class="text-subtitle2 q-mb-sm">Фото</div>
              <div class="relative-position inline-block">
                <img
                  v-if="avatarPreview || (form.avatar && form.avatar !== '')"
                  :src="avatarPreview || form.avatar"
                  alt="Avatar"
                  class="profile-avatar"
                />
                <q-avatar v-else size="120px" icon="person" font-size="48px" color="grey-4" />
                <q-btn round dense color="primary" icon="photo_camera" size="sm" class="absolute" style="bottom: 0; right: 0" @click="avatarInput?.click()" />
                <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="handleAvatarSelect" />
              </div>
              <p v-if="avatarPreview" class="text-caption text-grey q-mt-xs q-mb-none">Будет сохранено при нажатии «Сохранить»</p>
            </div>

            <!-- Видео -->
            <div>
              <div class="text-subtitle2 q-mb-sm">Видео (ссылка или загрузка)</div>
              <div v-if="form.video || videoPreview" class="video-preview q-mb-sm">
                <video v-if="videoSrc" :src="videoSrc" controls class="profile-video" />
                <div v-else class="video-placeholder">
                  <q-icon name="videocam" size="48px" color="grey-6" />
                  <span class="text-caption">Видео загружено</span>
                </div>
              </div>
              <q-input v-model="form.video" label="Ссылка на видео (YouTube, Vimeo)" outlined dense class="q-mb-sm" />
              <div class="row items-center q-gutter-sm">
                <q-btn outline size="sm" icon="upload" label="Загрузить файл" @click="videoInput?.click()" />
                <input ref="videoInput" type="file" accept="video/*" class="hidden" @change="handleVideoSelect" />
                <q-btn v-if="form.video || videoFile" flat size="sm" color="negative" icon="delete" label="Удалить" @click="clearVideo" />
              </div>
              <p v-if="videoFile" class="text-caption text-grey q-mt-xs q-mb-none">Файл будет загружен при сохранении</p>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Данные -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">Данные</div>
            <q-input v-model="form.first_name" label="Имя" outlined dense class="q-mb-md" />
            <q-input v-model="form.last_name" label="Фамилия" outlined dense class="q-mb-md" />
            <q-input v-model="form.phone" label="Телефон" outlined dense class="q-mb-md" />
            <q-input v-model="form.username" label="Логин" outlined dense disabled class="q-mb-md" />
            <q-input v-model="form.email" label="Email" outlined dense type="email" class="q-mb-md" />
            <q-btn color="primary" label="Сохранить" :loading="saving" @click="saveProfile" />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'cabinet-auth' })

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
  avatar: '',
  video: ''
})

const saving = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)
const avatarFile = ref<File | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const videoFile = ref<File | null>(null)

const videoSrc = computed(() => {
  if (videoPreview.value) return videoPreview.value
  const v = form.value.video
  if (!v) return ''
  if (v.startsWith('http') || v.startsWith('/') || v.startsWith('blob:')) return v
  return ''
})

const videoPreview = ref<string | null>(null)

const fetchProfile = async () => {
  try {
    const data = await $fetch<any>(`${apiBase}/cabinet/profile`, { credentials: 'include' })
    form.value = {
      id: data.id ?? '',
      username: data.username ?? '',
      email: data.email ?? '',
      first_name: data.first_name ?? '',
      last_name: data.last_name ?? '',
      phone: data.phone ?? '',
      avatar: data.avatar ?? '',
      video: data.video ?? ''
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

const handleVideoSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (videoPreview.value) URL.revokeObjectURL(videoPreview.value)
  videoPreview.value = URL.createObjectURL(file)
  videoFile.value = file
  form.value.video = ''
  input.value = ''
}

const clearVideo = () => {
  if (videoPreview.value) URL.revokeObjectURL(videoPreview.value)
  videoPreview.value = null
  videoFile.value = null
  form.value.video = ''
}

const saveProfile = async () => {
  saving.value = true
  try {
    if (avatarFile.value) {
      const fd = new FormData()
      fd.append('file', avatarFile.value)
      const res = await $fetch<{ url: string }>(`${apiBase}/upload`, { method: 'POST', body: fd, credentials: 'include' })
      form.value.avatar = res.url
      if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
      avatarPreview.value = null
      avatarFile.value = null
    }

    if (videoFile.value) {
      const fd = new FormData()
      fd.append('file', videoFile.value)
      const res = await $fetch<{ url: string }>(`${apiBase}/upload`, { method: 'POST', body: fd, credentials: 'include' })
      form.value.video = res.url
      if (videoPreview.value) URL.revokeObjectURL(videoPreview.value)
      videoPreview.value = null
      videoFile.value = null
    }

    await $fetch(`${apiBase}/cabinet/profile`, {
      method: 'PATCH',
      body: {
        first_name: form.value.first_name,
        last_name: form.value.last_name,
        phone: form.value.phone,
        avatar: form.value.avatar,
        video: form.value.video,
        email: form.value.email
      },
      credentials: 'include'
    })
    $q.notify({ color: 'positive', message: 'Профиль сохранён', icon: 'check' })
    await useAuthStore().fetchCurrentUser()
  } catch (err: any) {
    console.error('Save profile error:', err)
    $q.notify({ color: 'negative', message: err.data?.error || 'Ошибка сохранения', icon: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(() => fetchProfile())

onBeforeUnmount(() => {
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  if (videoPreview.value) URL.revokeObjectURL(videoPreview.value)
})
</script>

<style scoped>
.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e0e0e0;
}
.profile-video {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  background: #000;
}
.video-placeholder {
  width: 100%;
  min-height: 120px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>
