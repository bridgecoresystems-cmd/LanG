<template>
  <div class="teacher-gems-page">

    <!-- Teacher balance banner -->
    <NCard class="teacher-balance" :bordered="false">
      <div class="teacher-balance__inner">
        <div>
          <div class="teacher-balance__label">Ваш баланс гемов</div>
          <div class="teacher-balance__amount">{{ myBalance }} 💎</div>
        </div>
        <div class="teacher-balance__tip">
          Выдавайте гемы ученикам за правильные ответы, активность и достижения
        </div>
      </div>
    </NCard>

    <!-- Students list -->
    <NCard style="border-radius: 14px; margin-top: 20px;">
      <template #header>
        <span style="font-weight: 700; font-size: 16px;">Ученики группы</span>
      </template>

      <div v-if="loading" class="loading-state"><NSpin size="large" /></div>

      <div v-else-if="students.length === 0" class="empty-state">
        Ученики не найдены
      </div>

      <div v-else class="students-list">
        <div v-for="student in students" :key="student.id" class="student-row">
          <div class="student-row__info">
            <div class="student-row__avatar">{{ student.name.charAt(0).toUpperCase() }}</div>
            <div>
              <div class="student-row__name">{{ student.name }}</div>
              <div class="student-row__balance">{{ student.balance }} 💎</div>
            </div>
          </div>
          <div class="student-row__actions">
            <div class="quick-award">
              <NButton
                v-for="amt in quickAmounts"
                :key="amt"
                size="small"
                type="primary"
                ghost
                :disabled="myBalance < amt || awarding === student.id"
                @click="quickAward(student, amt)"
              >
                +{{ amt }} 💎
              </NButton>
            </div>
            <NButton
              size="small"
              type="primary"
              :loading="awarding === student.id"
              @click="openCustom(student)"
            >
              <template #icon><NIcon><component :is="AddIcon" /></NIcon></template>
              Выдать
            </NButton>
          </div>
        </div>
      </div>
    </NCard>

    <!-- Custom award modal -->
    <NModal v-model:show="showCustomModal" preset="card" style="width: 400px;" :title="`Выдать гемы → ${selectedStudent?.name}`">
      <div class="award-form">
        <div class="award-form__label">Количество гемов</div>
        <NInputNumber
          v-model:value="customAmount"
          :min="1"
          :max="myBalance"
          style="width: 100%"
          placeholder="Например: 5"
        />
        <div class="award-form__hint">Ваш баланс: {{ myBalance }} 💎</div>
        <div class="award-form__label" style="margin-top: 12px;">Причина <span style="color:#9ca3af">(необязательно)</span></div>
        <NInput v-model:value="customComment" placeholder="Правильный ответ, активность..." />
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCustomModal = false">Отмена</NButton>
          <NButton type="primary" :loading="awarding !== null" :disabled="!customAmount || customAmount <= 0" @click="doCustomAward">
            Выдать {{ customAmount || 0 }} 💎
          </NButton>
        </NSpace>
      </template>
    </NModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NCard, NButton, NIcon, NModal, NInputNumber, NInput, NSpace, NSpin, useMessage } from 'naive-ui'
import { AddOutline as AddIcon } from '@vicons/ionicons5'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const route = useRoute()
const groupId = computed(() => parseInt(route.params.id as string))
const config = useRuntimeConfig()
const API = config.public.apiBase as string
const message = useMessage()

const loading = ref(true)
const students = ref<{ id: string; name: string; balance: number }[]>([])
const myBalance = ref(0)
const awarding = ref<string | null>(null)

const quickAmounts = [1, 3, 5, 10]

const showCustomModal = ref(false)
const selectedStudent = ref<{ id: string; name: string } | null>(null)
const customAmount = ref<number | null>(null)
const customComment = ref('')

async function loadData() {
  loading.value = true
  try {
    const [studentsData, walletData] = await Promise.all([
      $fetch<any[]>(`${API}/cabinet/gems/group-students/${groupId.value}`, { credentials: 'include' }),
      $fetch<{ balance: number }>(`${API}/cabinet/gems/wallet`, { credentials: 'include' }),
    ])
    students.value = Array.isArray(studentsData) ? studentsData : []
    myBalance.value = walletData.balance ?? 0
  } catch (e) {
    console.error('Gems group load failed', e)
  } finally {
    loading.value = false
  }
}

async function quickAward(student: { id: string; name: string }, amount: number) {
  awarding.value = student.id
  try {
    await $fetch(`${API}/cabinet/gems/award-group`, {
      method: 'POST',
      credentials: 'include',
      body: { studentId: student.id, groupId: groupId.value, amount },
    })
    message.success(`+${amount} 💎 → ${student.name}`)
    myBalance.value -= amount
    const s = students.value.find((x) => x.id === student.id)
    if (s) s.balance += amount
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    awarding.value = null
  }
}

function openCustom(student: { id: string; name: string }) {
  selectedStudent.value = student
  customAmount.value = null
  customComment.value = ''
  showCustomModal.value = true
}

async function doCustomAward() {
  if (!selectedStudent.value || !customAmount.value) return
  awarding.value = selectedStudent.value.id
  try {
    await $fetch(`${API}/cabinet/gems/award-group`, {
      method: 'POST',
      credentials: 'include',
      body: {
        studentId: selectedStudent.value.id,
        groupId: groupId.value,
        amount: customAmount.value,
        comment: customComment.value || undefined,
      },
    })
    message.success(`+${customAmount.value} 💎 → ${selectedStudent.value.name}`)
    myBalance.value -= customAmount.value
    const s = students.value.find((x) => x.id === selectedStudent.value!.id)
    if (s) s.balance += customAmount.value!
    showCustomModal.value = false
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка')
  } finally {
    awarding.value = null
  }
}

watch(groupId, loadData)
loadData()
</script>

<style scoped>
.teacher-gems-page { padding-bottom: 60px; }

.teacher-balance {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 16px;
}

.teacher-balance__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.teacher-balance__label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.teacher-balance__amount {
  font-size: 36px;
  font-weight: 900;
  color: #15803d;
}

.teacher-balance__tip {
  font-size: 13px;
  color: #4b5563;
  max-width: 300px;
  line-height: 1.5;
}

.loading-state, .empty-state {
  display: flex;
  justify-content: center;
  padding: 48px;
  color: #9ca3af;
}

.students-list { display: flex; flex-direction: column; gap: 0; }

.student-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;
  gap: 12px;
}
.student-row:last-child { border-bottom: none; }

.student-row__info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-row__avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #18a058, #0c7a43);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
}

.student-row__name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.student-row__balance {
  font-size: 13px;
  color: #15803d;
  font-weight: 500;
  margin-top: 2px;
}

.student-row__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-award {
  display: flex;
  gap: 6px;
}

/* Award form */
.award-form { display: flex; flex-direction: column; gap: 8px; }
.award-form__label { font-size: 13px; font-weight: 500; color: #374151; }
.award-form__hint { font-size: 12px; color: #9ca3af; }
</style>
