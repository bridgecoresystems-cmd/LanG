/**
 * TypeScript типы для чата
 */

export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  avatar?: string
  role: 'student' | 'teacher' | 'head_teacher' | 'director' | 'admin'
}

export interface Room {
  id: number
  name: string
  room_type: 'course' | 'group' | 'direct' | 'general'
  course_id?: number
  group_id?: number
  is_private: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  room_id: number
  user_id: number
  content: string
  file?: string
  file_name?: string
  file_type?: 'image' | 'audio' | 'document'
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  user?: User
}

export interface MessageReadStatus {
  id: number
  message_id: number
  user_id: number
  read_at: string
}

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'user_joined' | 'user_left' | 'message_edited' | 'message_deleted'
  room_id: number
  user_id?: number
  message?: Message
  content?: string
  timestamp?: number
}

export interface FileUpload {
  file: File
  room_id: number
  user_id: number
  file_type: 'image' | 'audio'
}

