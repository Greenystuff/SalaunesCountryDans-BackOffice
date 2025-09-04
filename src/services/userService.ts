import { apiService, type ApiResponse, type User } from './api'

// Types spécifiques au profil utilisateur
export interface ProfileUpdateData {
  firstName: string
  lastName: string
  email: string
  phone?: string
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
}

export interface UserProfile extends User {
  phone?: string
  avatar?: string
  isActive: boolean
}

// Service pour la gestion du profil utilisateur
export const userService = {
  /**
   * Récupérer les données complètes du profil utilisateur
   */
  async getProfile(): Promise<ApiResponse<{ user: UserProfile }>> {
    return apiService.get<{ user: UserProfile }>('/admin/profile')
  },

  /**
   * Mettre à jour les informations du profil
   */
  async updateProfile(data: ProfileUpdateData): Promise<ApiResponse<{ user: UserProfile }>> {
    return apiService.put<{ user: UserProfile }>('/admin/profile', data)
  },

  /**
   * Changer le mot de passe utilisateur
   */
  async changePassword(data: PasswordChangeData): Promise<ApiResponse> {
    return apiService.put('/admin/change-password', data)
  },

  /**
   * Upload d'un nouvel avatar
   */
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData()
    formData.append('avatar', file)

    return apiService.post<{ avatarUrl: string }>('/admin/avatar', formData)
  },

  /**
   * Supprimer l'avatar actuel
   */
  async removeAvatar(): Promise<ApiResponse> {
    return apiService.delete('/admin/avatar')
  },

  /**
   * Récupérer les statistiques d'activité utilisateur
   */
  async getActivityStats(): Promise<
    ApiResponse<{
      lastLogin: string
      createdAt: string
      loginCount: number
      lastActivity: string
    }>
  > {
    return apiService.get('/admin/profile/activity')
  },
}

// Types déjà exportés via les déclarations interface ci-dessus
