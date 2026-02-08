<template>
  <div class="students-tab">
    <n-card :title="$t('cabinet.gems.studentsList')" bordered>
      <template #header-extra>
        <n-tag type="info" size="small" :bordered="false">
          {{ $t('common.readOnly') || 'Только просмотр' }}
        </n-tag>
      </template>

      <n-data-table
        :columns="columns"
        :data="students"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard, NDataTable, NText, NTag
} from 'naive-ui'
import api from '@/services/api'

const props = defineProps<{
  groupId: number
}>()

const { t } = useI18n()

const loading = ref(false)
const students = ref<any[]>([])

const columns = [
  {
    title: t('cabinet.student.fullName'),
    key: 'full_name',
    render(row: any) {
      return h(NText, { strong: true }, { default: () => row.full_name || `${row.first_name} ${row.last_name}` })
    }
  },
  {
    title: t('cabinet.student.email'),
    key: 'email'
  },
  {
    title: t('cabinet.student.phone'),
    key: 'phone'
  },
  {
    title: t('admin.table.status'),
    key: 'is_active',
    render(row: any) {
      return h(NTag, {
        type: row.is_active ? 'success' : 'error',
        size: 'small',
        round: true,
        bordered: false
      }, { default: () => row.is_active ? t('admin.filters.active') : t('admin.filters.inactive') })
    }
  }
]

const loadStudents = async () => {
  loading.value = true
  try {
    const response = await api.get(`/courses/groups/${props.groupId}/`)
    students.value = response.data.students || []
  } catch (err) {
    console.error('Error loading students:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStudents()
})
</script>

<style scoped>
.students-tab {
  width: 100%;
}
</style>
