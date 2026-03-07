import { createI18n } from 'vue-i18n'

const messages = {
  ru: {
    nav: {
      home: 'Главная',
      schedule: 'Расписание',
      grades: 'Оценки',
      profile: 'Профиль',
      children: 'Дети',
      payments: 'Оплата',
    },
    auth: {
      subtitle: 'Языковая школа',
      email: 'Email',
      password: 'Пароль',
      login: 'Войти',
      logout: 'Выйти',
    },
    student: {
      dashboard: {
        title: 'Главная',
        greeting: 'Привет',
        todaySchedule: 'Сегодня',
        noLessons: 'Занятий нет',
        quickActions: 'Быстрый доступ',
      },
      schedule: {
        noLessons: 'В этот день занятий нет',
      },
      profile: {
        gems: 'Gems баланс',
        notifications: 'Уведомления',
        language: 'Язык',
      },
    },
    parent: {
      dashboard: {
        title: 'Главная',
        greeting: 'Добрый день',
        children: 'Мои дети',
        recentPayments: 'Последние оплаты',
      },
    },
    roles: {
      STUDENT: 'Ученик',
      PARENT: 'Родитель',
    },
    common: {
      seeAll: 'Все →',
    },
  },
  tm: {
    nav: {
      home: 'Baş sahypa',
      schedule: 'Çäre',
      grades: 'Bahalar',
      profile: 'Profil',
      children: 'Çagalar',
      payments: 'Töleg',
    },
    auth: {
      subtitle: 'Dil mekdebi',
      email: 'Email',
      password: 'Parol',
      login: 'Giriş',
      logout: 'Çykyş',
    },
    student: {
      dashboard: {
        title: 'Baş sahypa',
        greeting: 'Salam',
        todaySchedule: 'Şu gün',
        noLessons: 'Sapak ýok',
        quickActions: 'Çalt giriş',
      },
      schedule: {
        noLessons: 'Bu gün sapak ýok',
      },
      profile: {
        gems: 'Gems balansy',
        notifications: 'Habarlamalar',
        language: 'Dil',
      },
    },
    parent: {
      dashboard: {
        title: 'Baş sahypa',
        greeting: 'Salam',
        children: 'Çagalarym',
        recentPayments: 'Soňky tölegler',
      },
    },
    roles: {
      STUDENT: 'Okuwçy',
      PARENT: 'Ata-ene',
    },
    common: {
      seeAll: 'Hemmesi →',
    },
  },
  en: {
    nav: {
      home: 'Home',
      schedule: 'Schedule',
      grades: 'Grades',
      profile: 'Profile',
      children: 'Children',
      payments: 'Payments',
    },
    auth: {
      subtitle: 'Language School',
      email: 'Email',
      password: 'Password',
      login: 'Sign In',
      logout: 'Log Out',
    },
    student: {
      dashboard: {
        title: 'Home',
        greeting: 'Hello',
        todaySchedule: 'Today',
        noLessons: 'No lessons today',
        quickActions: 'Quick Access',
      },
      schedule: {
        noLessons: 'No lessons this day',
      },
      profile: {
        gems: 'Gems balance',
        notifications: 'Notifications',
        language: 'Language',
      },
    },
    parent: {
      dashboard: {
        title: 'Home',
        greeting: 'Hello',
        children: 'My Children',
        recentPayments: 'Recent Payments',
      },
    },
    roles: {
      STUDENT: 'Student',
      PARENT: 'Parent',
    },
    common: {
      seeAll: 'See all →',
    },
  },
}

export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang_mobile_locale') || 'ru',
  fallbackLocale: 'ru',
  messages,
})
