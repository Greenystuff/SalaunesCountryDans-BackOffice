export interface Course {
  _id: string
  title: string
  description?: string
  level: 'Débutant' | 'Novice' | 'Intermédiaire'
  teacher?: string
  location?: string
  start: string | Date
  end: string | Date
  recurrence: 'Aucune' | 'Hebdomadaire' | 'Toutes les 2 semaines' | 'Mensuelle'
  createdAt: string | Date
  updatedAt: string | Date
  duration?: number // Propriété virtuelle calculée
}

export interface CourseForm {
  title: string
  description: string
  level: 'Débutant' | 'Novice' | 'Intermédiaire'
  teacher: string
  location: string
  start: string
  end: string
  recurrence: 'Aucune' | 'Hebdomadaire' | 'Toutes les 2 semaines' | 'Mensuelle'
}

export interface CourseFilters {
  q: string
  level: string | null
  teacher: string | null
  location: string | null
  startDate?: string
  endDate?: string
}

export interface CourseStats {
  total: number
  upcoming: number
  byLevel: Array<{ _id: string; count: number }>
  byTeacher: Array<{ _id: string; count: number }>
}
