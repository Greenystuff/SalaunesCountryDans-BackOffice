import { useUserStore } from '@/stores/user'

export const useDebugPermissions = () => {
  const userStore = useUserStore()

  const debugUserPermissions = () => {
    console.log('🔍 Debug des permissions utilisateur:')
    console.log('- Utilisateur:', userStore.user)
    console.log('- Est admin:', userStore.isAdmin)
    console.log('- Est manager:', userStore.isManager)
    console.log('- Permissions:', userStore.user?.permissions)
    console.log('- Nombre de permissions:', userStore.user?.permissions?.length || 0)
    
    if (userStore.user?.permissions) {
      console.log('- Détail des permissions:')
      userStore.user.permissions.forEach((perm, index) => {
        console.log(`  ${index + 1}. ${perm}`)
      })
    }
  }

  return {
    debugUserPermissions
  }
}
