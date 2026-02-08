import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import pino from 'pino'
import { chatRoutes } from './routes/chat'
import { apiRoutes } from './routes/api'
import { staticRoutes } from './routes/static'
import { testConnection } from './services/database'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

// Тестируем подключение к БД при старте
testConnection().catch(err => {
  logger.error('Database connection failed:', err)
})

const app = new Elysia()
  .use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }))
  .onRequest(({ request }) => {
    // Не логируем WebSocket upgrade запросы как обычные HTTP запросы
    if (!request.url.includes('/ws/')) {
      logger.info({ method: request.method, url: request.url }, 'Incoming request')
    }
  })
  .onError(({ error, request }) => {
    // Не логируем WebSocket upgrade ошибки как обычные ошибки
    if (!request.url.includes('/ws/')) {
      logger.error({ error: error.message, url: request.url }, 'Request error')
    }
  })
  // Health check
  .get('/', () => ({
    status: 'ok',
    service: 'Chat Service',
    version: '1.0.0',
    endpoints: {
      websocket: '/ws/chat/:roomId',
      api: '/api'
    }
  }))
  .get('/health', () => ({ status: 'healthy' }))
  // WebSocket роуты для real-time чата
  .use(chatRoutes)
  // REST API роуты
  .group('/api', (app) => app.use(apiRoutes))
  // Статические файлы (фото и аудио)
  .use(staticRoutes)
  .listen(process.env.PORT || 3001)

logger.info(`🚀 Chat service running on http://localhost:${app.server?.port || 3001}`)
logger.info(`📡 WebSocket: ws://localhost:${app.server?.port || 3001}/ws/chat/:roomId`)
logger.info(`🔌 REST API: http://localhost:${app.server?.port || 3001}/api`)

