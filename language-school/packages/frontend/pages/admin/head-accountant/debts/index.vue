<template>
  <div class="cabinet-page">
    <header class="page-header">
      <div class="page-header__text">
        <NH1 class="page-header__title">Контроль оплаты</NH1>
        <p class="page-header__subtitle">Мониторинг задолженностей и статусов оплаты курсов</p>
      </div>
      <div class="page-header__actions">
        <NButton v-if="canExport" type="info" secondary size="large" @click="exportToExcel">
          <template #icon><NIcon><DownloadIcon /></NIcon></template>
          Экспорт Excel
        </NButton>
      </div>
    </header>

    <NCard class="cabinet-card search-card">
      <NGrid cols="1 s:2 m:4" :x-gap="16" :y-gap="16">
        <NGi>
          <NFormItem label="Студент" :show-feedback="false">
            <NSelect
              v-model:value="filters.studentId"
              filterable
              placeholder="Поиск студента"
              :options="studentOptions"
              :loading="studentsLoading"
              remote
              @search="handleStudentSearch"
              @focus="handleFocusStudent"
              clearable
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="Группа" :show-feedback="false">
            <NSelect
              v-model:value="filters.groupId"
              filterable
              placeholder="Выберите группу"
              :options="groupOptions"
              :loading="groupsLoading"
              remote
              @search="handleGroupSearch"
              @focus="handleFocusGroup"
              clearable
            />
          </NFormItem>
        </NGi>
        <NGi v-if="isHeadAccountant">
          <NFormItem label="Школа" :show-feedback="false">
            <NSelect
              v-model:value="filters.schoolId"
              :options="schoolOptions"
              :loading="schoolsLoading"
              placeholder="Все школы"
              clearable
            />
          </NFormItem>
        </NGi>
        <NGi>
          <NFormItem label="Тариф" :show-feedback="false">
            <NSelect
              v-model:value="filters.tariffId"
              :options="tariffOptions"
              :loading="tariffsLoading"
              placeholder="Все тарифы"
              clearable
            />
          </NFormItem>
        </NGi>
      </NGrid>
    </NCard>

    <NCard class="cabinet-card table-card" :content-style="{ padding: 0 }">
      <NDataTable
        remote
        :columns="columns"
        :data="debts"
        :loading="loading"
        :pagination="pagination"
        class="cabinet-data-table"
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, reactive, watch, computed } from 'vue'
import { NH1, NCard, NDataTable, NTag, NText, useMessage, NButton, NIcon, NGrid, NGi, NFormItem, NSelect, NSpace } from 'naive-ui'
import { AddOutline as AddIcon, DownloadOutline as DownloadIcon } from '@vicons/ionicons5'
import { useEden } from '~/composables/useEden'
import { useAuthStore } from '~/stores/authStore'
import { useCabinetPagination } from '~/composables/useAdminPagination'
import * as XLSX from 'xlsx'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const api = useEden()
const message = useMessage()
const authStore = useAuthStore()
const loading = ref(false)
const debts = ref<any[]>([])

const isHeadAccountant = computed(() => 
  ['HEAD_ACCOUNTANT', 'GEN_DIRECTOR', 'ACCOUNTANT', 'SUPERUSER'].includes(authStore.user?.role || '')
)

const canExport = computed(() => authStore.user?.can_export_excel)

const filters = reactive({
  studentId: null as string | null,
  groupId: null as number | null,
  schoolId: null as number | null,
  tariffId: null as number | null,
})

const { pagination, resetPage } = useCabinetPagination('debts-pagination')

const columns = [
  { title: 'Студент', key: 'student_name', render: (row: any) => h('div', { style: 'font-weight: 600' }, row.student_name) },
  { title: 'Группа', key: 'group_name' },
  { title: 'Школа', key: 'school_name' },
  { title: 'Тариф', key: 'tariff_name' },
  { 
    title: 'Цена', 
    key: 'expected_amount',
    render: (row: any) => `${row.expected_amount + row.discount_amount} TMT`
  },
  { 
    title: 'Скидка', 
    key: 'discount_amount',
    render: (row: any) => row.discount_amount > 0 ? h(NText, { type: 'warning' }, { default: () => `${row.discount_amount} TMT` }) : '—'
  },
  { 
    title: 'К оплате', 
    key: 'final_expected',
    render: (row: any) => h(NText, { strong: true }, { default: () => `${row.expected_amount} TMT` })
  },
  { 
    title: 'Оплачено', 
    key: 'paid_amount',
    render: (row: any) => h(NText, { type: 'success', strong: true }, { default: () => `${row.paid_amount} TMT` })
  },
  { 
    title: 'Долг', 
    key: 'debt_amount',
    render: (row: any) => h(NText, { type: row.debt_amount > 0 ? 'error' : 'success', strong: true }, { default: () => `${row.debt_amount} TMT` })
  },
  { 
    title: 'Статус', 
    key: 'status',
    render: (row: any) => {
      const map: any = { paid: { label: 'Оплачено', type: 'success' }, partial: { label: 'Частично', type: 'warning' }, unpaid: { label: 'Не оплачено', type: 'error' } }
      const s = map[row.status] || { label: row.status, type: 'default' }
      return h(NTag, { size: 'small', type: s.type, round: true }, { default: () => s.label })
    }
  },
  {
    title: 'Действия',
    key: 'actions',
    align: 'right',
    render: (row: any) => h(NButton, {
      size: 'small',
      type: 'primary',
      secondary: true,
      onClick: () => navigateTo({
        path: '/admin/head-accountant/payments/add',
        query: { studentId: row.student_id, groupId: row.group_id }
      })
    }, { 
      icon: () => h(NIcon, null, { default: () => h(AddIcon) }),
      default: () => 'Принять доплату'
    })
  }
]

const loadDebts = async () => {
  loading.value = true
  try {
    const { data } = await api.api.v1.cabinet.debts.get({
      query: {
        studentId: filters.studentId || undefined,
        groupId: filters.groupId?.toString() || undefined,
        schoolId: filters.schoolId?.toString() || undefined,
        tariffId: filters.tariffId?.toString() || undefined,
        limit: pagination.pageSize?.toString() || '50',
        offset: (((pagination.page || 1) - 1) * (pagination.pageSize || 50)).toString()
      }
    })
    if (data && !('error' in data)) {
      debts.value = (data as any).items
      pagination.itemCount = (data as any).total
    }
  } catch (e) {
    console.error(e)
    message.error('Ошибка загрузки данных')
  } finally {
    loading.value = false
  }
}

// Filter Options
const studentsLoading = ref(false)
const studentOptions = ref<any[]>([])
const handleStudentSearch = async (q: string) => {
  studentsLoading.value = true
  try {
    const { data } = await api.api.v1.cabinet.accountant.students.get({ 
      query: { 
        q, 
        schoolId: filters.schoolId?.toString() 
      } 
    })
    if (data) studentOptions.value = data.map((s: any) => ({ label: s.full_name, value: s.id }))
  } finally { studentsLoading.value = false }
}
const handleFocusStudent = () => { handleStudentSearch('') }

const groupsLoading = ref(false)
const groupOptions = ref<any[]>([])
const handleGroupSearch = async (q: string) => {
  groupsLoading.value = true
  try {
    const { data } = await api.api.v1.cabinet.accountant.groups.get({ 
      query: { 
        q, 
        schoolId: filters.schoolId?.toString() 
      } 
    })
    if (data) groupOptions.value = data.map((g: any) => ({ label: g.name, value: g.id }))
  } finally { groupsLoading.value = false }
}
const handleFocusGroup = () => { handleGroupSearch('') }

const schoolsLoading = ref(false)
const schoolOptions = ref<any[]>([])
const loadSchools = async () => {
  if (!isHeadAccountant.value) return
  schoolsLoading.value = true
  try {
    const { data } = await api.api.v1.cabinet.accountant.schools.get()
    if (data) schoolOptions.value = data.map((s: any) => ({ label: s.label, value: s.id }))
  } finally { schoolsLoading.value = false }
}

const tariffsLoading = ref(false)
const tariffOptions = ref<any[]>([])
const loadTariffs = async () => {
  tariffsLoading.value = true
  try {
    const { data } = await api.api.v1.cabinet.tariffs.get()
    if (data) tariffOptions.value = data.map((t: any) => ({ label: `${t.name} (${t.price} TMT)`, value: t.id }))
  } finally { tariffsLoading.value = false }
}

const exportToExcel = () => {
  if (!debts.value.length) return
  
  const data = debts.value.map(d => ({
    'Студент': d.student_name,
    'Группа': d.group_name,
    'Школа': d.school_name || '—',
    'Тариф': d.tariff_name,
    'Цена (TMT)': d.expected_amount + d.discount_amount,
    'Скидка (TMT)': d.discount_amount,
    'К оплате (TMT)': d.expected_amount,
    'Оплачено (TMT)': d.paid_amount,
    'Долг (TMT)': d.debt_amount,
    'Статус': d.status === 'paid' ? 'Оплачено' : d.status === 'partial' ? 'Частично' : 'Не оплачено'
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Контроль оплаты')
  XLSX.writeFile(wb, `control_report_${new Date().toISOString().split('T')[0]}.xlsx`)
}

watch(() => filters.schoolId, () => {
  filters.studentId = null
  filters.groupId = null
  handleStudentSearch('')
  handleGroupSearch('')
})

watch(filters, () => {
  resetPage()
  loadDebts()
}, { deep: true })

watch(
  () => pagination.page,
  () => {
    loadDebts()
  }
)

watch(
  () => pagination.pageSize,
  () => {
    resetPage()
    loadDebts()
  }
)

onMounted(() => {
  loadDebts()
  loadSchools()
  loadTariffs()
})
</script>

<style scoped>
.cabinet-page { padding-bottom: 40px; }
.page-header { margin-bottom: 24px; max-width: 1400px; margin-left: auto; margin-right: auto; }
.page-header__title { margin: 0 0 8px; font-weight: 700; }
.page-header__subtitle { margin: 0; color: var(--n-text-color-3); }
.search-card { margin-bottom: 24px; border-radius: 16px; max-width: 1400px; margin-left: auto; margin-right: auto; }
.cabinet-card { border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); }
.table-card { overflow: hidden; max-width: 1400px; margin-left: auto; margin-right: auto; }
</style>
