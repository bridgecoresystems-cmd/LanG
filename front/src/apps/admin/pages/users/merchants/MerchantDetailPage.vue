<template>
  <AdminLayout>
    <div class="admin-page">
      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="3em" />
      </div>

      <template v-else-if="merchant">
        <!-- Header -->
        <div class="row items-center q-mb-lg">
          <div class="col">
            <q-btn
              flat
              round
              dense
              icon="arrow_back"
              @click="router.push('/management/merchants')"
              class="q-mr-sm"
            />
            <h1 class="text-h4 q-ma-none inline-block vertical-middle">
              {{ merchant.first_name }} {{ merchant.last_name }}
            </h1>
            <q-badge
              :color="merchant.is_active ? 'positive' : 'negative'"
              class="q-ml-md"
              :label="merchant.is_active ? 'Активен' : 'Заблокирован'"
            />
          </div>
          <div class="col-auto q-gutter-sm">
            <q-btn
              color="primary"
              icon="edit"
              :label="$t('admin.actions.edit')"
              :to="`/management/merchants/${merchant.id}/change`"
            />
            <q-btn
              color="negative"
              outline
              icon="delete"
              :label="$t('admin.actions.delete')"
              @click="confirmDelete"
            />
          </div>
        </div>

        <div class="row q-col-gutter-lg">
          <!-- Main Info -->
          <div class="col-12 col-md-8">
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <div class="text-h6 q-mb-md">Личные данные</div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <div class="text-caption text-grey-7">Имя</div>
                    <div class="text-subtitle1">{{ merchant.first_name || '—' }}</div>
                  </div>
                  <div class="col-12 col-sm-6">
                    <div class="text-caption text-grey-7">Фамилия</div>
                    <div class="text-subtitle1">{{ merchant.last_name || '—' }}</div>
                  </div>
                  <div class="col-12 col-sm-6">
                    <div class="text-caption text-grey-7">Email</div>
                    <div class="text-subtitle1">{{ merchant.email || '—' }}</div>
                  </div>
                  <div class="col-12 col-sm-6">
                    <div class="text-caption text-grey-7">Username</div>
                    <div class="text-subtitle1">{{ merchant.username }}</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card flat bordered v-if="vendor">
              <q-card-section>
                <div class="text-h6 q-mb-md">Торговая точка (Вендор)</div>
                <div class="row items-center q-mb-md">
                  <q-avatar color="accent" text-color="white" icon="storefront" class="q-mr-md" />
                  <div>
                    <div class="text-weight-bold text-h6">{{ vendor.name_ru || vendor.name_tm }}</div>
                    <div class="text-caption">Terminal ID: {{ vendor.terminal_id || '—' }}</div>
                  </div>
                </div>
                <q-btn
                  flat
                  color="accent"
                  label="Перейти к вендору"
                  class="full-width"
                  :to="`/management/vendors/${vendor.id}/`"
                />
              </q-card-section>
            </q-card>
            <q-banner v-else class="bg-grey-2 rounded-borders">
              <template v-slot:avatar>
                <q-icon name="warning" color="warning" />
              </template>
              Этот пользователь еще не привязан ни к одной торговой точке (вендору).
              <template v-slot:action>
                <q-btn flat color="primary" label="Привязать вендора" to="/management/vendors/add" />
              </template>
            </q-banner>
          </div>

          <!-- Sidebar Info -->
          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <div class="text-h6 q-mb-sm">Системная информация</div>
                <div class="info-list">
                  <div class="q-mb-sm">
                    <div class="text-caption text-grey-7">Роль</div>
                    <div class="text-subtitle2">{{ merchant.role }}</div>
                  </div>
                  <div class="q-mb-sm">
                    <div class="text-caption text-grey-7">Статус сотрудника</div>
                    <q-badge :color="merchant.is_staff ? 'positive' : 'grey-5'">
                      {{ merchant.is_staff ? 'Staff' : 'Обычный' }}
                    </q-badge>
                  </div>
                  <div>
                    <div class="text-caption text-grey-7">Дата регистрации</div>
                    <div class="text-subtitle2">{{ formatDate(merchant.created_at) }}</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </template>

      <div v-else class="row justify-center q-pa-xl">
        <div class="text-h6 text-grey-6">Продавец не найден</div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import dayjs from 'dayjs'
import AdminLayout from '../../../layouts/AdminLayout.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const loading = ref(true)
const merchant = ref<any>(null)
const vendor = ref<any>(null)

const fetchMerchant = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const response = await axios.get(`/api/v1/admin/users/users/${id}/`)
    merchant.value = response.data
    
    // Пытаемся найти привязанного вендора
    await fetchVendor(id)
  } catch (err) {
    console.error('Error fetching merchant details:', err)
  } finally {
    loading.value = false
  }
}

const fetchVendor = async (userId: any) => {
  try {
    // В API вендоров обычно есть фильтрация по user
    const response = await axios.get(`/api/v1/vendors/profiles/?user=${userId}`)
    const vendors = Array.isArray(response.data) ? response.data : response.data.results || []
    if (vendors.length > 0) {
      vendor.value = vendors[0]
    }
  } catch (err) {
    console.warn('Vendor not found for this user')
  }
}

const confirmDelete = () => {
  if (confirm(t('admin.confirmDelete') || 'Вы уверены, что хотите удалить этого пользователя?')) {
    deleteMerchant()
  }
}

const deleteMerchant = async () => {
  try {
    await axios.delete(`/api/v1/admin/users/users/${merchant.value.id}/`)
    router.push('/management/merchants')
  } catch (err) {
    console.error('Error deleting merchant:', err)
    alert('Ошибка при удалении пользователя')
  }
}

const formatDate = (date: string) => {
  if (!date) return '—'
  return dayjs(date).format('DD.MM.YYYY HH:mm')
}

onMounted(fetchMerchant)
</script>

