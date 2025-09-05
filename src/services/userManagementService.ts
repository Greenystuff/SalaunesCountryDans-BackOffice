import type { User, UserCreatePayload, UserUpdatePayload, PasswordResetPayload } from '@/types/user'
import { useApi } from './api'

export const useUserManagementService = () => {
  const api = useApi()

  const getUsers = async (): Promise<User[]> => {
    try {
      return await api.getData<User[]>('/admin/users')
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error)
      throw error
    }
  }

  const getUser = async (id: string): Promise<User> => {
    try {
      return await api.getData<User>(`/admin/users/${id}`)
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'utilisateur ${id}:`, error)
      throw error
    }
  }

  const createUser = async (userData: UserCreatePayload): Promise<User> => {
    try {
      return await api.postData<User>('/admin/users', userData)
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error)
      throw error
    }
  }

  const updateUser = async (id: string, userData: UserUpdatePayload): Promise<User> => {
    try {
      return await api.putData<User>(`/admin/users/${id}`, userData)
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'utilisateur ${id}:`, error)
      throw error
    }
  }

  const resetPassword = async (id: string, passwordData: PasswordResetPayload): Promise<void> => {
    try {
      await api.put(`/admin/users/${id}/reset-password`, passwordData)
    } catch (error) {
      console.error(`Erreur lors de la réinitialisation du mot de passe de l'utilisateur ${id}:`, error)
      throw error
    }
  }

  const deleteUser = async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/users/${id}`)
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'utilisateur ${id}:`, error)
      throw error
    }
  }

  const getAvailablePermissions = async (): Promise<string[]> => {
    try {
      return await api.getData<string[]>('/admin/users/permissions')
    } catch (error) {
      console.error('Erreur lors de la récupération des permissions disponibles:', error)
      throw error
    }
  }

  return {
    getUsers,
    getUser,
    createUser,
    updateUser,
    resetPassword,
    deleteUser,
    getAvailablePermissions
  }
}