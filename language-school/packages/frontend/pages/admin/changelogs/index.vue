<template>
  <div class="admin-page-content">
    <div class="row items-center justify-between q-mb-md">
      <h1 class="text-h4 q-ma-none">Changelog</h1>
      <q-btn color="primary" icon="add" label="Добавить changelog" :to="'/admin/changelogs/add'" />
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <q-input
          v-model="searchQuery"
          placeholder="Поиск..."
          outlined
          dense
          clearable
          class="changelog-search"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <template v-if="searchQuery.length > 0 && searchQuery.length < 3" v-slot:hint>
            <span class="text-caption text-grey">Введите ещё {{ 3 - searchQuery.length }} символа для поиска</span>
          </template>
        </q-input>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="admin-table-card">
      <q-card-section>
        <q-inner-loading :showing="loading">
          <q-spinner size="50px" color="primary" />
        </q-inner-loading>

        <div v-if="!loading && filteredItems.length === 0" class="full-width row flex-center text-grey q-gutter-sm q-pa-lg">
          <q-icon name="inbox" size="2em" />
          <span>{{ searchQuery.length >= 3 ? 'Ничего не найдено' : 'Нет записей' }}</span>
        </div>

        <q-list v-else-if="!loading" bordered separator>
          <q-expansion-item
            v-for="item in filteredItems"
            :key="item.id"
            expand-separator
            header-class="text-weight-medium"
          >
            <template v-slot:header>
              <q-item-section avatar style="min-width: 40px">
                <span class="text-body2 text-grey">{{ item.id }}</span>
              </q-item-section>
              <q-item-section class="col">
                <span class="text-body2 text-grey">{{ formatDate(item.date) }}</span>
                <span class="text-body2 text-grey q-mx-sm">—</span>
                <span class="text-body2">{{ truncate(item.text, 80) }}</span>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round dense color="primary" icon="edit" size="sm" @click.stop="router.push(`/admin/changelogs/${item.id}`)" />
                <q-btn flat round dense color="negative" icon="delete" size="sm" @click.stop="confirmDelete(item)" />
              </q-item-section>
            </template>
            <q-card flat bordered class="q-mx-md q-mb-md">
              <q-card-section>
                <div class="text-body2" style="white-space: pre-wrap">{{ item.text }}</div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </q-card-section>
    </q-card>

    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Удалить запись changelog?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn flat label="Удалить" color="negative" @click="deleteItem" :loading="deleting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const router = useRouter()

const items = ref<any[]>([])
const loading = ref(false)
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const itemToDelete = ref<any>(null)
const searchQuery = ref('')

const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (q.length < 3) return items.value
  return items.value.filter((item) => {
    const text = (item.text || '').toLowerCase()
    const date = formatDate(item.date).toLowerCase()
    return text.includes(q) || date.includes(q)
  })
})

function formatDate(val: string) {
  if (!val) return '-'
  const d = new Date(val)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function truncate(str: string | null | undefined, len: number) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

const fetchItems = async () => {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${apiBase}/admin/changelog`, { credentials: 'include' })
    items.value = data
  } catch (e) {
    console.error('Fetch changelog error:', e)
  } finally {
    loading.value = false
  }
}

const confirmDelete = (row: any) => {
  itemToDelete.value = row
  showDeleteConfirm.value = true
}

const deleteItem = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await $fetch(`${apiBase}/admin/changelog/${itemToDelete.value.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    showDeleteConfirm.value = false
    await fetchItems()
  } catch (e) {
    console.error('Delete error:', e)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchItems()
})
</script>
