<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="row items-center q-mb-md">
        <q-btn flat round dense icon="arrow_back" @click="$router.back()" class="q-mr-sm" />
        <h1 class="text-h4 q-ma-none">{{ $t('admin.actions.add') }} {{ $t('admin.menu.merchants') || 'Продавца' }}</h1>
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
                  label="Пароль *"
                  type="password"
                  outlined
                  dense
                  :rules="[val => !!val || 'Обязательное поле']"
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import AdminLayout from '../../../layouts/AdminLayout.vue'

const router = useRouter()
const loading = ref(false)

const formData = ref({
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  role: 'merchant',
  is_active: true
})

const handleSubmit = async () => {
  loading.value = true
  try {
    await axios.post('/api/v1/admin/users/users/', formData.value)
    router.push('/management/merchants')
  } catch (err) {
    console.error('Error creating merchant:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-form {
  max-width: 800px;
}
</style>

