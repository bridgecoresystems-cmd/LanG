// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {enabled: false},
  compatibilityDate: '2024-11-01',
  ssr: false, // SPA mode — временно отключено для разработки (меньше нагрузка на Chrome)
  modules: ['@nuxtjs/i18n', '@pinia/nuxt', 'nuxt-quasar-ui', '@nuxt/ui', 'nuxtjs-naive-ui'],
  colorMode: {
    preference: 'light'
  },
  quasar: {
    plugins: ['Notify', 'Dialog'],
    extras: {
      fontIcons: ['material-icons'],
    },
  },
  i18n: {
    restructureDir: false,
    locales: [
      { code: 'tm', name: 'Türkmen', flag: '🇹🇲', file: 'tm.json' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺', file: 'ru.json' },
      { code: 'en', name: 'English', flag: '🇬🇧', file: 'en.json' },
    ],
    defaultLocale: 'ru',
    lazy: true,
    langDir: 'locales',
    bundle: {
      optimizeTranslationDirective: false,
    },
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'locale',
    },
  },
  css: ['~/assets/styles/main.css', 'primeicons/primeicons.css'],
  runtimeConfig: {
    public: {
      // Прямой URL на backend. Используем localhost (не 127.0.0.1) чтобы cookies совпадали с доменом страницы.
      apiBase: process.env.NUXT_PUBLIC_API_BASE || `${process.env.NUXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000'}/api/v1`,
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:8000',
    },
  },
  // Remove vite and nitro proxy blocks as we will use a server route instead
  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  features: {
    inlineStyles: true,
  },
  routeRules: {
    '/': { redirect: '/landing' },
    '/admin/**': { ssr: false },
    '/uploads/**': {
      proxy: {
        to: `${process.env.API_URL || 'http://127.0.0.1:8000'}/uploads/**`,
        cookieDomainRewrite: { '*': '' },
      },
    },
  },
  nitro: {
    experimental: {
      wasm: false,
    },
    nodeOptions: ['--max-old-space-size=4096'],
  },
})
