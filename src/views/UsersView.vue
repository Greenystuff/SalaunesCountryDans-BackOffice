<template>
  <div class="users-view">
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h4">Gestion des utilisateurs</h1>
      <v-btn
        color="primary"
        prepend-icon="mdi-account-plus"
        @click="openUserDialog()"
        :disabled="loading"
      >
        Nouveau Manager
      </v-btn>
    </div>

    <!-- Tableaux des managers -->
    <div class="my-4">
      <v-card>
        <div class="d-flex justify-space-between align-center px-4 pt-3">
          <div class="d-flex align-center">
            <v-card-title class="px-0">Liste des managers</v-card-title>
            <v-chip class="ml-4" color="primary">{{ users.length || 0 }}</v-chip>
          </div>
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Rechercher"
            single-line
            hide-details
            density="compact"
            class="search-field"
            style="max-width: 250px"
          />
        </div>

        <v-card-text>
          <v-data-table
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="users"
            :search="search"
            item-value="id"
            class="elevation-1 my-2"
            :loading="loading"
            no-data-text="Aucun manager trouvé"
            loading-text="Chargement des utilisateurs..."
          >
            <!-- Status column -->
            <template v-slot:item.isActive="{ item }">
              <v-chip
                :color="item.isActive ? 'success' : 'error'"
                size="small"
                :text="item.isActive ? 'Actif' : 'Inactif'"
              />
            </template>

            <!-- Role column -->
            <template v-slot:item.role="{ item }">
              <v-chip
                v-if="item.role === 'manager'"
                color="primary"
                size="small"
                text="Manager"
              />
              <v-chip
                v-else
                color="secondary"
                size="small"
                :text="item.role"
              />
            </template>

            <!-- Last login column -->
            <template v-slot:item.lastLogin="{ item }">
              <span v-if="item.lastLogin">{{ formatDate(item.lastLogin) }}</span>
              <span v-else class="text-disabled">Jamais</span>
            </template>

            <!-- Permissions column -->
            <template v-slot:item.permissions="{ item }">
              <div class="d-flex flex-wrap gap-1">
                <v-chip
                  v-for="(perm, i) in item.permissions?.slice(0, 2)"
                  :key="i"
                  size="x-small"
                  color="info"
                  class="mr-1"
                >
                  {{ formatPermission(perm) }}
                </v-chip>
                <v-chip
                  v-if="item.permissions && item.permissions.length > 2"
                  size="x-small"
                  variant="outlined"
                  :text="`+${item.permissions.length - 2}`"
                  @click="showAllPermissions(item)"
                />
              </div>
            </template>

            <!-- Actions column -->
            <template v-slot:item.actions="{ item }">
              <v-tooltip location="top" text="Modifier">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    color="primary"
                    @click="openUserDialog(item)"
                    class="mr-1"
                  />
                </template>
              </v-tooltip>

              <v-tooltip location="top" text="Réinitialiser le mot de passe">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-lock-reset"
                    variant="text"
                    size="small"
                    color="warning"
                    @click="openPasswordDialog(item)"
                    class="mr-1"
                  />
                </template>
              </v-tooltip>

              <v-tooltip location="top" text="Supprimer">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    color="error"
                    @click="confirmDelete(item)"
                  />
                </template>
              </v-tooltip>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </div>

    <!-- Dialogues importés en tant que composants -->
    <UserFormDialog
      v-model="userDialog"
      :userData="editedUser"
      :availablePermissions="availablePermissions"
      :loading="saving"
      @save="saveUser"
      @validate="updateFormValidity"
    />

    <PasswordResetDialog
      v-model="passwordDialog"
      :user="passwordUser"
      :loading="saving"
      @reset="resetUserPassword"
    />

    <DeleteConfirmationDialog
      v-model="deleteDialog"
      :user="deleteUser"
      :loading="deleting"
      @delete="deleteUserConfirmed"
    />

    <PermissionsDialog
      v-model="permissionsDialog"
      :user="permissionsUser"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserManagementService } from '@/services/userManagementService'
import type { User, UserCreatePayload, UserUpdatePayload } from '@/types/user'
import { useUserStore } from '@/stores/user'
import { usePermissionsFormatter } from '@/composables/usePermissionsFormatter'
import { formatDate } from '@/utils/dateFormatter'

// Importer les composants
import UserFormDialog from '@/components/users/UserFormDialog.vue'
import PasswordResetDialog from '@/components/users/PasswordResetDialog.vue'
import DeleteConfirmationDialog from '@/components/users/DeleteConfirmationDialog.vue'
import PermissionsDialog from '@/components/users/PermissionsDialog.vue'

const userService = useUserManagementService()
const userStore = useUserStore()

// Data table
const users = ref<User[]>([])
const loading = ref(false)
const search = ref('')
const itemsPerPage = ref(10)

const headers = [
  { title: 'Nom', key: 'lastName' },
  { title: 'Prénom', key: 'firstName' },
  { title: 'Email', key: 'email' },
  { title: 'Statut', key: 'isActive', width: '100px' },
  { title: 'Rôle', key: 'role', width: '100px' },
  { title: 'Permissions', key: 'permissions', width: '150px' },
  { title: 'Dernière connexion', key: 'lastLogin', width: '150px' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: '120px' }
]

// État des dialogues
const userDialog = ref(false)
const passwordDialog = ref(false)
const deleteDialog = ref(false)
const permissionsDialog = ref(false)

// États des opérations
const saving = ref(false)
const deleting = ref(false)
const isFormValid = ref(false)

// Données des formulaires
const defaultUserForm = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  isActive: true,
  permissions: [] as string[]
}

const editedUser = ref({ ...defaultUserForm })
const passwordUser = ref<User | null>(null)
const deleteUser = ref<User | null>(null)
const permissionsUser = ref<User | null>(null)

// Permissions
const availablePermissions = ref<string[]>([])
const { formatPermission } = usePermissionsFormatter(availablePermissions)

// Méthodes
const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await userService.getUsers()
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs', error)
  } finally {
    loading.value = false
  }
}

const loadPermissions = async () => {
  try {
    console.log('Chargement des permissions...')
    
    // Si les permissions ne peuvent pas être chargées depuis le serveur, on utilise des valeurs par défaut
    try {
      const perms = await userService.getAvailablePermissions()
      console.log('Permissions récupérées du serveur:', perms)
      availablePermissions.value = perms
    } catch (e) {
      console.error('Erreur API lors du chargement des permissions, utilisation des permissions par défaut', e)
      availablePermissions.value = [
        'courses:view', 'courses:edit', 'courses:create', 'courses:delete',
        'members:view', 'members:edit', 'members:create', 'members:delete',
        'dances:view', 'dances:edit', 'dances:create', 'dances:delete',
        'gallery:view', 'gallery:edit', 'gallery:create', 'gallery:delete',
        'notifications:view', 'notifications:send'
      ]
    }
  } catch (error) {
    console.error('Erreur lors du chargement des permissions', error)
    // Fallback avec des valeurs par défaut en cas d'erreur
    availablePermissions.value = [
      'courses:view', 'courses:edit', 'courses:create', 'courses:delete',
      'members:view', 'members:edit', 'members:create', 'members:delete'
    ]
  }
}

// Handlers pour les dialogues
const openUserDialog = (user?: User) => {
  // S'assurer que les permissions sont chargées
  if (availablePermissions.value.length === 0) {
    loadPermissions()
  }
  
  if (user) {
    editedUser.value = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      password: '',
      isActive: user.isActive,
      permissions: user.permissions || []
    }
  } else {
    editedUser.value = { ...defaultUserForm, permissions: [] }
  }
  
  userDialog.value = true
}

const updateFormValidity = (isValid: boolean) => {
  isFormValid.value = isValid
}

const saveUser = async (userData: UserCreatePayload | UserUpdatePayload, isNew: boolean) => {
  saving.value = true
  
  try {
    if (!isNew) {
      await userService.updateUser(editedUser.value.id, userData as UserUpdatePayload)
    } else {
      await userService.createUser(userData as UserCreatePayload)
    }
    
    await loadUsers()
    userDialog.value = false
  } catch (error: any) {
    alert(`Erreur: ${error.message || 'Une erreur est survenue'}`)
  } finally {
    saving.value = false
  }
}

const openPasswordDialog = (user: User) => {
  passwordUser.value = user
  passwordDialog.value = true
}

const resetUserPassword = async (userId: string, newPassword: string) => {
  saving.value = true
  try {
    await userService.resetPassword(userId, { newPassword })
    passwordDialog.value = false
    alert('Mot de passe réinitialisé avec succès')
  } catch (error: any) {
    alert(`Erreur: ${error.message || 'Une erreur est survenue'}`)
  } finally {
    saving.value = false
  }
}

const confirmDelete = (user: User) => {
  deleteUser.value = user
  deleteDialog.value = true
}

const deleteUserConfirmed = async (userId: string) => {
  deleting.value = true
  try {
    await userService.deleteUser(userId)
    await loadUsers()
    deleteDialog.value = false
  } catch (error: any) {
    alert(`Erreur: ${error.message || 'Une erreur est survenue'}`)
  } finally {
    deleting.value = false
  }
}

const showAllPermissions = (user: User) => {
  permissionsUser.value = user
  permissionsDialog.value = true
}

// Lifecycle hooks
onMounted(async () => {
  try {
    await Promise.all([
      loadPermissions(),
      loadUsers()
    ])
  } catch (error) {
    console.error('Erreur lors de l\'initialisation', error)
  }
})
</script>

<style scoped>
@import '@/assets/users-view.css';
</style>