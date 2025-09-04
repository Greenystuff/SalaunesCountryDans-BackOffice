<template>
  <teleport to="body">
    <div class="global-notifications">
      <v-snackbar v-for="notification in notifications" :key="notification.id" v-model="notification.show"
        :color="getNotificationColor(notification.type)" :timeout="notification.persistent ? -1 : notification.timeout"
        location="top right" variant="elevated" :class="`notification-${notification.type}`" multi-line>
        <div class="d-flex align-center">
          <v-icon :icon="getNotificationIcon(notification.type)" class="me-3" size="small" />
          <span class="notification-message">{{ notification.message }}</span>
        </div>

        <template v-slot:actions>
          <!-- Actions personnalisées si présentes -->
          <template v-if="notification.actions && notification.actions.length > 0">
            <v-btn v-for="(action, index) in notification.actions" :key="index" :color="action.color || 'white'"
              variant="text" size="small" @click="() => { action.action(); hideNotification(notification.id) }"
              class="me-2">
              {{ action.text }}
            </v-btn>
          </template>

          <!-- Bouton de fermeture standard -->
          <v-btn color="white" variant="text" icon="mdi-close" size="small"
            @click="hideNotification(notification.id)" />
        </template>
      </v-snackbar>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotifications, type NotificationType } from '@/composables/useNotifications'

const { notifications, hideNotification } = useNotifications()

// Couleurs pour chaque type de notification selon le thème Vuetify
const getNotificationColor = (type: NotificationType): string => {
  const colors = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }
  return colors[type]
}

// Icônes pour chaque type de notification
const getNotificationIcon = (type: NotificationType): string => {
  const icons = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information'
  }
  return icons[type]
}
</script>

<style scoped>
.global-notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.global-notifications :deep(.v-snackbar) {
  pointer-events: auto;
  margin-bottom: 8px;
}

.notification-message {
  word-break: break-word;
  line-height: 1.4;
}

/* Styles spécifiques par type de notification */
.notification-success :deep(.v-snackbar__wrapper) {
  background-color: rgb(var(--v-theme-success)) !important;
}

.notification-error :deep(.v-snackbar__wrapper) {
  background-color: rgb(var(--v-theme-error)) !important;
}

.notification-warning :deep(.v-snackbar__wrapper) {
  background-color: rgb(var(--v-theme-warning)) !important;
  color: rgb(var(--v-theme-on-warning)) !important;
}

.notification-info :deep(.v-snackbar__wrapper) {
  background-color: rgb(var(--v-theme-info)) !important;
}

/* Animation d'entrée/sortie */
.global-notifications :deep(.v-snackbar) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive */
@media (max-width: 600px) {
  .global-notifications {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .global-notifications :deep(.v-snackbar) {
    margin-bottom: 6px;
  }
}
</style>
