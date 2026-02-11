<template>
  <div class="admin-page-content">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-ma-none">Редактировать сообщение</h1>
      </div>
      <div class="col-auto">
        <q-btn outline color="grey-7" icon="arrow_back" label="Назад" to="/admin/landing/contact" />
      </div>
    </div>

    <q-inner-loading :showing="loading && !form.name">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>

    <q-card v-if="!loading || form.name" flat bordered class="admin-form-card">
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="admin-form">
          <q-input v-model="form.name" label="Имя *" outlined :rules="[val => !!val || 'Обязательно']" class="q-mb-md">
            <template v-slot:prepend><q-icon name="person" /></template>
          </q-input>
          <q-input v-model="form.email" label="Email *" type="email" outlined :rules="[val => !!val || 'Обязательно', val => /.+@.+\..+/.test(val) || 'Неверный email']" class="q-mb-md">
            <template v-slot:prepend><q-icon name="email" /></template>
          </q-input>
          <q-input v-model="form.phone" label="Телефон" outlined class="q-mb-md">
            <template v-slot:prepend><q-icon name="phone" /></template>
          </q-input>
          <q-input v-model="form.message" label="Сообщение *" type="textarea" outlined rows="8" :rules="[val => !!val || 'Обязательно']" class="q-mb-md" />
          <q-select v-model="form.status" :options="statusOptions" label="Статус" outlined emit-value map-options class="q-mb-md" />
          <q-input v-model.number="form.likes" label="Лайки" type="number" min="0" outlined readonly class="q-mb-md" style="max-width: 150px">
            <template v-slot:prepend><q-icon name="thumb_up" /></template>
          </q-input>
          <div class="row q-gutter-sm q-mt-lg">
            <q-btn type="submit" color="primary" label="Сохранить" :loading="saving" icon="save" />
            <q-btn outline color="grey-7" label="Отмена" to="/admin/landing/contact" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const { getById, update } = useAdminContact()

const loading = ref(true)
const saving = ref(false)
const form = ref({
  name: '',
  email: '',
  phone: '',
  message: '',
  status: 'pending' as 'pending' | 'approved' | 'rejected',
  likes: 0
})

const statusOptions = [
  { label: 'Ожидает', value: 'pending' },
  { label: 'Одобрено', value: 'approved' },
  { label: 'Отклонено', value: 'rejected' }
]

const handleSubmit = async () => {
  saving.value = true
  try {
    await update(Number(route.params.id), {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone || '',
      message: form.value.message,
      status: form.value.status
    })
    navigateTo('/admin/landing/contact')
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const item = await getById(Number(route.params.id))
    if (item) {
      form.value = {
        name: (item as any).name || '',
        email: (item as any).email || '',
        phone: (item as any).phone || '',
        message: (item as any).message || '',
        status: (item as any).status || 'pending',
        likes: (item as any).likes ?? 0
      }
    }
  } catch (e) {
    console.error(e)
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
.admin-form :deep(.q-field--textarea) {
  max-width: 800px;
}
</style>
