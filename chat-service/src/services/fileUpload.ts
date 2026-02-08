/**
 * Сервис для загрузки файлов (фото и аудио)
 */

import sharp from 'sharp'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { unlink } from 'node:fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './src/uploads'
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB по умолчанию

// Создаем директории если их нет
const imagesDir = join(UPLOAD_DIR, 'images')
const audioDir = join(UPLOAD_DIR, 'audio')

if (!existsSync(imagesDir)) {
  mkdirSync(imagesDir, { recursive: true })
}
if (!existsSync(audioDir)) {
  mkdirSync(audioDir, { recursive: true })
}

export interface UploadResult {
  success: boolean
  file_path?: string
  file_name?: string
  file_size?: number
  error?: string
}

/**
 * Обработка и сохранение изображения
 */
export async function uploadImage(
  file: File,
  roomId: number,
  userId: number
): Promise<UploadResult> {
  try {
    // Проверка размера
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      }
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File must be an image',
      }
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `room_${roomId}_user_${userId}_${timestamp}.${extension}`
    const filePath = join(imagesDir, fileName)

    // Читаем файл
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Обрабатываем изображение (сжатие, ресайз)
    const processedImage = await sharp(buffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    // Сохраняем файл
    await Bun.write(filePath, processedImage)

    return {
      success: true,
      file_path: `/uploads/images/${fileName}`,
      file_name: file.name,
      file_size: processedImage.length,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    }
  }
}

/**
 * Сохранение аудио файла
 */
export async function uploadAudio(
  file: File,
  roomId: number,
  userId: number
): Promise<UploadResult> {
  try {
    // Проверка размера
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      }
    }

    // Проверка типа файла
    if (!file.type.startsWith('audio/')) {
      return {
        success: false,
        error: 'File must be an audio file',
      }
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'mp3'
    const fileName = `room_${roomId}_user_${userId}_${timestamp}.${extension}`
    const filePath = join(audioDir, fileName)

    // Сохраняем файл как есть (аудио не обрабатываем)
    const arrayBuffer = await file.arrayBuffer()
    await Bun.write(filePath, arrayBuffer)

    return {
      success: true,
      file_path: `/uploads/audio/${fileName}`,
      file_name: file.name,
      file_size: file.size,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to upload audio',
    }
  }
}

/**
 * Удаление файла
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const fullPath = join(UPLOAD_DIR, filePath.replace('/uploads/', ''))
    if (existsSync(fullPath)) {
      await unlink(fullPath)
      return true
    }
    return false
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

