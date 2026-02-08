import { useI18n } from 'vue-i18n'

export const useLanguage = () => {
  const { locale } = useI18n()

  const languages = [
    { code: 'tm', name: 'Türkmen', flag: '🇹🇲' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ]

  const setLanguage = (lang: string) => {
    locale.value = lang
    localStorage.setItem('locale', lang)
  }

  const currentLanguage = languages.find(lang => lang.code === locale.value) || languages[0]

  return {
    languages,
    currentLanguage,
    setLanguage,
    locale: locale.value
  }
}

