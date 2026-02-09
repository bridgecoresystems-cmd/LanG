import { getRequestURL, proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname + (url.search || '')

  // WebSocket upgrade — не проксируем (h3 proxy не поддерживает WS), чтобы избежать ECONNRESET
  if (path === '/api/v1/ws' || path.startsWith('/api/v1/ws?')) {
    return sendError(event, createError({ statusCode: 426, statusMessage: 'Use direct WebSocket connection to backend' }))
  }

  const base = process.env.API_URL || 'http://127.0.0.1:8000'
  const target = base + path

  return proxyRequest(event, target, {
    cookieDomainRewrite: { '*': '' },
    cookiePathRewrite: { '*': '/' },
  })
})
