export interface EventPeriod {
  startDate: string
  startTime: string
  endTime: string
}

export interface CourseEvent {
  _id?: string
  title: string
  description?: string
  level: 'Débutant' | 'Novice' | 'Intermédiaire'
  instructor?: string
  location?: string
  type?: string
  periods: EventPeriod[]
  capacity?: number
  price?: string
  tags?: string[]
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EventFormData {
  title: string
  description: string
  level: 'Débutant' | 'Novice' | 'Intermédiaire'
  instructor: string
  location: string
  type: string
  periods: EventPeriod[]
  capacity: number
  price: string
  tagsString: string
  isActive: boolean
}

export interface EventFilters {
  level?: string
  type?: string
  instructor?: string
  startDate?: string
  endDate?: string
  isActive?: boolean
}

export interface EventStats {
  total: number
  active: number
  byLevel: Record<string, number>
  byType: Record<string, number>
}
