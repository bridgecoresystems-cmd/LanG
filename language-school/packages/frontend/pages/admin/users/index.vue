<template>
  <div class="admin-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Пользователи</h1>
      <q-btn color="primary" icon="add" label="Добавить пользователя" to="/admin/users/add" />
    </div>

    <q-card flat bordered class="q-mb-md admin-table-card">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-input v-model="searchQuery" placeholder="Поиск по имени, username, email" outlined dense clearable debounce="300">
              <template v-slot:prepend><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-select v-model="roleFilter" :options="roleOptions" label="Роль" outlined dense clearable emit-value map-options />
          </div>
          <div class="col-12 col-md-3">
            <q-select v-model="schoolFilter" :options="schoolFilterOptions" label="Школа" outlined dense clearable emit-value map-options />
          </div>
          <div class="col-12 col-md-2">
            <q-btn color="primary" outline label="Сбросить" @click="resetFilters" icon="refresh" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="admin-table-card">
      <q-card-section>
        <q-table
          :rows="sortedItems"
          :columns="columns"
          row-key="id"
          v-model:pagination="pagination"
          :rows-per-page-options="rowsPerPageOptions"
          @update:pagination="savePagination"
          flat
          bordered
          :loading="loading"
          @row-click="(_evt, row) => navigateTo(`/admin/users/view/${row.id}`)"
          class="cursor-pointer"
          binary-state-sort
        >
          <template v-slot:body-cell-full_name="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-sm">
                <q-avatar v-if="avatarUrl(props.row.avatar)" size="32px">
                  <img :src="avatarUrl(props.row.avatar)" @error="($event.target as HTMLImageElement).style.display = 'none'" />
                </q-avatar>
                <q-avatar v-else size="32px" color="primary" text-color="white" font-size="14px">
                  {{ getNameInitials(props.row) }}
                </q-avatar>
                <span class="text-weight-medium">{{ props.row.full_name || props.row.username }}</span>
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-role="props">
            <q-td :props="props">
              <q-badge :color="getRoleColor(props.row.role)">{{ getRoleLabel(props.row.role) }}</q-badge>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" @click.stop>
              <q-btn flat round dense icon="edit" color="primary" @click="editItem(props.row.id)" class="q-mr-xs" />
              <q-btn
                v-if="canImpersonate(props.row)"
                flat round dense
                icon="manage_accounts"
                color="teal"
                class="q-mr-xs"
                @click.stop="handleImpersonate(props.row)"
              >
                <q-tooltip>Войти под этим пользователем</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="delete" color="negative" @click.stop="handleDelete(props.row)" />
            </q-td>
          </template>
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
              <q-icon name="people_outline" size="2em" />
              <span>Нет пользователей</span>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Удалить пользователя?</div>
          <p class="q-mt-sm q-mb-none text-body2">
            {{ userToDelete?.full_name || userToDelete?.username }} ({{ getRoleLabel(userToDelete?.role) }})
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn flat label="Удалить" color="negative" :loading="deleting" @click="confirmDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { avatarUrl } = useAvatarUrl()
const avatarFailed = reactive<Record<string, boolean>>({})
const { pagination, rowsPerPageOptions, resetPage, savePagination } = useAdminPagination('users')
const { getAll, remove } = useAdminUsers()
const { getAll: getAllSchools } = useAdminSchools()
const { impersonate } = useImpersonate()
const $q = useQuasar()

const items = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const roleFilter = ref('')
const schoolFilter = ref<number | null>(null)
const schools = ref<any[]>([])
const showDeleteConfirm = ref(false)
const userToDelete = ref<any>(null)
const deleting = ref(false)

const ROLE_LABELS: Record<string, string> = {
  SUPERUSER: 'Суперпользователь',
  GEN_DIRECTOR: 'Ген. директор',
  HEAD_ACCOUNTANT: 'Гл. бухгалтер',
  DIRECTOR: 'Директор',
  HEAD_TEACHER: 'Завуч',
  TEACHER: 'Учитель',
  STUDENT: 'Ученик',
  PARENT: 'Родитель',
  MERCHANT: 'Мерчант',
  SALES: 'Продажи',
  RECEPTIONIST: 'Рецепция',
  EDITOR: 'Редактор',
}

const roleOptions = [
  { label: 'Все роли', value: '' },
  ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ label, value }))
]

const schoolFilterOptions = computed(() => [
  { label: 'Все школы', value: null },
  ...schools.value.map((s) => ({ label: s.name_tm || s.name_ru || s.name_en || s.name || `Школа #${s.id}`, value: s.id }))
])

const columns = [
  { name: 'full_name', label: 'Имя', field: 'full_name', align: 'left' as const, sortable: true },
  { name: 'username', label: 'Логин', field: 'username', align: 'left' as const, sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left' as const, sortable: true },
  { name: 'role', label: 'Роль', field: 'role', align: 'center' as const, sortable: true },
  { name: 'schools_display', label: 'Школа(ы)', field: (row: any) => row.schools_display || row.school_name || '—', align: 'left' as const, sortable: true },
  { name: 'phone', label: 'Телефон', field: 'phone', align: 'left' as const },
  { name: 'actions', label: 'Действия', field: 'actions', align: 'right' as const }
]

const getRoleLabel = (role: string | undefined) => role ? (ROLE_LABELS[role] || role) : ''
const getRoleColor = (role: string | undefined) => {
  const colors: Record<string, string> = {
    SUPERUSER: 'deep-purple',
    STUDENT: 'blue',
    PARENT: 'teal',
    TEACHER: 'green',
    HEAD_TEACHER: 'light-green',
    DIRECTOR: 'orange',
  }
  return role ? (colors[role] || 'grey') : 'grey'
}
const getNameInitials = (row: any) => {
  const f = row.first_name?.[0] || ''
  const l = row.last_name?.[0] || ''
  if (f || l) return (f + l).toUpperCase()
  return row.username?.[0]?.toUpperCase() || '?'
}

const filteredItems = computed(() => {
  let filtered = items.value
  if (roleFilter.value) {
    filtered = filtered.filter(r => r.role === roleFilter.value)
  }
  if (schoolFilter.value != null) {
    const sid = schoolFilter.value
    filtered = filtered.filter(
      r => r.school_id === sid || (r.additional_school_ids || []).includes(sid)
    )
  }
  // search делаем на бэке, но если данные уже загружены - дополнительно фильтруем при смене search без перезапроса
  if (searchQuery.value?.trim()) {
    const s = searchQuery.value.trim().toLowerCase()
    filtered = filtered.filter(r =>
      r.username?.toLowerCase().includes(s) ||
      r.email?.toLowerCase().includes(s) ||
      r.first_name?.toLowerCase().includes(s) ||
      r.last_name?.toLowerCase().includes(s) ||
      r.full_name?.toLowerCase().includes(s)
    )
  }
  return filtered
})

const sortedItems = computed(() => {
  let sorted = [...filteredItems.value]
  const { sortBy, descending } = pagination.value
  if (!sortBy) return sorted
  sorted.sort((a, b) => {
    const aVal = a[sortBy] ?? ''
    const bVal = b[sortBy] ?? ''
    if (aVal < bVal) return descending ? 1 : -1
    if (aVal > bVal) return descending ? -1 : 1
    return 0
  })
  return sorted
})

const resetFilters = () => {
  searchQuery.value = ''
  roleFilter.value = ''
  schoolFilter.value = null
  resetPage()
}

const editItem = (id: string) => {
  navigateTo(`/admin/users/${id}`)
}

// Impersonate — show only for non-SUPERUSER rows
function canImpersonate(row: any) {
  return row.role !== 'SUPERUSER'
}

async function handleImpersonate(row: any) {
  $q.dialog({
    title: 'Войти под пользователем',
    message: `Вы войдёте под учётной записью <b>${row.full_name || row.username}</b> (${row.role}).<br>Чтобы вернуться — нажмите баннер в кабинете.`,
    html: true,
    cancel: true,
    ok: { label: 'Войти', color: 'teal' },
  }).onOk(async () => {
    try {
      await impersonate(row.id)
    } catch (e: any) {
      $q.notify({ type: 'negative', message: e?.data?.error || 'Ошибка при входе под пользователем' })
    }
  })
}

const handleDelete = (row: any) => {
  userToDelete.value = row
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  deleting.value = true
  try {
    await remove(userToDelete.value.id)
    await loadItems()
    showDeleteConfirm.value = false
    userToDelete.value = null
  } catch (e) {
    console.error(e)
  } finally {
    deleting.value = false
  }
}

const loadItems = async () => {
  loading.value = true
  try {
    const [usersList, schoolsList] = await Promise.all([
      getAll({ role: roleFilter.value || undefined, search: searchQuery.value?.trim() || undefined, school_id: schoolFilter.value ?? undefined }) as Promise<any[]>,
      getAllSchools() as Promise<any[]>,
    ])
    items.value = usersList ?? []
    schools.value = schoolsList ?? []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch([searchQuery, roleFilter, schoolFilter], () => {
  resetPage()
  loadItems()
})

onMounted(() => loadItems())
</script>
