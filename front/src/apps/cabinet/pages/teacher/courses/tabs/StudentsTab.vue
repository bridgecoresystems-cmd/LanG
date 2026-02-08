<template>
  <div class="students-tab">
    <n-card :title="$t('cabinet.gems.studentsList')" bordered>
      <template #header-extra>
        <n-button type="primary" secondary @click="loadStudents">
          <template #icon>
            <n-icon><refresh-icon /></n-icon>
          </template>
          {{ $t('common.retry') }}
        </n-button>
      </template>

      <n-data-table
        :columns="columns"
        :data="students"
        :loading="loading"
        :pagination="{ pageSize: 15 }"
      />
    </n-card>

    <!-- Chat Widget -->
    <ChatWidget
      v-if="currentChatStudent && currentChatRoomId > 0"
      :is-open="isChatOpen"
      :room-id="currentChatRoomId"
      :teacher-name="currentChatStudent.full_name || currentChatStudent.username"
      @close="closeChat"
      @update:unread-count="updateUnreadCount"
    />

    <!-- Modal for Awarding Gems -->
    <n-modal
      v-model:show="showAwardModal"
      preset="card"
      style="width: 400px"
      :title="$t('cabinet.gems.award') + ' 💎'"
    >
      <n-form ref="formRef" :model="awardForm" :rules="rules">
        <n-form-item :label="$t('cabinet.gems.receiver')" path="receiverName">
          <n-input v-model:value="awardForm.receiverName" disabled />
        </n-form-item>
        <n-form-item :label="$t('cabinet.gems.amount')" path="amount">
          <n-input-number
            v-model:value="awardForm.amount"
            :min="1"
            :max="Number(wallet?.balance || 0)"
            style="width: 100%"
            placeholder="0"
          >
            <template #suffix>💎</template>
          </n-input-number>
        </n-form-item>
        <n-form-item :label="$t('cabinet.gems.comment')" path="comment">
          <n-input
            v-model:value="awardForm.comment"
            type="textarea"
            :placeholder="$t('cabinet.gems.commentPlaceholder')"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAwardModal = false">{{ $t('common.cancel') }}</n-button>
          <n-button type="primary" :loading="awarding" @click="handleAward">
            {{ $t('cabinet.gems.send') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard, NDataTable, NButton, NIcon, NText, NModal,
  NForm, NFormItem, NInput, NInputNumber, NSpace, useMessage, NTag
} from 'naive-ui'
import {
  RefreshOutline as RefreshIcon,
  PaperPlaneOutline as SendIcon,
  ChatbubbleEllipsesOutline as ChatIcon
} from '@vicons/ionicons5'
import axios from 'axios'
import { usePointsStore } from '@/stores/pointsStore'
import ChatWidget from '@/components/ChatWidget.vue'

const props = defineProps<{
  groupId: number
}>()

const { t } = useI18n()
const message = useMessage()
const pointsStore = usePointsStore()

const wallet = computed(() => pointsStore.wallet)
const fetchMyWallet = () => pointsStore.fetchMyWallet()

const loading = ref(false)
const students = ref([])
const showAwardModal = ref(false)
const awarding = ref(false)
const formRef = ref(null)

// Chat state
const isChatOpen = ref(false)
const currentChatStudent = ref<any>(null)
const unreadCounts = ref<Record<number, number>>({})
// Очищаем кэш при загрузке компонента, чтобы избежать старых значений
const chatRooms = ref<Record<number, number>>({}) // studentId -> roomId mapping

// Очищаем кэш при монтировании компонента
onMounted(() => {
  console.log('🔄 StudentsTab mounted, clearing chatRooms cache to avoid old room IDs')
  chatRooms.value = {}
  console.log('🔄 Cache cleared, chatRooms:', chatRooms.value)
})

const currentChatRoomId = computed(() => {
  if (!currentChatStudent.value) {
    console.log('🔵 currentChatRoomId: no currentChatStudent')
    return 0
  }
  const studentId = currentChatStudent.value.id
  const studentIdNum = Number(studentId)
  
  // Проверяем оба варианта ключа (число и строка)
  const roomId = chatRooms.value[studentIdNum] || chatRooms.value[studentId] || 0
  
  // Логируем только если значение изменилось или есть проблема
  if (roomId === 0 || (roomId > 0 && roomId <= 10)) {
    console.log('🔵 currentChatRoomId computed:', {
      studentId,
      roomId,
      chatRooms: JSON.stringify(chatRooms.value),
      hasRoom: !!chatRooms.value[studentId],
      roomIdType: typeof roomId,
      studentIdType: typeof studentId
    })
  }
  
  // ВАЖНО: Если roomId = 1-5 (возможные старые AI/тестовые комнаты), не используем его
  // Но комнаты 6+ могут быть валидными, поэтому не блокируем их
  if (roomId > 0 && roomId <= 5) {
    console.warn('⚠️  Suspicious roomId detected:', roomId, '- might be old AI/test room, clearing cache')
    // Очищаем кэш для этого студента, чтобы принудительно создать новую комнату
    delete chatRooms.value[studentId]
    return 0 // Возвращаем 0, чтобы ChatWidget не рендерился с неверным roomId
  }
  
  return roomId
})

const awardForm = ref({
  receiverId: null as number | null,
  receiverName: '',
  amount: 5,
  comment: ''
})

const rules: any = {
  amount: {
    type: 'number',
    required: true,
    message: t('cabinet.gems.amountRequired') || 'Введите сумму',
    trigger: ['blur', 'input']
  }
}

const columns = [
  {
    title: t('cabinet.student.fullName'),
    key: 'full_name',
    render(row: any) {
      return h('div', [
        h(NText, { strong: true }, { default: () => row.full_name }),
        h('br'),
        h(NText, { depth: 3, size: 'small' }, { default: () => `@${row.username}` })
      ])
    }
  },
  {
    title: t('admin.forms.gender') || 'Gender',
    key: 'gender',
    width: 100,
    render(row: any) {
      if (!row.gender) return '-'
      const isBoy = row.gender === 'boy'
      return h(NTag, {
        type: isBoy ? 'info' : 'error',
        size: 'small',
        round: true,
        bordered: false
      }, { default: () => isBoy ? t('admin.forms.genderBoy') : t('admin.forms.genderGirl') })
    }
  },
  {
    title: t('cabinet.payments.paid'),
    key: 'total_paid',
    width: 120,
    render(row: any) {
      return h(NText, { strong: true, type: row.total_paid > 0 ? 'success' : 'error' }, { default: () => `${row.total_paid || 0} TMT` })
    }
  },
  {
    title: t('chat.chat') || 'Chat',
    key: 'chat',
    width: 120,
    render(row: any) {
      if (!row || !row.id) return null
      const unreadCount = unreadCounts.value?.[row.id] || 0
      return h(
        NButton,
        {
          type: unreadCount > 0 ? 'warning' : 'default',
          size: 'small',
          onClick: () => openChat(row)
        },
        {
          default: () => unreadCount > 0 ? `${t('chat.chat') || 'Чат'} (${unreadCount})` : (t('chat.chat') || 'Чат'),
          icon: () => h(NIcon, null, { default: () => h(ChatIcon) })
        }
      )
    }
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 150,
    render(row: any) {
      return h(
        NButton,
        {
          type: 'primary',
          size: 'small',
          onClick: () => openAwardModal(row)
        },
        {
          default: () => t('cabinet.gems.award'),
          icon: () => h(NIcon, null, { default: () => h(SendIcon) })
        }
      )
    }
  }
]

const openAwardModal = (student: any) => {
  awardForm.value = {
    receiverId: student.id,
    receiverName: student.full_name || student.username,
    amount: 5,
    comment: ''
  }
  showAwardModal.value = true
}

const handleAward = async () => {
  ;(formRef.value as any)?.validate(async (errors: any) => {
    if (errors) return

    const walletBalance = typeof wallet.value?.balance === 'number' ? wallet.value.balance : Number(wallet.value?.balance || 0)
    if (awardForm.value.amount > walletBalance) {
      message.error(t('cabinet.gems.insufficientBalance') || 'Недостаточно кристаллов на балансе')
      return
    }

    awarding.value = true
    try {
      await axios.post('/api/v1/points/transfer/', {
        receiver_id: awardForm.value.receiverId,
        amount: awardForm.value.amount,
        comment: awardForm.value.comment
      })
      
      message.success(t('cabinet.gems.successMessage'))
      showAwardModal.value = false
      await fetchMyWallet() // Refresh teacher's balance
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Ошибка при награждении')
    } finally {
      awarding.value = false
    }
  })
}

// Create or get chat room for teacher-student direct message
const getOrCreateChatRoom = async (studentId: number): Promise<number | null> => {
  console.log('='.repeat(50))
  console.log('🚀 getOrCreateChatRoom called for student:', studentId, 'type:', typeof studentId)
  console.log('🚀 Current chatRooms cache:', JSON.stringify(chatRooms.value))
  console.log('='.repeat(50))
  
  // Убеждаемся что studentId - это число
  const studentIdNum = Number(studentId)
  if (isNaN(studentIdNum)) {
    console.error('❌ Invalid studentId:', studentId)
    return null
  }
  
  try {
    // Check if room already exists in cache (проверяем оба варианта ключа)
    const cachedRoomId = chatRooms.value[studentIdNum] || chatRooms.value[studentId]
    if (cachedRoomId) {
      console.log('📦 Using cached roomId:', cachedRoomId, 'for student:', studentIdNum)
      console.log('📦 Cache contents:', JSON.stringify(chatRooms.value))
      
      // ВАЖНО: Проверяем что кэшированный ID не равен 1-10 (возможные старые комнаты)
      const cachedNum = Number(cachedRoomId)
      if (cachedNum >= 1 && cachedNum <= 10) {
        console.warn('⚠️  Cached roomId is', cachedNum, '(possibly old/invalid room), clearing cache and creating new room')
        delete chatRooms.value[studentIdNum]
        delete chatRooms.value[studentId] // Очищаем оба варианта
        // Продолжаем создание новой комнаты
      } else {
        console.log('✅ Using valid cached roomId:', cachedNum)
        return cachedNum
      }
    }

    console.log('📞 Creating/getting chat room for student:', studentId)
    console.log('📞 API endpoint: /api/v1/chat/rooms/direct_message/')
    console.log('📞 Request payload:', { user_id: studentId })
    console.log('📞 Making API call now...')
    
    // Create or get room via Django API
    console.log('📡 Sending POST request to /api/v1/chat/rooms/direct_message/')
    const response = await axios.post('/api/v1/chat/rooms/direct_message/', {
      user_id: studentId
    })

    console.log('✅ Chat room API response received!')
    console.log('✅ Response status:', response.status)
    console.log('✅ Full response data:', JSON.stringify(response.data, null, 2))
    console.log('✅ Room ID from response:', response.data?.id)
    console.log('✅ Room type from response:', response.data?.room_type)
    console.log('✅ Room name from response:', response.data?.name)
    console.log('✅ Room is_active:', response.data?.is_active)
    console.log('✅ Room participants:', response.data?.participants)

    if (response.data && response.data.id) {
      const roomId = response.data.id
      
      // Проверяем что это Direct Message комната
      if (response.data.room_type !== 'direct') {
        console.warn('⚠️  Warning: Room type is not "direct":', response.data.room_type)
      }
      
      // Сохраняем в кэш ПЕРЕД возвратом
      console.log('💾 Saving roomId to cache:', { studentId, roomId, studentIdType: typeof studentId, roomIdType: typeof roomId })
      console.log('💾 Cache before:', JSON.stringify(chatRooms.value))
      
      // Убеждаемся что studentId - это число
      const studentIdNum = Number(studentId)
      const roomIdNum = Number(roomId)
      
      if (isNaN(studentIdNum) || isNaN(roomIdNum)) {
        console.error('❌ Invalid IDs:', { studentId, roomId, studentIdNum, roomIdNum })
        return null
      }
      
      // Сохраняем используя числовые ключи
      chatRooms.value[studentIdNum] = roomIdNum
      
      console.log('💾 Cache after direct assignment:', JSON.stringify(chatRooms.value))
      console.log('💾 Verification - chatRooms.value[studentIdNum]:', chatRooms.value[studentIdNum])
      console.log('💾 Verification - chatRooms.value[studentId]:', chatRooms.value[studentId])
      
      // Дополнительная проверка что значение сохранилось
      if (chatRooms.value[studentIdNum] !== roomIdNum) {
        console.error('❌ CRITICAL: roomId not saved to cache!')
        console.error('   Expected:', roomIdNum, 'Got:', chatRooms.value[studentIdNum])
        // Пробуем через создание нового объекта
        const newCache = { ...chatRooms.value }
        newCache[studentIdNum] = roomIdNum
        chatRooms.value = newCache
        console.log('💾 Retry with new object - cache after:', JSON.stringify(chatRooms.value))
        console.log('💾 Retry verification:', chatRooms.value[studentIdNum])
      }
      
      // Финальная проверка
      const finalRoomId = chatRooms.value[studentIdNum]
      if (finalRoomId !== roomIdNum) {
        console.error('❌ FINAL CHECK FAILED: roomId still not in cache!')
        console.error('   studentIdNum:', studentIdNum, 'roomIdNum:', roomIdNum)
        console.error('   chatRooms.value:', JSON.stringify(chatRooms.value))
        return null
      }
      
      console.log('✅ Chat room saved to cache successfully!')
      console.log('✅ roomId:', finalRoomId, 'for student:', studentIdNum)
      console.log('✅ Final cache state:', JSON.stringify(chatRooms.value))
      return roomIdNum
    }

    console.error('❌ No room ID in response:', response.data)
    return null
  } catch (err: any) {
    console.error('Error creating/getting chat room:', err)
    const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Ошибка при создании чата'
    message.error(errorMsg)
    return null
  }
}

const openChat = async (student: any) => {
  console.log('='.repeat(50))
  console.log('🔵 openChat called for student:', student.id, student.username)
  console.log('🔵 Current chatRooms cache:', JSON.stringify(chatRooms.value))
  console.log('🔵 Current currentChatStudent:', currentChatStudent.value?.id)
  console.log('🔵 Is chat open:', isChatOpen.value)
  console.log('='.repeat(50))
  
  // Если кликаем на того же студента И чат уже открыт И у нас есть roomId - просто переключаем
  if (currentChatStudent.value?.id === student.id && isChatOpen.value) {
    const existingRoomId = chatRooms.value[student.id]
    if (existingRoomId && existingRoomId > 10) {
      console.log('🔵 Same student, chat is open, toggling chat')
      isChatOpen.value = false
      return
    }
    // Если roomId нет или он подозрительный - создаем заново
    console.log('🔵 Same student but no valid roomId, creating room...')
  }
  
  // Закрываем предыдущий чат если это другой студент
  if (currentChatStudent.value?.id !== student.id) {
    console.log('🔵 Different student, closing previous chat')
    isChatOpen.value = false
    currentChatStudent.value = null
    // Небольшая задержка чтобы предыдущий чат закрылся
    await new Promise(resolve => setTimeout(resolve, 100))
  } else {
    console.log('🔵 Same student, keeping current state')
  }
  
  // ВСЕГДА создаем/получаем комнату ПЕРЕД установкой currentChatStudent
  console.log('🔵 Getting/creating chat room for student:', student.id)
  const roomId = await getOrCreateChatRoom(student.id)
  
  if (!roomId) {
    console.error('❌ Failed to get/create room')
    message.error('Не удалось создать чат. Попробуйте еще раз.')
    return
  }
  
  console.log('✅ Chat room ready, roomId:', roomId, 'for student:', student.id)
  console.log('✅ chatRooms cache after API call:', JSON.stringify(chatRooms.value))
  
  // Устанавливаем студента (это обновит currentChatRoomId через computed)
  currentChatStudent.value = student
  
  // Небольшая задержка чтобы computed обновился
  await new Promise(resolve => setTimeout(resolve, 150))
  
  // Проверяем что roomId действительно обновился
  const actualRoomId = currentChatRoomId.value
  console.log('🔵 Checking roomId - Expected:', roomId, 'Actual:', actualRoomId)
  console.log('🔵 chatRooms cache:', JSON.stringify(chatRooms.value))
  console.log('🔵 currentChatStudent.id:', currentChatStudent.value?.id)
  
  if (actualRoomId === roomId && actualRoomId > 0) {
    console.log('✅ RoomId confirmed, opening chat with roomId:', actualRoomId)
    isChatOpen.value = true
  } else {
    console.error('❌ RoomId mismatch! Expected:', roomId, 'Got:', actualRoomId)
    console.error('   chatRooms cache:', JSON.stringify(chatRooms.value))
    console.error('   currentChatStudent:', currentChatStudent.value?.id)
    
    // Попробуем исправить - принудительно установим roomId
    if (roomId > 0) {
      console.log('🔧 Fixing: setting roomId directly in cache')
      chatRooms.value[student.id] = roomId
      await new Promise(resolve => setTimeout(resolve, 50))
      const fixedRoomId = currentChatRoomId.value
      if (fixedRoomId === roomId) {
        console.log('✅ Fixed! Opening chat with roomId:', fixedRoomId)
        isChatOpen.value = true
      } else {
        console.error('❌ Still broken after fix')
        message.error('Ошибка при открытии чата. Попробуйте еще раз.')
      }
    } else {
      message.error('Ошибка при открытии чата. Попробуйте еще раз.')
    }
  }
}

const closeChat = () => {
  isChatOpen.value = false
  // Keep currentChatStudent to maintain room connection
}

const updateUnreadCount = (count: number) => {
  if (currentChatStudent.value) {
    unreadCounts.value[currentChatStudent.value.id] = count
  }
}

const loadStudents = async () => {
  loading.value = true
  try {
    const response = await axios.get(`/api/v1/courses/groups/${props.groupId}/`)
    students.value = response.data.students || []
    // Initialize unread counts
    students.value.forEach((student: any) => {
      if (!(student.id in unreadCounts.value)) {
        unreadCounts.value[student.id] = 0
      }
    })
  } catch (err) {
    console.error('Error loading students:', err)
    message.error('Ошибка при загрузке студентов')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStudents()
  fetchMyWallet()
})
</script>

<style scoped>
.students-tab {
  padding: 0;
}
</style>
