import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiService, type ApiResponse } from '@/services/api'
import { globalWebSocket } from './useWebSocket'
import { globalNotifications } from './useNotifications'

// Types pour les notifications persistantes
export interface PersistentNotification {
  _id: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  category: 'system' | 'security' | 'update' | 'reminder' | 'message'
  isRead: boolean
  isPersistent: boolean
  metadata?: { [key: string]: any }
  actionUrl?: string
  actionText?: string
  createdAt: string
  readAt?: string
}

export interface NotificationStats {
  total: number
  unreadCount: number
  hasMore: boolean
}

export interface NotificationQueryOptions {
  page?: number
  limit?: number
  unreadOnly?: boolean
  category?: string
  type?: string
}

/**
 * Composable pour gérer le centre de notifications avec persistance
 */
export const useNotificationCenter = () => {
  // État local
  const notifications = ref<PersistentNotification[]>([])
  const stats = ref<NotificationStats>({
    total: 0,
    unreadCount: 0,
    hasMore: false,
  })
  const loading = ref(false)
  const currentPage = ref(1)
  const currentFilters = ref<NotificationQueryOptions>({})

  // États pour l'UI
  const isDrawerOpen = ref(false)
  const showUnreadOnly = ref(false)
  const selectedCategory = ref<string>('')

  // Computed
  const hasUnreadNotifications = computed(() => stats.value.unreadCount > 0)
  const filteredNotifications = computed(() => {
    let filtered = notifications.value

    if (showUnreadOnly.value) {
      filtered = filtered.filter((n) => !n.isRead)
    }

    if (selectedCategory.value) {
      filtered = filtered.filter((n) => n.category === selectedCategory.value)
    }

    return filtered
  })

  const categoryCounts = computed(() => {
    const counts: Record<string, number> = {}
    notifications.value.forEach((n) => {
      if (!n.isRead) {
        counts[n.category] = (counts[n.category] || 0) + 1
      }
    })
    return counts
  })

  /**
   * Charger les notifications depuis l'API
   */
  const loadNotifications = async (options: NotificationQueryOptions = {}) => {
    try {
      loading.value = true
      currentFilters.value = options

      const queryParams = new URLSearchParams()
      if (options.page) queryParams.append('page', options.page.toString())
      if (options.limit) queryParams.append('limit', options.limit.toString())
      if (options.unreadOnly) queryParams.append('unreadOnly', options.unreadOnly.toString())
      if (options.category) queryParams.append('category', options.category)
      if (options.type) queryParams.append('type', options.type)

      const response: ApiResponse<{
        notifications: PersistentNotification[]
        total: number
        unreadCount: number
        hasMore: boolean
      }> = await apiService.get(`/admin/notifications?${queryParams.toString()}`)

      if (response.success && response.data) {
        // Si c'est la première page, remplacer. Sinon, ajouter.
        if (options.page === 1 || !options.page) {
          notifications.value = response.data.notifications
        } else {
          notifications.value.push(...response.data.notifications)
        }

        stats.value = {
          total: response.data.total,
          unreadCount: response.data.unreadCount,
          hasMore: response.data.hasMore,
        }

        currentPage.value = options.page || 1
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des notifications:', error)
      globalNotifications.showError('Erreur lors du chargement des notifications')
    } finally {
      loading.value = false
    }
  }

  /**
   * Charger plus de notifications (pagination)
   */
  const loadMore = async () => {
    if (!stats.value.hasMore || loading.value) return

    await loadNotifications({
      ...currentFilters.value,
      page: currentPage.value + 1,
    })
  }

  /**
   * Rafraîchir les notifications
   */
  const refresh = async () => {
    currentPage.value = 1
    await loadNotifications(currentFilters.value)
  }

  /**
   * Marquer une notification comme lue
   */
  const markAsRead = async (notificationId: string) => {
    try {
      const response: ApiResponse = await apiService.put(
        `/admin/notifications/${notificationId}/read`,
      )

      if (response.success) {
        // Mettre à jour localement
        const notification = notifications.value.find((n) => n._id === notificationId)
        if (notification && !notification.isRead) {
          notification.isRead = true
          notification.readAt = new Date().toISOString()
          stats.value.unreadCount = Math.max(0, stats.value.unreadCount - 1)
        }

        globalNotifications.showSuccess('Notification marquée comme lue')
      }
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lue:', error)
      globalNotifications.showError('Erreur lors du marquage de la notification')
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  const markAllAsRead = async () => {
    try {
      const response: ApiResponse<{ modifiedCount: number }> = await apiService.put(
        '/admin/notifications/mark-all-read',
      )

      if (response.success) {
        // Mettre à jour localement
        notifications.value.forEach((n) => {
          if (!n.isRead) {
            n.isRead = true
            n.readAt = new Date().toISOString()
          }
        })
        stats.value.unreadCount = 0

        globalNotifications.showSuccess(
          `${response.data?.modifiedCount || 0} notification(s) marquée(s) comme lues`,
        )
      }
    } catch (error) {
      console.error('❌ Erreur lors du marquage global:', error)
      globalNotifications.showError('Erreur lors du marquage des notifications')
    }
  }

  /**
   * Supprimer une notification
   */
  const deleteNotification = async (notificationId: string) => {
    try {
      const response: ApiResponse = await apiService.delete(
        `/admin/notifications/${notificationId}`,
      )

      if (response.success) {
        // Supprimer localement
        const index = notifications.value.findIndex((n) => n._id === notificationId)
        if (index > -1) {
          const notification = notifications.value[index]
          if (!notification.isRead) {
            stats.value.unreadCount = Math.max(0, stats.value.unreadCount - 1)
          }
          notifications.value.splice(index, 1)
          stats.value.total = Math.max(0, stats.value.total - 1)
        }

        globalNotifications.showSuccess('Notification supprimée')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error)
      globalNotifications.showError('Erreur lors de la suppression de la notification')
    }
  }

  /**
   * Supprimer toutes les notifications lues
   */
  const deleteAllRead = async () => {
    try {
      const response: ApiResponse<{ deletedCount: number }> = await apiService.delete(
        '/admin/notifications/read',
      )

      if (response.success) {
        // Supprimer localement
        const deletedCount = response.data?.deletedCount || 0
        notifications.value = notifications.value.filter((n) => !n.isRead)
        stats.value.total = Math.max(0, stats.value.total - deletedCount)

        globalNotifications.showSuccess(`${deletedCount} notification(s) supprimée(s)`)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression des notifications lues:', error)
      globalNotifications.showError('Erreur lors de la suppression des notifications lues')
    }
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  const getUnreadCount = async () => {
    try {
      const response: ApiResponse<{ unreadCount: number }> = await apiService.get(
        '/admin/notifications/unread-count',
      )

      if (response.success && response.data) {
        stats.value.unreadCount = response.data.unreadCount
      }
    } catch (error) {
      console.error('❌ Erreur lors du comptage des non lues:', error)
    }
  }

  /**
   * Gérer les notifications WebSocket en temps réel
   */
  const handleRealtimeNotification = (data: any) => {
    if (data.isRealTimeNotification) {
      // C'est une nouvelle notification persistante
      const newNotification: PersistentNotification = {
        _id: data.id,
        title: data.title,
        message: data.message,
        type: data.type,
        category: data.category,
        isRead: false,
        isPersistent: data.isPersistent,
        metadata: data.metadata,
        actionUrl: data.actionUrl,
        actionText: data.actionText,
        createdAt: data.createdAt,
      }

      // Ajouter au début de la liste
      notifications.value.unshift(newNotification)
      stats.value.unreadCount++
      stats.value.total++

      // Afficher également comme notification toast
      globalNotifications.showNotification({
        message: `${data.title}: ${data.message}`,
        type: data.type,
        timeout: data.type === 'error' ? 8000 : 5000,
        actions: data.actionUrl
          ? [
              {
                text: data.actionText || 'Voir',
                action: () => {
                  if (data.actionUrl.startsWith('/')) {
                    // Route interne
                    window.location.hash = data.actionUrl
                  } else {
                    // URL externe
                    window.open(data.actionUrl, '_blank')
                  }
                },
              },
            ]
          : undefined,
      })
    } else if (data.type === 'notifications_updated') {
      // Mise à jour du compteur
      stats.value.unreadCount = data.unreadCount || 0
    } else if (data.type === 'pending_notifications') {
      // Notifications en attente au moment de la connexion
      stats.value.unreadCount = data.count || 0
      globalNotifications.showInfo(`Vous avez ${data.count} notification(s) en attente`, 6000)
    }
  }

  /**
   * Basculer l'affichage du drawer
   */
  const toggleDrawer = () => {
    isDrawerOpen.value = !isDrawerOpen.value
    if (isDrawerOpen.value && notifications.value.length === 0) {
      loadNotifications({ limit: 20 })
    }
  }

  /**
   * Fermer le drawer
   */
  const closeDrawer = () => {
    isDrawerOpen.value = false
  }

  /**
   * Appliquer des filtres
   */
  const applyFilters = (filters: NotificationQueryOptions) => {
    currentPage.value = 1
    showUnreadOnly.value = filters.unreadOnly || false
    selectedCategory.value = filters.category || ''
    loadNotifications(filters)
  }

  // Setup des événements WebSocket
  onMounted(() => {
    // Charger le compteur initial
    getUnreadCount()

    // S'abonner aux notifications WebSocket
    globalWebSocket.on('notification', handleRealtimeNotification)

    // Rafraîchir périodiquement le compteur
    const interval = setInterval(getUnreadCount, 60000) // Toutes les minutes

    onUnmounted(() => {
      clearInterval(interval)
      globalWebSocket.off('notification', handleRealtimeNotification)
    })
  })

  return {
    // État
    notifications: filteredNotifications,
    stats,
    loading,
    isDrawerOpen,
    showUnreadOnly,
    selectedCategory,
    categoryCounts,

    // Computed
    hasUnreadNotifications,

    // Méthodes
    loadNotifications,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    getUnreadCount,
    toggleDrawer,
    closeDrawer,
    applyFilters,
  }
}
