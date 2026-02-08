export interface Teacher {
  id: number
  user_id?: number
  username: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  avatar: string | null
  avatar_url: string | null
  specialization: string | null
  experience_years: number
  bio: string | null
  hire_date: string | null
  views: number
  likes: number
  is_liked?: boolean
  video: string | null
  video_url: string | null
}
