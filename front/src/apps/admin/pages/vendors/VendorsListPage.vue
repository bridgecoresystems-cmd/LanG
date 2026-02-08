<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="row items-center q-mb-md">
        <div class="col">
          <h1 class="text-h4 q-ma-none">Торговые точки (Вендоры)</h1>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            label="Добавить вендора"
            icon="add"
            :to="{ name: 'AdminVendorAdd' }"
          />
        </div>
      </div>

      <q-card flat bordered>
        <q-card-section>
          <q-table
            :rows="vendors"
            :columns="columns"
            row-key="id"
            :loading="loading"
            :pagination="{ rowsPerPage: 20 }"
            binary-state-sort
            @row-click="onRowClick"
            class="vendor-table"
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge :color="props.row.is_active ? 'positive' : 'negative'">
                  {{ props.row.is_active ? 'Активен' : 'Заблокирован' }}
                </q-badge>
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props" @click.stop>
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  color="primary"
                  :to="`/management/vendors/${props.row.id}/change`"
                  class="q-mr-xs"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  @click="handleDelete(props.row.id)"
                />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../layouts/AdminLayout.vue'
import { useVendors } from '@/composables/useVendors'
import axios from 'axios'

const router = useRouter()
const { t } = useI18n()
const { vendors, loading, fetchVendors } = useVendors()

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'name', label: 'Название', field: (row: any) => row.name_ru || row.name_tm, align: 'left', sortable: true },
  { name: 'username', label: 'Аккаунт', field: 'username', align: 'left', sortable: true },
  { name: 'terminal', label: 'Terminal ID', field: 'terminal_id', align: 'left' },
  { name: 'status', label: 'Статус', field: 'is_active', align: 'center' },
  { name: 'actions', label: 'Действия', field: 'actions', align: 'center' }
]

const onRowClick = (_evt: any, row: any) => {
  router.push(`/management/vendors/${row.id}/`)
}

const handleDelete = async (id: number) => {
  if (confirm('Вы уверены, что хотите удалить этого вендора?')) {
    try {
      await axios.delete(`/api/v1/vendors/profiles/${id}/`)
      fetchVendors()
    } catch (err) {
      console.error('Error deleting vendor:', err)
      alert('Ошибка при удалении вендора')
    }
  }
}

onMounted(fetchVendors)
</script>

<style scoped>
.vendor-table :deep(tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.vendor-table :deep(tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.03);
}
</style>

