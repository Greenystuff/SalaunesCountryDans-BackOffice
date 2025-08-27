<template>
  <LoginLayout>
    <v-form @submit.prevent="handleLogin" v-model="isFormValid">
      <v-text-field v-model="email" label="Email" type="email" prepend-icon="mdi-email" :rules="emailRules" required
        variant="outlined" class="mb-4" autocomplete="username" />

      <v-text-field v-model="password" label="Mot de passe" type="password" prepend-icon="mdi-lock"
        :rules="passwordRules" required variant="outlined" class="mb-6" autocomplete="current-password" />

      <v-checkbox v-model="rememberMe" label="Se souvenir de moi" color="primary" class="mb-6" hide-details />

      <v-btn type="submit" color="primary" size="large" block :loading="userStore.isLoading" :disabled="!isFormValid"
        class="mb-4">
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
  </LoginLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import LoginLayout from '@/layouts/LoginLayout.vue'

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
