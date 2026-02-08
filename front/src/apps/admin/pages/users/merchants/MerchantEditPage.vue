<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="row items-center q-mb-md">
        <q-btn flat round dense icon="arrow_back" @click="$router.back()" class="q-mr-sm" />
        <h1 class="text-h4 q-ma-none">{{ $t('admin.actions.edit') }} {{ $t('admin.menu.merchants') || 'Продавца' }}</h1>
      </div>

      <q-card flat bordered class="admin-form">
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.username"
                  label="Username *"
                  outlined
                  dense
                  :rules="[val => !!val || 'Обязательное поле']"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.password"
                  label="Новый пароль (оставьте пустым, чтобы не менять)"
                  type="password"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.first_name"
                  label="Имя"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.last_name"
                  label="Фамилия"
                  outlined
                  dense
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="formData.email"
                  label="Email"
                  type="email"
                  outlined
                  dense
                />
              </div>
              <div class="col-12">
                <q-toggle
                  v-model="formData.is_active"
                  label="Активен"
                  color="positive"
                />
              </div>
            </div>

            <div class="row q-mt-lg">
              <q-btn
                type="submit"
                color="primary"
                label="Сохранить"
                :loading="loading"
                class="q-px-xl"
              />
              <q-btn
                flat
                label="Отмена"
                class="q-ml-md"
                @click="$router.back()"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import AdminLayout from '../../../layouts/AdminLayout.vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const id = route.params.id

const formData = ref({
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  is_active: true
})

const fetchMerchant = async () => {
  try {
    const response = await axios.get(`/api/v1/admin/users/users/${id}/`)
    const data = response.data
    formData.value = {
      username: data.username,
      password: '',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      is_active: data.is_active
    }
  } catch (err) {
    console.error('Error fetching merchant:', err)
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const submitData = { ...formData.value }
    if (!submitData.password) {
      delete submitData.password
    }
    await axios.patch(`/api/v1/admin/users/users/${id}/`, submitData)
    router.push('/management/merchants')
  } catch (err) {
    console.error('Error updating merchant:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchMerchant)
</script>

<style scoped>
.admin-form {
  max-width: 800px;
}
</style>

