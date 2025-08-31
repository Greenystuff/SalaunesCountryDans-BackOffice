<template>
  <MainLayout>
    <div class="courses-container">
      <!-- Header -->
      <div class="header-section mb-6">
        <div class="d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h3 font-weight-bold mb-2">
              Gestion des Cours
            </h1>
            <p class="text-body-1 text-medium-emphasis">
              Gérez le planning des cours et événements de country dance
            </p>
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" size="large" @click="openEventDialog()">
            Créer un événement
          </v-btn>
        </div>
      </div>

      <!-- Calendrier VCalendar - Centre d'attention -->
      <v-card class="calendar-card" elevation="3" rounded="xl">
        <!-- Indicateur de chargement -->
        <v-overlay v-model="loading" class="align-center justify-center">
          <v-progress-circular indeterminate size="64" color="primary" />
        </v-overlay>

        <!-- Message d'erreur -->
        <v-alert v-if="error" type="error" variant="tonal" class="ma-4" rounded="lg">
          <template #prepend>
            <v-icon>mdi-alert-circle</v-icon>
          </template>
          {{ error }}
        </v-alert>

        <v-card-text class="pa-6">
          <!-- Contrôles du calendrier -->
          <div class="d-flex justify-space-between align-center mb-6">
            <div class="d-flex align-center gap-4">
              <v-btn icon="mdi-chevron-left" variant="text" size="large" @click="previousMonth" />
              <h2 class="text-h4 font-weight-bold">{{ currentMonthYear }}</h2>
              <v-btn icon="mdi-chevron-right" variant="text" size="large" @click="nextMonth" />
            </div>
            <div class="d-flex align-center gap-3">
              <v-btn variant="outlined" size="large" @click="goToToday" prepend-icon="mdi-calendar-today">
                Aujourd'hui
              </v-btn>
              <v-select v-model="viewMode" :items="viewModes" variant="outlined" density="comfortable" hide-details />
            </div>
          </div>

          <!-- Calendrier VCalendar - Pleine largeur -->
          <div class="calendar-wrapper">
            <VCalendar v-model="calendarSelectedDate" :attributes="calendarAttributes" class="custom-calendar" />
          </div>
        </v-card-text>
      </v-card>

      <!-- Dialog pour créer/modifier un événement -->
      <v-dialog v-model="eventDialog" max-width="800px" persistent>
        <v-card>
          <v-card-title class="text-h5 pa-6 d-flex justify-space-between align-center">
            <span>{{ editingEvent ? 'Modifier l\'événement' : 'Créer un événement' }}</span>
            <v-btn icon="mdi-close" variant="text" size="small" @click="closeEventDialog" />
          </v-card-title>

          <v-card-text class="pa-6">
            <v-form ref="eventForm" v-model="eventFormValid" class="form-spacing">
              <!-- Titre -->
              <v-text-field v-model="eventForm.title" label="Titre de l'événement *" variant="outlined"
                :rules="[v => !!v || 'Le titre est requis']" required class="mb-4" />

              <!-- Description -->
              <v-textarea v-model="eventForm.description" label="Description" variant="outlined" rows="3" counter="500"
                hint="Description détaillée de l'événement" class="mb-4" />

              <!-- Niveau de difficulté -->
              <v-select v-model="eventForm.level" :items="levelOptions" label="Niveau de difficulté *"
                variant="outlined" :rules="[v => !!v || 'Le niveau est requis']" required class="mb-4" />

              <!-- Instructeur -->
              <v-text-field v-model="eventForm.instructor" label="Instructeur" variant="outlined" class="mb-4" />

              <!-- Lieu -->
              <v-text-field v-model="eventForm.location" label="Lieu" variant="outlined" class="mb-4" />

              <!-- Type d'événement -->
              <v-select v-model="eventForm.type" :items="eventTypes" label="Type d'événement" variant="outlined"
                class="mb-4" />

              <!-- Périodes -->
              <div class="mb-6">
                <div class="d-flex align-center mb-4">
                  <h4 class="text-h6">Périodes</h4>
                  <v-spacer />
                  <v-btn size="small" variant="outlined" prepend-icon="mdi-plus" @click="addPeriod">
                    Ajouter une période
                  </v-btn>
                </div>

                <div v-for="(period, index) in eventForm.periods" :key="index" class="period-item mb-4">
                  <v-row>
                    <v-col cols="12" md="4">
                      <v-text-field v-model="period.startDate" label="Date de début" type="date" variant="outlined"
                        density="compact" />
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-text-field v-model="period.startTime" label="Heure début" type="time" variant="outlined"
                        density="compact" />
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-text-field v-model="period.endTime" label="Heure fin" type="time" variant="outlined"
                        density="compact" />
                    </v-col>
                    <v-col cols="12" md="2" class="d-flex align-center">
                      <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="removePeriod(index)" />
                    </v-col>
                  </v-row>
                </div>
              </div>

              <!-- Capacité -->
              <v-text-field v-model.number="eventForm.capacity" label="Capacité maximale" type="number"
                variant="outlined" min="1" class="mb-4" />

              <!-- Prix -->
              <v-text-field v-model="eventForm.price" label="Prix" variant="outlined" prefix="€" class="mb-4" />

              <!-- Tags -->
              <v-text-field v-model="eventForm.tagsString" label="Tags" variant="outlined"
                hint="Séparez les tags par des virgules" placeholder="cours, débutant, country" class="mb-4" />
            </v-form>
          </v-card-text>

          <!-- Actions -->
          <v-card-actions class="pa-6 d-flex justify-space-between align-center">
            <!-- Toggle à gauche -->
            <v-switch v-model="eventForm.isActive" label="Événement actif" color="primary" class="ma-0" hide-details />

            <!-- Boutons à droite -->
            <div class="d-flex gap-3">
              <v-btn variant="outlined" @click="resetEventForm" :disabled="!hasEventChanges">
                Réinitialiser
              </v-btn>
              <v-btn color="primary" :loading="saving" :disabled="isSaveButtonDisabled" @click="saveEvent">
                {{ editingEvent ? 'Modifier' : 'Créer' }}
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { eventService } from '@/services/eventService'
import type { CourseEvent, EventFormData, EventPeriod } from '@/types/events'

// État réactif
const selectedDate = ref<Date>(new Date())
const calendarSelectedDate = ref<Date[]>([])
const viewMode = ref('month')
const eventDialog = ref(false)
const editingEvent = ref<CourseEvent | null>(null)
const saving = ref(false)
const eventFormValid = ref<boolean>(false)

// État des données
const events = ref<CourseEvent[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Options
const viewModes = [
  { title: 'Vue mensuelle', value: 'month' },
  { title: 'Vue hebdomadaire', value: 'week' }
]

const levelOptions = [
  { title: 'Débutant', value: 'Débutant' },
  { title: 'Novice', value: 'Novice' },
  { title: 'Intermédiaire', value: 'Intermédiaire' }
]

const eventTypes = [
  'Cours régulier',
  'Stage',
  'Soirée',
  'Compétition',
  'Démonstration',
  'Autre'
]

// Configuration VCalendar
const locale = {
  id: 'fr',
  firstDayOfWeek: 2,
  masks: {
    L: 'DD/MM/YYYY',
    title: 'MMMM YYYY',
    weekdays: 'W',
  },
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  monthNames: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  monthNamesShort: [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
  ]
}

const themeStyles = {
  light: {
    wrapper: {
      border: 'none',
      borderRadius: '12px',
      backgroundColor: 'transparent'
    },
    header: {
      backgroundColor: 'transparent',
      borderBottom: 'none',
      color: 'rgb(var(--v-theme-on-surface))'
    },
    navButton: {
      color: 'rgb(var(--v-theme-primary))',
      backgroundColor: 'transparent',
      border: '1px solid rgb(var(--v-theme-outline))',
      borderRadius: '8px'
    },
    navButtonHover: {
      backgroundColor: 'rgb(var(--v-theme-primary-container))',
      color: 'rgb(var(--v-theme-on-primary-container))'
    },
    dayCell: {
      border: '1px solid rgb(var(--v-theme-outline))',
      backgroundColor: 'rgb(var(--v-theme-surface))',
      borderRadius: '8px'
    },
    dayCellHover: {
      backgroundColor: 'rgb(var(--v-theme-surface-variant))'
    },
    dayCellToday: {
      backgroundColor: 'rgb(var(--v-theme-primary-container))',
      color: 'rgb(var(--v-theme-on-primary-container))'
    }
  },
  dark: {
    wrapper: {
      border: 'none',
      borderRadius: '12px',
      backgroundColor: 'transparent'
    },
    header: {
      backgroundColor: 'transparent',
      borderBottom: 'none',
      color: 'rgb(var(--v-theme-on-surface))'
    },
    navButton: {
      color: 'rgb(var(--v-theme-primary))',
      backgroundColor: 'transparent',
      border: '1px solid rgb(var(--v-theme-outline))',
      borderRadius: '8px'
    },
    navButtonHover: {
      backgroundColor: 'rgb(var(--v-theme-primary-container))',
      color: 'rgb(var(--v-theme-on-primary-container))'
    },
    dayCell: {
      border: '1px solid rgb(var(--v-theme-outline))',
      backgroundColor: 'rgb(var(--v-theme-surface))',
      borderRadius: '8px'
    },
    dayCellHover: {
      backgroundColor: 'rgb(var(--v-theme-surface-variant))'
    },
    dayCellToday: {
      backgroundColor: 'rgb(var(--v-theme-primary-container))',
      color: 'rgb(var(--v-theme-on-primary-container))'
    }
  }
}

// Formulaire événement
const eventForm = ref({
  title: '',
  description: '',
  level: 'Débutant' as 'Débutant' | 'Novice' | 'Intermédiaire',
  instructor: '',
  location: '',
  type: 'Cours régulier',
  periods: [] as EventPeriod[],
  capacity: 20,
  price: '',
  tagsString: '',
  isActive: true
})

// Computed
const currentMonthYear = computed(() => {
  return selectedDate.value.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  })
})

const calendarAttributes = computed(() => {
  return events.value.map(event => ({
    key: event._id || `event-${Math.random()}`,
    highlight: {
      color: getLevelColor(event.level),
      fillMode: 'light' as const
    },
    dates: event.periods.map(period => new Date(period.startDate)),
    customData: event
  }))
})

// Méthodes
const getLevelColor = (level: string) => {
  switch (level) {
    case 'Débutant':
      return 'green'
    case 'Novice':
      return 'blue'
    case 'Intermédiaire':
      return 'orange'
    default:
      return 'gray'
  }
}

const previousMonth = () => {
  const newDate = new Date(selectedDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  selectedDate.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(selectedDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  selectedDate.value = newDate
}

const goToToday = () => {
  selectedDate.value = new Date()
}

const onDayClick = ({ date }: { date: Date }) => {
  openEventDialog()
  if (eventForm.value.periods.length === 0) {
    addPeriod()
  }
  eventForm.value.periods[0].startDate = date.toISOString().split('T')[0]
}

const onPageChange = ({ month, year }: { month: number; year: number }) => {
  selectedDate.value = new Date(year, month, 1)
}

const openEventDialog = (event?: CourseEvent) => {
  if (event) {
    editingEvent.value = event
    eventForm.value = {
      title: event.title,
      description: event.description || '',
      level: event.level,
      instructor: event.instructor || '',
      location: event.location || '',
      type: event.type || 'Cours régulier',
      periods: [...event.periods],
      capacity: event.capacity || 20,
      price: event.price || '',
      tagsString: event.tags?.join(', ') || '',
      isActive: event.isActive
    }
  } else {
    editingEvent.value = null
    resetEventForm()
  }
  eventDialog.value = true
}

const closeEventDialog = () => {
  eventDialog.value = false
  editingEvent.value = null
  resetEventForm()
}

const resetEventForm = () => {
  eventForm.value = {
    title: '',
    description: '',
    level: 'Débutant',
    instructor: '',
    location: '',
    type: 'Cours régulier',
    periods: [],
    capacity: 20,
    price: '',
    tagsString: '',
    isActive: true
  }
}

const addPeriod = () => {
  eventForm.value.periods.push({
    startDate: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '20:30'
  })
}

const removePeriod = (index: number) => {
  eventForm.value.periods.splice(index, 1)
}

const saveEvent = async () => {
  saving.value = true
  error.value = null

  try {
    if (editingEvent.value) {
      // Mise à jour
      const updatedEvent = await eventService.updateEvent(editingEvent.value._id!, eventForm.value)
      const index = events.value.findIndex(e => e._id === updatedEvent._id)
      if (index !== -1) {
        events.value[index] = updatedEvent
      }
    } else {
      // Création
      const newEvent = await eventService.createEvent(eventForm.value)
      events.value.push(newEvent)
    }

    closeEventDialog()
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors de la sauvegarde'
    console.error('Erreur lors de la sauvegarde:', err)
  } finally {
    saving.value = false
  }
}

const hasEventChanges = computed((): boolean => {
  if (!editingEvent.value) return true

  const original = editingEvent.value
  const current = eventForm.value

  const hasChanges = (
    original.title !== current.title ||
    original.description !== current.description ||
    original.level !== current.level ||
    original.instructor !== current.instructor ||
    original.location !== current.location ||
    original.type !== current.type ||
    original.capacity !== current.capacity ||
    original.price !== current.price ||
    original.isActive !== current.isActive ||
    JSON.stringify(original.periods) !== JSON.stringify(current.periods) ||
    JSON.stringify(original.tags) !== JSON.stringify(current.tagsString.split(',').map(tag => tag.trim()).filter(tag => tag))
  )

  return Boolean(hasChanges)
})

const isSaveButtonDisabled = computed((): boolean => {
  const isValid = Boolean(eventFormValid.value)
  const hasChanges = Boolean(hasEventChanges.value)
  const isEditing = Boolean(editingEvent.value)
  return !isValid || (isEditing && !hasChanges)
})

// Charger les événements
const loadEvents = async () => {
  loading.value = true
  error.value = null

  try {
    const startDate = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1).toISOString().split('T')[0]
    const endDate = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth() + 1, 0).toISOString().split('T')[0]

    events.value = await eventService.getEventsByDateRange(startDate, endDate)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors du chargement des événements'
    console.error('Erreur lors du chargement des événements:', err)
  } finally {
    loading.value = false
  }
}

// Initialisation
onMounted(() => {
  loadEvents()
})

// Recharger les événements quand la date change
watch(selectedDate, () => {
  loadEvents()
})
</script>

<style scoped>
/* Container principal */
.courses-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header section */
.header-section {
  flex-shrink: 0;
  padding: 24px 0;
}

/* Carte du calendrier - Centre d'attention */
.calendar-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgb(var(--v-theme-surface)) 0%, rgb(var(--v-theme-surface-variant)) 100%);
  border: 1px solid rgb(var(--v-theme-outline));
  min-height: 0;
  /* Important pour flex */
}

/* Wrapper du calendrier */
.calendar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* Important pour flex */
}

/* Périodes */
.period-item {
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 12px;
  padding: 20px;
  background: rgb(var(--v-theme-surface));
}

.gap-3 {
  gap: 12px;
}

.gap-4 {
  gap: 16px;
}

/* Styles VCalendar personnalisés */
:deep(.custom-calendar) {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  border: none !important;
  border-radius: 12px !important;
}

:deep(.vc-container) {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  border: none !important;
  border-radius: 12px !important;
  background: transparent !important;
  min-height: 0 !important;
}

:deep(.vc-header) {
  flex-shrink: 0 !important;
  background: transparent !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border-radius: 12px 12px 0 0 !important;
  padding: 16px !important;
}

:deep(.vc-weeks) {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 16px !important;
  gap: 8px !important;
  min-height: 0 !important;
}

:deep(.vc-week) {
  flex: 1 !important;
  display: flex !important;
  gap: 8px !important;
  min-height: 0 !important;
}

:deep(.vc-day) {
  flex: 1 !important;
  border-radius: 8px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: 1px solid rgb(var(--v-theme-outline)) !important;
  background: rgb(var(--v-theme-surface)) !important;
  min-height: 80px !important;
  display: flex !important;
  flex-direction: column !important;
}

:deep(.vc-day:hover) {
  background-color: rgb(var(--v-theme-surface-variant)) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(var(--v-theme-shadow-key-umbra-opacity), 0.15) !important;
}

:deep(.vc-day.is-today) {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary-container)) 0%, rgb(var(--v-theme-primary)) 100%) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  font-weight: 700 !important;
  transform: scale(1.02) !important;
}

:deep(.vc-day.is-not-in-month) {
  opacity: 0.5 !important;
}

:deep(.vc-day-content) {
  flex: 1 !important;
  padding: 8px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
}

:deep(.vc-day-content .vc-day-label) {
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  margin-bottom: 4px !important;
}

:deep(.vc-day-content .vc-day-content-wrapper) {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 2px !important;
}

:deep(.vc-day-content .vc-day-content-wrapper .vc-day-content-item) {
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

:deep(.vc-day-content .vc-day-content-wrapper .vc-day-content-item:hover) {
  transform: scale(1.2) !important;
}

/* Couleurs des événements par niveau */
:deep(.vc-day-content .vc-day-content-wrapper .vc-day-content-item[data-level="Débutant"]) {
  background-color: rgb(var(--v-theme-success)) !important;
}

:deep(.vc-day-content .vc-day-content-wrapper .vc-day-content-item[data-level="Novice"]) {
  background-color: rgb(var(--v-theme-info)) !important;
}

:deep(.vc-day-content .vc-day-content-wrapper .vc-day-content-item[data-level="Intermédiaire"]) {
  background-color: rgb(var(--v-theme-warning)) !important;
}
</style>
