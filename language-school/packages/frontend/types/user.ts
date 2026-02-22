export interface User {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string
  role: 'SUPERUSER' | 'GEN_DIRECTOR' | 'HEAD_ACCOUNTANT' | 'DIRECTOR' | 'HEAD_TEACHER' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'MERCHANT' | 'SALES' | 'RECEPTIONIST' | 'EDITOR'
  phone: string | null
  avatar: string | null
  avatar_url: string | null
  is_active: boolean
  school_id?: number | null
  parent_id?: string | null
  can_export_excel?: boolean
  additional_roles?: string[]
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface TokenResponse {
  access: string
  refresh: string
}
