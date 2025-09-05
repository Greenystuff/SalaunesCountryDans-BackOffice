import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

export const useNavigationPermissions = () => {
  const userStore = useUserStore()

  // Mapping des routes vers les permissions requises
  const routePermissions = {
    '/dashboard': 'dashboard:view',
    '/courses': 'courses:view',
    '/dances': 'dances:view',
    '/gallery': 'gallery:view',
    '/members': 'members:view',
    '/notifications': 'notifications:view'
  }

  // Vérifier si l'utilisateur a accès à une route
  const hasAccessToRoute = (route: string): boolean => {
    // L'admin a accès à tout
    if (userStore.isAdmin) {
      return true
    }

    // Vérifier si l'utilisateur a la permission requise
    const requiredPermission = routePermissions[route as keyof typeof routePermissions]
    if (!requiredPermission) {
      return false
    }

    return userStore.user?.permissions?.includes(requiredPermission) || false
  }

  // Filtrer les éléments de menu selon les permissions
  const filterMenuItems = (menuItems: Array<{ title: string; icon: string; to: string }>) => {
    return menuItems.filter(item => hasAccessToRoute(item.to))
  }

  // Vérifier si l'utilisateur peut accéder à la gestion des utilisateurs
  const canManageUsers = computed(() => {
    return userStore.isAdmin
  })

  return {
    hasAccessToRoute,
    filterMenuItems,
    canManageUsers,
    routePermissions
  }
}
