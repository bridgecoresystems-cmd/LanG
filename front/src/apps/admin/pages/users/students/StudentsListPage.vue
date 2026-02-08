<template>
  <AdminLayout>
    <div class="admin-page">
      <!-- Page Header -->
      <div class="row items-center q-mb-md">
        <div class="col">
          <h1 class="text-h4 q-ma-none">{{ $t('admin.models.students') }}</h1>
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            :label="$t('admin.actions.add') + ' ' + $t('admin.models.students')"
            icon="add"
            :to="{ name: 'AdminStudentAdd' }"
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
            <div class="col-12 col-md-3">
              <q-select
                v-model="currentFilter"
                :options="filterOptions"
                :label="$t('admin.filters.status')"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="groupFilter"
                :options="groups"
                option-label="name"
                option-value="id"
                :label="$t('admin.filters.group')"
                outlined
                dense
                clearable
                emit-value
                map-options
                use-input
                input-debounce="300"
                @filter="filterGroups"
              />
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

      <!-- Students Table -->
      <q-card v-if="!loading && !error" flat bordered>
        <q-card-section>
          <q-table
            :rows="sortedItems"
            :columns="columns"
            row-key="id"
            :loading="loading"
            v-model:pagination="pagination"
            :rows-per-page-options="[10, 20, 50, 100]"
            @row-click="(evt, row) => viewDetail(row.id)"
            class="cursor-pointer"
            binary-state-sort
          >
            <template v-slot:body-cell-fullName="props">
              <q-td :props="props">
                {{ props.row.full_name || (props.row.first_name + ' ' + props.row.last_name) }}
              </q-td>
            </template>

            <template v-slot:body-cell-gender="props">
              <q-td :props="props">
                <q-badge v-if="props.row.gender" :color="props.row.gender === 'boy' ? 'blue' : 'pink'">
                  {{ props.row.gender === 'boy' ? $t('admin.forms.genderBoy') : $t('admin.forms.genderGirl') }}
                </q-badge>
                <span v-else>-</span>
              </q-td>
            </template>

            <template v-slot:body-cell-isActive="props">
              <q-td :props="props">
                <q-badge :color="props.row.is_active !== false ? 'positive' : 'negative'">
                  {{ props.row.is_active !== false ? $t('admin.filters.active') : $t('admin.filters.inactive') }}
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
import { useAdminStudents } from '@/composables/useAdminApi'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const { t } = useI18n()
const { loading, error, fetchStudents, deleteStudent } = useAdminStudents()
const authStore = useAuthStore()

const searchQuery = ref('')
const currentFilter = ref('all')
const groupFilter = ref<number | null>(null)
const items = ref<any[]>([])
const groups = ref<any[]>([])
const allGroups = ref<any[]>([])

const pagination = ref({
  sortBy: 'id',
  descending: false,
  page: 1,
  rowsPerPage: 20
})

const filterOptions = [
  { label: t('admin.filters.all'), value: 'all' },
  { label: t('admin.filters.active'), value: 'active' },
  { label: t('admin.filters.inactive'), value: 'inactive' }
]

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
    name: 'gender',
    label: t('admin.forms.gender'),
    field: 'gender',
    align: 'center' as const,
    sortable: true
  },
  {
    name: 'phone',
    label: t('admin.forms.phone'),
    field: 'phone',
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
      (item.username && item.username.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.first_name && item.first_name.toLowerCase().includes(query)) ||
      (item.last_name && item.last_name.toLowerCase().includes(query))
    )
  }

  if (currentFilter.value === 'active') {
    filtered = filtered.filter(item => item.is_active !== false)
  } else if (currentFilter.value === 'inactive') {
    filtered = filtered.filter(item => item.is_active === false)
  }

  // Group filtering is done on backend via group_id parameter
  // No need to filter here if groupFilter is set (data is already filtered)

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
      aVal = a.is_active !== false ? 1 : 0
      bVal = b.is_active !== false ? 1 : 0
    } else {
      aVal = a[sortBy]
      bVal = b[sortBy]
    }
    
    // Handle null/undefined values
    if (aVal == null) return 1
    if (bVal == null) return -1
    
    // Compare values
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (aVal < bVal) return descending ? 1 : -1
    if (aVal > bVal) return descending ? -1 : 1
    return 0
  })
  
  return sorted
})

const viewDetail = (id: number) => {
  router.push(`/management/students/${id}`)
}

const editItem = (id: number) => {
  router.push(`/management/students/${id}/change`)
}

const handleDelete = async (id: number) => {
  const confirmed = await new Promise<boolean>((resolve) => {
    resolve(window.confirm(t('admin.confirmDelete')))
  })

  if (confirmed) {
    try {
      await deleteStudent(id)
      await loadStudents()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }
}

const loadGroups = async () => {
  try {
    const response = await axios.get('http://localhost:8000/api/v1/courses/groups/', {
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      },
      params: { page_size: 9999 }
    })
    const groupsData = Array.isArray(response.data) ? response.data : response.data.results || []
    allGroups.value = groupsData
    groups.value = groupsData.map((g: any) => ({
      id: g.id,
      name: g.name || `${g.course_name || ''} - ${g.name || ''}`.trim()
    }))
  } catch (err) {
    console.error('Load groups error:', err)
  }
}

const filterGroups = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      groups.value = allGroups.value.map((g: any) => ({
        id: g.id,
        name: g.name || `${g.course_name || ''} - ${g.name || ''}`.trim()
      }))
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    groups.value = allGroups.value
      .filter((g: any) => 
        (g.name && g.name.toLowerCase().includes(needle)) ||
        (g.course_name && g.course_name.toLowerCase().includes(needle))
      )
      .map((g: any) => ({
        id: g.id,
        name: g.name || `${g.course_name || ''} - ${g.name || ''}`.trim()
      }))
  })
}

const loadStudents = async () => {
  try {
    const params: any = { page_size: 9999 }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    // Filter by group if selected
    if (groupFilter.value) {
      params.group_id = groupFilter.value
    }
    const response = await fetchStudents(params)
    items.value = Array.isArray(response) ? response : response.results || []
  } catch (err) {
    console.error('Load students error:', err)
  }
}

// Watchers
watch(() => pagination.value.rowsPerPage, () => {
  pagination.value.page = 1
})

onMounted(() => {
  loadGroups()
  loadStudents()
})

// Reload students when group filter changes
watch([groupFilter], () => {
  loadStudents()
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
