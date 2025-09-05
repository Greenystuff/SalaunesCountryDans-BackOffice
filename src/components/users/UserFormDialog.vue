<template>
  <v-dialog v-model="dialog" max-width="900px" persistent scrollable>
    <v-card class="user-dialog">
      <v-toolbar color="primary" density="compact" dark>
        <v-toolbar-title>{{ user.id ? "Modifier l'utilisateur" : "Nouvel utilisateur" }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      
      <v-card-text class="pa-4">
        <v-form ref="userForm" @submit.prevent="saveUser">
          <v-container fluid>
            <!-- Informations utilisateur -->
            <v-row>
              <v-col cols="12">
                <h3 class="text-h6 mb-2">Informations personnelles</h3>
                <v-divider class="mb-4"></v-divider>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" md="6" lg="3">
                <v-text-field
                  v-model="user.firstName"
                  label="Prénom"
                  :rules="hasAttemptedSubmit ? [rules.required] : []"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  density="comfortable"
                  bg-color="surface-variant"
                  required
                />
              </v-col>
              <v-col cols="12" md="6" lg="3">
                <v-text-field
                  v-model="user.lastName"
                  label="Nom"
                  :rules="hasAttemptedSubmit ? [rules.required] : []"
                  prepend-inner-icon="mdi-account-outline"
                  variant="outlined"
                  density="comfortable"
                  bg-color="surface-variant"
                  required
                />
              </v-col>
              <v-col cols="12" md="6" lg="3">
                <v-text-field
                  v-model="user.email"
                  label="Email"
                  :rules="hasAttemptedSubmit ? [rules.required, rules.email] : []"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  density="comfortable"
                  bg-color="surface-variant"
                  required
                />
              </v-col>
              <v-col cols="12" md="6" lg="3">
                <v-text-field
                  v-model="user.phone"
                  label="Téléphone"
                  :rules="hasAttemptedSubmit ? [rules.phoneFormat] : []"
                  prepend-inner-icon="mdi-phone"
                  variant="outlined"
                  density="comfortable"
                  bg-color="surface-variant"
                />
              </v-col>
            </v-row>
            
            <v-row v-if="!user.id">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="user.password"
                  label="Mot de passe"
                  :rules="hasAttemptedSubmit ? [rules.required, rules.minLength] : []"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showPassword ? 'text' : 'password'"
                  @click:append-inner="showPassword = !showPassword"
                  variant="outlined"
                  density="comfortable"
                  bg-color="surface-variant"
                  required
                />
              </v-col>
              <v-col cols="12" md="6" v-if="user.id">
                <div class="d-flex align-center h-100">
                  <v-switch
                    v-model="user.isActive"
                    color="success"
                    label="Compte actif"
                    hide-details
                  />
                </div>
              </v-col>
            </v-row>
            
            <!-- Permissions -->
            <v-row class="mt-3">
              <v-col cols="12">
                <h3 class="text-h6 mb-2">Permissions</h3>
                <v-divider class="mb-4"></v-divider>
              </v-col>
            </v-row>
            
            <!-- Navigation par catégories -->
            <v-row>
              <v-col cols="12">
                <v-card variant="flat" class="pa-0">
                  <v-tabs
                    v-model="activePermissionTab"
                    show-arrows
                    bg-color="surface-variant"
                    slider-color="primary"
                    centered
                  >
                    <v-tab 
                      v-for="group in permissionGroups" 
                      :key="group.name" 
                      :value="group.name"
                    >
                      {{ formatPermissionGroup(group.name) }} ({{ group.actions.length }})
                    </v-tab>
                  </v-tabs>
                  
                  <v-card-text class="pa-4">
                    <v-window v-model="activePermissionTab">
                      <v-window-item 
                        v-for="group in permissionGroups" 
                        :key="group.name" 
                        :value="group.name"
                      >
                        <div class="d-flex justify-space-between align-center mb-4">
                          <h4 class="text-subtitle-1">{{ formatPermissionGroup(group.name) }}</h4>
                          <div>
                            <v-btn
                              prepend-icon="mdi-check-all"
                              variant="tonal"
                              density="comfortable"
                              size="small"
                              color="primary"
                              @click="selectAllPermissions(group.name)"
                              class="mr-2"
                            >
                              Tout sélectionner
                            </v-btn>
                            <v-btn
                              prepend-icon="mdi-close-box-multiple"
                              variant="tonal"
                              density="comfortable"
                              size="small"
                              color="error"
                              @click="deselectAllPermissions(group.name)"
                            >
                              Tout désélectionner
                            </v-btn>
                          </div>
                        </div>
                        
                        <v-row class="permission-grid">
                          <v-col 
                            v-for="action in group.actions" 
                            :key="`${group.name}:${action}`"
                            cols="12" sm="6" md="3"
                          >
                            <v-checkbox
                              v-model="user.permissions"
                              :value="`${group.name}:${action}`"
                              :label="formatAction(action)"
                              density="comfortable"
                              color="primary"
                              hide-details
                            ></v-checkbox>
                          </v-col>
                        </v-row>
                      </v-window-item>
                    </v-window>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="error" variant="outlined" prepend-icon="mdi-close" @click="closeDialog" class="mr-2">Annuler</v-btn>
        <v-btn 
          color="primary" 
          prepend-icon="mdi-check" 
          @click="saveUser" 
          :loading="loading"
          :disabled="!isFormValid"
        >
          Enregistrer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive, nextTick } from 'vue'
import type { User, UserCreatePayload, UserUpdatePayload } from '@/types/user'
import { useValidationRules } from '@/composables/useValidationRules'
import { usePermissionsFormatter } from '@/composables/usePermissionsFormatter'
import { usePermissionsManager } from '@/composables/usePermissionsManager'

const props = defineProps<{
  modelValue: boolean;
  userData: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    isActive: boolean;
    permissions: string[];
  };
  availablePermissions: string[];
  loading?: boolean;
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', userData: UserCreatePayload | UserUpdatePayload, isNew: boolean): void;
  (e: 'validate', isValid: boolean): void;
}>()

const { rules } = useValidationRules()
const userForm = ref<any>(null)
const dialog = ref(false)
const showPassword = ref(false)
const isFormValid = ref(false)
const activePermissionTab = ref('')
const hasAttemptedSubmit = ref(false)

// Copie locale des données utilisateur
const user = reactive({
  id: props.userData.id,
  firstName: props.userData.firstName,
  lastName: props.userData.lastName,
  email: props.userData.email,
  phone: props.userData.phone,
  password: props.userData.password,
  isActive: props.userData.isActive,
  permissions: [...props.userData.permissions]
})

// Configuration des permissions
const availablePermissionsRef = ref(props.availablePermissions)

// On utilise les composables pour gérer les permissions
const { 
  formatPermissionGroup, 
  formatAction 
} = usePermissionsFormatter(availablePermissionsRef)

const {
  permissionGroups,
  selectAllPermissions,
  deselectAllPermissions
} = usePermissionsManager(availablePermissionsRef, ref(user))

// Synchronisation des propriétés avec le modèle
watch(() => props.userData, (newValue) => {
  user.id = newValue.id
  user.firstName = newValue.firstName
  user.lastName = newValue.lastName
  user.email = newValue.email
  user.phone = newValue.phone
  user.password = newValue.password
  user.isActive = newValue.isActive
  user.permissions = [...newValue.permissions]
}, { deep: true })

watch(() => props.availablePermissions, (newValue) => {
  availablePermissionsRef.value = newValue
})

watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal
  if (newVal) {
    // Réinitialiser l'état de validation
    hasAttemptedSubmit.value = false
    isFormValid.value = false // S'assurer que le bouton est désactivé à l'ouverture
    
    // Initialiser le premier onglet de permissions s'il y en a
    if (permissionGroups.value.length > 0) {
      activePermissionTab.value = permissionGroups.value[0].name
    }
  }
})

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
})

// Surveiller les champs pour la validation
watch(
  () => [user.firstName, user.lastName, user.email, user.password],
  () => {
    validateForm()
  }
)

// Valider le formulaire
const validateForm = async () => {
  if (!userForm.value) {
    isFormValid.value = false
    return
  }
  
  // Si aucune tentative de soumission n'a été faite, on fait une validation basique
  if (!hasAttemptedSubmit.value) {
    // Validation basique sans afficher les erreurs
    const hasRequiredFields = !!(user.firstName && user.lastName && user.email)
    const hasPassword = !!user.id || !!(user.password && user.password.length >= 8)
    isFormValid.value = hasRequiredFields && hasPassword
    emit('validate', isFormValid.value)
    return
  }
  
  try {
    await nextTick() // Attendre que le DOM soit mis à jour
    const { valid } = await userForm.value.validate()
    isFormValid.value = valid
    
    // Validation supplémentaire pour la création d'utilisateur
    if (!user.id && (!user.password || user.password.length < 8)) {
      isFormValid.value = false
    }
    
    emit('validate', isFormValid.value)
  } catch (error) {
    console.error('Erreur lors de la validation du formulaire:', error)
    isFormValid.value = false
    emit('validate', false)
  }
}

// Méthodes
const closeDialog = () => {
  dialog.value = false
}

const saveUser = async () => {
  // Marquer qu'une tentative de soumission a été faite
  hasAttemptedSubmit.value = true
  
  await validateForm()
  
  if (!isFormValid.value) {
    return
  }
  
  if (user.id) {
    // Modification d'un utilisateur existant
    const updateData: UserUpdatePayload = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      permissions: user.permissions
    }
    emit('save', updateData, false)
  } else {
    // Création d'un nouvel utilisateur
    const createData: UserCreatePayload = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      phone: user.phone,
      permissions: user.permissions
    }
    emit('save', createData, true)
  }
}
</script>

<style scoped>
@import '@/assets/users-view.css';
</style>
