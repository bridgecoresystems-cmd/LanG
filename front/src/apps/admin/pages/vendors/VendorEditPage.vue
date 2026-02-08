<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="row items-center q-mb-md">
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          @click="router.back()"
          class="q-mr-sm"
        />
        <h1 class="text-h4 q-ma-none">Редактировать вендора</h1>
      </div>

      <q-card v-if="!initialLoading" flat bordered class="admin-form">
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <div class="text-h6 q-mb-sm">Аккаунт: {{ formData.username }} ({{ formData.email }})</div>
              </div>

              <div class="col-12">
                <div class="text-h6 q-mb-sm">Названия (Мультиязычность)</div>
                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model="formData.name_tm"
                      label="Название (TM) *"
                      outlined
                      dense
                      :rules="[val => !!val || 'Обязательное поле']"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model="formData.name_ru"
                      label="Название (RU) *"
                      outlined
                      dense
                      :rules="[val => !!val || 'Обязательное поле']"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model="formData.name_en"
                      label="Название (EN) *"
                      outlined
                      dense
                      :rules="[val => !!val || 'Обязательное поле']"
                    />
                  </div>
                </div>
              </div>

              <div class="col-12">
                <div class="text-h6 q-mb-sm">Терминал ESP32</div>
                <q-input
                  v-model="formData.terminal_id"
                  label="Terminal ID"
                  outlined
                  dense
                  placeholder="Например: SHOP-01"
                />
                <div class="q-mt-sm">
                  <div class="text-caption text-grey-7">Auth Token (только чтение):</div>
                  <code class="bg-grey-2 q-pa-xs rounded-borders">{{ formData.auth_token }}</code>
                </div>
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
                label="Сохранить изменения"
                :loading="loading"
                class="q-px-xl"
              />
              <q-btn
                flat
                label="Отмена"
                class="q-ml-md"
                @click="router.back()"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <q-inner-loading :showing="initialLoading">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import AdminLayout from '../../layouts/AdminLayout.vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const initialLoading = ref(true)

const formData = ref({
  username: '',
  email: '',
  name_tm: '',
  name_ru: '',
  name_en: '',
  terminal_id: '',
  auth_token: '',
  is_active: true
})

const fetchVendor = async () => {
  try {
    const id = route.params.id
    const response = await axios.get(`/api/v1/vendors/profiles/${id}/`)
    formData.value = { ...response.data }
  } catch (err) {
    console.error('Error fetching vendor:', err)
  } finally {
    initialLoading.value = false
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const id = route.params.id
    await axios.patch(`/api/v1/vendors/profiles/${id}/`, formData.value)
    router.push('/management/vendors')
  } catch (err: any) {
    console.error('Error updating vendor:', err)
    const detail = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Ошибка при обновлении вендора'
    alert(detail)
  } finally {
    loading.value = false
  }
}

onMounted(fetchVendor)
</script>

<style scoped>
.admin-form {
  max-width: 800px;
}
</style>

