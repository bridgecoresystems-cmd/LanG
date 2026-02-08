/**
 * Статические файлы (загруженные фото и аудио)
 */

import { Elysia } from 'elysia'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './src/uploads'

export const staticRoutes = new Elysia()
  // Отдача изображений
  .get('/uploads/images/:filename', async ({ params }) => {
    try {
      const filePath = join(UPLOAD_DIR, 'images', params.filename)
      
      if (!existsSync(filePath)) {
        return new Response('File not found', { status: 404 })
      }

      const file = readFileSync(filePath)
      const ext = params.filename.split('.').pop()?.toLowerCase()
      
      let contentType = 'image/jpeg'
      if (ext === 'png') contentType = 'image/png'
      else if (ext === 'webp') contentType = 'image/webp'
      else if (ext === 'gif') contentType = 'image/gif'

      return new Response(file, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000', // 1 год
        },
      })
    } catch (error: any) {
      return new Response(error.message, { status: 500 })
    }
  })

  // Отдача аудио файлов
  .get('/uploads/audio/:filename', async ({ params }) => {
    try {
      const filePath = join(UPLOAD_DIR, 'audio', params.filename)
      
      if (!existsSync(filePath)) {
        return new Response('File not found', { status: 404 })
      }

      const file = readFileSync(filePath)
      const ext = params.filename.split('.').pop()?.toLowerCase()
      
      let contentType = 'audio/mpeg'
      if (ext === 'wav') contentType = 'audio/wav'
      else if (ext === 'ogg') contentType = 'audio/ogg'
      else if (ext === 'webm') contentType = 'audio/webm'

      return new Response(file, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000', // 1 год
          'Accept-Ranges': 'bytes', // Поддержка range requests для стриминга
        },
      })
    } catch (error: any) {
      return new Response(error.message, { status: 500 })
    }
  })

