<template>
  <div class="login-container">
    <v-card class="login-card" elevation="8" max-width="400">
      <v-card-title class="text-center text-h4 font-weight-bold pa-6 pb-4">
        Connexion
      </v-card-title>

      <v-card-subtitle class="text-center text-body-1 pa-4 pt-0">
        Accédez à votre espace d'administration
      </v-card-subtitle>

      <v-card-text class="pa-6 pt-0">
        <v-form @submit.prevent="handleLogin" v-model="isFormValid">
          <v-text-field v-model="email" label="Email" type="email" prepend-inner-icon="mdi-email" :rules="emailRules"
            required variant="outlined" class="mb-4" autocomplete="username" />

          <v-text-field v-model="password" label="Mot de passe" type="password" prepend-inner-icon="mdi-lock"
            :rules="passwordRules" required variant="outlined" class="mb-6" autocomplete="current-password" />

          <v-checkbox v-model="rememberMe" label="Se souvenir de moi" color="primary" class="mb-6" hide-details />

          <v-btn type="submit" color="primary" size="large" block :loading="userStore.isLoading"
            :disabled="!isFormValid" class="mb-4">
            <v-icon left>mdi-login</v-icon>
            Se connecter
          </v-btn>

          <!-- Alerte uniquement pour les erreurs critiques nécessitant une attention particulière -->
          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4" closable
            @click:close="errorMessage = ''">
            {{ errorMessage }}
          </v-alert>

          <div class="text-center">
            <v-btn variant="text" color="primary" @click="forgotPassword">
              Mot de passe oublié ?
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Notifications globales -->
    <GlobalNotifications />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotifications } from '@/composables/useNotifications'
import GlobalNotifications from '@/components/GlobalNotifications.vue'

const router = useRouter()
const userStore = useUserStore()
const { showSuccess, showError, showInfo } = useNotifications()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isFormValid = ref(false)
const errorMessage = ref('')

const emailRules = [
  (v: string) => !!v || 'L\'email est requis',
  (v: string) => /.+@.+\..+/.test(v) || 'L\'email doit être valide'
]

const passwordRules = [
  (v: string) => !!v || 'Le mot de passe est requis',
  (v: string) => v.length >= 6 || 'Le mot de passe doit contenir au moins 6 caractères'
]

const handleLogin = async () => {
  errorMessage.value = ''

  // Validation côté client
  if (!email.value || !password.value) {
    showError('Veuillez remplir tous les champs')
    return
  }

  if (!/.+@.+\..+/.test(email.value)) {
    showError('L\'adresse email n\'est pas valide')
    return
  }

  if (password.value.length < 6) {
    showError('Le mot de passe doit contenir au moins 6 caractères')
    return
  }

  try {
    const result = await userStore.login(email.value, password.value)

    if (result.success) {
      showSuccess('Connexion réussie ! Redirection en cours...')

      // Petite pause pour que l'utilisateur voie la notification de succès
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } else {
      // Gestion des erreurs spécifiques
      const error = result.error || 'Erreur de connexion'

      if (error.includes('email') || error.includes('utilisateur') || error.includes('user')) {
        showError('Adresse email non reconnue')
      } else if (error.includes('mot de passe') || error.includes('password') || error.includes('incorrect')) {
        showError('Mot de passe incorrect')
      } else if (error.includes('compte') && error.includes('bloqué')) {
        showError('Compte temporairement bloqué. Réessayez plus tard.')
        errorMessage.value = error // Afficher aussi dans le v-alert pour les erreurs critiques
      } else if (error.includes('réseau') || error.includes('network') || error.includes('timeout')) {
        showError('Problème de connexion. Vérifiez votre connexion internet.')
      } else if (error.includes('serveur') || error.includes('server') || error.includes('500')) {
        showError('Erreur serveur temporaire. Veuillez réessayer.')
      } else {
        showError(error)
      }
    }
  } catch (error: any) {
    console.error('Erreur lors de la connexion:', error)
    showError('Erreur de connexion inattendue. Veuillez réessayer.')
  }
}

const forgotPassword = () => {
  // TODO: Implémenter la récupération de mot de passe
  showInfo('Fonctionnalité de récupération de mot de passe à venir. Contactez un administrateur.')
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
}

/* Responsive */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    max-width: 100%;
  }
}
</style>
