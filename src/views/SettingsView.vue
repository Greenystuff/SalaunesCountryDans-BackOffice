<template>
  <div class="pa-6">
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Paramètres</h1>
    </div>

    <v-container fluid class="pa-0">
      <v-row>
        <!-- Préférences d'interface -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="pb-2">
              <v-icon class="me-2">mdi-palette</v-icon>
              Interface utilisateur
            </v-card-title>
            <v-card-text>
              <div class="mb-4">
                <v-label class="mb-2 d-block">Thème de l'application</v-label>
                <v-btn-toggle v-model="themePreference" @update:model-value="updateTheme" mandatory color="primary"
                  variant="outlined" divided>
                  <v-btn value="light">
                    <v-icon start>mdi-weather-sunny</v-icon>
                    Clair
                  </v-btn>
                  <v-btn value="dark">
                    <v-icon start>mdi-weather-night</v-icon>
                    Sombre
                  </v-btn>
                  <v-btn value="auto">
                    <v-icon start>mdi-theme-light-dark</v-icon>
                    Auto
                  </v-btn>
                </v-btn-toggle>
              </div>

              <v-divider class="mb-4" />

              <v-switch v-model="settings.compactMode" @update:model-value="saveSettings" label="Mode compact"
                hint="Réduire l'espacement dans les listes et tableaux" persistent-hint inset color="primary" />

              <v-switch v-model="settings.showTooltips" @update:model-value="saveSettings"
                label="Afficher les info-bulles" hint="Montrer les descriptions d'aide au survol" persistent-hint inset
                color="primary" class="mt-2" />

              <v-switch v-model="settings.animationsEnabled" @update:model-value="saveSettings"
                label="Animations activées" hint="Activer les transitions et animations" persistent-hint inset
                color="primary" class="mt-2" />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Préférences de données -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="pb-2">
              <v-icon class="me-2">mdi-database</v-icon>
              Données et affichage
            </v-card-title>
            <v-card-text>
              <div class="mb-4">
                <v-label class="mb-2 d-block">Nombre d'éléments par page</v-label>
                <v-select v-model="settings.itemsPerPage" @update:model-value="saveSettings"
                  :items="itemsPerPageOptions" variant="outlined" density="comfortable" hide-details />
              </div>

              <v-divider class="mb-4" />

              <v-switch v-model="settings.autoRefresh" @update:model-value="saveSettings"
                label="Actualisation automatique" hint="Actualiser les données automatiquement toutes les 5 minutes"
                persistent-hint inset color="primary" />

              <v-switch v-model="settings.showStatistics" @update:model-value="saveSettings"
                label="Afficher les statistiques" hint="Montrer les statistiques dans le tableau de bord"
                persistent-hint inset color="primary" class="mt-2" />

              <v-switch v-model="settings.enableNotifications" @update:model-value="saveSettings"
                label="Notifications activées" hint="Recevoir des notifications pour les événements importants"
                persistent-hint inset color="primary" class="mt-2" />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Préférences d'exportation -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="pb-2">
              <v-icon class="me-2">mdi-download</v-icon>
              Exportation
            </v-card-title>
            <v-card-text>
              <div class="mb-4">
                <v-label class="mb-2 d-block">Format d'export par défaut</v-label>
                <v-select v-model="settings.defaultExportFormat" @update:model-value="saveSettings"
                  :items="exportFormatOptions" variant="outlined" density="comfortable" hide-details />
              </div>

              <v-switch v-model="settings.includeHeaders" @update:model-value="saveSettings"
                label="Inclure les en-têtes" hint="Inclure les noms de colonnes dans les exports" persistent-hint inset
                color="primary" />

              <v-switch v-model="settings.compressExports" @update:model-value="saveSettings"
                label="Compresser les exports" hint="Compresser les fichiers d'export en ZIP" persistent-hint inset
                color="primary" class="mt-2" />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Sécurité et confidentialité -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="pb-2">
              <v-icon class="me-2">mdi-shield-account</v-icon>
              Sécurité et confidentialité
            </v-card-title>
            <v-card-text>
              <div class="mb-4">
                <v-label class="mb-2 d-block">Durée de session</v-label>
                <v-select v-model="settings.sessionTimeout" @update:model-value="saveSettings"
                  :items="sessionTimeoutOptions" variant="outlined" density="comfortable" hide-details />
              </div>

              <v-switch v-model="settings.twoFactorEnabled" @update:model-value="saveSettings"
                label="Authentification à deux facteurs"
                hint="Activer l'authentification à deux facteurs pour plus de sécurité" persistent-hint inset
                color="primary" />

              <v-switch v-model="settings.logActivities" @update:model-value="saveSettings"
                label="Journaliser les activités" hint="Enregistrer vos actions dans les journaux de sécurité"
                persistent-hint inset color="primary" class="mt-2" />
            </v-card-text>
            <v-card-actions class="px-6 pb-4">
              <v-btn @click="clearUserData" color="error" variant="outlined" prepend-icon="mdi-delete-alert">
                Effacer les données locales
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Actions rapides -->
        <v-col cols="12">
          <v-card>
            <v-card-title class="pb-2">
              <v-icon class="me-2">mdi-cog</v-icon>
              Actions rapides
            </v-card-title>
            <v-card-text>
              <div class="d-flex flex-wrap gap-3">
                <v-btn @click="resetToDefaults" color="warning" variant="outlined" prepend-icon="mdi-restore">
                  Restaurer les paramètres par défaut
                </v-btn>

                <v-btn @click="exportSettings" color="info" variant="outlined" prepend-icon="mdi-export">
                  Exporter les paramètres
                </v-btn>

                <v-btn @click="importSettings" color="success" variant="outlined" prepend-icon="mdi-import">
                  Importer les paramètres
                </v-btn>

                <v-btn @click="clearCache" :loading="clearingCache" color="secondary" variant="outlined"
                  prepend-icon="mdi-cached">
                  Vider le cache
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Dialog de confirmation -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="confirmDialog.show = false" text>Annuler</v-btn>
          <v-btn @click="confirmDialog.action" color="primary">Confirmer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar pour les notifications -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="showSnackbar = false">
          Fermer
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()

// État du composant
const clearingCache = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Préférence de thème
const themePreference = ref<'light' | 'dark' | 'auto'>('light')

// Dialog de confirmation
const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  action: () => { }
})

// Paramètres utilisateur
const settings = ref({
  compactMode: false,
  showTooltips: true,
  animationsEnabled: true,
  itemsPerPage: 25,
  autoRefresh: true,
  showStatistics: true,
  enableNotifications: true,
  defaultExportFormat: 'xlsx',
  includeHeaders: true,
  compressExports: false,
  sessionTimeout: 60,
  twoFactorEnabled: false,
  logActivities: true
})

// Options pour les sélecteurs
const itemsPerPageOptions = [
  { title: '10 par page', value: 10 },
  { title: '25 par page', value: 25 },
  { title: '50 par page', value: 50 },
  { title: '100 par page', value: 100 }
]

const exportFormatOptions = [
  { title: 'Excel (.xlsx)', value: 'xlsx' },
  { title: 'CSV (.csv)', value: 'csv' },
  { title: 'JSON (.json)', value: 'json' },
  { title: 'PDF (.pdf)', value: 'pdf' }
]

const sessionTimeoutOptions = [
  { title: '15 minutes', value: 15 },
  { title: '30 minutes', value: 30 },
  { title: '1 heure', value: 60 },
  { title: '4 heures', value: 240 },
  { title: '8 heures', value: 480 }
]

// Fonctions
const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('scd_user_settings')
    const savedTheme = localStorage.getItem('theme')

    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      settings.value = { ...settings.value, ...parsed }
    }

    if (savedTheme) {
      themePreference.value = savedTheme as any
    } else {
      // Détecter la préférence système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      themePreference.value = prefersDark ? 'dark' : 'light'
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error)
  }
}

const saveSettings = () => {
  try {
    localStorage.setItem('scd_user_settings', JSON.stringify(settings.value))
    showNotification('Paramètres sauvegardés', 'success')
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    showNotification('Erreur lors de la sauvegarde', 'error')
  }
}

const updateTheme = (newTheme: 'light' | 'dark' | 'auto') => {
  if (newTheme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.change(prefersDark ? 'dark' : 'light')
  } else {
    theme.change(newTheme)
  }

  localStorage.setItem('theme', newTheme)
  showNotification('Thème mis à jour', 'success')
}

const resetToDefaults = () => {
  confirmDialog.value = {
    show: true,
    title: 'Restaurer les paramètres par défaut',
    message: 'Êtes-vous sûr de vouloir restaurer tous les paramètres par défaut ? Cette action ne peut pas être annulée.',
    action: () => {
      // Réinitialiser les paramètres
      settings.value = {
        compactMode: false,
        showTooltips: true,
        animationsEnabled: true,
        itemsPerPage: 25,
        autoRefresh: true,
        showStatistics: true,
        enableNotifications: true,
        defaultExportFormat: 'xlsx',
        includeHeaders: true,
        compressExports: false,
        sessionTimeout: 60,
        twoFactorEnabled: false,
        logActivities: true
      }

      themePreference.value = 'light'
      theme.change('light')

      localStorage.removeItem('scd_user_settings')
      localStorage.setItem('theme', 'light')

      confirmDialog.value.show = false
      showNotification('Paramètres restaurés par défaut', 'success')
    }
  }
}

const exportSettings = () => {
  try {
    const exportData = {
      settings: settings.value,
      theme: themePreference.value,
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scd-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showNotification('Paramètres exportés avec succès', 'success')
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    showNotification('Erreur lors de l\'export', 'error')
  }
}

const importSettings = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement)?.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)

          if (data.settings) {
            settings.value = { ...settings.value, ...data.settings }
            saveSettings()
          }

          if (data.theme) {
            themePreference.value = data.theme
            updateTheme(data.theme)
          }

          showNotification('Paramètres importés avec succès', 'success')
        } catch (error) {
          console.error('Erreur lors de l\'import:', error)
          showNotification('Fichier de paramètres invalide', 'error')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const clearCache = async () => {
  clearingCache.value = true

  try {
    // Simuler le nettoyage du cache
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Effacer les données temporaires du localStorage (garder les paramètres)
    const settingsBackup = localStorage.getItem('scd_user_settings')
    const themeBackup = localStorage.getItem('theme')

    localStorage.clear()

    if (settingsBackup) localStorage.setItem('scd_user_settings', settingsBackup)
    if (themeBackup) localStorage.setItem('theme', themeBackup)

    showNotification('Cache vidé avec succès', 'success')
  } catch (error) {
    console.error('Erreur lors du nettoyage du cache:', error)
    showNotification('Erreur lors du nettoyage du cache', 'error')
  } finally {
    clearingCache.value = false
  }
}

const clearUserData = () => {
  confirmDialog.value = {
    show: true,
    title: 'Effacer les données locales',
    message: 'Cette action supprimera toutes vos données locales (paramètres, cache, préférences). Êtes-vous sûr ?',
    action: () => {
      localStorage.clear()
      sessionStorage.clear()

      // Recharger la page pour réinitialiser l'application
      window.location.reload()
    }
  }
}

const showNotification = (message: string, color: 'success' | 'error' | 'info' = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

// Surveillance des changements de préférence système pour le thème auto
const setupThemeWatcher = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handleChange = () => {
    if (themePreference.value === 'auto') {
      theme.change(mediaQuery.matches ? 'dark' : 'light')
    }
  }

  mediaQuery.addEventListener('change', handleChange)

  // Appliquer le thème initial si en mode auto
  if (themePreference.value === 'auto') {
    theme.change(mediaQuery.matches ? 'dark' : 'light')
  }
}

// Initialisation
onMounted(() => {
  loadSettings()
  setupThemeWatcher()
})
</script>

<style scoped>
/* Styles spécifiques à la page paramètres */
.v-card {
  border-radius: 12px;
}

.gap-3 {
  gap: 12px;
}

.v-switch {
  flex: none;
}

.v-label {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.87;
}
</style>
