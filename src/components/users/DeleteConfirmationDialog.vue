<template>
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-toolbar color="error" density="compact" dark>
        <v-toolbar-title>Confirmer la suppression</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      
      <v-card-text class="pa-4">
        <v-alert
          density="comfortable"
          type="warning"
          variant="tonal"
          icon="mdi-alert"
          class="mb-4"
        >
          Vous êtes sur le point de supprimer définitivement cet utilisateur. Cette action est irréversible.
        </v-alert>
        
        <div class="d-flex align-center justify-center pa-4">
          <v-avatar size="64" class="mr-4">
            <v-icon size="40" color="error">mdi-account-remove</v-icon>
          </v-avatar>
          <div class="text-center">
            <h3 class="text-h6">{{ user?.firstName }} {{ user?.lastName }}</h3>
            <p class="text-subtitle-2 text-medium-emphasis">{{ user?.email }}</p>
          </div>
        </div>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="default" variant="outlined" prepend-icon="mdi-close" @click="closeDialog" class="mr-2">Annuler</v-btn>
        <v-btn color="error" prepend-icon="mdi-delete" @click="confirmDelete" :loading="loading">Supprimer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { User } from '@/types/user'

const props = defineProps<{
  modelValue: boolean;
  user: User | null;
  loading?: boolean;
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'delete', userId: string): void;
}>()

const dialog = ref(false)

watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal
})

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
})

const closeDialog = () => {
  dialog.value = false
}

const confirmDelete = () => {
  if (!props.user) return
  emit('delete', props.user.id)
}
</script>

<style scoped>
/* Les styles sont définis dans assets/users-view.css */
</style>
