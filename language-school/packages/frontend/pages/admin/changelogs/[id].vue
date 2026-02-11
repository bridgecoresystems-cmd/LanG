<template>
  <div class="admin-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Редактировать changelog</h1>
      <q-btn flat round icon="arrow_back" @click="router.push('/admin/changelogs')" />
    </div>

    <q-card flat bordered>
      <q-card-section class="q-gutter-md">
        <q-input
          v-model="form.date"
          type="date"
          label="Дата"
          outlined
          dense
          :rules="[val => !!val || 'Обязательно']"
          class="full-width"
        />
        <q-input
          v-model="form.text"
          label="Текст"
          outlined
          dense
          type="textarea"
          rows="4"
          :rules="[val => !!val || 'Обязательно']"
          class="full-width"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" @click="router.push('/admin/changelogs')" />
        <q-btn label="Сохранить" color="primary" @click="save" :loading="saving" />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const { getAll, update } = useAdminChangelogs()

const saving = ref(false)
const form = ref({
  date: '',
  text: ''
})

const fetchItem = async () => {
  try {
    const all = await getAll()
    const item = (all as any[]).find((r: any) => String(r.id) === String(route.params.id))
    if (!item) {
      router.push('/admin/changelogs')
      return
    }
    form.value = {
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : '',
      text: item.text ?? ''
    }
  } catch (e) {
    console.error('Fetch error:', e)
    router.push('/admin/changelogs')
  }
}

const save = async () => {
  if (!form.value.date || !form.value.text) {
    $q.notify({ color: 'negative', message: 'Заполните дату и текст', icon: 'error' })
    return
  }
  saving.value = true
  try {
    await update(Number(route.params.id), {
      date: form.value.date,
      text: form.value.text
    })
    $q.notify({ color: 'positive', message: 'Changelog обновлён', icon: 'check' })
    router.push('/admin/changelogs')
  } catch (e: any) {
    console.error('Save error:', e)
    $q.notify({ color: 'negative', message: e.data?.error || 'Ошибка сохранения', icon: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchItem()
})
</script>
