import type { Ref } from 'vue'
import { usePermissionsFormatter } from './usePermissionsFormatter'

interface EditedUser {
  permissions: string[]
  [key: string]: any
}

export function usePermissionsManager(
  availablePermissions: Ref<string[]>, 
  editedUser: Ref<EditedUser>
) {
  const { permissionGroups } = usePermissionsFormatter(availablePermissions)
  
  // Basculer toutes les permissions d'un groupe
  const togglePermissionGroup = (groupName: string) => {
    const group = permissionGroups.value.find(g => g.name === groupName)
    if (!group) return
    
    const allPermissions = group.actions.map(action => `${groupName}:${action}`)
    const hasAllPermissions = allPermissions.every(p => editedUser.value.permissions.includes(p))
    
    if (hasAllPermissions) {
      // Remove all permissions for this group
      editedUser.value.permissions = editedUser.value.permissions.filter(p => !p.startsWith(`${groupName}:`))
    } else {
      // Add all permissions for this group
      const currentPermissions = new Set(editedUser.value.permissions)
      allPermissions.forEach(p => currentPermissions.add(p))
      editedUser.value.permissions = Array.from(currentPermissions)
    }
  }

  // Sélectionner toutes les permissions d'un groupe
  const selectAllPermissions = (groupName: string) => {
    const group = permissionGroups.value.find(g => g.name === groupName)
    if (!group) return
    
    const allPermissions = group.actions.map(action => `${groupName}:${action}`)
    const currentPermissions = new Set(editedUser.value.permissions)
    
    allPermissions.forEach(p => currentPermissions.add(p))
    editedUser.value.permissions = Array.from(currentPermissions)
  }

  // Désélectionner toutes les permissions d'un groupe
  const deselectAllPermissions = (groupName: string) => {
    editedUser.value.permissions = editedUser.value.permissions.filter(p => !p.startsWith(`${groupName}:`))
  }

  return {
    permissionGroups,
    togglePermissionGroup,
    selectAllPermissions,
    deselectAllPermissions
  }
}
