import { apiService } from './api'

// Types pour les données du dashboard
export interface DashboardStats {
  overview: {
    totalMembers: number
    totalCourses: number
    totalDances: number
    totalImages: number
    totalCheques: number
  }
  members: {
    total: number
    byStatus: {
      preInscrits: number
      inscrits: number
      actifs: number
      inactifs: number
    }
    newThisMonth: number
    withImageRights: number
    topCities: Array<{
      name: string
      count: number
    }>
  }
  courses: {
    total: number
    upcoming: number
    thisWeek: number
    byLevel: Array<{
      level: string
      count: number
    }>
  }
  finances: {
    totalCheques: number
    recus: number
    credites: number
    totalCreditedAmount: number
  }
  dances: {
    total: number
    withVideos: number
    withPdf: number
    byLevel: Array<{
      level: string
      count: number
    }>
  }
  gallery: {
    total: number
    active: number
  }
  evolution: {
    monthlyRegistrations: Array<{
      month: string
      count: number
    }>
  }
  recent: {
    nextCourses: Array<{
      title: string
      level: string
      start: string
      end: string
      teacher?: string
      location?: string
    }>
    recentMembers: Array<{
      name: string
      status: string
      createdAt: string
    }>
  }
}

// Service pour le dashboard
export const dashboardService = {
  // Récupérer les statistiques du dashboard
  async getStats(): Promise<DashboardStats> {
    return apiService.getData<DashboardStats>('/dashboard/stats')
  },
}

// Composable pour Vue 3
export const useDashboard = () => {
  return {
    getStats: dashboardService.getStats,
  }
}
