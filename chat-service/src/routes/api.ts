/**
 * REST API роуты для чата
 */

import { Elysia } from 'elysia'
import { db } from '../services/database'
import { verifyToken, getUserFromToken, authPlugin } from '../services/auth'
import { uploadImage, uploadAudio } from '../services/fileUpload'
import type { Message, Room } from '../types/chat'
import { broadcastToAll } from './chat'

export const apiRoutes = new Elysia()
  .use(authPlugin)
  // Вспомогательный роут для системных уведомлений (от Django)
  .post('/system/notify', async ({ body, headers }) => {
    const secret = headers['x-internal-secret']
    // Используем тот же секрет, что и для JWT
    if (secret !== process.env.JWT_SECRET) {
      return { error: 'Unauthorized', statusCode: 401 }
    }

    const { type, data } = body as any
    broadcastToAll({
      type,
      data,
      timestamp: Date.now()
    })

    return { success: true }
  })
  .derive(async ({ headers }) => {
    // Проверка JWT токена
    const authHeader = headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null }
    }

    const token = authHeader.replace('Bearer ', '')
    const payload = await verifyToken(token)
    
    if (!payload) {
      return { user: null }
    }

    return { user: getUserFromToken(payload) }
  })
  .onBeforeHandle(({ user }) => {
    // Проверка аутентификации для всех роутов
    if (!user) {
      return { error: 'Unauthorized', statusCode: 401 }
    }
  })

  // Получить список комнат пользователя
  .get('/rooms', async ({ user }) => {
    if (!user) {
      return { error: 'Unauthorized', statusCode: 401 }
    }
    try {
      const rooms = await db`
        SELECT r.*, 
               COUNT(DISTINCT m.id) as message_count,
               MAX(m.created_at) as last_message_at
        FROM chat_room r
        LEFT JOIN chat_room_participants rp ON r.id = rp.room_id
        LEFT JOIN chat_message m ON r.id = m.room_id AND m.is_deleted = false
        WHERE rp.user_id = ${user.id} AND r.is_active = true
        GROUP BY r.id
        ORDER BY last_message_at DESC NULLS LAST, r.updated_at DESC
      `

      return { rooms }
    } catch (error: any) {
      return { error: error.message, statusCode: 500 }
    }
  })

  // Получить информацию о комнате
  .get('/rooms/:roomId', async ({ params, user }) => {
    if (!user) {
      return { error: 'Unauthorized', statusCode: 401 }
    }
    try {
      const roomId = parseInt(params.roomId)

      // Проверяем доступ
      const isParticipant = await db`
        SELECT COUNT(*) as count FROM chat_room_participants
        WHERE room_id = ${roomId} AND user_id = ${user.id}
      `.then(rows => (rows[0]?.count ?? 0) > 0)

      const [room] = await db`
        SELECT * FROM chat_room WHERE id = ${roomId}
      `

      if (!room) {
        return { error: 'Room not found', statusCode: 404 }
      }

      if (room.is_private && !isParticipant) {
        return { error: 'Access denied', statusCode: 403 }
      }

      // Получаем участников
      const participants = await db`
        SELECT u.id, u.username, u.first_name, u.last_name, u.avatar, u.role
        FROM chat_room_participants rp
        JOIN users_user u ON rp.user_id = u.id
        WHERE rp.room_id = ${roomId}
      `

      return { room: { ...room, participants } }
    } catch (error: any) {
      return { error: error.message, statusCode: 500 }
    }
  })

  // Получить сообщения комнаты
  .get('/rooms/:roomId/messages', async ({ params, query, user }) => {
    if (!user) {
      return { error: 'Unauthorized', statusCode: 401 }
    }
    try {
      const roomId = parseInt(params.roomId)
      const page = parseInt(query.page as string) || 1
      const limit = parseInt(query.limit as string) || 50
      const offset = (page - 1) * limit

      // Проверяем доступ
      const isParticipant = await db`
        SELECT COUNT(*) as count FROM chat_room_participants
        WHERE room_id = ${roomId} AND user_id = ${user.id}
      `.then(rows => (rows[0]?.count ?? 0) > 0)

      const [room] = await db`
        SELECT * FROM chat_room WHERE id = ${roomId}
      `

      if (!room) {
        return { error: 'Room not found', statusCode: 404 }
      }

      if (room.is_private && !isParticipant) {
        return { error: 'Access denied', statusCode: 403 }
      }

      // Получаем сообщения
      const messages = await db`
        SELECT m.*, 
               u.id as user_id, u.username, u.first_name, u.last_name, u.avatar,
               (SELECT COUNT(*) FROM chat_messagereadstatus mrs 
                WHERE mrs.message_id = m.id) as read_count
        FROM chat_message m
        JOIN users_user u ON m.user_id = u.id
        WHERE m.room_id = ${roomId} AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

      // Получаем общее количество
      const [count] = await db`
        SELECT COUNT(*) as total FROM chat_message
        WHERE room_id = ${roomId} AND is_deleted = false
      `

      const total = count ? parseInt(count.total as string) : 0

      return {
        messages: messages.reverse(), // Обратный порядок для хронологии
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error: any) {
      return { error: error.message, statusCode: 500 }
    }
  })

  // Создать сообщение
  .post('/rooms/:roomId/messages', async ({ params, body, user }) => {
    if (!user) {
      return { error: 'Unauthorized', statusCode: 401 }
    }
    try {
      const roomId = parseInt(params.roomId)
      const { content, file_path, file_name } = body as any

      if (!content && !file_path) {
        return { error: 'Message content or file is required', statusCode: 400 }
      }

      // Проверяем доступ
      const isParticipant = await db`
        SELECT COUNT(*) as count FROM chat_room_participants
        WHERE room_id = ${roomId} AND user_id = ${user.id}
      `.then(rows => (rows[0]?.count ?? 0) > 0)

      const [room] = await db`
        SELECT * FROM chat_room WHERE id = ${roomId} AND is_active = true
      `

      if (!room) {
        return { error: 'Room not found', statusCode: 404 }
      }

      if (room.is_private && !isParticipant) {
        return { error: 'Access denied', statusCode: 403 }
      }

      // Сохраняем сообщение
      const [message] = await db`
        INSERT INTO chat_message (room_id, user_id, content, file, file_name, is_edited, is_deleted, created_at, updated_at)
        VALUES (${roomId}, ${user.id}, ${content || ''}, ${file_path || null}, ${file_name || null}, false, false, NOW(), NOW())
        RETURNING *
      `

      // Получаем информацию о пользователе
      const [userInfo] = await db`
        SELECT id, username, first_name, last_name, avatar
        FROM users_user
        WHERE id = ${user.id}
      `

      return {
        message: {
          ...message,
          user: userInfo || null,
        },
      }
    } catch (error: any) {
      return { error: error.message, statusCode: 500 }
    }
  })

  // Редактировать сообщение
  .patch('/messages/:messageId', async ({ params, body, user }) => {
    if (!user) {
      return { error: 'Unauthorized', statusCode: 401 }
    }
    try {
      const messageId = parseInt(params.messageId)
      const { content } = body as any

      if (!content) {
        return { error: 'Content is required', statusCode: 400 }
      }

      // Проверяем, что сообщение принадлежит пользователю
      const [message] = await db`
        SELECT * FROM chat_message WHERE id = ${messageId} AND user_id = ${user.id}
      `

      if (!message) {
        return { error: 'Message not found or access denied', statusCode: 404 }
      }

      // Обновляем сообщение
      const [updated] = await db`
        UPDATE chat_message
        SET content = ${content}, is_edited = true, updated_at = NOW()
        WHERE id = ${messageId}
        RETURNING *
      `

      return { message: updated }
    } catch (error: any) {
      return { error: error.message, statusCode: 500 }
    }
  })

  // Удалить сообщение
  .delete('/messages/:messageId', async ({ params, user }) => {
    if (!user) {
      return { error: 'Unauthorized', statusCode: 401 }
    }
    try {
      const messageId = parseInt(params.messageId)

      // Проверяем, что сообщение принадлежит пользователю
      const [message] = await db`
        SELECT * FROM chat_message WHERE id = ${messageId} AND user_id = ${user.id}
      `

      if (!message) {
        return { error: 'Message not found or access denied', statusCode: 404 }
      }

      // Мягкое удаление
      await db`
        UPDATE chat_message
        SET is_deleted = true, updated_at = NOW()
        WHERE id = ${messageId}
      `

      return { success: true }
    } catch (error: any) {
      return { error: error.message, statusCode: 500 }
    }
  })

  // Загрузить файл (фото или аудио)
  .post('/upload', async ({ user, request }) => {
    if (!user) {
      return { error: 'Unauthorized', statusCode: 401 }
    }
    try {
      console.log('📤 Upload request received')
      console.log('📤 Content-Type:', request.headers.get('content-type'))
      
      // В Elysia нужно использовать request.formData() напрямую для multipart/form-data
      const formData = await request.formData()
      
      const file = formData.get('file') as File | null
      const roomIdStr = formData.get('room_id') as string | null
      const fileType = formData.get('file_type') as string | null
      
      console.log('📤 Parsed form data:', {
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        roomId: roomIdStr,
        fileTypeParam: fileType,
        formDataKeys: Array.from(formData.keys())
      })

      if (!file) {
        return { error: 'File is required', statusCode: 400 }
      }
      
      if (!roomIdStr) {
        return { error: 'room_id is required', statusCode: 400 }
      }
      
      const roomId = parseInt(roomIdStr)
      if (isNaN(roomId)) {
        return { error: 'Invalid room_id', statusCode: 400 }
      }
      
      if (!fileType || (fileType !== 'image' && fileType !== 'audio')) {
        return { error: 'file_type must be "image" or "audio"', statusCode: 400 }
      }

      // Проверяем, что file это действительно File объект
      if (!(file instanceof File)) {
        console.error('❌ File is not a File instance:', typeof file, file)
        return { error: 'Invalid file object', statusCode: 400 }
      }

      // Проверяем доступ к комнате
      const isParticipant = await db`
        SELECT COUNT(*) as count FROM chat_room_participants
        WHERE room_id = ${roomId} AND user_id = ${user.id}
      `.then(rows => (rows[0]?.count ?? 0) > 0)

      const [room] = await db`
        SELECT * FROM chat_room WHERE id = ${roomId} AND is_active = true
      `

      if (!room) {
        return { error: 'Room not found', statusCode: 404 }
      }

      if (room.is_private && !isParticipant) {
        return { error: 'Access denied', statusCode: 403 }
      }

      // Загружаем файл
      let uploadResult
      if (fileType === 'image' && user) {
        uploadResult = await uploadImage(file, roomId, user.id)
      } else if (fileType === 'audio' && user) {
        uploadResult = await uploadAudio(file, roomId, user.id)
      } else {
        return { error: 'Invalid file type. Use "image" or "audio"', statusCode: 400 }
      }

      if (!uploadResult.success) {
        console.error('❌ Upload failed:', uploadResult.error)
        return { error: uploadResult.error, statusCode: 400 }
      }

      console.log('✅ File uploaded successfully:', {
        file_path: uploadResult.file_path,
        file_name: uploadResult.file_name,
        file_size: uploadResult.file_size
      })

      return {
        file_path: uploadResult.file_path,
        file_name: uploadResult.file_name,
        file_size: uploadResult.file_size,
        file_type: fileType
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error)
      return { error: error.message, statusCode: 500 }
    }
  })

  // Отметить сообщения как прочитанные
  .post('/rooms/:roomId/read', async ({ params, user }) => {
    if (!user) {
      return { error: 'Unauthorized', statusCode: 401 }
    }
    try {
      const roomId = parseInt(params.roomId)

      // Отмечаем все непрочитанные сообщения в комнате как прочитанные
      await db`
        INSERT INTO chat_messagereadstatus (message_id, user_id, read_at)
        SELECT m.id, ${user.id}, NOW()
        FROM chat_message m
        WHERE m.room_id = ${roomId}
          AND m.user_id != ${user.id}
          AND m.is_deleted = false
          AND NOT EXISTS (
            SELECT 1 FROM chat_messagereadstatus mrs
            WHERE mrs.message_id = m.id AND mrs.user_id = ${user.id}
          )
      `

      return { success: true }
    } catch (error: any) {
      return { error: error.message, statusCode: 500 }
    }
  })

