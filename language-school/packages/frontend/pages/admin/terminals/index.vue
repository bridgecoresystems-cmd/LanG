<template>
  <div class="admin-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Терминалы 💎</h1>
      <q-btn color="primary" icon="add" label="Добавить терминал" to="/admin/terminals/add" />
    </div>

    <q-card flat bordered class="q-mb-md admin-table-card">
      <q-card-section>
        <q-input v-model="searchQuery" placeholder="Поиск по названию, мерчанту, адресу..." outlined dense clearable debounce="200">
          <template v-slot:prepend><q-icon name="search" /></template>
        </q-input>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="admin-table-card">
      <q-card-section>
        <q-table
          :rows="filteredItems"
          :columns="columns"
          row-key="id"
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 25, 50]"
          flat
          bordered
          :loading="loading"
          @row-click="(_evt, row) => openEdit(row)"
          class="cursor-pointer"
        >
          <template v-slot:body-cell-merchantName="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-sm">
                <q-avatar size="30px" color="primary" text-color="white" font-size="12px">
                  {{ (props.row.merchantName || '?').charAt(0).toUpperCase() }}
                </q-avatar>
                <div>
                  <div class="text-weight-medium">{{ props.row.merchantName }}</div>
                  <div class="text-caption text-grey">{{ props.row.username }}</div>
                </div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <div class="text-weight-bold">{{ props.row.name }}</div>
              <div v-if="props.row.address" class="text-caption text-grey">
                <q-icon name="place" size="12px" /> {{ props.row.address }}
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-terminalId="props">
            <q-td :props="props">
              <code v-if="props.row.terminalId" class="terminal-code">{{ props.row.terminalId }}</code>
              <q-badge v-else color="grey-4" text-color="grey-7">Не задан</q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-authToken="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-xs">
                <code class="token-code">{{ props.row.authToken.slice(0, 8) }}...{{ props.row.authToken.slice(-4) }}</code>
                <q-btn flat round dense icon="content_copy" size="xs" color="grey-7" @click.stop="copyToken(props.row.authToken)" />
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-isActive="props">
            <q-td :props="props">
              <q-badge :color="props.row.isActive ? 'positive' : 'grey'">
                {{ props.row.isActive ? 'Активен' : 'Отключён' }}
              </q-badge>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props" @click.stop>
              <q-btn flat round dense icon="edit" color="primary" @click="openEdit(props.row)" class="q-mr-xs" />
              <q-btn flat round dense icon="power_settings_new" :color="props.row.isActive ? 'warning' : 'positive'" @click.stop="toggleActive(props.row)" />
              <q-btn flat round dense icon="delete" color="negative" @click.stop="handleDelete(props.row)" />
            </q-td>
          </template>

          <template v-slot:no-data>
            <div class="full-width column flex-center text-grey q-gutter-sm q-pa-xl">
              <q-icon name="point_of_sale" size="3em" color="grey-4" />
              <div class="text-h6 text-grey-5">Терминалов пока нет</div>
              <div class="text-body2 text-grey-5">Сначала создайте пользователя с ролью <strong>MERCHANT</strong>, затем добавьте терминал</div>
              <q-btn color="primary" icon="add" label="Добавить терминал" to="/admin/terminals/add" class="q-mt-sm" />
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Edit Dialog (inline for quick edits) -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="min-width: 480px; max-width: 600px;">
        <q-card-section>
          <div class="text-h6">Редактировать терминал</div>
          <div class="text-subtitle2 text-grey q-mt-xs" v-if="editingItem">Мерчант: {{ editingItem.merchantName }}</div>
        </q-card-section>

        <q-card-section v-if="editingItem" class="q-pt-none">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input v-model="editForm.name" label="Название точки *" outlined dense />
            </div>
            <div class="col-12">
              <q-input v-model="editForm.address" label="Адрес / местоположение" outlined dense hint="Например: 1-й этаж, столовая" />
            </div>
            <div class="col-12">
              <q-input v-model="editForm.terminalId" label="Terminal ID" outlined dense hint="Уникальный ID для прошивки ESP32">
                <template v-slot:prepend><q-icon name="hardware" /></template>
              </q-input>
            </div>
          </div>

          <!-- ESP32 credentials info box -->
          <q-banner class="bg-blue-1 q-mt-md rounded-borders" rounded>
            <template v-slot:avatar>
              <q-icon name="info" color="blue" />
            </template>
            <div class="text-caption">
              <strong>Auth Token:</strong> <code class="token-code-full">{{ editingItem.authToken }}</code>
              <q-btn flat dense size="xs" icon="content_copy" color="blue" @click="copyToken(editingItem.authToken)" class="q-ml-sm" />
            </div>
            <div class="text-caption text-grey q-mt-xs">Прошейте Terminal ID + Auth Token в ESP32</div>
          </q-banner>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn color="primary" label="Сохранить" :loading="saving" @click="confirmEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirm -->
    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Удалить терминал?</div>
          <p class="q-mt-sm q-mb-none text-body2">
            <strong>{{ itemToDelete?.name }}</strong> ({{ itemToDelete?.merchantName }})<br>
            <span class="text-grey text-caption">Кошелёк мерчанта и транзакции останутся. Удаляется только профиль терминала.</span>
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
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { pagination, rowsPerPageOptions, savePagination } = useAdminPagination('terminals')
const config = useRuntimeConfig()
const API = config.public.apiBase as string

const items = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const showDeleteConfirm = ref(false)
const itemToDelete = ref<any>(null)
const deleting = ref(false)
const showEditDialog = ref(false)
const editingItem = ref<any>(null)
const saving = ref(false)
const editForm = ref({ name: '', address: '', terminalId: '' })

const columns = [
  { name: 'merchantName', label: 'Мерчант', field: 'merchantName', align: 'left' as const, sortable: true },
  { name: 'name', label: 'Точка / Адрес', field: 'name', align: 'left' as const, sortable: true },
  { name: 'terminalId', label: 'Terminal ID', field: 'terminalId', align: 'left' as const },
  { name: 'authToken', label: 'Auth Token', field: 'authToken', align: 'left' as const },
  { name: 'isActive', label: 'Статус', field: 'isActive', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Действия', field: 'actions', align: 'right' as const },
]

const filteredItems = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return items.value
  return items.value.filter((r) =>
    r.name?.toLowerCase().includes(q) ||
    r.merchantName?.toLowerCase().includes(q) ||
    r.address?.toLowerCase().includes(q) ||
    r.terminalId?.toLowerCase().includes(q)
  )
})

function openEdit(row: any) {
  editingItem.value = row
  editForm.value = { name: row.name, address: row.address || '', terminalId: row.terminalId || '' }
  showEditDialog.value = true
}

async function confirmEdit() {
  if (!editingItem.value) return
  saving.value = true
  try {
    await $fetch(`${API}/admin/terminals/${editingItem.value.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: {
        name: editForm.value.name,
        address: editForm.value.address || undefined,
        terminalId: editForm.value.terminalId || undefined,
      },
    })
    showEditDialog.value = false
    await loadItems()
  } catch (e: any) {
    alert(e?.data?.error || 'Ошибка')
  } finally {
    saving.value = false
  }
}

async function toggleActive(row: any) {
  try {
    await $fetch(`${API}/admin/terminals/${row.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: { isActive: !row.isActive },
    })
    row.isActive = !row.isActive
  } catch (e: any) {
    alert(e?.data?.error || 'Ошибка')
  }
}

function handleDelete(row: any) {
  itemToDelete.value = row
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await $fetch(`${API}/admin/terminals/${itemToDelete.value.id}`, { method: 'DELETE', credentials: 'include' })
    await loadItems()
    showDeleteConfirm.value = false
    itemToDelete.value = null
  } catch (e: any) {
    alert(e?.data?.error || 'Ошибка')
  } finally {
    deleting.value = false
  }
}

function copyToken(token: string) {
  navigator.clipboard.writeText(token)
}

async function loadItems() {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/admin/terminals`, { credentials: 'include' })
    items.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadItems)
</script>

<style scoped>
.terminal-code {
  font-size: 12px;
  background: #f0f4ff;
  color: #1d4ed8;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
}
.token-code {
  font-size: 11px;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: #374151;
}
.token-code-full {
  font-size: 11px;
  background: #dbeafe;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: #1e40af;
  word-break: break-all;
}
</style>
