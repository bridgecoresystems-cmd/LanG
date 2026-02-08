<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="row items-center q-mb-md">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.menu.merchants') || 'Продавцы' }}</h1>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            icon="add"
            :label="$t('admin.actions.add')"
            to="/management/merchants/add"
          />
        </div>
      </div>

      <q-card flat bordered>
        <q-table
          :rows="merchants"
          :columns="columns"
          row-key="id"
          :loading="loading"
          flat
          @row-click="onRowClick"
          class="merchant-table"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="q-gutter-x-sm" @click.stop>
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="edit"
                :to="`/management/merchants/${props.row.id}/change`"
              >
                <q-tooltip>{{ $t('admin.actions.edit') }}</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>{{ $t('admin.actions.delete') }}</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template v-slot:body-cell-is_active="props">
            <q-td :props="props">
              <q-icon
                :name="props.row.is_active ? 'check_circle' : 'cancel'"
                :color="props.row.is_active ? 'positive' : 'negative'"
                size="xs"
              />
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import axios from 'axios'

const { t } = useI18n()
const router = useRouter()
const merchants = ref([])
const loading = ref(false)

const columns = computed(() => [
  { name: 'username', label: t('admin.forms.username') || 'Username', field: 'username', align: 'left', sortable: true },
  { name: 'first_name', label: t('admin.forms.firstName') || 'Имя', field: 'first_name', align: 'left', sortable: true },
  { name: 'last_name', label: t('admin.forms.lastName') || 'Фамилия', field: 'last_name', align: 'left', sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
  { name: 'is_active', label: t('admin.forms.active') || 'Активен', field: 'is_active', align: 'center' },
  { name: 'actions', label: t('admin.actions.actions') || 'Действия', field: 'actions', align: 'center' }
])

const onRowClick = (_evt: any, row: any) => {
  router.push(`/management/merchants/${row.id}/`)
}

const fetchMerchants = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/v1/admin/users/users/?role=merchant')
    merchants.value = Array.isArray(response.data) ? response.data : response.data.results || []
  } catch (err) {
    console.error('Error fetching merchants:', err)
  } finally {
    loading.value = false
  }
}

const confirmDelete = (merchant: any) => {
  if (confirm(t('admin.confirmDelete') || `Вы уверены, что хотите удалить продавца ${merchant.username}?`)) {
    deleteMerchant(merchant.id)
  }
}

const deleteMerchant = async (id: number) => {
  try {
    await axios.delete(`/api/v1/admin/users/users/${id}/`)
    fetchMerchants()
  } catch (err) {
    console.error('Error deleting merchant:', err)
  }
}

onMounted(fetchMerchants)
</script>

<style scoped>
.merchant-table :deep(tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.merchant-table :deep(tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.03);
}
</style>

