/**
 * PostgreSQL подключение
 * Использует ту же БД что и Django
 */

import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/lang_db'

export const db = postgres(connectionString, {
  max: 10, // Максимум соединений
  idle_timeout: 20,
  connect_timeout: 10,
})

// Тест подключения
export async function testConnection() {
  try {
    const result = await db`SELECT version()`
    console.log('✅ PostgreSQL connected:', result[0].version)
    return true
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error)
    return false
  }
}

