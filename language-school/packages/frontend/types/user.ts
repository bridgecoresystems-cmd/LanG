export interface User {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string
  role: 'student' | 'teacher' | 'director' | 'admin' | 'head_teacher' | 'merchant'
  phone: string | null
  avatar: string | null
  avatar_url: string | null
  is_active: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface TokenResponse {
  access: string
  refresh: string
}
