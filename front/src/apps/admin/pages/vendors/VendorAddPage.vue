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
        <h1 class="text-h4 q-ma-none">Добавить вендора</h1>
      </div>

      <q-card flat bordered class="admin-form">
        <q-card-section>
          <q-form @submit="handleSubmit">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <div class="text-h6 q-mb-sm">Связанный аккаунт</div>
                <q-select
                  v-model="formData.user"
                  :options="userOptions"
                  label="Выберите пользователя (роль Merchant) *"
                  outlined
                  dense
                  emit-value
                  map-options
                  :rules="[val => !!val || 'Выберите пользователя']"
                />
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
                  hint="ID будет использоваться ESP32 для идентификации при оплате"
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
                @click="router.back()"
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
import { useRouter } from 'vue-router'
import axios from 'axios'
import AdminLayout from '../../layouts/AdminLayout.vue'

const router = useRouter()
const loading = ref(false)
const userOptions = ref([])

const formData = ref({
  user: null,
  name_tm: '',
  name_ru: '',
  name_en: '',
  terminal_id: '',
  is_active: true
})

const fetchMerchantUsers = async () => {
  try {
    const response = await axios.get('/api/v1/admin/users/users/?role=merchant')
    const users = Array.isArray(response.data) ? response.data : response.data.results || []
    userOptions.value = users.map((u: any) => ({
      label: `${u.username} (${u.first_name || ''} ${u.last_name || ''})`,
      value: u.id
    }))
  } catch (err) {
    console.error('Error fetching merchants:', err)
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    await axios.post('/api/v1/vendors/profiles/', formData.value)
    router.push('/management/vendors')
  } catch (err: any) {
    console.error('Error creating vendor:', err)
    const detail = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Ошибка при создании вендора'
    alert(detail)
  } finally {
    loading.value = false
  }
}

onMounted(fetchMerchantUsers)
</script>

<style scoped>
.admin-form {
  max-width: 800px;
}
</style>

