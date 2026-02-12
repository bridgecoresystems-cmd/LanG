<template>
  <div class="admin-page-content">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h1 class="text-h4 q-ma-none">Редактировать школу</h1>
      </div>
      <div class="col-auto">
        <q-btn outline color="grey-7" icon="arrow_back" label="Назад" to="/admin/schools" />
      </div>
    </div>

    <q-inner-loading :showing="loading && !form.name">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>

    <q-card v-if="!loading || form.name" flat bordered class="admin-form-card">
      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="admin-form">
          <q-input v-model="form.name" label="Название школы *" outlined :rules="[val => !!val?.trim() || 'Обязательно']" class="q-mb-md" />
          <q-input v-model="form.address" label="Адрес" outlined class="q-mb-md" />
          <q-input v-model="form.phone" label="Телефон" outlined class="q-mb-md" />
          <q-toggle v-model="form.is_active" label="Активна" class="q-mb-md" />
          <div class="row q-gutter-sm q-mt-lg">
            <q-btn type="submit" color="primary" label="Сохранить" :loading="saving" icon="save" />
            <q-btn outline color="grey-7" label="Отмена" to="/admin/schools" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const { getById: fetchSchool, update: updateSchool } = useAdminSchools()

const loading = ref(true)
const saving = ref(false)

const form = ref({
  id: 0,
  name: '',
  address: '',
  phone: '',
  is_active: true
})

const handleSubmit = async () => {
  saving.value = true
  try {
    await updateSchool(form.value.id, {
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

onMounted(async () => {
  const id = Number(route.params.id)
  if (!id) {
    loading.value = false
    navigateTo('/admin/schools')
    return
  }
  try {
    const data = await fetchSchool(id)
    if (data?.error) {
      navigateTo('/admin/schools')
      return
    }
    form.value = {
      id: data.id,
      name: data.name || '',
      address: data.address || '',
      phone: data.phone || '',
      is_active: data.is_active ?? true
    }
  } catch {
    navigateTo('/admin/schools')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-form :deep(.q-input) {
  max-width: 600px;
}
</style>
