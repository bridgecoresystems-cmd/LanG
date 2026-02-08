export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: 'student' | 'teacher' | 'director' | 'admin' | 'head_teacher' | 'merchant'
  phone: string | null
  avatar: string | null
  avatar_url: string | null
  date_of_birth: string | null
  address: string | null
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface TokenResponse {
  access: string
  refresh: string
}

