<template>
  <div class="admin-page-content">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-ma-none">Добавить школу</h1>
      </div>
      <div class="col-auto">
        <q-btn outline color="grey-7" icon="arrow_back" label="Назад" to="/admin/schools" />
      </div>
    </div>

    <q-card flat bordered class="admin-form-card">
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="admin-form">
          <q-input v-model="form.name" label="Название школы *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />
          <q-input v-model="form.address" label="Адрес" outlined class="q-mb-md" />
          <q-input v-model="form.phone" label="Телефон" outlined class="q-mb-md" />
          <q-toggle v-model="form.is_active" label="Активна" class="q-mb-md" />
          <div class="row q-gutter-sm q-mt-lg">
            <q-btn type="submit" color="primary" label="Создать" :loading="saving" icon="save" />
            <q-btn outline color="grey-7" label="К списку" to="/admin/schools" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { createSchool } = useAdminSchools()
const saving = ref(false)

const form = ref({
  name: '',
  address: '',
  phone: '',
  is_active: true
})

const handleSubmit = async () => {
  saving.value = true
  try {
    await createSchool({
      name: form.value.name.trim(),
      address: form.value.address?.trim() || undefined,
      phone: form.value.phone?.trim() || undefined,
      is_active: form.value.is_active
    })
    navigateTo('/admin/schools')
  } catch (e: any) {
    const err = e?.message || e?.data?.error || 'Ошибка'
    console.error(e)
    alert(err)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.admin-form :deep(.q-input) {
  max-width: 600px;
}
</style>
