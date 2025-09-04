<template>
  <div class="pa-6">
    <!-- En-tête avec actions -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Centre de notifications</h1>
        <p class="text-body-1 text-medium-emphasis">
          Gérez vos notifications et restez informé des dernières activités
        </p>
      </div>

      <div class="d-flex gap-2">
        <v-btn prepend-icon="mdi-refresh" @click="refresh" :loading="loading" variant="outlined"
          :color="theme.global.current.value.dark ? 'primary' : 'primary'">
          Actualiser
        </v-btn>
        <v-btn v-if="hasUnread" prepend-icon="mdi-email-open" @click="markAllAsRead" variant="outlined" color="success">
          Tout marquer lu
        </v-btn>
        <v-btn v-if="hasReadNotifications" prepend-icon="mdi-delete-sweep" @click="confirmDeleteRead" variant="outlined"
          color="error">
          Vider les lues
        </v-btn>
      </div>
    </div>

    <!-- Statistiques rapides -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text class="d-flex align-center">
            <v-avatar size="48" :color="theme.global.current.value.dark ? 'primary' : 'primary'" class="me-3">
              <v-icon size="24" color="white">mdi-bell</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.total }}</div>
              <div class="text-body-2 text-medium-emphasis">Total</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text class="d-flex align-center">
            <v-avatar size="48" color="error" class="me-3">
              <v-icon size="24" color="white">mdi-bell-alert</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ stats.unreadCount }}</div>
              <div class="text-body-2 text-medium-emphasis">Non lues</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text class="d-flex align-center">
            <v-avatar size="48" color="success" class="me-3">
              <v-icon size="24" color="white">mdi-shield-check</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ categoryCounts.security || 0 }}</div>
              <div class="text-body-2 text-medium-emphasis">Sécurité</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text class="d-flex align-center">
            <v-avatar size="48" color="info" class="me-3">
              <v-icon size="24" color="white">mdi-cog</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">{{ categoryCounts.system || 0 }}</div>
              <div class="text-body-2 text-medium-emphasis">Système</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtres et recherche -->
    <v-card class="mb-6" elevation="2">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-chip-group v-model="selectedFilter" variant="outlined" color="primary" selected-class="text-primary">
              <v-chip value="all">
                <v-icon start>mdi-bell</v-icon>
                Toutes ({{ stats.total }})
              </v-chip>
              <v-chip value="unread">
                <v-icon start>mdi-bell-alert</v-icon>
                Non lues ({{ stats.unreadCount }})
              </v-chip>
            </v-chip-group>
          </v-col>

          <v-col cols="12" md="6">
            <v-select v-model="selectedCategory" :items="categoryOptions" label="Filtrer par catégorie"
              variant="outlined" density="compact" clearable prepend-inner-icon="mdi-filter" />
          </v-col>
        </v-row>

        <v-row v-if="Object.keys(categoryCounts).length > 0" class="mt-2">
          <v-col cols="12">
            <div class="d-flex flex-wrap gap-2">
              <v-chip v-for="(count, category) in categoryCounts" :key="category" :color="getCategoryColor(category)"
                size="small" variant="outlined" :class="{ 'v-chip--selected': selectedCategory === category }"
                @click="toggleCategory(category)">
                <v-icon start :icon="getCategoryIcon(category)" size="16" />
                {{ getCategoryLabel(category) }} ({{ count }})
              </v-chip>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Liste des notifications -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2">mdi-format-list-bulleted</v-icon>
        Notifications
        <v-spacer />
        <v-btn-toggle v-model="viewMode" variant="outlined" density="compact">
          <v-btn value="list" icon="mdi-view-list" />
          <v-btn value="cards" icon="mdi-view-grid" />
        </v-btn-toggle>
      </v-card-title>

      <v-divider />

      <!-- Chargement initial -->
      <div v-if="loading && notifications.length === 0" class="d-flex justify-center align-center pa-8">
        <v-progress-circular indeterminate size="48" :color="theme.global.current.value.dark ? 'primary' : 'primary'" />
        <span class="ml-4 text-body-1">Chargement des notifications...</span>
      </div>

      <!-- Vue liste -->
      <template v-else-if="viewMode === 'list' && notifications.length > 0">
        <v-list class="pa-0">
          <template v-for="notification in notifications" :key="notification._id">
            <v-list-item class="notification-item py-4" :class="{ 'notification-unread': !notification.isRead }"
              @click="handleNotificationClick(notification)">

              <template #prepend>
                <v-avatar :color="getTypeColor(notification.type)" size="40" class="me-4">
                  <v-icon :icon="getTypeIcon(notification.type)" size="20" color="white" />
                </v-avatar>
              </template>

              <v-list-item-title class="text-h6 mb-2">
                {{ notification.title }}
                <v-chip v-if="!notification.isRead" color="primary" size="x-small" variant="flat" class="ms-2">
                  Nouveau
                </v-chip>
              </v-list-item-title>

              <v-list-item-subtitle>
                <div class="text-body-1 mb-3" style="white-space: pre-wrap;">
                  {{ notification.message }}
                </div>

                <div class="d-flex align-center flex-wrap gap-2">
                  <v-chip :color="getCategoryColor(notification.category)" size="small" variant="outlined">
                    <v-icon start :icon="getCategoryIcon(notification.category)" size="14" />
                    {{ getCategoryLabel(notification.category) }}
                  </v-chip>

                  <v-chip color="info" size="small" variant="text">
                    <v-icon start>mdi-clock</v-icon>
                    {{ formatDateTime(notification.createdAt) }}
                  </v-chip>

                  <v-chip v-if="notification.readAt" color="success" size="small" variant="text">
                    <v-icon start>mdi-eye</v-icon>
                    Lu le {{ formatDateTime(notification.readAt) }}
                  </v-chip>
                </div>
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex align-center gap-2">
                  <!-- Action principale -->
                  <v-btn v-if="notification.actionUrl" :color="getTypeColor(notification.type)" variant="outlined"
                    size="small" @click.stop="handleAction(notification)">
                    {{ notification.actionText || 'Voir' }}
                    <v-icon end>mdi-open-in-new</v-icon>
                  </v-btn>

                  <!-- Menu actions -->
                  <v-menu location="start">
                    <template #activator="{ props }">
                      <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="props" @click.stop />
                    </template>
                    <v-list density="compact" min-width="180">
                      <v-list-item v-if="!notification.isRead" @click="markAsRead(notification._id)"
                        prepend-icon="mdi-email-open">
                        Marquer comme lu
                      </v-list-item>
                      <v-list-item v-if="notification.actionUrl" @click="handleAction(notification)"
                        prepend-icon="mdi-open-in-new">
                        {{ notification.actionText || 'Voir détail' }}
                      </v-list-item>
                      <v-divider />
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
      </template>

      <!-- Vue cartes -->
      <template v-else-if="viewMode === 'cards' && notifications.length > 0">
        <div class="pa-4">
          <v-row>
            <v-col v-for="notification in notifications" :key="notification._id" cols="12" md="6" lg="4">
              <v-card class="notification-card h-100" :class="{ 'notification-unread': !notification.isRead }"
                @click="handleNotificationClick(notification)" elevation="2">

                <v-card-title class="d-flex align-center">
                  <v-avatar :color="getTypeColor(notification.type)" size="32" class="me-3">
                    <v-icon :icon="getTypeIcon(notification.type)" size="16" color="white" />
                  </v-avatar>

                  <div class="flex-grow-1">
                    <div class="text-subtitle-1 font-weight-medium">{{ notification.title }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatRelativeTime(notification.createdAt) }}
                    </div>
                  </div>

                  <v-avatar v-if="!notification.isRead" size="12" color="primary" />
                </v-card-title>

                <v-card-text>
                  <div class="text-body-2 mb-3"
                    style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                    {{ notification.message }}
                  </div>

                  <v-chip :color="getCategoryColor(notification.category)" size="small" variant="outlined">
                    <v-icon start :icon="getCategoryIcon(notification.category)" size="14" />
                    {{ getCategoryLabel(notification.category) }}
                  </v-chip>
                </v-card-text>

                <v-card-actions>
                  <v-btn v-if="notification.actionUrl" :color="getTypeColor(notification.type)" variant="text"
                    size="small" @click.stop="handleAction(notification)">
                    {{ notification.actionText || 'Voir' }}
                    <v-icon end>mdi-open-in-new</v-icon>
                  </v-btn>

                  <v-spacer />

                  <v-btn v-if="!notification.isRead" icon="mdi-email-open" size="small" variant="text"
                    @click.stop="markAsRead(notification._id)" color="success" />

                  <v-btn icon="mdi-delete" size="small" variant="text"
                    @click.stop="deleteNotification(notification._id)" color="error" />
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </template>

      <!-- État vide -->
      <div v-else-if="!loading" class="d-flex flex-column align-center justify-center pa-12 text-center">
        <v-icon size="64" :color="theme.global.current.value.dark ? 'grey-darken-1' : 'grey-lighten-2'" class="mb-4">
          mdi-bell-off
        </v-icon>
        <h2 class="text-h5 font-weight-bold mb-2">
          {{ selectedFilter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification' }}
        </h2>
        <p class="text-body-1 text-medium-emphasis mb-4">
          {{ selectedFilter === 'unread' ? 'Toutes vos notifications ont été lues' :
            'Vous n\'avez pas encore reçu de notifications' }}
        </p>
        <v-btn prepend-icon="mdi-refresh" @click="refresh"
          :color="theme.global.current.value.dark ? 'primary' : 'primary'">
          Actualiser
        </v-btn>
      </div>

      <!-- Pagination -->
      <div v-if="notifications.length > 0" class="pa-4 d-flex justify-center">
        <v-btn v-if="stats.hasMore" variant="outlined" @click="loadMore" :loading="loading"
          :color="theme.global.current.value.dark ? 'primary' : 'primary'">
          <v-icon start>mdi-chevron-down</v-icon>
          Charger plus ({{ stats.total - notifications.length }} restantes)
        </v-btn>
        <div v-else class="text-body-2 text-medium-emphasis">
          {{ notifications.length }} / {{ stats.total }} notifications affichées
        </div>
      </div>
    </v-card>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5 d-flex align-center">
          <v-icon class="me-2" color="error">mdi-delete</v-icon>
          Supprimer les notifications
        </v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer toutes les notifications lues ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" @click="deleteAllReadConfirmed">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { useNotificationCenter, type PersistentNotification } from '@/composables/useNotificationCenter'

const theme = useTheme()
const router = useRouter()

// État local du composant
const selectedFilter = ref<'all' | 'unread'>('all')
const selectedCategory = ref<string>('')
const viewMode = ref<'list' | 'cards'>('list')
const deleteDialog = ref(false)

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
const hasUnread = computed(() => stats.value.unreadCount > 0)
const hasReadNotifications = computed(() =>
  notifications.value.some(n => n.isRead)
)

const categoryOptions = computed(() => [
  { title: 'Système', value: 'system' },
  { title: 'Sécurité', value: 'security' },
  { title: 'Mise à jour', value: 'update' },
  { title: 'Rappel', value: 'reminder' },
  { title: 'Message', value: 'message' }
])

// Watchers pour appliquer les filtres
watch([selectedFilter, selectedCategory], () => {
  const filters = {
    unreadOnly: selectedFilter.value === 'unread',
    category: selectedCategory.value || undefined,
    limit: 50
  }
  applyFilters(filters)
})

// Méthodes
const handleNotificationClick = (notification: PersistentNotification) => {
  if (!notification.isRead) {
    markAsRead(notification._id)
  }
}

const handleAction = (notification: PersistentNotification) => {
  if (!notification.actionUrl) return

  if (notification.actionUrl.startsWith('/')) {
    router.push(notification.actionUrl)
  } else {
    window.open(notification.actionUrl, '_blank')
  }
}

const toggleCategory = (category: string) => {
  selectedCategory.value = selectedCategory.value === category ? '' : category
}

const confirmDeleteRead = () => {
  deleteDialog.value = true
}

const deleteAllReadConfirmed = () => {
  deleteAllRead()
  deleteDialog.value = false
}

// Fonctions utilitaires (mêmes que dans NotificationCenter.vue)
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

const getCategoryIcon = (category: string): string => {
  const icons = {
    system: 'mdi-cog',
    security: 'mdi-shield',
    update: 'mdi-update',
    reminder: 'mdi-bell-ring',
    message: 'mdi-message'
  }
  return icons[category as keyof typeof icons] || 'mdi-cog'
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

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
    month: '2-digit',
    year: 'numeric'
  })
}

// Charger les notifications au montage
onMounted(() => {
  loadNotifications({ limit: 50 })
})
</script>

<style scoped>
.stat-card {
  border: 1px solid rgb(var(--v-theme-outline));
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-shadow-key-umbra-opacity), 0.1);
}

.notification-item {
  transition: all 0.2s ease;
  cursor: pointer;
}

.notification-item:hover {
  background-color: rgb(var(--v-theme-surface-variant), 0.5);
}

.notification-unread {
  background-color: rgb(var(--v-theme-primary), 0.05);
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.notification-unread:hover {
  background-color: rgb(var(--v-theme-primary), 0.08);
}

.notification-card {
  transition: all 0.2s ease;
  cursor: pointer;
}

.notification-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--v-theme-shadow-key-umbra-opacity), 0.15);
}

.notification-card.notification-unread {
  border-top: 4px solid rgb(var(--v-theme-primary));
}

/* Scrollbar personnalisée */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgb(var(--v-theme-surface-variant), 0.3);
}

::-webkit-scrollbar-thumb {
  background: rgb(var(--v-theme-primary), 0.6);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--v-theme-primary), 0.8);
}
</style>
