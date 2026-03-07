<template>
  <div class="dashboard">
    <!-- Hero: общий приветственный баннер -->
    <header class="hero" :class="heroClass">
      <div class="hero-content">
        <h1 class="hero-title">
          С возвращением, {{ authStore.user?.first_name || 'друг' }}! 👋
        </h1>
        <p class="hero-subtitle">{{ heroSubtitle }}</p>
      </div>
      <div class="hero-deco hero-deco-1" />
      <div class="hero-deco hero-deco-2" />
      <div class="hero-icon">
        <NIcon size="72" :component="heroIcon" />
      </div>
    </header>

    <!-- ─── HEAD_ACCOUNTANT ─────────────────────────────────────────── -->
    <div v-if="isHeadAccountant" class="dashboard-section">
      <div class="stats-row">
        <NCard class="stat-card stat-card--gems" :bordered="false">
          <div class="stat-card__icon">
            <NIcon size="24" :component="DiamondIcon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">Мой баланс гемов</span>
            <span class="stat-card__value">{{ haStats.myBalance }} 💎</span>
          </div>
        </NCard>
        <NCard class="stat-card stat-card--wallets" :bordered="false">
          <div class="stat-card__icon">
            <NIcon size="24" :component="PeopleIcon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">Всего кошельков</span>
            <span class="stat-card__value">{{ haStats.walletsCount }}</span>
          </div>
        </NCard>
        <NCard class="stat-card stat-card--requests" :bordered="false">
          <div class="stat-card__icon">
            <NIcon size="24" :component="ListIcon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">Заявок на пополнение</span>
            <span class="stat-card__value">{{ haStats.pendingRequests }}</span>
          </div>
        </NCard>
      </div>
      <h2 class="section-title">Быстрые действия</h2>
      <div class="shortcuts-grid">
        <NCard
          v-for="card in headAccountantShortcuts"
          :key="card.path"
          class="shortcut-card"
          :bordered="false"
          hoverable
          @click="navigateTo(card.path)"
        >
          <div :class="['shortcut-card__icon', card.iconBg]">
            <NIcon size="22" :component="card.icon" />
          </div>
          <h3 class="shortcut-card__title">{{ card.label }}</h3>
          <p class="shortcut-card__desc">{{ card.desc }}</p>
          <NButton quaternary size="small" class="shortcut-card__link">
            Перейти <NIcon size="14" :component="ArrowIcon" />
          </NButton>
        </NCard>
      </div>
    </div>

    <!-- ─── ACCOUNTANT ───────────────────────────────────────────────── -->
    <div v-else-if="isAccountant" class="dashboard-section">
      <div class="stats-row stats-row--2">
        <NCard class="stat-card stat-card--primary" :bordered="false">
          <div class="stat-card__icon">
            <NIcon size="24" :component="CardIcon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">Принять оплату</span>
            <span class="stat-card__value">Быстрый приём</span>
          </div>
        </NCard>
        <NCard class="stat-card stat-card--secondary" :bordered="false">
          <div class="stat-card__icon">
            <NIcon size="24" :component="ChartIcon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">Отчёты и контроль</span>
            <span class="stat-card__value">Платежи · Долги</span>
          </div>
        </NCard>
      </div>
      <h2 class="section-title">Меню</h2>
      <div class="shortcuts-grid">
        <NCard
          v-for="card in accountantShortcuts"
          :key="card.path"
          class="shortcut-card"
          :bordered="false"
          hoverable
          @click="navigateTo(card.path)"
        >
          <div :class="['shortcut-card__icon', card.iconBg]">
            <NIcon size="22" :component="card.icon" />
          </div>
          <h3 class="shortcut-card__title">{{ card.label }}</h3>
          <NButton quaternary size="small" class="shortcut-card__link">
            Открыть <NIcon size="14" :component="ArrowIcon" />
          </NButton>
        </NCard>
      </div>
    </div>

    <!-- ─── SALES ────────────────────────────────────────────────────── -->
    <div v-else-if="isSales" class="dashboard-section">
      <div class="stats-row">
        <NCard class="stat-card stat-card--sales-today" :bordered="false">
          <div class="stat-card__icon">
            <NIcon size="24" :component="CallIcon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">Звонков сегодня</span>
            <span class="stat-card__value">{{ salesStats.today }}</span>
          </div>
        </NCard>
        <NCard class="stat-card stat-card--sales-week" :bordered="false">
          <div class="stat-card__icon">
            <NIcon size="24" :component="CalendarIcon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">За 7 дней</span>
            <span class="stat-card__value">{{ salesStats.last7Days }}</span>
          </div>
        </NCard>
        <NCard class="stat-card stat-card--sales-total" :bordered="false">
          <div class="stat-card__icon">
            <NIcon size="24" :component="PeopleIcon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">Всего контактов</span>
            <span class="stat-card__value">{{ salesStats.total }}</span>
          </div>
        </NCard>
      </div>
      <div class="action-bar">
        <NButton type="primary" size="large" @click="navigateTo('/cabinet/sales/add')">
          <template #icon>
            <NIcon :component="AddIcon" />
          </template>
          Добавить звонок
        </NButton>
        <NButton secondary size="large" @click="navigateTo('/cabinet/sales')">
          Дневник звонков
          <template #icon>
            <NIcon :component="ListIcon" />
          </template>
        </NButton>
      </div>
    </div>

    <!-- ─── GEN_DIRECTOR ─────────────────────────────────────────────── -->
    <div v-else-if="isGenDirector" class="dashboard-section">
      <div class="stats-row stats-row--1">
        <NCard class="stat-card stat-card--gd" :bordered="false" hoverable @click="navigateTo('/cabinet/gen-director/topup-requests')">
          <div class="stat-card__icon">
            <NIcon size="28" :component="DiamondIcon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">Заявки на пополнение гемов</span>
            <span class="stat-card__value">Утвердить заявки главбуха</span>
          </div>
          <NIcon size="24" :component="ArrowIcon" class="stat-card__arrow" />
        </NCard>
      </div>
    </div>

    <!-- ─── HEAD_TEACHER ─────────────────────────────────────────────── -->
    <div v-else-if="isHeadTeacher" class="dashboard-section">
      <h2 class="section-title">Управление учебным процессом</h2>
      <div class="shortcuts-grid shortcuts-grid--wide">
        <NCard
          v-for="card in headTeacherShortcuts"
          :key="card.path"
          class="shortcut-card shortcut-card--large"
          :bordered="false"
          hoverable
          @click="navigateTo(card.path)"
        >
          <div :class="['shortcut-card__icon shortcut-card__icon--lg', card.iconBg]">
            <NIcon size="24" :component="card.icon" />
          </div>
          <h3 class="shortcut-card__title">{{ card.label }}</h3>
          <p class="shortcut-card__desc">{{ card.desc }}</p>
          <NButton quaternary size="small" class="shortcut-card__link">
            Открыть <NIcon size="14" :component="ArrowIcon" />
          </NButton>
        </NCard>
      </div>
    </div>

    <!-- ─── EDITOR / SUPERUSER (контент) ──────────────────────────────── -->
    <div v-else-if="isEditor" class="dashboard-section">
      <h2 class="section-title">Контент сайта</h2>
      <div class="shortcuts-grid">
        <NCard
          v-for="card in editorShortcuts"
          :key="card.path"
          class="shortcut-card"
          :bordered="false"
          hoverable
          @click="navigateTo(card.path)"
        >
          <div :class="['shortcut-card__icon', card.iconBg]">
            <NIcon size="22" :component="card.icon" />
          </div>
          <h3 class="shortcut-card__title">{{ card.label }}</h3>
          <p class="shortcut-card__desc">{{ card.desc }}</p>
          <NButton quaternary size="small" class="shortcut-card__link">
            Перейти <NIcon size="14" :component="ArrowIcon" />
          </NButton>
        </NCard>
      </div>
    </div>

    <!-- ─── TEACHER / STUDENT: группы и курсы ─────────────────────────── -->
    <div v-else-if="isTeacher || isStudent" class="dashboard-section">
      <h2 class="section-title">
        <NIcon size="22" :component="PeopleIcon" class="section-title__icon" />
        {{ isTeacher ? 'Мои группы' : 'Мои курсы' }}
      </h2>
      <div v-if="contextStore.isLoading" class="groups-skeleton">
        <NCard v-for="i in 4" :key="i" class="skeleton-card" :bordered="false">
          <NSkeleton height="180px" />
        </NCard>
      </div>
      <div v-else-if="contextStore.availableGroups.length > 0" class="groups-grid">
        <div v-for="group in contextStore.availableGroups" :key="group.id" class="groups-grid__item">
          <CabinetGroupCard :group="group" @click="selectGroup(group.id)" />
        </div>
      </div>
      <div v-else class="empty-state">
        <NIcon size="48" :component="BookIcon" class="empty-state__icon" />
        <p class="empty-state__text">У вас пока нет активных групп</p>
      </div>
    </div>

    <!-- ─── PARENT ────────────────────────────────────────────────────── -->
    <div v-else-if="isParent" class="dashboard-section">
      <h2 class="section-title">Дети и сообщения</h2>
      <div class="shortcuts-grid shortcuts-grid--2">
        <NCard class="shortcut-card" :bordered="false" hoverable @click="navigateTo('/cabinet/children')">
          <div class="shortcut-card__icon shortcut-card__icon--parent">
            <NIcon size="24" :component="PeopleIcon" />
          </div>
          <h3 class="shortcut-card__title">Мои дети</h3>
          <p class="shortcut-card__desc">Профили детей, успеваемость и расписание</p>
          <NButton quaternary size="small" class="shortcut-card__link">Открыть</NButton>
        </NCard>
        <NCard class="shortcut-card" :bordered="false" hoverable @click="navigateTo('/cabinet/mailing')">
          <div class="shortcut-card__icon shortcut-card__icon--mail">
            <NIcon size="24" :component="MailIcon" />
          </div>
          <h3 class="shortcut-card__title">Сообщения</h3>
          <p class="shortcut-card__desc">Рассылки и объявления от школы</p>
          <NButton quaternary size="small" class="shortcut-card__link">Открыть</NButton>
        </NCard>
      </div>
    </div>

    <!-- ─── MERCHANT ──────────────────────────────────────────────────── -->
    <div v-else-if="isMerchant" class="dashboard-section">
      <div class="stats-row stats-row--1">
        <NCard class="stat-card stat-card--merchant" :bordered="false">
          <div class="stat-card__icon">
            <NIcon size="28" :component="DiamondIcon" />
          </div>
          <div class="stat-card__body">
            <span class="stat-card__label">Мой баланс гемов</span>
            <span class="stat-card__value">{{ merchantBalance }} 💎</span>
          </div>
        </NCard>
      </div>
      <NButton type="primary" size="large" @click="navigateTo('/cabinet/gems')">
        Транзакции и история
        <template #icon>
          <NIcon :component="ListIcon" />
        </template>
      </NButton>
    </div>

    <!-- Fallback: только hero для остальных ролей (DIRECTOR, RECEPTIONIST и т.д.) -->
    <div v-else class="dashboard-section">
      <div class="shortcuts-grid">
        <NCard class="shortcut-card" :bordered="false" hoverable @click="navigateTo('/cabinet/profile')">
          <div class="shortcut-card__icon shortcut-card__icon--profile">
            <NIcon size="28" :component="PersonIcon" />
          </div>
          <h3 class="shortcut-card__title">Мой профиль</h3>
          <p class="shortcut-card__desc">Настройки и личные данные</p>
          <NButton quaternary size="small" class="shortcut-card__link">Открыть</NButton>
        </NCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  NCard,
  NButton,
  NIcon,
  NSkeleton,
} from 'naive-ui'
import {
  PeopleOutline as PeopleIcon,
  BookOutline as BookIcon,
  DocumentTextOutline as DocumentIcon,
  BarChartOutline as ChartIcon,
  MailOutline as MailIcon,
  CallOutline as CallIcon,
  CalendarOutline as CalendarIcon,
  ListOutline as ListIcon,
  AddOutline as AddIcon,
  CardOutline as CardIcon,
  DiamondOutline as DiamondIcon,
  PersonOutline as PersonIcon,
  StorefrontOutline as VendorIcon,
  ChevronForwardOutline as ArrowIcon,
  SchoolOutline as SchoolIcon,
  WalletOutline as WalletIcon,
} from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/authStore'
import { useContextStore } from '~/stores/contextStore'
import { useCabinetProfile } from '~/composables/useCabinetProfile'
import { useCabinetSales } from '~/composables/useCabinetSales'

definePageMeta({ layout: 'cabinet', middleware: 'cabinet-auth' })

const authStore = useAuthStore()
const contextStore = useContextStore()
const profileApi = useCabinetProfile()
const salesApi = useCabinetSales()
const config = useRuntimeConfig()
const API = config.public.apiBase as string

const userRole = computed(() => (authStore.user?.role || '').toUpperCase())
const hasRole = (r: string) => userRole.value === r
const hasAnyRole = (roles: string[]) => roles.some((r) => userRole.value === r)

const isHeadAccountant = computed(() => hasAnyRole(['HEAD_ACCOUNTANT', 'SUPERUSER']))
const isAccountant = computed(() => hasRole('ACCOUNTANT'))
const isSales = computed(() => hasRole('SALES'))
const isGenDirector = computed(() => hasAnyRole(['GEN_DIRECTOR', 'SUPERUSER']))
const isHeadTeacher = computed(() => hasAnyRole(['HEAD_TEACHER', 'SUPERUSER']))
const isEditor = computed(() => hasAnyRole(['EDITOR', 'SUPERUSER']))
const isTeacher = computed(() => hasRole('TEACHER'))
const isStudent = computed(() => hasRole('STUDENT'))
const isParent = computed(() => hasRole('PARENT'))
const isMerchant = computed(() => hasRole('MERCHANT'))

const heroSubtitle = computed(() => {
  const map: Record<string, string> = {
    HEAD_ACCOUNTANT: 'Главный бухгалтер · Управление гемами и финансами',
    ACCOUNTANT: 'Бухгалтер · Приём оплат и контроль',
    SALES: 'Менеджер по продажам · Дневник звонков',
    GEN_DIRECTOR: 'Генеральный директор · Утверждение заявок',
    HEAD_TEACHER: 'Завуч · Управление учебным процессом',
    EDITOR: 'Редактор · Контент сайта',
    TEACHER: 'Учитель · Ваши группы и расписание',
    STUDENT: 'Студент · Ваши курсы и успеваемость',
    PARENT: 'Родитель · Профили детей',
    MERCHANT: 'Мерчант · Баланс гемов',
  }
  return map[userRole.value] || 'Личный кабинет LanG Academy'
})

const heroClass = computed(() => {
  if (isHeadAccountant.value) return 'hero--ha'
  if (isAccountant.value) return 'hero--acc'
  if (isSales.value) return 'hero--sales'
  if (isGenDirector.value) return 'hero--gd'
  if (isHeadTeacher.value) return 'hero--ht'
  if (isEditor.value) return 'hero--editor'
  if (isTeacher.value) return 'hero--teacher'
  if (isStudent.value) return 'hero--student'
  if (isParent.value) return 'hero--parent'
  if (isMerchant.value) return 'hero--merchant'
  return 'hero--default'
})

const heroIcon = computed(() => {
  if (isHeadAccountant.value || isGenDirector.value || isMerchant.value) return DiamondIcon
  if (isAccountant.value) return CardIcon
  if (isSales.value) return CallIcon
  if (isHeadTeacher.value || isTeacher.value) return SchoolIcon
  if (isStudent.value) return BookIcon
  if (isParent.value) return PeopleIcon
  if (isEditor.value) return DocumentIcon
  return SchoolIcon
})

const haStats = ref({ myBalance: 0, walletsCount: 0, pendingRequests: 0 })
const salesStats = ref({ today: 0, last7Days: 0, total: 0 })
const merchantBalance = ref(0)

const headAccountantShortcuts = [
  { label: 'Все кошельки', path: '/cabinet/head-accountant/gems', desc: 'Балансы и начисление гемов', icon: ChartIcon, iconBg: 'shortcut-card__icon--gems' },
  { label: 'Заявки на пополнение', path: '/cabinet/head-accountant/gems/requests', desc: 'Создать и отслеживать заявки', icon: ListIcon, iconBg: 'shortcut-card__icon--requests' },
  { label: 'Вендоры', path: '/cabinet/head-accountant/vendors', desc: 'Настройка точек списания', icon: VendorIcon, iconBg: 'shortcut-card__icon--vendor' },
  { label: 'Транзакции', path: '/cabinet/head-accountant/payments', desc: 'Все платежи по школам', icon: CardIcon, iconBg: 'shortcut-card__icon--pay' },
  { label: 'Контроль долгов', path: '/cabinet/head-accountant/debts', desc: 'Просроченные платежи', icon: DocumentIcon, iconBg: 'shortcut-card__icon--debt' },
  { label: 'Тарифы', path: '/cabinet/head-accountant/tariffs', desc: 'Настройка цен', icon: WalletIcon, iconBg: 'shortcut-card__icon--tariff' },
]

const accountantShortcuts = [
  { label: 'Принять оплату', path: '/cabinet/accountant/payments/add', icon: AddIcon, iconBg: 'shortcut-card__icon--pay' },
  { label: 'Отчёт по оплатам', path: '/cabinet/accountant/payments', icon: ChartIcon, iconBg: 'shortcut-card__icon--chart' },
  { label: 'Контроль долгов', path: '/cabinet/accountant/debts', icon: DocumentIcon, iconBg: 'shortcut-card__icon--debt' },
  { label: 'Тарифы', path: '/cabinet/accountant/tariffs', icon: WalletIcon, iconBg: 'shortcut-card__icon--tariff' },
  { label: 'Мои гемы', path: '/cabinet/gems', icon: DiamondIcon, iconBg: 'shortcut-card__icon--gems' },
]

const headTeacherShortcuts = [
  { label: 'Ученики и родители', path: '/cabinet/head-teacher/users', desc: 'База учеников и контакты родителей', icon: PeopleIcon, iconBg: 'shortcut-card__icon--ht' },
  { label: 'Курсы', path: '/cabinet/head-teacher/courses', desc: 'Каталог курсов и группы', icon: BookIcon, iconBg: 'shortcut-card__icon--ht' },
  { label: 'Группы', path: '/cabinet/head-teacher/groups', desc: 'Управление группами', icon: PeopleIcon, iconBg: 'shortcut-card__icon--ht' },
  { label: 'Уроки', path: '/cabinet/head-teacher/lessons', desc: 'Расписание уроков', icon: CalendarIcon, iconBg: 'shortcut-card__icon--ht' },
  { label: 'Рассылки', path: '/cabinet/head-teacher/mailing', desc: 'Объявления для учеников', icon: MailIcon, iconBg: 'shortcut-card__icon--ht' },
  { label: 'Экзамены', path: '/cabinet/head-teacher/exam-settings', desc: 'Настройки экзаменов', icon: ListIcon, iconBg: 'shortcut-card__icon--ht' },
]

const editorShortcuts = [
  { label: 'Курсы', path: '/cabinet/editor/courses', desc: 'Каталог курсов, цены и описания', icon: BookIcon, iconBg: 'shortcut-card__icon--editor' },
  { label: 'Новости', path: '/cabinet/editor/news', desc: 'Публикация событий и акций', icon: DocumentIcon, iconBg: 'shortcut-card__icon--editor' },
  { label: 'Сообщения', path: '/cabinet/editor/contact', desc: 'Входящие заявки с сайта', icon: MailIcon, iconBg: 'shortcut-card__icon--editor' },
]

async function loadHeadAccountantStats() {
  if (!isHeadAccountant.value) return
  try {
    const [wallet, allWallets, requests] = await Promise.all([
      $fetch<{ balance: number }>(`${API}/cabinet/gems/wallet`, { credentials: 'include' }),
      $fetch<any[]>(`${API}/cabinet/gems/all-wallets`, { credentials: 'include' }),
      $fetch<any[]>(`${API}/cabinet/gems/topup-requests`, { credentials: 'include' }),
    ])
    haStats.value = {
      myBalance: wallet?.balance ?? 0,
      walletsCount: Array.isArray(allWallets) ? allWallets.length : 0,
      pendingRequests: Array.isArray(requests) ? requests.filter((r: any) => ['pending_director', 'pending_admin'].includes(r.status)).length : 0,
    }
  } catch {
    // ignore
  }
}

async function loadSalesStats() {
  if (!isSales.value) return
  try {
    const data = await salesApi.getStats()
    salesStats.value = {
      today: data?.today ?? 0,
      last7Days: data?.last7Days ?? 0,
      total: data?.total ?? 0,
    }
  } catch {
    // ignore
  }
}

async function loadMerchantBalance() {
  if (!isMerchant.value) return
  try {
    const data = await $fetch<{ balance: number }>(`${API}/cabinet/gems/wallet`, { credentials: 'include' })
    merchantBalance.value = data?.balance ?? 0
  } catch {
    // ignore
  }
}

function selectGroup(id: number) {
  contextStore.setSelectedGroup(id)
  const targetPath = isTeacher.value
    ? `/cabinet/teacher/groups/${id}/lessons`
    : `/cabinet/student/groups/${id}/lessons`
  navigateTo(targetPath)
}

onMounted(async () => {
  if (hasAnyRole(['TEACHER', 'STUDENT'])) {
    try {
      const groups = await profileApi.getMyGroups()
      const normalized = Array.isArray(groups)
        ? groups.map((g: any) => ({ ...g, course_name: g.course_name ?? g.courseName }))
        : []
      contextStore.setGroups(normalized)
    } catch (e) {
      console.error('Failed to load groups', e)
    }
  }
  await Promise.all([loadHeadAccountantStats(), loadSalesStats(), loadMerchantBalance()])
})
</script>

<style scoped>
.dashboard {
  animation: slideUp 0.4s ease-out;
}

.hero {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  padding: 18px 24px;
  color: white;
  margin-bottom: 20px;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 2px;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 0.85rem;
  opacity: 0.9;
  margin: 0;
}

.hero-deco {
  position: absolute;
  border-radius: 50%;
  opacity: 0.25;
}

.hero-deco-1 {
  top: -40px;
  right: -40px;
  width: 160px;
  height: 160px;
  background: rgba(255, 255, 255, 0.2);
}

.hero-deco-2 {
  bottom: -50px;
  right: 15%;
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.1);
}

.hero-icon {
  position: absolute;
  right: 20px;
  bottom: 12px;
  opacity: 0.12;
}


.hero--ha,
.hero--gd {
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #115e59 100%);
}

.hero--acc {
  background: linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #155e75 100%);
}

.hero--sales {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
}

.hero--ht,
.hero--teacher {
  background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%);
}

.hero--student {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%);
}

.hero--editor {
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 50%, #9a3412 100%);
}

.hero--parent {
  background: linear-gradient(135deg, #db2777 0%, #be185d 50%, #9d174d 100%);
}

.hero--merchant {
  background: linear-gradient(135deg, #ca8a04 0%, #a16207 50%, #854d0e 100%);
}

.hero--default {
  background: linear-gradient(135deg, #18a058 0%, #0c7a43 50%, #065f46 100%);
}

.dashboard-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title__icon {
  color: #18a058;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stats-row--2 {
  grid-template-columns: repeat(2, 1fr);
}

.stats-row--1 {
  grid-template-columns: 1fr;
  max-width: 420px;
}

.stat-card {
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: default;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.stat-card--gems {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.stat-card--wallets {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
}

.stat-card--requests {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.stat-card--primary {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.stat-card--secondary {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
}

.stat-card--sales-today {
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
}

.stat-card--sales-week {
  background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
}

.stat-card--sales-total {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.stat-card--gd {
  background: linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%);
  cursor: pointer;
}

.stat-card--merchant {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.stat-card__icon {
  color: rgba(0, 0, 0, 0.5);
}

.stat-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-card__label {
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-card__value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a202c;
}

.stat-card__arrow {
  margin-left: auto;
  color: #0d9488;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.shortcuts-grid--wide {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.shortcuts-grid--2 {
  grid-template-columns: repeat(2, 1fr);
}

.shortcut-card {
  border-radius: 12px;
  padding: 16px 18px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.shortcut-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
}

.shortcut-card--large .shortcut-card__icon {
  width: 44px;
  height: 44px;
}

.shortcut-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.shortcut-card__icon--gems {
  background: #d1fae5;
  color: #059669;
}

.shortcut-card__icon--requests {
  background: #fef3c7;
  color: #d97706;
}

.shortcut-card__icon--vendor {
  background: #e0e7ff;
  color: #4f46e5;
}

.shortcut-card__icon--pay {
  background: #dbeafe;
  color: #2563eb;
}

.shortcut-card__icon--debt {
  background: #fee2e2;
  color: #dc2626;
}

.shortcut-card__icon--tariff {
  background: #e0e7ff;
  color: #6366f1;
}

.shortcut-card__icon--chart {
  background: #d1fae5;
  color: #059669;
}

.shortcut-card__icon--ht {
  background: #d1fae5;
  color: #047857;
}

.shortcut-card__icon--editor {
  background: #ffedd5;
  color: #c2410c;
}

.shortcut-card__icon--parent {
  background: #fce7f3;
  color: #be185d;
}

.shortcut-card__icon--mail {
  background: #dbeafe;
  color: #2563eb;
}

.shortcut-card__icon--profile {
  background: #e5e7eb;
  color: #4b5563;
}

.shortcut-card__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 4px;
}

.shortcut-card__desc {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0 0 10px;
  line-height: 1.35;
}

.shortcut-card__link {
  padding: 0;
  color: #18a058 !important;
}

.action-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.groups-grid__item {
  display: flex;
  justify-content: center;
}

.groups-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.skeleton-card {
  border-radius: 16px;
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: #f9fafb;
  border-radius: 14px;
  border: 2px dashed #e5e7eb;
}

.empty-state__icon {
  color: #9ca3af;
  margin-bottom: 12px;
}

.empty-state__text {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 24px;
  }

  .hero-icon {
    display: none;
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .stats-row--2 {
    grid-template-columns: 1fr;
  }

  .shortcuts-grid,
  .shortcuts-grid--wide {
    grid-template-columns: 1fr;
  }

  .shortcuts-grid--2 {
    grid-template-columns: 1fr;
  }

  .action-bar {
    flex-direction: column;
  }
}
</style>
