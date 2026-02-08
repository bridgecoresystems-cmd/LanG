/**
 * WebSocket роуты для real-time чата
 */

import { Elysia } from 'elysia'
import { db } from '../services/database'
import { verifyToken, getUserFromToken } from '../services/auth'
import type { WebSocketMessage, Message } from '../types/chat'
import { generateAIResponse, streamAIResponse } from '../services/ai'

// Хранилище активных соединений по комнатам
export const activeConnections = new Map<number, Set<any>>()

// Хранилище пользователей, которые печатают
const typingUsers = new Map<number, Map<number, number>>() // roomId -> userId -> timestamp

/**
 * Отправка сообщения всем подключенным пользователям (глобально)
 */
export function broadcastToAll(message: any) {
  const messageStr = typeof message === 'string' ? message : JSON.stringify(message)
  
  activeConnections.forEach((connections, roomId) => {
    connections.forEach((ws) => {
      try {
        ws.send(messageStr)
      } catch (error: any) {
        console.error('Error sending global message:', error.message || error)
        connections.delete(ws)
        if (connections.size === 0) {
          activeConnections.delete(roomId)
        }
      }
    })
  })
}

export const chatRoutes = new Elysia()
  .ws('/ws/chat/:roomId', {
    // Настройки WebSocket
    idleTimeout: 0, // Отключаем автоматическое закрытие по таймауту
    // Подключение к WebSocket
    async open(ws) {
      try {
        console.log('WebSocket connection attempt, roomId:', ws.data.params?.roomId)
        // Проверка аутентификации
        const token = ws.data.query?.token || ws.data.headers?.authorization?.replace('Bearer ', '')
        
        if (!token) {
          console.log('WebSocket rejected: No token provided')
          ws.close(1008, 'Unauthorized: No token provided')
          return
        }

        let user = null;
        let isLanding = false;

        if (token === 'landing') {
          // Специальный токен для лендинга (только чтение)
          isLanding = true;
          user = { id: 0, username: 'landing_user', role: 'guest' };
        } else {
        // Проверка JWT токена
        console.log('🔐 Verifying JWT token...')
        const payload = await verifyToken(token)
        if (!payload) {
          console.error('❌ WebSocket rejected: Invalid token')
          ws.close(1008, 'Unauthorized: Invalid token')
          return
        }
        console.log('✅ Token verified, payload:', { 
          user_id: payload.user_id, 
          username: payload.username,
          exp: payload.exp,
          iat: payload.iat
        })
        
        user = getUserFromToken(payload)
        if (!user) {
          console.error('❌ WebSocket rejected: Cannot extract user from token')
          ws.close(1008, 'Unauthorized: Invalid user data')
          return
        }
        
        console.log('✅ WebSocket user authenticated:', user.id, user.username, 'role:', user.role)
        
        // Проверяем что пользователь существует в базе данных
        try {
          const dbUser = await db`
            SELECT id, username, first_name, last_name FROM users_user WHERE id = ${user.id}
          `.then(rows => rows[0])
          
          if (!dbUser) {
            console.error('❌ WebSocket rejected: User not found in database, userId:', user.id)
            ws.close(1008, 'Unauthorized: User not found')
            return
          }
          console.log('✅ User found in database:', dbUser.username)
        } catch (dbError: any) {
          console.error('❌ Error checking user in database:', dbError)
          ws.close(1008, 'Internal server error')
          return
        }
        }

        if (!user) {
          console.log('WebSocket rejected: Invalid user')
          ws.close(1008, 'Unauthorized: Invalid user')
          return
        }

        // Сохраняем пользователя в соединении
        ws.data.user = user
        ws.data.roomId = parseInt(ws.data.params.roomId)
        ws.data.isLanding = isLanding

        // Если это лендинг, ему не нужен доступ к конкретным комнатам
        if (!isLanding) {
        // Проверяем доступ к комнате
        console.log('🔍 Checking room access, roomId:', ws.data.roomId, 'userId:', user.id)
        
        // Сначала проверяем существование комнаты
        console.log('🔍 Querying database for room:', ws.data.roomId)
        const roomCheck = await db`
          SELECT id, name, room_type, is_private, is_active FROM chat_room 
          WHERE id = ${ws.data.roomId}
        `.then(rows => {
          console.log('📊 Database query result - rows found:', rows.length)
          if (rows.length > 0) {
            console.log('📊 First row:', rows[0])
          }
          return rows[0]
        })
        
        console.log('📋 Room check result:', roomCheck ? {
          id: roomCheck.id,
          name: roomCheck.name,
          type: roomCheck.room_type,
          private: roomCheck.is_private,
          active: roomCheck.is_active
        } : 'NOT FOUND')
        
        // Дополнительная проверка - может быть проблема с типами данных
        if (roomCheck) {
          console.log('📋 Room check details:', {
            id: roomCheck.id,
            idType: typeof roomCheck.id,
            roomId: ws.data.roomId,
            roomIdType: typeof ws.data.roomId,
            isActive: roomCheck.is_active,
            isActiveType: typeof roomCheck.is_active
          })
        }

        if (!roomCheck) {
          console.error('❌ WebSocket rejected: Room not found, roomId:', ws.data.roomId)
          console.error('   RoomId type:', typeof ws.data.roomId)
          console.error('   Trying to find room in database...')
          
          // Попробуем найти все комнаты для отладки
          const allRooms = await db`
            SELECT id, name, room_type, is_active FROM chat_room 
            ORDER BY id DESC 
            LIMIT 10
          `.then(rows => rows)
          console.error('   Last 10 rooms in database:', allRooms.map(r => ({
            id: r.id,
            name: r.name,
            type: r.room_type,
            active: r.is_active
          })))
          
          ws.close(1008, 'Room not found')
          return
        }
        
        // Проверяем is_active - может быть boolean или string
        const isActive = roomCheck.is_active === true || roomCheck.is_active === 'true' || roomCheck.is_active === 1 || roomCheck.is_active === '1'
        console.log('📋 Room active check:', {
          raw: roomCheck.is_active,
          type: typeof roomCheck.is_active,
          converted: isActive
        })
        
        if (!isActive) {
          console.error('❌ WebSocket rejected: Room is inactive, roomId:', ws.data.roomId)
          console.error('   is_active value:', roomCheck.is_active, 'type:', typeof roomCheck.is_active)
          ws.close(1008, 'Room is inactive')
          return
        }
        
        console.log('✅ Room found:', roomCheck.name, 'type:', roomCheck.room_type, 'private:', roomCheck.is_private)
        ws.data.roomType = roomCheck.room_type

        // Проверяем, является ли пользователь участником комнаты
        const participantResult = await db`
          SELECT COUNT(*)::int as count FROM chat_room_participants
          WHERE room_id = ${ws.data.roomId} AND user_id = ${user.id}
        `.then(rows => rows[0])
        
        console.log('👥 Participant check result:', participantResult)
        
        const isParticipant = participantResult && participantResult.count > 0
        console.log('✅ Is participant:', isParticipant, 'count:', participantResult?.count)

        if (!isParticipant && roomCheck.is_private) {
          console.error('❌ WebSocket rejected: Not a participant, roomId:', ws.data.roomId, 'userId:', user.id)
          ws.close(1008, 'Access denied: Not a participant')
          return
        }
        
        console.log('✅ Access granted for room:', ws.data.roomId, 'user:', user.id)
        }

        // Добавляем соединение в комнату
        if (!activeConnections.has(ws.data.roomId)) {
          activeConnections.set(ws.data.roomId, new Set())
        }
        activeConnections.get(ws.data.roomId)!.add(ws)
        console.log('✅ WebSocket connected successfully, roomId:', ws.data.roomId, 'userId:', user.id)
        console.log('📊 Active connections for room', ws.data.roomId, ':', activeConnections.get(ws.data.roomId)?.size || 0)

        // Для обычных пользователей отправляем уведомление о подключении и историю
        if (!isLanding) {
        try {
          const joinMessage: WebSocketMessage = {
            type: 'user_joined',
            room_id: ws.data.roomId,
            user_id: user.id,
            timestamp: Date.now(),
          }

          broadcastToRoom(ws.data.roomId, joinMessage, ws)

          // Отправляем последние сообщения
          const recentMessagesRaw = await db`
            SELECT 
              m.id,
              m.room_id,
              m.user_id as message_user_id,
              m.content,
              m.file,
              m.file_name,
              m.is_edited,
              m.is_deleted,
              m.created_at,
              m.updated_at,
              u.id as user_id,
              u.username,
              u.first_name,
              u.last_name,
              u.avatar
            FROM chat_message m
            JOIN users_user u ON m.user_id = u.id
            WHERE m.room_id = ${ws.data.roomId} 
              AND m.is_deleted = false
            ORDER BY m.created_at DESC
            LIMIT 50
          `

          console.log('📋 Raw messages from DB:', recentMessagesRaw.length, 'messages')
          if (recentMessagesRaw.length > 0) {
            console.log('📋 Sample message:', {
              id: recentMessagesRaw[0].id,
              user_id: recentMessagesRaw[0].user_id,
              username: recentMessagesRaw[0].username,
              first_name: recentMessagesRaw[0].first_name
            })
          }

          // Преобразуем сообщения в правильный формат с объектом user
          const recentMessages = recentMessagesRaw.map((msg: any) => {
            // Используем user_id из JOIN (u.id as user_id), а не message_user_id
            const userId = msg.user_id // Это из JOIN users_user
            const messageUser = {
              id: userId,
              username: msg.username || '',
              first_name: msg.first_name || '',
              last_name: msg.last_name || '',
              avatar: msg.avatar || null
            }
            
            return {
              id: msg.id,
              room_id: msg.room_id,
              user_id: userId, // Используем user_id из JOIN
              content: msg.content,
              file: msg.file,
              file_name: msg.file_name,
              is_edited: msg.is_edited || false,
              is_deleted: msg.is_deleted || false,
              created_at: msg.created_at,
              user: messageUser
            }
          })
          
          console.log('📋 Processed messages:', recentMessages.length)
          if (recentMessages.length > 0) {
            console.log('📋 Sample processed message:', {
              id: recentMessages[0].id,
              user_id: recentMessages[0].user_id,
              hasUser: !!recentMessages[0].user,
              user: recentMessages[0].user
            })
          }

          // НЕ делаем reverse - сообщения уже отсортированы DESC (новые первыми)
          // На фронтенде мы отсортируем их по возрастанию (старые первыми, новые внизу)
          const historyMessage = {
            type: 'messages_history',
            room_id: ws.data.roomId,
            messages: recentMessages, // Оставляем как есть, сортировка на фронтенде
          }
          
          console.log('📨 Prepared message history:', {
            count: recentMessages.length,
            sample: recentMessages[0] ? {
              id: recentMessages[0].id,
              hasUser: !!recentMessages[0].user,
              user: recentMessages[0].user
            } : 'no messages'
          })
          
          // Проверяем все сообщения перед отправкой
          const messagesWithoutUser = recentMessages.filter((msg: any) => !msg.user)
          if (messagesWithoutUser.length > 0) {
            console.error('❌ CRITICAL: Found messages without user object:', messagesWithoutUser.length)
            console.error('   First message without user:', messagesWithoutUser[0])
          }
          
          // Проверяем сериализацию
          const serialized = JSON.stringify(historyMessage)
          const parsed = JSON.parse(serialized)
          const parsedMessagesWithoutUser = parsed.messages?.filter((msg: any) => !msg.user) || []
          if (parsedMessagesWithoutUser.length > 0) {
            console.error('❌ CRITICAL: After JSON serialization, messages lost user object:', parsedMessagesWithoutUser.length)
            console.error('   First message:', parsedMessagesWithoutUser[0])
          }
          
          console.log('Sending message history, count:', recentMessages.length)
          try {
            ws.send(serialized)
            console.log('✅ Message history sent successfully')
          } catch (sendError: any) {
            console.error('Error sending message history:', sendError)
            // Не закрываем соединение при ошибке отправки
          }
        } catch (historyError: any) {
          console.error('Error preparing message history:', historyError)
          // Не закрываем соединение, просто логируем ошибку
        }
        }
        
        // Убеждаемся что соединение не закрывается автоматически
        console.log('✅ WebSocket open handler completed')
        console.log('✅ Connection should remain open. Room:', ws.data.roomId, 'User:', user.id)
        console.log('📝 Handler finished, connection should stay alive')
      } catch (error: any) {
        console.error('WebSocket open error:', error)
        try {
          ws.close(1011, error.message || 'Internal server error')
        } catch (closeError) {
          // Игнорируем ошибки при закрытии
        }
      }
    },

    // Получение сообщения
    async message(ws, message) {
      try {
        const user = ws.data.user
        const roomId = ws.data.roomId
        const isLanding = ws.data.isLanding

        if (!user || (!isLanding && !roomId)) {
          try {
            ws.send(JSON.stringify({ error: 'Unauthorized' }))
          } catch (err) {
            // Игнорируем ошибки отправки
          }
          return
        }

        if (isLanding) {
          try {
            ws.send(JSON.stringify({ error: 'Landing users can only receive updates' }))
          } catch (err) {
            // Игнорируем ошибки отправки
          }
          return
        }

        const data = typeof message === 'string' ? JSON.parse(message) : message

        // Обработка разных типов сообщений
        switch (data.type) {
          case 'message':
            await handleNewMessage(ws, data, user, roomId)
            break

          case 'typing':
            handleTyping(ws, data, user, roomId)
            break

          case 'stop_typing':
            handleStopTyping(ws, data, user, roomId)
            break

          case 'read':
            await handleReadStatus(ws, data, user, roomId)
            break

          default:
            ws.send(JSON.stringify({ error: 'Unknown message type' }))
        }
      } catch (error: any) {
        console.error('WebSocket message error:', error)
        try {
          ws.send(JSON.stringify({ error: error.message || 'Internal server error' }))
        } catch (sendError) {
          console.error('Error sending error message:', sendError)
        }
      }
    },

    // Закрытие соединения
    close(ws, code, message) {
      try {
        const user = ws.data.user
        const roomId = ws.data.roomId
        const isLanding = ws.data.isLanding
        
        // Всегда логируем закрытие для отладки
        console.log('🔌 WebSocket closing:', { 
          roomId, 
          userId: user?.id, 
          code, 
          message: message?.toString() || '(no message)',
          isLanding,
          readyState: ws.readyState,
          timestamp: new Date().toISOString()
        })
        
        // Если это нормальное закрытие без причины сразу после открытия - это проблема
        if (code === 1000 && !message) {
          console.warn('⚠️  Normal closure (1000) without reason - may indicate a problem')
          console.warn('   This usually means the connection was closed intentionally but unexpectedly')
        }

        if (user && (isLanding || roomId)) {
          // Удаляем соединение из комнаты
          const connections = activeConnections.get(roomId)
          if (connections) {
            connections.delete(ws)
            if (connections.size === 0) {
              activeConnections.delete(roomId)
            }
          }

          if (!isLanding) {
          // Удаляем из typing
          const roomTyping = typingUsers.get(roomId)
          if (roomTyping) {
            roomTyping.delete(user.id)
          }

          // Отправляем уведомление об отключении
          const leaveMessage: WebSocketMessage = {
            type: 'user_left',
            room_id: roomId,
            user_id: user.id,
            timestamp: Date.now(),
          }

          broadcastToRoom(roomId, leaveMessage, ws)
          }
        }
      } catch (error: any) {
        console.error('WebSocket close error:', error)
        // Игнорируем ошибки при закрытии
      }
    },
  })

/**
 * Обработка нового сообщения
 */
async function handleNewMessage(
  ws: any,
  data: any,
  user: any,
  roomId: number
) {
  const { content, file_path, file_name, file_type } = data

  if (!content && !file_path) {
    ws.send(JSON.stringify({ error: 'Message content or file is required' }))
    return
  }

  // Сохраняем сообщение в БД
  const [message] = await db`
    INSERT INTO chat_message (room_id, user_id, content, file, file_name, is_edited, is_deleted, created_at, updated_at)
    VALUES (${roomId}, ${user.id}, ${content || ''}, ${file_path || null}, ${file_name || null}, false, false, NOW(), NOW())
    RETURNING *
  `

  // Получаем информацию о пользователе
  const userInfoResult = await db`
    SELECT id, username, first_name, last_name, avatar
    FROM users_user
    WHERE id = ${user.id}
  `
  
  const userInfo = userInfoResult[0]
  
  // Создаем объект сообщения с информацией о пользователе
  const messageWithUser = {
    ...message,
    user: userInfo ? {
      id: userInfo.id,
      username: userInfo.username || '',
      first_name: userInfo.first_name || '',
      last_name: userInfo.last_name || '',
      avatar: userInfo.avatar || null
    } : {
      id: user.id,
      username: user.username || 'Unknown',
      first_name: '',
      last_name: '',
      avatar: null
    }
  }
  
  console.log('📨 Message with user:', {
    messageId: message.id,
    hasUser: !!messageWithUser.user,
    user: messageWithUser.user
  })

  // Отправляем сообщение всем в комнате (включая отправителя)
  const wsMessage: WebSocketMessage = {
    type: 'message',
    room_id: roomId,
    user_id: user.id,
    message: messageWithUser,
    timestamp: Date.now(),
  }

  console.log('📤 Broadcasting message to room:', roomId, 'messageId:', message.id, 'userId:', user.id)
  console.log('📤 Sender WebSocket state:', ws.readyState, '(1=OPEN)')
  console.log('📤 Active connections count:', activeConnections.get(roomId)?.size || 0)
  
  // НЕ передаем ws как exclude - отправитель должен получить свое сообщение обратно
  broadcastToRoom(roomId, wsMessage)

  // Отправляем подтверждение отправителю
  try {
    ws.send(JSON.stringify({
      type: 'message_sent',
      message_id: message.id,
      timestamp: Date.now(),
    }))
    console.log('✅ Confirmation sent to sender')
  } catch (err: any) {
    console.error('❌ Error sending confirmation:', err.message || err)
  }

  // --- ЛОГИКА AI АССИСТЕНТА ---
  if (ws.data.roomType === 'ai') {
    await handleAIResponse(ws, content, roomId)
  }
}

/**
 * Генерация и отправка ответа от AI
 */
async function handleAIResponse(ws: any, userPrompt: string, roomId: number) {
  const AI_USER_ID = 32; // Наш системный AI Assistant
  
  try {
    // 1. Показываем статус "AI печатает"
    const typingMessage: WebSocketMessage = {
      type: 'typing',
      room_id: roomId,
      user_id: AI_USER_ID,
      timestamp: Date.now(),
    }
    broadcastToRoom(roomId, typingMessage)

    // 2. Получаем историю сообщений для контекста (последние 10)
    const history = await db`
      SELECT content, user_id 
      FROM chat_message 
      WHERE room_id = ${roomId} 
      ORDER BY created_at DESC 
      LIMIT 10
    `
    
    const formattedHistory = history.reverse().map((msg: any) => ({
      role: msg.user_id === AI_USER_ID ? "model" : "user",
      parts: [{ text: msg.content }]
    }))

    // 3. Генерируем ответ (используем стриминг для эффекта "печати")
    let fullResponse = "";
    
    // Создаем "пустое" сообщение в базе, которое будем обновлять (или просто отправим финальное)
    // Для простоты сначала отправим финальное, но через сокет будем стримить текст
    
    const stream = streamAIResponse(userPrompt, formattedHistory);
    
    // Отправляем начальный кадр стриминга
    ws.send(JSON.stringify({
      type: 'ai_stream_start',
      room_id: roomId,
      user_id: AI_USER_ID,
    }))

    for await (const chunk of stream) {
      fullResponse += chunk;
      // Стримим кусочек фронтенду
      broadcastToRoom(roomId, {
        type: 'ai_stream_chunk',
        room_id: roomId,
        user_id: AI_USER_ID,
        chunk: chunk
      } as any)
    }

    // 4. Сохраняем финальное сообщение в БД
    const [aiMsg] = await db`
      INSERT INTO chat_message (room_id, user_id, content, is_edited, is_deleted, created_at, updated_at)
      VALUES (${roomId}, ${AI_USER_ID}, ${fullResponse}, false, false, NOW(), NOW())
      RETURNING *
    `

    // Получаем инфо о боте
    const [botInfo] = await db`
      SELECT id, username, first_name, last_name, avatar
      FROM users_user
      WHERE id = ${AI_USER_ID}
    `

    const aiMessageWithUser = {
      ...aiMsg,
      user: botInfo,
    }

    // 5. Отправляем финальное сообщение и убираем статус печати
    broadcastToRoom(roomId, {
      type: 'stop_typing',
      room_id: roomId,
      user_id: AI_USER_ID,
      timestamp: Date.now(),
    })

    broadcastToRoom(roomId, {
      type: 'message',
      room_id: roomId,
      user_id: AI_USER_ID,
      message: aiMessageWithUser,
      timestamp: Date.now(),
    })

  } catch (error) {
    console.error('AI Response Error:', error);
    broadcastToRoom(roomId, {
      type: 'stop_typing',
      room_id: roomId,
      user_id: AI_USER_ID,
      timestamp: Date.now(),
    })
  }
}

/**
 * Обработка статуса "печатает"
 */
function handleTyping(ws: any, data: any, user: any, roomId: number) {
  if (!typingUsers.has(roomId)) {
    typingUsers.set(roomId, new Map())
  }

  const roomTyping = typingUsers.get(roomId)!
  roomTyping.set(user.id, Date.now())

  // Отправляем всем в комнате (кроме отправителя)
  const typingMessage: WebSocketMessage = {
    type: 'typing',
    room_id: roomId,
    user_id: user.id,
    timestamp: Date.now(),
  }

  broadcastToRoom(roomId, typingMessage, ws)

  // Автоматически удаляем через 3 секунды
  setTimeout(() => {
    const currentTyping = typingUsers.get(roomId)
    if (currentTyping && currentTyping.get(user.id) === roomTyping.get(user.id)) {
      currentTyping.delete(user.id)
      handleStopTyping(ws, data, user, roomId)
    }
  }, 3000)
}

/**
 * Обработка остановки печатания
 */
function handleStopTyping(ws: any, data: any, user: any, roomId: number) {
  const roomTyping = typingUsers.get(roomId)
  if (roomTyping) {
    roomTyping.delete(user.id)
  }

  const stopTypingMessage: WebSocketMessage = {
    type: 'stop_typing',
    room_id: roomId,
    user_id: user.id,
    timestamp: Date.now(),
  }

  broadcastToRoom(roomId, stopTypingMessage, ws)
}

/**
 * Обработка статуса прочтения
 */
async function handleReadStatus(ws: any, data: any, user: any, roomId: number) {
  const { message_id } = data

  if (!message_id) {
    return
  }

  // Сохраняем статус прочтения в БД
  await db`
    INSERT INTO chat_messagereadstatus (message_id, user_id, read_at)
    VALUES (${message_id}, ${user.id}, NOW())
    ON CONFLICT (message_id, user_id) DO NOTHING
  `

  // Отправляем подтверждение
  ws.send(JSON.stringify({
    type: 'read_confirmed',
    message_id,
    timestamp: Date.now(),
  }))
}

/**
 * Отправка сообщения всем в комнате
 */
function broadcastToRoom(roomId: number, message: WebSocketMessage, exclude?: any) {
  const connections = activeConnections.get(roomId)
  if (!connections) {
    console.warn('⚠️  No active connections for room:', roomId)
    return
  }

  const messageStr = JSON.stringify(message)
  let sentCount = 0

  connections.forEach((ws) => {
    // Исключаем только если явно указан exclude И это не тот же WebSocket
    if (exclude && ws === exclude) {
      return // Пропускаем исключенное соединение
    }
    
    // В Elysia WebSocket нет readyState, просто пытаемся отправить и ловим ошибки
    try {
      ws.send(messageStr)
      sentCount++
    } catch (error: any) {
      // Если ошибка отправки, удаляем соединение из списка
      console.warn('⚠️  Error sending message, removing connection:', error.message || error)
      connections.delete(ws)
      if (connections.size === 0) {
        activeConnections.delete(roomId)
      }
    }
  })
  
  console.log(`📡 Broadcasted to ${sentCount} connections in room ${roomId}`)
}

