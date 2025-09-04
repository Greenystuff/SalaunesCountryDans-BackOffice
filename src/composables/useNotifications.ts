import { ref } from 'vue'

// Types pour les notifications
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationConfig {
  message: string
  type?: NotificationType
  timeout?: number
  persistent?: boolean
  actions?: Array<{
    text: string
    color?: string
    action: () => void
  }>
}

// État global des notifications
const notifications = ref<
  Array<{
    id: number
    show: boolean
    message: string
    type: NotificationType
    timeout: number
    persistent: boolean
    actions?: Array<{
      text: string
      color?: string
      action: () => void
    }>
  }>
>([])

let notificationIdCounter = 0

/**
 * Composable pour gérer les notifications dans l'application
 * Utilise Vuetify snackbars pour l'affichage
 */
export const useNotifications = () => {
  /**
   * Afficher une notification
   */
  const showNotification = (config: NotificationConfig) => {
    const id = ++notificationIdCounter

    const notification = {
      id,
      show: true,
      message: config.message,
      type: config.type || 'info',
      timeout: config.timeout || (config.type === 'error' ? 8000 : 4000),
      persistent: config.persistent || false,
      actions: config.actions,
    }

    notifications.value.push(notification)

    // Auto-remove après le timeout (sauf si persistent)
    if (!notification.persistent && notification.timeout > 0) {
      setTimeout(() => {
        hideNotification(id)
      }, notification.timeout)
    }

    return id
  }

  /**
   * Masquer une notification spécifique
   */
  const hideNotification = (id: number) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index > -1) {
      notifications.value[index].show = false
      // Supprimer complètement après l'animation
      setTimeout(() => {
        notifications.value.splice(index, 1)
      }, 300)
    }
  }

  /**
   * Masquer toutes les notifications
   */
  const clearAll = () => {
    notifications.value.forEach((n) => (n.show = false))
    setTimeout(() => {
      notifications.value.splice(0)
    }, 300)
  }

  // Raccourcis pour les types courants
  const showSuccess = (message: string, timeout?: number) =>
    showNotification({ message, type: 'success', timeout })

  const showError = (message: string, persistent?: boolean) =>
    showNotification({ message, type: 'error', persistent })

  const showWarning = (message: string, timeout?: number) =>
    showNotification({ message, type: 'warning', timeout })

  const showInfo = (message: string, timeout?: number) =>
    showNotification({ message, type: 'info', timeout })

  /**
   * Afficher une notification avec action(s)
   */
  const showActionNotification = (
    message: string,
    actions: Array<{ text: string; color?: string; action: () => void }>,
    type: NotificationType = 'info',
  ) => {
    return showNotification({
      message,
      type,
      persistent: true, // Les notifications avec actions sont persistantes
      actions,
    })
  }

  return {
    // État
    notifications: notifications.value,

    // Méthodes principales
    showNotification,
    hideNotification,
    clearAll,

    // Raccourcis
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showActionNotification,
  }
}

// Export d'une instance singleton pour un usage global
export const globalNotifications = useNotifications()
