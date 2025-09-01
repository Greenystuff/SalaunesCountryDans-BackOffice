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

          <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

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

  if (!email.value || !password.value) {
    errorMessage.value = 'Veuillez remplir tous les champs'
    return
  }

  const result = await userStore.login(email.value, password.value)

  if (result.success) {
    router.push('/dashboard')
  } else {
    errorMessage.value = result.error || 'Erreur de connexion'
  }
}

const forgotPassword = () => {
  // TODO: Implémenter la récupération de mot de passe
  console.log('Mot de passe oublié')
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
