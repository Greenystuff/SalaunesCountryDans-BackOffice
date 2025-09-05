import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

export function usePermissions() {
  const userStore = useUserStore()

  /**
   * Vérifie si l'utilisateur actuel possède une permission spécifique
   * @param permission - La permission à vérifier (format: 'ressource:action')
   * @returns true si l'utilisateur possède la permission ou est admin
   */
  const hasPermission = (permission: string) => {
    // L'administrateur a toutes les permissions
    if (userStore.isAdmin) {
      return true
    }
    
    // Pour les managers, vérifier les permissions spécifiques
    const user = userStore.user
    if (user && user.role === 'manager' && user.permissions) {
      return user.permissions.includes(permission)
    }
    
    // Par défaut, pas de permission
    return false
  }

  /**
   * Vérifie si l'utilisateur possède au moins une des permissions listées
   * @param permissions - Liste des permissions à vérifier
   * @returns true si l'utilisateur possède au moins une des permissions ou est admin
   */
  const hasAnyPermission = (permissions: string[]) => {
    // L'administrateur a toutes les permissions
    if (userStore.isAdmin) {
      return true
    }
    
    // Pour les managers, vérifier s'ils ont au moins une des permissions
    const user = userStore.user
    if (user && user.role === 'manager' && user.permissions) {
      return permissions.some(perm => user.permissions!.includes(perm))
    }
    
    // Par défaut, pas de permission
    return false
  }

  /**
   * Vérifie si l'utilisateur possède toutes les permissions listées
   * @param permissions - Liste des permissions à vérifier
   * @returns true si l'utilisateur possède toutes les permissions ou est admin
   */
  const hasAllPermissions = (permissions: string[]) => {
    // L'administrateur a toutes les permissions
    if (userStore.isAdmin) {
      return true
    }
    
    // Pour les managers, vérifier s'ils ont toutes les permissions
    const user = userStore.user
    if (user && user.role === 'manager' && user.permissions) {
      return permissions.every(perm => user.permissions!.includes(perm))
    }
    
    // Par défaut, pas de permission
    return false
  }

  /**
   * Vérifie si l'utilisateur a accès à une ressource particulière (toutes actions)
   * @param resource - La ressource à vérifier (ex: 'courses', 'members')
   * @returns true si l'utilisateur a au moins une permission sur cette ressource ou est admin
   */
  const hasResourceAccess = (resource: string) => {
    // L'administrateur a accès à toutes les ressources
    if (userStore.isAdmin) {
      return true
    }
    
    // Pour les managers, vérifier les permissions sur la ressource
    const user = userStore.user
    if (user && user.role === 'manager' && user.permissions) {
      return user.permissions.some(perm => perm.startsWith(`${resource}:`))
    }
    
    // Par défaut, pas d'accès
    return false
  }

  /**
   * Vérifie si l'utilisateur est un administrateur
   */
  const isAdmin = computed(() => userStore.isAdmin)

  /**
   * Vérifie si l'utilisateur est un manager
   */
  const isManager = computed(() => {
    const user = userStore.user
    return user && user.role === 'manager'
  })

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasResourceAccess,
    isAdmin,
    isManager
  }
}
