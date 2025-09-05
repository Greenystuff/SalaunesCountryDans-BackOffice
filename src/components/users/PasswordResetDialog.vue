<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-toolbar color="warning" density="compact" dark>
        <v-toolbar-title>Réinitialiser le mot de passe</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      
      <v-card-text class="pa-4">
        <v-alert
          density="comfortable"
          type="info"
          variant="tonal"
          icon="mdi-information"
          class="mb-4"
        >
          Vous allez réinitialiser le mot de passe pour <strong>{{ user?.firstName }} {{ user?.lastName }}</strong>
        </v-alert>
        
        <v-form ref="passwordForm" @submit.prevent="resetPassword">
          <v-text-field
            v-model="password"
            label="Nouveau mot de passe"
            :rules="[rules.required, rules.minLength]"
            prepend-inner-icon="mdi-lock-reset"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :type="showPassword ? 'text' : 'password'"
            @click:append-inner="showPassword = !showPassword"
            variant="outlined"
            bg-color="surface-variant"
            hint="Minimum 8 caractères"
            required
          />
        </v-form>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="default" variant="outlined" prepend-icon="mdi-close" @click="closeDialog" class="mr-2">Annuler</v-btn>
        <v-btn color="warning" prepend-icon="mdi-lock-reset" @click="resetPassword" :loading="loading">Réinitialiser</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { User } from '@/types/user'
import { useValidationRules } from '@/composables/useValidationRules'

const props = defineProps<{
  modelValue: boolean;
  user: User | null;
  loading?: boolean;
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'reset', userId: string, password: string): void;
}>()

const { rules } = useValidationRules()
const passwordForm = ref<any>(null)
const password = ref('')
const showPassword = ref(false)

const dialog = ref(false)

watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal
  if (newVal) {
    // Réinitialiser le mot de passe quand le dialogue s'ouvre
    password.value = ''
  }
})

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
})

const closeDialog = () => {
  dialog.value = false
}

const resetPassword = async () => {
  if (!passwordForm.value || !props.user) return
  
  const { valid } = await passwordForm.value.validate()
  if (!valid) return
  
  emit('reset', props.user.id, password.value)
}
</script>

<style scoped>
/* Les styles sont définis dans assets/users-view.css */
</style>
