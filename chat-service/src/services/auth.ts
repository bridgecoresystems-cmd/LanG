/**
 * JWT аутентификация
 * Интеграция с Django JWT токенами
 */

import { jwt } from '@elysiajs/jwt'

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || 'django-insecure-change-this-in-production'

export const authPlugin = jwt({
  name: 'jwt',
  secret: JWT_SECRET,
  exp: '7d', // Время жизни токена
})

/**
 * Проверка JWT токена от Django
 */
export async function verifyToken(token: string): Promise<any> {
  try {
    // Используем тот же секрет и алгоритм что и Django (HS256)
    const jwtLib = await import('jsonwebtoken')
    const decoded = jwtLib.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
    console.log('✅ Token verified successfully')
    return decoded
  } catch (error: any) {
    console.error('❌ Token verification failed:', error.message)
    if (error.name === 'TokenExpiredError') {
      console.error('   Token expired at:', new Date(error.expiredAt))
    } else if (error.name === 'JsonWebTokenError') {
      console.error('   Invalid token format')
    }
    return null
  }
}

/**
 * Извлечение пользователя из токена
 */
export function getUserFromToken(payload: any) {
  if (!payload || !payload.user_id) {
    return null
  }

  return {
    id: payload.user_id,
    username: payload.username || '',
    email: payload.email || '',
    role: payload.role || 'student',
  }
}

