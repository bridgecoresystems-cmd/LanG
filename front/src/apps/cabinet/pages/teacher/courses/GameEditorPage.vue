<template>
  <CabinetLayout>
    <n-space vertical size="large" class="game-editor-page">
      <n-page-header @back="handleBack">
        <template #title>
          {{ isEdit ? $t('cabinet.games.editionPage') : $t('cabinet.games.creationPage') }}
        </template>
        <template #subtitle>
          {{ groupName }}
        </template>
      </n-page-header>

      <n-card :bordered="false" class="editor-card">
        <n-form :model="formData" :rules="rules" ref="formRef">
          <n-grid cols="1 m:2" :x-gap="24">
            <n-gi>
              <n-form-item :label="$t('cabinet.games.gameTitle')" path="title">
                <n-input v-model:value="formData.title" :placeholder="`${$t('common.example')}: ${$t('cabinet.games.exampleTitle')}`" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="$t('cabinet.games.attachToLesson')" path="lesson">
                <n-select
                  v-model:value="formData.lesson"
                  :options="lessonOptions"
                  :placeholder="`${$t('cabinet.games.selectLesson')} (${$t('cabinet.games.optional')})`"
                  clearable
                  :loading="lessonsLoading"
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-divider title-placement="left">{{ $t('cabinet.games.gameType') }}</n-divider>

          <div class="game-types-grid">
            <div 
              v-for="type in gameTypes" 
              :key="type.value"
              class="game-type-card"
              :class="{ 'active': formData.game_type === type.value, 'disabled': isEdit && formData.game_type !== type.value }"
              @click="!isEdit && (formData.game_type = type.value)"
            >
              <div class="type-icon">
                <n-icon size="32"><component :is="type.icon" /></n-icon>
              </div>
              <div class="type-info">
                <div class="type-title">{{ type.label }}</div>
                <div class="type-desc">{{ type.description }}</div>
              </div>
              <div class="type-badge" v-if="formData.game_type === type.value">
                <n-icon><check-icon /></n-icon>
              </div>
            </div>
          </div>

          <n-divider title-placement="left">{{ $t('cabinet.games.gameContent') }}</n-divider>

          <div class="content-section">
            <n-alert v-if="formData.game_type === 'matching'" type="info" style="margin-bottom: 16px;">
              {{ $t('cabinet.games.matchingDesc') }}
            </n-alert>
            <n-alert v-if="formData.game_type === 'sprint'" type="info" style="margin-bottom: 16px;">
              {{ $t('cabinet.games.sprintDesc') }}
            </n-alert>
            <n-alert v-if="formData.game_type === 'memory'" type="info" style="margin-bottom: 16px;">
              {{ $t('cabinet.games.memoryDesc') }}
            </n-alert>

            <n-form-item :label="`${$t('cabinet.games.wordPairs')} (${formData.pairs.length})`" path="pairs">
              <n-dynamic-input
                v-model:value="formData.pairs"
                :on-create="onCreatePair"
                #default="{ value }"
              >
                <div class="pair-input-row">
                  <n-input 
                    v-model:value="value.word" 
                    :placeholder="$t('cabinet.games.word')" 
                    style="flex: 1"
                  />
                  <div class="pair-arrow">
                    <n-icon><arrow-icon /></n-icon>
                  </div>
                  <n-input 
                    v-model:value="value.translation" 
                    :placeholder="$t('cabinet.games.translation')" 
                    style="flex: 1"
                  />
                </div>
              </n-dynamic-input>
            </n-form-item>
          </div>

          <div class="form-actions">
            <n-space justify="end">
              <n-button @click="handleBack">{{ $t('common.cancel') }}</n-button>
              <n-button 
                type="primary" 
                size="large" 
                :loading="saving" 
                @click="handleSave"
                style="min-width: 150px"
              >
                {{ isEdit ? $t('common.save') : $t('cabinet.games.createGame') }}
              </n-button>
            </n-space>
          </div>
        </n-form>
      </n-card>
    </n-space>
  </CabinetLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NSpace, NPageHeader, NCard, NForm, NFormItem, NInput, NSelect, 
  NDivider, NGrid, NGi, NIcon, NDynamicInput, NButton, NAlert, useMessage
} from 'naive-ui'
import { 
  ShapesOutline as MatchingIcon, 
  FlashOutline as SprintIcon,
  GridOutline as MemoryIcon,
  CheckmarkCircle as CheckIcon,
  ArrowForwardOutline as ArrowIcon
} from '@vicons/ionicons5'
import CabinetLayout from '@/apps/cabinet/layouts/CabinetLayout.vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { t } = useI18n()

const groupId = Number(route.params.id)
const gameId = route.params.gameId ? Number(route.params.gameId) : null
const isEdit = computed(() => !!gameId)

const formRef = ref(null)
const saving = ref(false)
const groupName = ref('')
const lessonsLoading = ref(false)
const lessons = ref([])

const formData = ref({
  title: '',
  game_type: 'matching',
  lesson: null,
  pairs: [{ word: '', translation: '' }, { word: '', translation: '' }]
})

const gameTypes = computed(() => [
  { 
    label: t('cabinet.games.matching'), 
    value: 'matching', 
    icon: MatchingIcon, 
    description: t('cabinet.games.matchingDesc') 
  },
  { 
    label: t('cabinet.games.sprint'), 
    value: 'sprint', 
    icon: SprintIcon, 
    description: t('cabinet.games.sprintDesc') 
  },
  { 
    label: t('cabinet.games.memory'), 
    value: 'memory', 
    icon: MemoryIcon, 
    description: t('cabinet.games.memoryDesc') 
  }
])

const rules = {
  title: { required: true, message: t('cabinet.games.enterGameTitle'), trigger: 'blur' },
  game_type: { required: true, message: t('cabinet.games.gameType'), trigger: 'change' }
}

const lessonOptions = computed(() => {
  return lessons.value.map(l => ({
    label: `${l.lesson_date.split('T')[0]} - ${l.title}`,
    value: l.id
  }))
})

const onCreatePair = () => ({ word: '', translation: '' })

const handleBack = () => {
  router.push({ name: 'TeacherCourseDetail', params: { id: groupId }, query: { tab: 'games' } })
}

const loadGroupInfo = async () => {
  try {
    const res = await axios.get(`/api/v1/courses/groups/${groupId}/`)
    groupName.value = res.data.name
  } catch (err) {
    console.error('Error loading group:', err)
  }
}

const loadLessons = async () => {
  lessonsLoading.value = true
  try {
    const res = await axios.get(`/api/v1/courses/lessons/?group_id=${groupId}`)
    lessons.value = Array.isArray(res.data) ? res.data : res.data.results || []
  } catch (err) {
    console.error('Error loading lessons:', err)
  } finally {
    lessonsLoading.value = false
  }
}

const loadGameData = async () => {
  if (!gameId) return
  try {
    const res = await axios.get(`/api/v1/courses/games/${gameId}/`)
    formData.value = {
      title: res.data.title,
      game_type: res.data.game_type,
      lesson: res.data.lesson,
      pairs: JSON.parse(JSON.stringify(res.data.data))
    }
  } catch (err) {
    message.error(t('cabinet.games.errorSavingGame'))
    handleBack()
  }
}

const handleSave = async () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return

    const validPairs = formData.value.pairs.filter(p => p.word.trim() && p.translation.trim())
    if (validPairs.length < 2) {
      message.warning(t('cabinet.games.addAtLeastTwoPairs'))
      return
    }

    saving.value = true
    try {
      const payload = {
        group: groupId,
        lesson: formData.value.lesson,
        title: formData.value.title,
        game_type: formData.value.game_type,
        data: validPairs
      }

      if (isEdit.value) {
        await axios.put(`/api/v1/courses/games/${gameId}/`, payload)
        message.success(t('cabinet.games.gameUpdatedSuccess'))
      } else {
        await axios.post('/api/v1/courses/games/', payload)
        message.success(t('cabinet.games.gameCreatedSuccess'))
      }
      handleBack()
    } catch (err) {
      console.error('Error saving game:', err)
      message.error(t('cabinet.games.errorSavingGame'))
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => {
  loadGroupInfo()
  loadLessons()
  if (isEdit.value) {
    loadGameData()
  }
})
</script>

<style scoped>
.game-editor-page {
  padding: 12px;
}

.editor-card {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.game-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.game-type-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f9f9fb;
  border: 2px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.game-type-card:hover:not(.disabled) {
  background: #f0f0f5;
  transform: translateY(-2px);
}

.game-type-card.active {
  background: #f0fdf4;
  border-color: #18a058;
}

.game-type-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.type-icon {
  width: 56px;
  height: 56px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #18a058;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.active .type-icon {
  background: #18a058;
  color: white;
}

.type-info {
  flex: 1;
}

.type-title {
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 4px;
}

.type-desc {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.3;
}

.type-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  color: #18a058;
  font-size: 1.2rem;
}

.pair-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.pair-arrow {
  color: #999;
}

.content-section {
  padding: 16px;
  background: #fcfcfd;
  border-radius: 12px;
}

.form-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #efeff5;
}

@media (max-width: 600px) {
  .pair-input-row {
    flex-direction: column;
    align-items: stretch;
  }
  .pair-arrow {
    text-align: center;
    transform: rotate(90deg);
  }
}
</style>

