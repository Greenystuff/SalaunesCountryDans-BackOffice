<template>
  <!-- Bouton d'ouverture du centre de notifications -->
  <v-menu v-model="isMenuOpen" location="bottom end" :close-on-content-click="false" max-width="450">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="notification-trigger">
        <v-badge :content="unreadCount > 99 ? '99+' : unreadCount.toString()" :model-value="hasUnread" color="error"
          offset-x="5" offset-y="5">
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <!-- Contenu du menu -->
    <v-card class="notification-center" elevation="8">
      <!-- En-tête -->
      <v-card-title class="notification-header">
        <div class="d-flex align-center justify-space-between w-100">
          <div class="d-flex align-center">
            <v-icon class="me-2">mdi-bell</v-icon>
            <span class="text-h6">Notifications</span>
            <v-chip v-if="hasUnread" :color="theme.global.current.value.dark ? 'error' : 'error'" size="small"
              variant="flat" class="ms-2">
              {{ unreadCount }}
            </v-chip>
          </div>

          <!-- Actions en-tête -->
          <div class="d-flex align-center gap-1">
            <v-btn icon="mdi-refresh" size="x-small" variant="text" @click="refresh" :loading="loading"
              :color="theme.global.current.value.dark ? 'grey-lighten-1' : 'grey-darken-2'" />
            <v-btn v-if="hasUnread" icon="mdi-email-open" size="x-small" variant="text" @click="markAllAsRead"
              :color="theme.global.current.value.dark ? 'grey-lighten-1' : 'grey-darken-2'" />
          </div>
        </div>
      </v-card-title>

      <v-divider />

      <!-- Filtres -->
      <v-card-text class="pa-2">
        <div class="d-flex align-center gap-2 mb-2">
          <v-chip-group v-model="selectedFilter" variant="outlined" size="small" color="primary"
            selected-class="text-primary">
            <v-chip value="all" size="small">
              Toutes
              <v-chip v-if="stats.total > 0" size="x-small" color="primary" variant="flat" class="ms-1">
                {{ stats.total }}
              </v-chip>
            </v-chip>
            <v-chip value="unread" size="small">
              Non lues
              <v-chip v-if="hasUnread" size="x-small" color="error" variant="flat" class="ms-1">
                {{ unreadCount }}
              </v-chip>
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Filtres par catégorie -->
        <div v-if="Object.keys(categoryCounts).length > 0" class="d-flex flex-wrap gap-1 mb-2">
          <v-chip v-for="(count, category) in categoryCounts" :key="category" :color="getCategoryColor(category)"
            size="x-small" variant="outlined" :class="{ 'v-chip--selected': selectedCategory === category }"
            @click="toggleCategory(category)">
            {{ getCategoryLabel(category) }}
            <span class="ms-1">{{ count }}</span>
          </v-chip>
        </div>
      </v-card-text>

      <!-- Liste des notifications -->
      <v-divider v-if="notifications.length > 0" />

      <div class="notification-list" style="max-height: 400px; overflow-y: auto;">
        <!-- État de chargement -->
        <div v-if="loading && notifications.length === 0" class="d-flex justify-center align-center pa-4">
          <v-progress-circular indeterminate size="32"
            :color="theme.global.current.value.dark ? 'primary' : 'primary'" />
        </div>

        <!-- Notifications -->
        <template v-else-if="notifications.length > 0">
          <v-list class="pa-0" density="compact">
            <template v-for="notification in notifications" :key="notification._id">
              <v-list-item class="notification-item" :class="{ 'notification-unread': !notification.isRead }"
                @click="handleNotificationClick(notification)">

                <template #prepend>
                  <v-avatar :color="getTypeColor(notification.type)" size="32" class="notification-avatar">
                    <v-icon :icon="getTypeIcon(notification.type)" size="16" color="white" />
                  </v-avatar>
                </template>

                <v-list-item-title class="text-subtitle-2 font-weight-medium notification-title">
                  {{ notification.title }}
                </v-list-item-title>

                <v-list-item-subtitle class="notification-content">
                  <div class="text-body-2 mb-1">{{ notification.message }}</div>
                  <div class="d-flex align-center justify-space-between">
                    <v-chip :color="getCategoryColor(notification.category)" size="x-small" variant="outlined">
                      {{ getCategoryLabel(notification.category) }}
                    </v-chip>
                    <span class="text-caption text-medium-emphasis">
                      {{ formatRelativeTime(notification.createdAt) }}
                    </span>
                  </div>
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex flex-column align-center gap-1">
                    <!-- Indicateur non lu -->
                    <v-avatar v-if="!notification.isRead" size="8"
                      :color="theme.global.current.value.dark ? 'primary' : 'primary'" />

                    <!-- Actions -->
                    <v-menu location="start">
                      <template #activator="{ props }">
                        <v-btn icon="mdi-dots-vertical" size="x-small" variant="text" v-bind="props"
                          :color="theme.global.current.value.dark ? 'grey-lighten-1' : 'grey-darken-2'" @click.stop />
                      </template>
                      <v-list density="compact" min-width="150">
                        <v-list-item v-if="!notification.isRead" @click="markAsRead(notification._id)"
                          prepend-icon="mdi-email-open">
                          Marquer comme lu
                        </v-list-item>
                        <v-list-item v-if="notification.actionUrl" @click="handleAction(notification)"
                          prepend-icon="mdi-open-in-new">
                          {{ notification.actionText || 'Voir détail' }}
                        </v-list-item>
                        <v-list-item @click="deleteNotification(notification._id)" prepend-icon="mdi-delete"
                          class="text-error">
                          Supprimer
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                </template>
              </v-list-item>
              <v-divider />
            </template>
          </v-list>

          <!-- Bouton charger plus -->
          <div v-if="stats.hasMore" class="pa-2 d-flex justify-center">
            <v-btn variant="text" size="small" @click="loadMore" :loading="loading"
              :color="theme.global.current.value.dark ? 'primary' : 'primary'">
              <v-icon start>mdi-chevron-down</v-icon>
              Charger plus
            </v-btn>
          </div>
        </template>

        <!-- État vide -->
        <div v-else class="d-flex flex-column align-center justify-center pa-6 text-center">
          <v-icon size="48" :color="theme.global.current.value.dark ? 'grey-darken-1' : 'grey-lighten-2'" class="mb-3">
            mdi-bell-off
          </v-icon>
          <div class="text-body-1 text-medium-emphasis mb-2">
            {{ selectedFilter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification' }}
          </div>
          <v-btn variant="text" size="small" @click="refresh"
            :color="theme.global.current.value.dark ? 'primary' : 'primary'">
            <v-icon start>mdi-refresh</v-icon>
            Actualiser
          </v-btn>
        </div>
      </div>

      <!-- Pied de page avec actions -->
      <v-divider v-if="notifications.length > 0" />
      <v-card-actions v-if="notifications.length > 0" class="pa-2">
        <v-btn variant="text" size="small" @click="openFullView"
          :color="theme.global.current.value.dark ? 'primary' : 'primary'">
          <v-icon start>mdi-open-in-new</v-icon>
          Voir tout
        </v-btn>
        <v-spacer />
        <v-btn v-if="hasReadNotifications" variant="text" size="small" @click="deleteAllRead"
          :color="theme.global.current.value.dark ? 'error' : 'error'">
          <v-icon start>mdi-delete-sweep</v-icon>
          Vider les lues
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { useNotificationCenter, type PersistentNotification } from '@/composables/useNotificationCenter'

const theme = useTheme()
const router = useRouter()

// État local du composant
const isMenuOpen = ref(false)
const selectedFilter = ref<'all' | 'unread'>('all')
const selectedCategory = ref<string>('')

// Utilisation du composable
const {
  notifications,
  stats,
  loading,
  categoryCounts,
  hasUnreadNotifications,
  loadNotifications,
  loadMore,
  refresh,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  applyFilters
} = useNotificationCenter()

// Computed
const unreadCount = computed(() => stats.value.unreadCount)
const hasUnread = computed(() => unreadCount.value > 0)
const hasReadNotifications = computed(() =>
  notifications.value.some(n => n.isRead)
)

// Watchers pour appliquer les filtres
watch([selectedFilter, selectedCategory], () => {
  const filters = {
    unreadOnly: selectedFilter.value === 'unread',
    category: selectedCategory.value || undefined,
    limit: 20
  }
  applyFilters(filters)
})

// Méthodes
const handleNotificationClick = (notification: PersistentNotification) => {
  if (!notification.isRead) {
    markAsRead(notification._id)
  }

  if (notification.actionUrl) {
    handleAction(notification)
  }
}

const handleAction = (notification: PersistentNotification) => {
  if (!notification.actionUrl) return

  if (notification.actionUrl.startsWith('/')) {
    // Route interne
    isMenuOpen.value = false
    router.push(notification.actionUrl)
  } else {
    // URL externe
    window.open(notification.actionUrl, '_blank')
  }
}

const toggleCategory = (category: string) => {
  selectedCategory.value = selectedCategory.value === category ? '' : category
}

const openFullView = () => {
  isMenuOpen.value = false
  router.push('/notifications')
}

// Fonctions utilitaires
const getTypeColor = (type: string): string => {
  const colors = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }
  return colors[type as keyof typeof colors] || 'info'
}

const getTypeIcon = (type: string): string => {
  const icons = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information'
  }
  return icons[type as keyof typeof icons] || 'mdi-information'
}

const getCategoryColor = (category: string): string => {
  const colors = {
    system: 'primary',
    security: 'error',
    update: 'info',
    reminder: 'warning',
    message: 'success'
  }
  return colors[category as keyof typeof colors] || 'primary'
}

const getCategoryLabel = (category: string): string => {
  const labels = {
    system: 'Système',
    security: 'Sécurité',
    update: 'Mise à jour',
    reminder: 'Rappel',
    message: 'Message'
  }
  return labels[category as keyof typeof labels] || category
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins}min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit'
  })
}

// Charger les notifications au montage si le menu est ouvert
watch(isMenuOpen, (newValue) => {
  if (newValue && notifications.value.length === 0) {
    loadNotifications({ limit: 20 })
  }
})
</script>

<style scoped>
.notification-center {
  border: 1px solid rgb(var(--v-theme-outline));
  min-width: 400px;
  max-width: 450px;
}

.notification-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-surface-variant)) 0%, rgb(var(--v-theme-surface)) 100%);
  padding: 12px 16px;
}

.notification-trigger {
  transition: transform 0.2s ease;
}

.notification-trigger:hover {
  transform: scale(1.05);
}

.notification-item {
  transition: all 0.2s ease;
  border-radius: 0;
}

.notification-item:hover {
  background-color: rgb(var(--v-theme-surface-variant), 0.5);
}

.notification-unread {
  background-color: rgb(var(--v-theme-primary), 0.05);
  border-left: 3px solid rgb(var(--v-theme-primary));
}

.notification-unread:hover {
  background-color: rgb(var(--v-theme-primary), 0.08);
}

.notification-avatar {
  flex-shrink: 0;
}

.notification-title {
  line-height: 1.2;
  word-break: break-word;
}

.notification-content {
  margin-top: 4px;
}

.notification-list {
  background-color: rgb(var(--v-theme-surface));
}

/* Scrollbar personnalisée */
.notification-list::-webkit-scrollbar {
  width: 4px;
}

.notification-list::-webkit-scrollbar-track {
  background: rgb(var(--v-theme-surface-variant), 0.3);
}

.notification-list::-webkit-scrollbar-thumb {
  background: rgb(var(--v-theme-primary), 0.6);
  border-radius: 2px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--v-theme-primary), 0.8);
}

/* Animation pour les nouveaux éléments */
@keyframes slideInDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.notification-item {
  animation: slideInDown 0.3s ease-out;
}

/* Responsive */
@media (max-width: 600px) {
  .notification-center {
    min-width: 320px;
    max-width: 100vw;
  }
}
</style>
