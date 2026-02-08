import { proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const target = (process.env.API_URL || 'http://127.0.0.1:8000') + event.path
  return proxyRequest(event, target)
})
