<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.models.administrators') }}</h1>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            :label="$t('admin.actions.add') + ' ' + $t('admin.models.administrator')"
            icon="add"
            :to="{ name: 'AdminAdministratorAdd' }"
          />
        </div>
      </div>

      <!-- Filters -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="searchQuery"
                :placeholder="$t('admin.search')"
                outlined
                dense
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Loading State -->
      <q-inner-loading :showing="loading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>

      <!-- Error State -->
      <q-banner v-if="error" class="bg-negative text-white q-mb-md">
        {{ error }}
      </q-banner>

      <!-- Administrators Table -->
      <q-card v-if="!loading && !error" flat bordered>
        <q-card-section>
          <q-table
            :rows="sortedItems"
            :columns="columns"
            row-key="id"
            :loading="loading"
            v-model:pagination="pagination"
            :rows-per-page-options="[10, 20, 50, 100]"
            @row-click="(evt, row) => editItem(row.id)"
            class="cursor-pointer"
            binary-state-sort
          >
            <template v-slot:body-cell-fullName="props">
              <q-td :props="props">
                {{ props.row.full_name || (props.row.first_name + ' ' + props.row.last_name) }}
              </q-td>
            </template>

            <template v-slot:body-cell-isActive="props">
              <q-td :props="props">
                <q-badge :color="props.row.is_active ? 'positive' : 'negative'">
                  {{ props.row.is_active ? $t('admin.filters.active') : $t('admin.filters.inactive') }}
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
                  @click="editItem(props.row.id)"
                  class="q-mr-xs"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  @click.stop="handleDelete(props.row.id)"
                />
              </q-td>
            </template>

            <template v-slot:no-data>
              <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
                <q-icon name="inbox" size="2em" />
                <span>{{ $t('admin.table.noData') }}</span>
              </div>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../../layouts/AdminLayout.vue'
import { useAdminAdministrators } from '@/composables/useAdminApi'

const router = useRouter()
const { t } = useI18n()
const { loading, error, fetchAdministrators, deleteAdministrator } = useAdminAdministrators()

const searchQuery = ref('')
const items = ref<any[]>([])

const pagination = ref({
  sortBy: 'id',
  descending: false,
  page: 1,
  rowsPerPage: 20
})

const columns = computed(() => [
  {
    name: 'id',
    label: t('admin.table.id'),
    field: 'id',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'username',
    label: t('admin.table.username'),
    field: 'username',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'email',
    label: t('admin.table.email'),
    field: 'email',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'fullName',
    label: t('admin.table.fullName'),
    field: 'full_name',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'isActive',
    label: t('admin.table.isActive'),
    field: 'is_active',
    align: 'center' as const,
    sortable: true
  },
  {
    name: 'actions',
    label: t('admin.table.actions'),
    field: 'actions',
    align: 'center' as const
  }
])

const filteredItems = computed(() => {
  let filtered = items.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.username.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      (item.first_name && item.first_name.toLowerCase().includes(query)) ||
      (item.last_name && item.last_name.toLowerCase().includes(query))
    )
  }

  return filtered
})

const sortedItems = computed(() => {
  let sorted = [...filteredItems.value]
  
  const sortBy = pagination.value.sortBy
  const descending = pagination.value.descending
  
  if (!sortBy) return sorted
  
  sorted.sort((a, b) => {
    let aVal: any
    let bVal: any
    
    // Handle special fields
    if (sortBy === 'fullName') {
      aVal = (a.full_name || (a.first_name + ' ' + a.last_name)).toLowerCase()
      bVal = (b.full_name || (b.first_name + ' ' + b.last_name)).toLowerCase()
    } else if (sortBy === 'isActive') {
      aVal = a.is_active ? 1 : 0
      bVal = b.is_active ? 1 : 0
    } else {
      aVal = a[sortBy]
      bVal = b[sortBy]
    }
    
    // Handle null/undefined values
    if (aVal == null) return 1
    if (bVal == null) return -1
    
    // Compare values
    if (aVal < bVal) return descending ? 1 : -1
    if (aVal > bVal) return descending ? -1 : 1
    return 0
  })
  
  return sorted
})

const editItem = (id: number) => {
  router.push(`/management/administrators/${id}/change`)
}

const handleDelete = async (id: number) => {
  const confirmed = await new Promise<boolean>((resolve) => {
    resolve(window.confirm(t('admin.confirmDelete')))
  })

  if (confirmed) {
    try {
      await deleteAdministrator(id)
      await loadAdministrators()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}

const loadAdministrators = async () => {
  try {
    const params: any = { page_size: 9999 }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    const response = await fetchAdministrators(params)
    items.value = Array.isArray(response) ? response : response.results || []
  } catch (err) {
    console.error('Load administrators error:', err)
  }
}

// Watchers
watch(() => pagination.value.rowsPerPage, () => {
  pagination.value.page = 1
})

onMounted(() => {
  loadAdministrators()
})
</script>

<style scoped>
.admin-page {
  padding: 0;
}

:deep(.q-table tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

:deep(.q-table tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
</style>
