<template>
  <v-dialog v-model="dialog" max-width="600px">
    <v-card>
      <v-toolbar color="info" density="compact" dark>
        <v-toolbar-title>Liste des permissions</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      
      <v-card-text class="pa-4">
        <div class="d-flex align-center mb-4">
          <v-avatar size="40" class="mr-3" color="primary">
            <span class="text-h6 text-white">{{ user?.firstName?.charAt(0) }}{{ user?.lastName?.charAt(0) }}</span>
          </v-avatar>
          <div>
            <h3 class="text-h6">{{ user?.firstName }} {{ user?.lastName }}</h3>
            <p class="text-subtitle-2 text-medium-emphasis mb-0">{{ user?.email }}</p>
          </div>
        </div>
        
        <v-chip-group>
          <v-chip 
            v-for="perm in user?.permissions" 
            :key="perm"
            color="info"
            variant="tonal"
            class="ma-1"
          >
            {{ formatPermission(perm) }}
          </v-chip>
        </v-chip-group>
        
        <v-list lines="one" class="mt-4">
          <v-list-subheader>Détail des permissions</v-list-subheader>
          <v-list-item 
            v-for="perm in user?.permissions" 
            :key="perm"
            :prepend-icon="getPermissionIcon(perm)"
          >
            <v-list-item-title>{{ formatPermission(perm) }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="primary" prepend-icon="mdi-check" @click="closeDialog">Fermer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { User } from '@/types/user'
import { usePermissionsFormatter } from '@/composables/usePermissionsFormatter'

const props = defineProps<{
  modelValue: boolean;
  user: User | null;
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>()

// Empty ref for permissions formatter compatibility
const availablePermissions = ref<string[]>([])
const { formatPermission, getPermissionIcon } = usePermissionsFormatter(availablePermissions)

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
</script>

<style scoped>
/* Les styles sont définis dans assets/users-view.css */
</style>
