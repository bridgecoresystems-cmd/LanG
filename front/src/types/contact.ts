export interface ContactMessage {
  id: number
  name: string
  email: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  likes: number
  is_liked?: boolean
  created_at: string
}

export interface ContactMessageCreate {
  name: string
  phone: string
  email: string
  message: string
}

