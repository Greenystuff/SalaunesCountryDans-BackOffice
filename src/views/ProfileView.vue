<template>
  <div class="pa-6">
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Mon Profil</h1>
    </div>

    <!-- Chargement initial -->
    <template v-if="loading">
      <v-container fluid class="pa-0">
        <v-row>
          <v-col cols="12" md="8">
            <v-skeleton-loader type="card" />
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="pa-4">
              <div class="d-flex flex-column align-center">
                <v-skeleton-loader type="avatar" class="mb-4" />
                <v-skeleton-loader type="button" class="mb-2" />
                <v-skeleton-loader type="button" />
              </div>
            </v-card>
            <v-skeleton-loader type="card" class="mt-4" />
          </v-col>
        </v-row>
        <v-row class="mt-4">
          <v-col cols="12" md="8">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- Contenu principal -->
    <v-container v-else fluid class="pa-0">
      <v-row>
        <!-- Informations personnelles -->
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title class="pb-2">
              <v-icon class="me-2">mdi-account</v-icon>
              Informations personnelles
            </v-card-title>
            <v-card-text>
              <form @submit.prevent="saveProfile">
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="profileData.firstName" label="Prénom"
                      prepend-inner-icon="mdi-account-outline" :readonly="!editMode" variant="outlined"
                      density="comfortable" autocomplete="given-name" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="profileData.lastName" label="Nom" prepend-inner-icon="mdi-account-outline"
                      :readonly="!editMode" variant="outlined" density="comfortable" autocomplete="family-name" />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="profileData.email" label="Email" prepend-inner-icon="mdi-email-outline"
                      :readonly="!editMode" variant="outlined" density="comfortable" type="email"
                      autocomplete="email" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="profileData.phone" label="Téléphone" prepend-inner-icon="mdi-phone-outline"
                      :readonly="!editMode" variant="outlined" density="comfortable" autocomplete="tel" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="profileData.role" label="Rôle" prepend-inner-icon="mdi-badge-account-outline"
                      readonly variant="outlined" density="comfortable" />
                  </v-col>
                </v-row>
              </form>
            </v-card-text>
            <v-card-actions class="px-6 pb-4">
              <v-btn v-if="!editMode" @click="enableEditMode"
                :color="theme.global.current.value.dark ? 'primary' : 'primary'" prepend-icon="mdi-pencil"
                :disabled="loading">
                Modifier
              </v-btn>
              <template v-else>
                <v-btn type="submit" :loading="saving" :disabled="loading" color="success"
                  prepend-icon="mdi-content-save">
                  Sauvegarder
                </v-btn>
                <v-btn type="button" @click="cancelEdit" variant="outlined" :disabled="saving || loading" class="ms-2"
                  prepend-icon="mdi-cancel">
                  Annuler
                </v-btn>
              </template>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Photo de profil -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="pb-2">
              <v-icon class="me-2">mdi-camera</v-icon>
              Photo de profil
            </v-card-title>
            <v-card-text class="text-center">
              <v-avatar size="150" class="mb-4">
                <v-img :src="avatarSrc" :alt="userStore.fullName || 'Avatar utilisateur'" />
              </v-avatar>
              <div>
                <v-btn color="primary" variant="outlined" prepend-icon="mdi-camera" @click="changeAvatar"
                  :loading="uploadingAvatar" :disabled="loading" class="mb-2">
                  Changer la photo
                </v-btn>
                <br>
                <v-btn v-if="userStore.user?.avatar" color="warning" variant="text" prepend-icon="mdi-refresh"
                  @click="removeAvatar" :loading="uploadingAvatar" :disabled="loading" size="small">
                  Réinitialiser l'avatar
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <!-- Statistiques rapides -->
          <v-card class="mt-4">
            <v-card-title class="pb-2">
              <v-icon class="me-2">mdi-chart-box</v-icon>
              Activité
            </v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between align-center mb-2">
                <span>Dernière connexion</span>
                <v-chip size="small" color="primary">{{ formatDate(profileData.lastLogin) }}</v-chip>
              </div>
              <div class="d-flex justify-space-between align-center mb-2">
                <span>Compte créé le</span>
                <v-chip size="small" color="secondary">{{ formatDate(profileData.createdAt) }}</v-chip>
              </div>
              <div class="d-flex justify-space-between align-center">
                <span>Statut du compte</span>
                <v-chip size="small" :color="profileData.isActive ? 'success' : 'error'">
                  {{ profileData.isActive ? 'Actif' : 'Inactif' }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Section changement de mot de passe -->
      <v-row class="mt-4">
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title class="pb-2">
              <v-icon class="me-2">mdi-lock-outline</v-icon>
              Sécurité
            </v-card-title>
            <form @submit.prevent="changePassword">
              <v-card-text>
                <!-- Champ username caché pour l'accessibilité -->
                <input type="text" :value="profileData.email" autocomplete="username"
                  style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" tabindex="-1" readonly />
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="passwordData.currentPassword" label="Mot de passe actuel"
                      prepend-inner-icon="mdi-lock" :type="showCurrentPassword ? 'text' : 'password'"
                      :append-inner-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append-inner="showCurrentPassword = !showCurrentPassword" variant="outlined"
                      density="comfortable" autocomplete="current-password" />
                  </v-col>
                  <v-col cols="12" sm="6"></v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="passwordData.newPassword" label="Nouveau mot de passe"
                      prepend-inner-icon="mdi-lock-plus" :type="showNewPassword ? 'text' : 'password'"
                      :append-inner-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append-inner="showNewPassword = !showNewPassword" variant="outlined" density="comfortable"
                      autocomplete="new-password" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="passwordData.confirmPassword" label="Confirmer le mot de passe"
                      prepend-inner-icon="mdi-lock-check" :type="showConfirmPassword ? 'text' : 'password'"
                      :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append-inner="showConfirmPassword = !showConfirmPassword" variant="outlined"
                      density="comfortable" :error-messages="passwordError" autocomplete="new-password" />
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-actions class="px-6 pb-4">
                <v-btn type="submit" :loading="changingPassword" :disabled="!canChangePassword || loading"
                  color="warning" prepend-icon="mdi-lock-reset">
                  Changer le mot de passe
                </v-btn>
              </v-card-actions>
            </form>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useUserStore } from '@/stores/user'
import { userService, type UserProfile, type ProfileUpdateData, type PasswordChangeData } from '@/services/userService'
import { useNotifications } from '@/composables/useNotifications'

const theme = useTheme()
const userStore = useUserStore()
const { showSuccess, showError, showWarning } = useNotifications()

// État du formulaire
const editMode = ref(false)
const saving = ref(false)
const changingPassword = ref(false)
const loading = ref(true)
const uploadingAvatar = ref(false)

// Visibilité des mots de passe
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Données du profil
const profileData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  lastLogin: new Date(),
  createdAt: new Date(),
  isActive: true
})

// Données d'origine pour annuler les modifications
const originalProfileData = ref({})

// Données de changement de mot de passe
const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Avatar source
const avatarSrc = computed(() => {
  return userStore.user?.avatar || (userStore.isAdmin ? '/images/avatar.svg' : 'https://randomuser.me/api/portraits/men/85.jpg')
})

// Validation du changement de mot de passe
const passwordError = computed(() => {
  if (passwordData.value.newPassword && passwordData.value.confirmPassword) {
    if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
      return 'Les mots de passe ne correspondent pas'
    }
  }
  return []
})

const canChangePassword = computed(() => {
  return passwordData.value.currentPassword &&
    passwordData.value.newPassword &&
    passwordData.value.confirmPassword &&
    passwordData.value.newPassword === passwordData.value.confirmPassword &&
    passwordData.value.newPassword.length >= 6
})

// Fonctions
const loadProfile = async () => {
  try {
    loading.value = true

    // Récupérer les données réelles du profil
    const response = await userService.getProfile()

    if (response.success && response.data) {
      const userProfile = response.data.user

      profileData.value = {
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        role: userProfile.role === 'admin' ? 'Administrateur' : 'Membre',
        lastLogin: userProfile.lastLogin ? new Date(userProfile.lastLogin) : new Date(),
        createdAt: userProfile.createdAt ? new Date(userProfile.createdAt) : new Date(),
        isActive: userProfile.isActive ?? true
      }

      // Sauvegarder les données d'origine
      originalProfileData.value = { ...profileData.value }
    } else {
      showError('Erreur lors du chargement du profil')
    }
  } catch (error: any) {
    console.error('Erreur lors du chargement du profil:', error)
    showError(error.message || 'Erreur lors du chargement du profil')
  } finally {
    loading.value = false
  }
}

const enableEditMode = () => {
  editMode.value = true
  originalProfileData.value = { ...profileData.value }
}

const cancelEdit = () => {
  editMode.value = false
  profileData.value = originalProfileData.value ? { ...originalProfileData.value } : {} as any
}

const saveProfile = async () => {
  try {
    saving.value = true

    // Préparer les données à envoyer
    const updateData: ProfileUpdateData = {
      firstName: profileData.value.firstName,
      lastName: profileData.value.lastName,
      email: profileData.value.email,
      phone: profileData.value.phone || undefined
    }

    // Appel API pour mettre à jour le profil
    const response = await userService.updateProfile(updateData)

    if (response.success && response.data) {
      // Mettre à jour le store utilisateur
      userStore.updateUser(response.data.user)

      // Mettre à jour les données locales avec conversion de types
      const userData = response.data.user
      profileData.value = {
        ...profileData.value,
        ...userData,
        lastLogin: typeof userData.lastLogin === 'string' ? new Date(userData.lastLogin) : (userData.lastLogin || new Date()),
        createdAt: typeof userData.createdAt === 'string' ? new Date(userData.createdAt) : (userData.createdAt || new Date())
      }
      originalProfileData.value = { ...profileData.value }

      editMode.value = false
      showSuccess('Profil mis à jour avec succès')
    } else {
      showError('Erreur lors de la sauvegarde du profil')
    }
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde:', error)
    showError(error.message || 'Erreur lors de la sauvegarde du profil')
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  if (!canChangePassword.value) return

  try {
    changingPassword.value = true

    // Préparer les données pour l'API
    const passwordChangeData: PasswordChangeData = {
      currentPassword: passwordData.value.currentPassword,
      newPassword: passwordData.value.newPassword
    }

    // Appel API pour changer le mot de passe
    const response = await userService.changePassword(passwordChangeData)

    if (response.success) {
      // Réinitialiser le formulaire
      passwordData.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }

      showSuccess('Mot de passe modifié avec succès')
    } else {
      showError('Erreur lors du changement de mot de passe')
    }
  } catch (error: any) {
    console.error('Erreur lors du changement de mot de passe:', error)

    // Messages d'erreur spécifiques
    if (error.message.includes('current password')) {
      showError('Mot de passe actuel incorrect')
    } else if (error.message.includes('weak')) {
      showWarning('Le nouveau mot de passe est trop faible')
    } else {
      showError(error.message || 'Erreur lors du changement de mot de passe')
    }
  } finally {
    changingPassword.value = false
  }
}

const changeAvatar = () => {
  // Ouvrir un sélecteur de fichiers
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement)?.files?.[0]
    if (file) {
      await uploadAvatar(file)
    }
  }
  input.click()
}

const uploadAvatar = async (file: File) => {
  try {
    uploadingAvatar.value = true

    // Validation du fichier
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      showWarning('Le fichier est trop volumineux. Taille maximum : 5MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showWarning('Type de fichier non supporté. Utilisez JPG, PNG ou WebP')
      return
    }

    // Appel API pour uploader l'avatar
    const response = await userService.uploadAvatar(file)

    if (response.success && response.data) {
      // Mettre à jour l'avatar dans le store
      userStore.updateUser({ avatar: response.data.avatarUrl })

      showSuccess('Photo de profil mise à jour avec succès')
    } else {
      showError('Erreur lors de l\'upload de la photo')
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'upload:', error)
    showError(error.message || 'Erreur lors de l\'upload de la photo')
  } finally {
    uploadingAvatar.value = false
  }
}

const removeAvatar = async () => {
  try {
    uploadingAvatar.value = true

    // Appel API pour supprimer l'avatar
    const response = await userService.removeAvatar()

    if (response.success) {
      // Supprimer l'avatar du store
      userStore.updateUser({ avatar: undefined })

      showSuccess('Avatar réinitialisé avec succès')
    } else {
      showError('Erreur lors de la réinitialisation de l\'avatar')
    }
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'avatar:', error)
    showError(error.message || 'Erreur lors de la réinitialisation de l\'avatar')
  } finally {
    uploadingAvatar.value = false
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Initialisation
onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
/* Styles spécifiques à la page profil */
.v-card {
  border-radius: 12px;
}

.v-avatar {
  border: 4px solid rgb(var(--v-theme-surface-variant));
}

.v-chip {
  font-weight: 500;
}
</style>
