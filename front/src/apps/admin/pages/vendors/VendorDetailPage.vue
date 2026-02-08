<template>
  <AdminLayout>
    <div class="admin-page">
      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="3em" />
      </div>

      <template v-else-if="vendor">
        <!-- Header -->
        <div class="row items-center q-mb-lg">
          <div class="col">
            <q-btn
              flat
              round
              dense
              icon="arrow_back"
              @click="router.push('/management/vendors')"
              class="q-mr-sm"
            />
            <h1 class="text-h4 q-ma-none inline-block vertical-middle">
              {{ vendor.name_ru || vendor.name_tm }}
            </h1>
            <q-badge
              :color="vendor.is_active ? 'positive' : 'negative'"
              class="q-ml-md"
              label="Активен"
              v-if="vendor.is_active"
            />
            <q-badge
              color="negative"
              class="q-ml-md"
              label="Заблокирован"
              v-else
            />
          </div>
          <div class="col-auto q-gutter-sm">
            <q-btn
              color="primary"
              icon="edit"
              :label="$t('admin.actions.edit')"
              :to="`/management/vendors/${vendor.id}/change`"
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
                <div class="text-h6 q-mb-md">Общая информация</div>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-4">
                    <div class="text-caption text-grey-7">Название (RU)</div>
                    <div class="text-subtitle1">{{ vendor.name_ru || '—' }}</div>
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="text-caption text-grey-7">Название (TM)</div>
                    <div class="text-subtitle1">{{ vendor.name_tm || '—' }}</div>
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="text-caption text-grey-7">Название (EN)</div>
                    <div class="text-subtitle1">{{ vendor.name_en || '—' }}</div>
                  </div>
                  <div class="col-12">
                    <div class="text-caption text-grey-7">Описание</div>
                    <div class="text-body1" style="white-space: pre-wrap;">
                      {{ vendor.description_ru || vendor.description_tm || 'Описание отсутствует' }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card flat bordered>
              <q-card-section>
                <div class="text-h6 q-mb-md">Настройки терминала (ESP32)</div>
                <div class="row items-center q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <div class="text-caption text-grey-7">Terminal ID</div>
                    <div class="text-subtitle1 text-weight-bold">{{ vendor.terminal_id || 'Не назначен' }}</div>
                  </div>
                  <div class="col-12 col-sm-6">
                    <div class="text-caption text-grey-7">Auth Token</div>
                    <div class="row items-center no-wrap">
                      <code class="bg-grey-2 q-pa-xs rounded-borders text-body2 overflow-hidden ellipsis">
                        {{ vendor.auth_token }}
                      </code>
                      <q-btn
                        flat
                        round
                        dense
                        icon="content_copy"
                        size="sm"
                        class="q-ml-sm"
                        @click="copyToken"
                      >
                        <q-tooltip>Копировать токен</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Sidebar Info -->
          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <div class="text-h6 q-mb-md">Связанный аккаунт</div>
                <div class="row items-center q-mb-md">
                  <q-avatar color="primary" text-color="white" icon="person" class="q-mr-md" />
                  <div>
                    <div class="text-weight-bold">{{ vendor.username }}</div>
                    <div class="text-caption">{{ vendor.email }}</div>
                  </div>
                </div>
                <q-btn
                  flat
                  color="primary"
                  :label="`Перейти к пользователю`"
                  class="full-width"
                  :to="`/management/merchants/${vendor.user}/`"
                />
              </q-card-section>
            </q-card>

            <q-card flat bordered>
              <q-card-section>
                <div class="text-h6 q-mb-sm">Метаданные</div>
                <div class="text-caption text-grey-7 q-mb-xs">ID записи: {{ vendor.id }}</div>
                <div class="text-caption text-grey-7">Создан: {{ formatDate(vendor.created_at) }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </template>

      <div v-else class="row justify-center q-pa-xl">
        <div class="text-h6 text-grey-6">Вендор не найден</div>
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
import AdminLayout from '../../layouts/AdminLayout.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const loading = ref(true)
const vendor = ref<any>(null)

const fetchVendor = async () => {
  loading.value = true
  try {
    const response = await axios.get(`/api/v1/vendors/profiles/${route.params.id}/`)
    vendor.value = response.data
  } catch (err) {
    console.error('Error fetching vendor details:', err)
  } finally {
    loading.value = false
  }
}

const confirmDelete = () => {
  if (confirm(t('admin.confirmDelete') || 'Вы уверены, что хотите удалить этого вендора?')) {
    deleteVendor()
  }
}

const deleteVendor = async () => {
  try {
    await axios.delete(`/api/v1/vendors/profiles/${vendor.value.id}/`)
    router.push('/management/vendors')
  } catch (err) {
    console.error('Error deleting vendor:', err)
    alert('Ошибка при удалении вендора')
  }
}

const copyToken = () => {
  if (vendor.value?.auth_token) {
    navigator.clipboard.writeText(vendor.value.auth_token)
    alert('Токен скопирован в буфер обмена')
  }
}

const formatDate = (date: string) => {
  if (!date) return '—'
  return dayjs(date).format('DD.MM.YYYY HH:mm')
}

onMounted(fetchVendor)
</script>

