export interface CourseCategory {
  id: number
  image: string | null
  icon: string
  name: string
  description: string | null
  order: number
  is_active: boolean
}

export interface CourseSubCategory {
  id: number
  image: string | null
  category_id: number
  category_name: string
  name: string
  description: string | null
  order: number
  is_active: boolean
}

export interface Course {
  id: number
  image: string | null
  category_id: number
  category_name: string
  subcategory_id: number
  subcategory_name: string
  title: string
  description: string
  duration_weeks: number
  hours_per_week: number
  price: number
  discount_price: number | null
  is_active: boolean
}

