import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

export const useViewPermissions = (resource: string) => {
  const userStore = useUserStore()

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (permission: string): boolean => {
    // L'admin a toutes les permissions
    if (userStore.isAdmin) {
      return true
    }

    return userStore.user?.permissions?.includes(permission) || false
  }

  // Permissions spécifiques à la ressource
  const canView = computed(() => hasPermission(`${resource}:view`))
  const canCreate = computed(() => hasPermission(`${resource}:create`))
  const canEdit = computed(() => hasPermission(`${resource}:edit`))
  const canDelete = computed(() => hasPermission(`${resource}:delete`))

  // Permissions spéciales
  const canSendNotifications = computed(() => hasPermission('notifications:send'))

  return {
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canSendNotifications
  }
}
