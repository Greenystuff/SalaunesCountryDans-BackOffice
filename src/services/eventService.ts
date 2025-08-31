import { apiService } from '@/services/api'
import type { CourseEvent, EventFormData, EventFilters, EventStats } from '@/types/events'

export const eventService = {
  // Récupérer tous les événements
  async getAllEvents(filters?: EventFilters): Promise<CourseEvent[]> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }

    const response = await apiService.get<CourseEvent[]>(`/events?${params.toString()}`)
    return response.data || []
  },

  // Récupérer un événement par ID
  async getEventById(id: string): Promise<CourseEvent> {
    const response = await apiService.get<CourseEvent>(`/events/${id}`)
    return response.data!
  },

  // Créer un nouvel événement
  async createEvent(eventData: EventFormData): Promise<CourseEvent> {
    const { tagsString, ...eventPayload } = eventData
    const payload = {
      ...eventPayload,
      tags: tagsString ? tagsString.split(',').map((tag) => tag.trim()) : [],
    }

    const response = await apiService.post<CourseEvent>('/events', payload)
    return response.data!
  },

  // Mettre à jour un événement
  async updateEvent(id: string, eventData: EventFormData): Promise<CourseEvent> {
    const { tagsString, ...eventPayload } = eventData
    const payload = {
      ...eventPayload,
      tags: tagsString ? tagsString.split(',').map((tag) => tag.trim()) : [],
    }

    const response = await apiService.put<CourseEvent>(`/events/${id}`, payload)
    return response.data!
  },

  // Supprimer un événement
  async deleteEvent(id: string): Promise<void> {
    await apiService.delete(`/events/${id}`)
  },

  // Récupérer les statistiques des événements
  async getEventStats(): Promise<EventStats> {
    const response = await apiService.get<EventStats>('/events/stats')
    return response.data!
  },

  // Récupérer les événements pour une période donnée
  async getEventsByDateRange(startDate: string, endDate: string): Promise<CourseEvent[]> {
    const response = await apiService.get<CourseEvent[]>(
      `/events/range?startDate=${startDate}&endDate=${endDate}`,
    )
    return response.data || []
  },

  // Activer/désactiver un événement
  async toggleEventStatus(id: string, isActive: boolean): Promise<CourseEvent> {
    const response = await apiService.put<CourseEvent>(`/events/${id}/status`, { isActive })
    return response.data!
  },

  // Récupérer les événements récurrents
  async getRecurringEvents(): Promise<CourseEvent[]> {
    const response = await apiService.get<CourseEvent[]>('/events/recurring')
    return response.data || []
  },
}
