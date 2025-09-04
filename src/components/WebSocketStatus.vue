<template>
  <v-menu location="bottom">
    <template v-slot:activator="{ props }">
      <v-chip v-bind="props" :color="statusColor" size="small" variant="flat" class="websocket-status">
        <v-icon start size="12">
          {{ statusIcon }}
        </v-icon>
        {{ statusText }}
      </v-chip>
    </template>

    <v-card min-width="280" class="websocket-menu">
      <v-card-title class="d-flex align-center">
        <v-icon :color="statusColor" class="me-2">
          {{ statusIcon }}
        </v-icon>
        Connexion Système
      </v-card-title>

      <v-card-text>
        <div class="d-flex flex-column gap-2">
          <div class="d-flex justify-space-between align-center">
            <span class="text-body-2">Statut :</span>
            <v-chip :color="statusColor" size="small" variant="flat">
              {{ statusText }}
            </v-chip>
          </div>

          <div v-if="websocket.reconnectAttempts.value > 0" class="d-flex justify-space-between align-center">
            <span class="text-body-2">Tentatives :</span>
            <span class="text-body-2">{{ websocket.reconnectAttempts }}/5</span>
          </div>

          <div v-if="hasError" class="d-flex flex-column">
            <span class="text-error">Erreur :</span>
            <span class="text-caption text-error">{{ websocket.lastError }}</span>
          </div>

          <v-divider />

          <div class="d-flex gap-2">
            <v-btn v-if="!websocket.isConnected && !websocket.isConnecting" @click.stop="websocket.reconnect"
              color="primary" size="small" variant="outlined" prepend-icon="mdi-refresh">
              Reconnecter
            </v-btn>

            <v-btn v-if="websocket.isConnected" @click.stop="websocket.ping" color="success" size="small"
              variant="outlined" prepend-icon="mdi-pulse">
              Ping
            </v-btn>

            <v-btn @click.stop="showDebugInfo = !showDebugInfo" size="small" variant="text"
              append-icon="mdi-chevron-down">
              Debug
            </v-btn>
          </div>

          <v-expand-transition>
            <div v-show="showDebugInfo">
              <v-divider class="mb-2" />
              <div class="text-caption">
                <div class="d-flex justify-space-between">
                  <span>URL :</span>
                  <span class="text-primary">{{ debugInfo.url }}/ws</span>
                </div>
                <div class="d-flex justify-space-between">
                  <span>Transport :</span>
                  <span>{{ debugInfo.transport }}</span>
                </div>
                <div class="d-flex justify-space-between">
                  <span>Dernière MAJ :</span>
                  <span>{{ lastUpdateTime }}</span>
                </div>
              </div>
            </div>
          </v-expand-transition>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { globalWebSocket } from '@/composables/useWebSocket'

const showDebugInfo = ref(false)
const lastUpdateTime = ref('')

// Utilisation directe de l'instance globale réactive
const websocket = globalWebSocket

// Icône selon le statut
const statusIcon = computed(() => {
  if (websocket.isConnecting.value) return 'mdi-wifi-sync'
  if (websocket.isConnected.value) return 'mdi-wifi'
  const error = websocket.lastError?.value || websocket.lastError
  if (error) return 'mdi-wifi-alert'
  return 'mdi-wifi-off'
})

// Couleur selon le statut
const statusColor = computed(() => {
  if (websocket.isConnecting.value) return 'warning'
  if (websocket.isConnected.value) return 'success'
  const error = websocket.lastError?.value || websocket.lastError
  if (error) return 'error'
  return 'grey'
})

// Texte selon le statut
const statusText = computed(() => {
  if (websocket.isConnecting.value) return 'Connexion...'
  if (websocket.isConnected.value) return 'Connecté'
  const error = websocket.lastError?.value || websocket.lastError
  if (error) return 'Erreur'
  return 'Déconnecté'
})

// Computed pour l'affichage conditionnel de l'erreur
const hasError = computed(() => {
  const error = websocket.lastError?.value || websocket.lastError
  return error && typeof error === 'string' && error.trim() !== ''
})

// Informations de debug
const debugInfo = computed(() => ({
  url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`,
  transport: 'WebSocket Natif (Vite Proxy)'
}))

// Mettre à jour l'heure
const updateTime = () => {
  lastUpdateTime.value = new Date().toLocaleTimeString('fr-FR')
}

let timeInterval: any

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.websocket-status {
  cursor: pointer;
  font-size: 0.75rem;
  height: 24px;
  margin-left: 10px;
}

.gap-2 {
  gap: 8px;
}

.websocket-menu {
  border: 1px solid rgb(var(--v-theme-outline));
}
</style>
