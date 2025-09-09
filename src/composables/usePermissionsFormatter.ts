import { computed } from 'vue'
import type { Ref } from 'vue'

export function usePermissionsFormatter(availablePermissions: Ref<string[]>) {
  // Formatage des groupes de permissions
  const permissionGroups = computed(() => {
    const groups: Record<string, { name: string; actions: string[] }> = {}

    availablePermissions.value.forEach((perm) => {
      const [resource, action] = perm.split(':')
      if (!groups[resource]) {
        groups[resource] = { name: resource, actions: [] }
      }
      groups[resource].actions.push(action)
    })

    return Object.values(groups)
  })

  // Formatage d'une permission complète
  const formatPermission = (permission: string) => {
    const [resource, action] = permission.split(':')
    return `${formatPermissionGroup(resource)} - ${formatAction(action)}`
  }

  // Formatage du nom d'une ressource
  const formatPermissionGroup = (resource: string) => {
    const resourceMap: Record<string, string> = {
      events: 'Événements',
      members: 'Membres',
      dances: 'Danses',
      gallery: 'Galerie',
      notifications: 'Notifications',
    }
    return resourceMap[resource] || resource
  }

  // Formatage du nom d'une action
  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      view: 'Voir',
      create: 'Créer',
      edit: 'Modifier',
      delete: 'Supprimer',
      send: 'Envoyer',
    }
    return actionMap[action] || action
  }

  // Icône correspondant à une permission
  const getPermissionIcon = (permission: string) => {
    const [resource, action] = permission.split(':')

    // Icônes pour les ressources
    const resourceIcons: Record<string, string> = {
      events: 'mdi-calendar-month',
      members: 'mdi-account-group',
      dances: 'mdi-dance-ballroom',
      gallery: 'mdi-image-multiple',
      notifications: 'mdi-bell',
    }

    // Icônes pour les actions
    const actionIcons: Record<string, string> = {
      view: 'mdi-eye',
      create: 'mdi-plus-circle',
      edit: 'mdi-pencil',
      delete: 'mdi-delete',
      send: 'mdi-send',
    }

    // Si l'action a une icône spécifique, l'utiliser, sinon utiliser l'icône de la ressource
    return actionIcons[action] || resourceIcons[resource] || 'mdi-check-circle'
  }

  return {
    permissionGroups,
    formatPermission,
    formatPermissionGroup,
    formatAction,
    getPermissionIcon,
  }
}
