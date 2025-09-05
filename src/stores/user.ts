import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService, type User } from '@/services/api'
import type { UserProfile } from '@/services/userService'
import { globalWebSocket } from '@/composables/useWebSocket'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isManager = computed(() => user.value?.role === 'manager')
  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName} ${user.value.lastName}`
  })

  const login = async (email: string, password: string) => {
    isLoading.value = true
    try {
      const response = await authService.login(email, password)

      if (response.success && response.data) {
        user.value = response.data.user
        token.value = response.data.token
        localStorage.setItem('token', response.data.token)

        // Se connecter au WebSocket après une authentification réussie
        setTimeout(() => {
          globalWebSocket.connect()
        }, 100) // Petit délai pour s'assurer que le token est bien défini

        return { success: true }
      } else {
        return { success: false, error: response.message || 'Erreur de connexion' }
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error)
      return { success: false, error: error.message || 'Erreur de connexion' }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      // Déconnecter le WebSocket avant la déconnexion API
      globalWebSocket.disconnect()

      // Appeler l'API de déconnexion
      await authService.logout()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      // Nettoyer les données locales
      user.value = null
      token.value = null
      localStorage.removeItem('token')
    }
  }

  const checkAuth = async () => {
    if (!token.value) return false

    try {
      const response = await authService.getProfile()

      if (response.success && response.data) {
        user.value = response.data.user

        // Se connecter au WebSocket si pas encore connecté
        if (!globalWebSocket.isConnected.value && token.value) {
          setTimeout(() => {
            globalWebSocket.connect()
          }, 100)
        }

        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error('Erreur de vérification:', error)
      logout()
      return false
    }
  }

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken()

      if (response.success && response.data) {
        token.value = response.data.token
        localStorage.setItem('token', response.data.token)
        return true
      }
      return false
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error)
      return false
    }
  }

  const updateUser = (userData: Partial<UserProfile>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
    }
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    isAdmin,
    isManager,
    fullName,
    login,
    logout,
    checkAuth,
    refreshToken,
    updateUser,
  }
})
