<template>
  <VDialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="1200px"
    persistent class="event-selector-modal">
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>Gérer les inscriptions de {{ props.memberName }}</span>
        <VBtn icon="mdi-close" variant="text" size="small" @click="closeModal" />
      </VCardTitle>

      <VCardText>
        <VRow>
          <!-- Colonne de gauche : Sélection de date -->
          <VCol cols="12" lg="4" xl="4">
            <VDatePicker v-model="selectedDate" :min="minDate" :max="maxDate" :allowed-dates="allowedDates" locale="fr"
              color="primary" @update:model-value="onDateSelected" class="date-picker-responsive" elevation="2"
              rounded="lg" />
          </VCol>

          <!-- Colonne de droite : Événements et sélection -->
          <VCol cols="12" lg="8" xl="8">
            <!-- Événements de la date sélectionnée -->
            <div v-if="selectedDate" class="events-section">
              <h4 class="text-h6">
                Événements du {{ formatSelectedDate(selectedDate) }}
              </h4>
              <!-- Liste des événements avec options intégrées - Interface compacte -->
              <div class="events-container">
                <VCard v-for="event in groupedEvents" :key="event.originalEventId || event.id" class="event-card"
                  :class="{ 'event-card--selected': isEventSelected(event) }" elevation="1"
                  @click="toggleEventCard(event)">
                  <VCardText class="pa-4 event-card-content">
                    <!-- Contenu principal de l'événement -->
                    <div class="event-main-content">
                      <!-- En-tête de l'événement -->
                      <div class="event-header">
                        <div class="event-title-section">
                          <VIcon :icon="getEventTypeIcon(event.type)" :color="getEventTypeColor(event.type)"
                            size="small" class="event-icon" />
                          <h5 class="event-title">{{ event.title }}</h5>
                        </div>
                        <div class="event-details">
                          <div class="event-chips">
                            <VChip v-if="event.level" :color="getLevelColor(event.level)" size="small" variant="flat"
                              class="event-chip">
                              {{ event.level }}
                            </VChip>
                            <VChip v-if="event.recurrence && event.recurrence !== 'Aucune'" color="info" size="small"
                              variant="outlined" class="event-chip">
                              {{ event.recurrence }}
                            </VChip>
                          </div>
                          <div class="event-meta">
                            <span class="event-time">
                              <VIcon icon="mdi-clock-outline" size="x-small" class="me-1" />
                              {{ event.time }}
                            </span>
                            <span class="event-location">
                              <VIcon icon="mdi-map-marker" size="x-small" class="me-1" />
                              {{ event.location }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Options de participation (toujours en bas) -->
                    <div v-if="event.recurrence && event.recurrence !== 'Aucune'" class="participation-options"
                      @click.stop>
                      <VRadioGroup :model-value="getEventSelectionType(event)"
                        @update:model-value="(value: string | null) => updateEventSelection(event, value || 'none')"
                        inline density="compact" hide-details>
                        <VRadio :value="'all'" :label="`Tous les ${getRecurrenceLabel(event.recurrence)}`"
                          color="success" />
                        <VRadio :value="'single'" :label="`Seulement le ${formatEventDate({ start: selectedDate })}`"
                          color="primary" />
                        <VRadio :value="'none'" label="Ne pas participer" color="default" />
                      </VRadioGroup>
                    </div>

                    <!-- Événement ponctuel -->
                    <div v-else class="participation-options" @click.stop>
                      <VCheckbox :model-value="isEventSelected(event)"
                        @update:model-value="(checked: boolean | null) => toggleSimpleEvent(event, checked || false)"
                        :label="`Participer à cet événement`" color="primary" hide-details />
                    </div>
                  </VCardText>
                </VCard>
              </div>

              <!-- Message si aucun événement pour cette date -->
              <div v-if="eventsOnSelectedDate.length === 0" class="no-events-message mt-4">
                <VAlert type="info" variant="tonal" class="text-center">
                  <VIcon icon="mdi-calendar-blank" class="me-2" />
                  Aucun événement disponible pour cette date.
                </VAlert>
              </div>
            </div>

            <!-- Message si aucun événement -->
            <div v-else-if="selectedDate && eventsOnSelectedDate.length === 0" class="no-events-message">
              <VAlert type="info" variant="tonal" class="text-center">
                <VIcon icon="mdi-calendar-blank" class="me-2" />
                Aucun événement disponible pour cette date.
              </VAlert>
            </div>

            <!-- Message si aucune date sélectionnée -->
            <div v-else class="no-events-message">
              <VAlert type="info" variant="tonal" class="text-center">
                <VIcon icon="mdi-calendar-search" class="me-2" />
                Sélectionnez une date pour voir les événements disponibles.
              </VAlert>
            </div>
          </VCol>
        </VRow>

        <!-- Liste des événements inscrits (pleine largeur) -->
        <div v-if="enrolledEvents.length > 0" class="selected-events-section">
          <h4 class="text-h6">
            <VIcon icon="mdi-check-circle" class="me-2" />
            Événements auxquels {{ props.memberName }} est inscrit ({{ enrolledEvents.length }})
          </h4>
          <VList density="compact">
            <VListItem v-for="event in enrolledEvents"
              :key="event.eventId + (event.isAllOccurrences ? '_all' : event.isSingleOccurrence ? '_single' : '')"
              class="selected-event-item">
              <template #prepend>
                <VIcon :icon="getEventTypeIcon(event.type)" :color="getEventTypeColor(event.type)" />
              </template>

              <VListItemTitle>
                <div class="d-flex align-center flex-wrap">
                  <span class="font-weight-medium me-2">{{ event.title }}</span>
                  <VChip v-if="event.isAllOccurrences" color="success" size="x-small" variant="outlined">
                    Toutes les occurrences
                  </VChip>
                  <VChip v-if="event.isSingleOccurrence" color="primary" size="x-small" variant="outlined">
                    Occurrence unique
                  </VChip>
                  <VChip v-if="event.level" :color="getLevelColor(event.level)" size="x-small" variant="flat">
                    {{ event.level }}
                  </VChip>
                </div>
              </VListItemTitle>

              <VListItemSubtitle>
                <div class="d-flex align-center flex-wrap">
                  <span v-if="event.isSingleOccurrence && event.occurrenceDate" class="me-2">
                    <VIcon icon="mdi-calendar" size="small" class="me-1" />
                    {{ formatEventDate({ start: event.occurrenceDate }) }}
                  </span>
                  <span v-if="event.time" class="me-2">
                    <VIcon icon="mdi-clock-outline" size="small" class="me-1" />
                    {{ event.time }}
                  </span>
                  <span v-if="event.location" class="me-2">
                    <VIcon icon="mdi-map-marker" size="small" class="me-1" />
                    {{ event.location }}
                  </span>
                  <span v-if="event.recurrence && event.recurrence !== 'Aucune'" class="me-2">
                    <VIcon icon="mdi-repeat" size="small" class="me-1" />
                    {{ event.recurrence }}
                  </span>
                </div>
              </VListItemSubtitle>

              <template #append>
                <VBtn icon="mdi-close" variant="text" size="small" @click="removeEvent(event)"
                  title="Supprimer de la sélection" />
              </template>
            </VListItem>
          </VList>
        </div>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn variant="text" @click="closeModal">
          Annuler
        </VBtn>
        <VBtn color="primary" @click="confirmSelection">
          Valider la sélection
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useApi } from '@/services/api'

// Props
interface Props {
  modelValue: boolean
  selectedEventIds?: string[]
  memberName?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedEventIds: () => [],
  memberName: 'le membre'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [events: any[]]
}>()

// Composables
const api = useApi()

// État réactif
const events = ref<any[]>([])
const loading = ref(false)
const selectedDate = ref<string | null>(null)

// Événements sélectionnés (tous les événements auxquels le membre est inscrit)
const selectedEvents = ref<any[]>([])

// Sélection des événements - Gestion avec la nouvelle interface
const isUpdatingSelection = ref(false)

// Dates min/max pour le date picker
const minDate = computed(() => {
  const date = new Date()
  return date.toISOString().split('T')[0]
})

const maxDate = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().split('T')[0]
})

// Événements de la date sélectionnée (avec génération des occurrences récurrentes)
const eventsOnSelectedDate = computed(() => {
  if (!selectedDate.value) return []

  const targetDate = new Date(selectedDate.value)
  const targetDateString = targetDate.toISOString().split('T')[0]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const eventsForDate: any[] = []

  events.value.forEach((event, index) => {

    if (event.recurrence === 'Aucune') {
      // Événement ponctuel : vérifier si c'est la bonne date
      const eventDate = new Date(event.start).toISOString().split('T')[0]
      if (eventDate === targetDateString) {
        eventsForDate.push(event)
      }
    } else {
      // Événement récurrent : générer les occurrences futures
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      // Si la date de fin est identique à la date de début, utiliser une durée par défaut de 1h30
      const duration = eventEnd.getTime() - eventStart.getTime()
      const defaultDuration = 90 * 60 * 1000 // 1h30 en millisecondes
      const finalDuration = duration > 0 ? duration : defaultDuration

      // Calculer les occurrences futures jusqu'à 1 an dans le futur
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1)

      // Vérifier d'abord si la date cible correspond à la date d'origine de l'événement
      const originalEventDateString = eventStart.toISOString().split('T')[0]

      if (originalEventDateString === targetDateString) {
        // La date cible correspond à la date d'origine de l'événement récurrent
        const virtualEvent = {
          ...event,
          _id: `${event._id}_${eventStart.getTime()}`,
          start: new Date(eventStart),
          end: new Date(eventStart.getTime() + finalDuration),
          isVirtualOccurrence: true,
          originalEventId: event._id,
          occurrenceDate: originalEventDateString
        }
        eventsForDate.push(virtualEvent)
        return // Passer au prochain événement
      }

      let currentOccurrence = new Date(eventStart)

      // Si l'événement original est dans le passé, calculer la prochaine occurrence
      const currentOccurrenceDateString = currentOccurrence.toISOString().split('T')[0]
      const todayString = today.toISOString().split('T')[0]


      if (currentOccurrenceDateString < todayString) {
        switch (event.recurrence) {
          case 'Hebdomadaire':
            while (currentOccurrence.toISOString().split('T')[0] < todayString) {
              currentOccurrence.setDate(currentOccurrence.getDate() + 7)
            }
            break
          case 'Toutes les 2 semaines':
            while (currentOccurrence.toISOString().split('T')[0] < todayString) {
              currentOccurrence.setDate(currentOccurrence.getDate() + 14)
            }
            break
          case 'Mensuelle':
            while (currentOccurrence.toISOString().split('T')[0] < todayString) {
              currentOccurrence.setMonth(currentOccurrence.getMonth() + 1)
            }
            break
        }
      }

      // Générer les occurrences jusqu'à la date de fin
      while (currentOccurrence <= endDate) {
        const occurrenceDateString = currentOccurrence.toISOString().split('T')[0]

        if (occurrenceDateString === targetDateString) {
          // Créer une occurrence virtuelle pour cette date
          const virtualEvent = {
            ...event,
            _id: `${event._id}_${currentOccurrence.getTime()}`,
            start: new Date(currentOccurrence),
            end: new Date(currentOccurrence.getTime() + finalDuration),
            isVirtualOccurrence: true,
            originalEventId: event._id,
            occurrenceDate: occurrenceDateString
          }
          eventsForDate.push(virtualEvent)
          break // On a trouvé l'occurrence pour cette date
        }

        // Calculer la prochaine occurrence
        switch (event.recurrence) {
          case 'Hebdomadaire':
            currentOccurrence.setDate(currentOccurrence.getDate() + 7)
            break
          case 'Toutes les 2 semaines':
            currentOccurrence.setDate(currentOccurrence.getDate() + 14)
            break
          case 'Mensuelle':
            currentOccurrence.setMonth(currentOccurrence.getMonth() + 1)
            break
        }
      }
    }
  })

  return eventsForDate
})

// Structure des événements groupés pour l'interface compacte
const groupedEvents = computed(() => {
  const grouped: any[] = []
  const processedEvents = new Set<string>() // Pour éviter les doublons

  eventsOnSelectedDate.value.forEach(event => {
    if (event.isVirtualOccurrence) {
      // C'est une occurrence d'un événement récurrent
      const originalEventId = event.originalEventId

      if (!processedEvents.has(originalEventId)) {
        processedEvents.add(originalEventId)

        // Trouver l'événement original
        const originalEvent = events.value.find(e => e._id === originalEventId)
        if (originalEvent) {
          grouped.push({
            id: originalEventId,
            originalEventId: originalEventId,
            title: originalEvent.title,
            type: originalEvent.type,
            level: originalEvent.level,
            location: originalEvent.location,
            recurrence: originalEvent.recurrence,
            time: `${timeShort(originalEvent.start)}–${timeShort(originalEvent.end)}`,
            isRecurring: true
          })
        }
      }
    } else if (event.recurrence === 'Aucune') {
      // Événement ponctuel
      grouped.push({
        id: event._id,
        title: event.title,
        type: event.type,
        level: event.level,
        location: event.location,
        recurrence: 'Aucune',
        time: `${timeShort(event.start)}–${timeShort(event.end)}`,
        isRecurring: false
      })
    }
  })

  return grouped
})

// Événements inscrits à afficher (tous, sans filtrage par date)
const enrolledEvents = computed(() => {
  return selectedEvents.value
})

// Dates autorisées (dates qui ont des événements, y compris les occurrences récurrentes)
const allowedDates = computed(() => {
  const dates = new Set<string>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date()
  endDate.setFullYear(endDate.getFullYear() + 1)

  events.value.forEach((event, index) => {

    if (event.recurrence === 'Aucune') {
      // Événement ponctuel
      const eventDate = new Date(event.start).toISOString().split('T')[0]
      if (new Date(eventDate) >= today) {
        dates.add(eventDate)
      }
    } else {
      // Événement récurrent : générer toutes les occurrences futures
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      const duration = eventEnd.getTime() - eventStart.getTime()

      let currentOccurrence = new Date(eventStart)
      let occurrenceCount = 0

      // Si l'événement original est dans le passé, calculer la prochaine occurrence
      const currentOccurrenceDateString = currentOccurrence.toISOString().split('T')[0]
      const todayString = today.toISOString().split('T')[0]

      if (currentOccurrenceDateString < todayString) {
        switch (event.recurrence) {
          case 'Hebdomadaire':
            while (currentOccurrence.toISOString().split('T')[0] < todayString && occurrenceCount < 100) { // Limite de sécurité
              currentOccurrence.setDate(currentOccurrence.getDate() + 7)
              occurrenceCount++
            }
            break
          case 'Toutes les 2 semaines':
            while (currentOccurrence.toISOString().split('T')[0] < todayString && occurrenceCount < 100) {
              currentOccurrence.setDate(currentOccurrence.getDate() + 14)
              occurrenceCount++
            }
            break
          case 'Mensuelle':
            while (currentOccurrence.toISOString().split('T')[0] < todayString && occurrenceCount < 100) {
              currentOccurrence.setMonth(currentOccurrence.getMonth() + 1)
              occurrenceCount++
            }
            break
        }
      }

      // Générer les occurrences jusqu'à la date de fin
      while (currentOccurrence <= endDate && occurrenceCount < 200) { // Limite de sécurité
        const occurrenceDateString = currentOccurrence.toISOString().split('T')[0]
        dates.add(occurrenceDateString)
        occurrenceCount++

        // Calculer la prochaine occurrence
        switch (event.recurrence) {
          case 'Hebdomadaire':
            currentOccurrence.setDate(currentOccurrence.getDate() + 7)
            break
          case 'Toutes les 2 semaines':
            currentOccurrence.setDate(currentOccurrence.getDate() + 14)
            break
          case 'Mensuelle':
            currentOccurrence.setMonth(currentOccurrence.getMonth() + 1)
            break
        }
      }
    }
  })

  const result = Array.from(dates).sort()
  return result
})

// Méthodes utilitaires simplifiées
function timeShort(dateString: string | Date) {
  const date = new Date(dateString)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}


// Gestion de la sélection avec la nouvelle interface
function isEventSelected(event: any): boolean {
  if (event.isRecurring) {
    // Pour les événements récurrents, vérifier si "toutes les occurrences" ou "occurrence unique" est sélectionné
    return selectedEvents.value.some(selected =>
      selected.eventId === event.originalEventId &&
      (selected.isAllOccurrences || selected.isSingleOccurrence)
    )
  } else {
    // Pour les événements ponctuels
    return selectedEvents.value.some(selected => selected.eventId === event.id)
  }
}

function getEventSelectionType(event: any): string {
  if (!event.isRecurring) return 'none'

  const selected = selectedEvents.value.find(selected => selected.eventId === event.originalEventId)

  if (!selected) return 'none'

  if (selected.isAllOccurrences) return 'all'
  if (selected.isSingleOccurrence) {
    // Vérifier si la date de l'occurrence unique correspond à la date actuellement sélectionnée
    if (selected.occurrenceDate === selectedDate.value) {
      return 'single'
    } else {
      // L'occurrence unique est pour une autre date, donc "ne pas participer" pour cette date
      return 'none'
    }
  }
  return 'none'
}

function getRecurrenceLabel(recurrence: string): string {
  switch (recurrence) {
    case 'Hebdomadaire': return 'mercredis'
    case 'Toutes les 2 semaines': return 'mercredis (2 semaines)'
    case 'Mensuelle': return 'mercredis du mois'
    default: return 'occurrences'
  }
}

function updateEventSelection(event: any, selectionType: string) {
  // Retirer d'abord toute sélection existante pour cet événement (toutes les occurrences ET occurrences uniques)
  selectedEvents.value = selectedEvents.value.filter(selected =>
    selected.eventId !== event.originalEventId
  )

  if (selectionType === 'all') {
    // Ajouter "toutes les occurrences" et retirer toutes les occurrences uniques de cet événement
    const newEvent = {
      eventId: event.originalEventId,
      isAllOccurrences: true,
      isRecurring: true,
      title: event.title,
      type: event.type,
      level: event.level,
      location: event.location,
      recurrence: event.recurrence,
      time: event.time
    }
    selectedEvents.value.push(newEvent)

    // Retirer toutes les occurrences uniques de ce même événement récurrent
    selectedEvents.value = selectedEvents.value.filter(selected =>
      !(selected.isSingleOccurrence && selected.eventId === event.originalEventId)
    )
  } else if (selectionType === 'single') {
    // Ajouter "occurrence unique"
    const newEvent = {
      eventId: event.originalEventId,
      isSingleOccurrence: true,
      isRecurring: true,
      occurrenceDate: selectedDate.value,
      title: event.title,
      type: event.type,
      level: event.level,
      location: event.location,
      time: event.time
    }
    selectedEvents.value.push(newEvent)
  }
  // Si 'none', on ne fait rien (déjà retiré)
}

function toggleSimpleEvent(event: any, checked: boolean) {
  if (checked) {
    // Ajouter l'événement ponctuel
    selectedEvents.value.push({
      eventId: event.id,
      isRecurring: false,
      title: event.title,
      type: event.type,
      level: event.level,
      location: event.location,
      time: event.time,
      eventDate: selectedDate.value // Ajouter la date de l'événement ponctuel
    })
  } else {
    // Retirer l'événement ponctuel
    selectedEvents.value = selectedEvents.value.filter(selected => selected.eventId !== event.id)
  }
}

function toggleEventCard(event: any) {
  // Pour les événements récurrents, faire un cycle : none → all → single → none
  if (event.isRecurring) {
    const currentType = getEventSelectionType(event)

    if (currentType === 'none') {
      updateEventSelection(event, 'all')
    } else if (currentType === 'all') {
      updateEventSelection(event, 'single')
    } else if (currentType === 'single') {
      updateEventSelection(event, 'none')
    } else {
      // Par défaut, commencer par "all"
      updateEventSelection(event, 'all')
    }
  } else {
    // Pour les événements ponctuels, basculer la checkbox
    const isSelected = isEventSelected(event)
    toggleSimpleEvent(event, !isSelected)
  }
}


function removeEvent(event: any) {
  const index = selectedEvents.value.findIndex(selected => {
    if (event.isAllOccurrences || event.isSingleOccurrence) {
      return selected.eventId === event.eventId &&
        selected.isAllOccurrences === event.isAllOccurrences &&
        selected.isSingleOccurrence === event.isSingleOccurrence
    } else {
      return selected.eventId === event.eventId
    }
  })

  if (index >= 0) {
    selectedEvents.value.splice(index, 1)
    updateCheckboxSelection()
  }
}

// Synchronisation de la nouvelle interface avec les événements sélectionnés
function updateCheckboxSelection() {
  // Cette fonction n'est plus nécessaire avec la nouvelle interface
  // car la sélection est gérée directement par les composants VRadioGroup et VCheckbox
  // La logique de présélection est maintenant dans getEventSelectionType()
}

function getEventTypeIcon(type: string) {
  switch (type) {
    case 'Cours': return 'mdi-school'
    case 'Événement': return 'mdi-calendar-star'
    case 'Compétition': return 'mdi-trophy'
    case 'Stage': return 'mdi-account-group'
    case 'recurring': return 'mdi-check-all'
    default: return 'mdi-calendar'
  }
}

function getEventTypeColor(type: string) {
  switch (type) {
    case 'Cours': return 'primary'
    case 'Événement': return 'success'
    case 'Compétition': return 'warning'
    case 'Stage': return 'info'
    case 'recurring': return 'success'
    default: return 'default'
  }
}

function getLevelColor(level: string) {
  switch (level) {
    case 'Débutant': return 'success'
    case 'Novice': return 'info'
    case 'Intermédiaire': return 'warning'
    case 'Avancé': return 'error'
    case 'Tous niveaux': return 'primary'
    default: return 'primary'
  }
}

function formatSelectedDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function formatEventDate(event: any) {
  const date = new Date(event.start)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  })
}

function onDateSelected(date: string | Date | null) {
  // Convertir en chaîne de caractères si c'est un objet Date
  if (date instanceof Date) {
    // Utiliser les méthodes locales pour éviter les problèmes de fuseau horaire
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    selectedDate.value = `${year}-${month}-${day}`
  } else {
    selectedDate.value = date
  }

  updateCheckboxSelection()
}

// Chargement des événements (événements futurs + événements récurrents)
async function loadEvents() {
  try {
    loading.value = true

    // Utiliser le nouvel endpoint qui récupère tous les événements pertinents
    const response = await api.get('/events/for-selection?limit=1000')

    if (response.success) {
      events.value = response.data as any[]
    }

  } catch (error) {
    // Erreur silencieuse - l'utilisateur verra un message approprié
  } finally {
    loading.value = false
  }
}

// Gestion de la modale
function closeModal() {
  emit('update:modelValue', false)
}

function confirmSelection() {
  // Convertir les événements sélectionnés au format attendu par le parent
  const processedEvents = selectedEvents.value.map(event => {
    if (event.isAllOccurrences) {
      return {
        eventId: event.eventId,
        isAllOccurrences: true,
        isRecurring: true,
        title: event.title,
        type: event.type,
        level: event.level,
        location: event.location,
        recurrence: event.recurrence,
        time: event.time
      }
    } else if (event.isSingleOccurrence) {
      return {
        eventId: event.eventId,
        occurrenceDate: event.occurrenceDate,
        isRecurring: true,
        title: event.title,
        type: event.type,
        level: event.level,
        location: event.location,
        time: event.time
      }
    } else {
      return {
        eventId: event.eventId,
        isRecurring: false,
        title: event.title,
        type: event.type,
        level: event.level,
        location: event.location,
        time: event.time,
        eventDate: event.eventDate // Inclure la date de l'événement ponctuel
      }
    }
  })

  emit('confirm', processedEvents)
  closeModal()
}

// Initialiser les événements sélectionnés depuis les props
function initializeSelectedEvents() {
  selectedEvents.value = []

  if (props.selectedEventIds && props.selectedEventIds.length > 0) {
    props.selectedEventIds.forEach(eventEnrollment => {
      if (typeof eventEnrollment === 'object') {
        const enrollment = eventEnrollment as any
        const event = events.value.find(e => e._id === enrollment.eventId)
        if (event) {
          if (enrollment.isAllOccurrences) {
            selectedEvents.value.push({
              eventId: enrollment.eventId,
              isAllOccurrences: true,
              isRecurring: true,
              title: event.title,
              type: event.type,
              level: event.level,
              location: event.location,
              recurrence: event.recurrence,
              time: `${timeShort(event.start)}–${timeShort(event.end)}`
            })
          } else if (enrollment.occurrenceDate) {
            selectedEvents.value.push({
              eventId: enrollment.eventId,
              isSingleOccurrence: true,
              isRecurring: true,
              occurrenceDate: enrollment.occurrenceDate,
              title: event.title,
              type: event.type,
              level: event.level,
              location: event.location,
              time: `${timeShort(event.start)}–${timeShort(event.end)}`
            })
          } else {
            selectedEvents.value.push({
              eventId: event._id,
              isRecurring: false,
              title: event.title,
              type: event.type,
              level: event.level,
              location: event.location,
              time: `${timeShort(event.start)}–${timeShort(event.end)}`
            })
          }
        }
      }
    })

    // Définir une date par défaut (première date future disponible)
    if (!selectedDate.value) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Utiliser la première date autorisée (qui est déjà triée et ne contient que les dates futures)
      if (allowedDates.value.length > 0) {
        selectedDate.value = allowedDates.value[0]
      }
    }
  }
}

// Watchers simplifiés
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadEvents()
  }
})

watch(() => props.selectedEventIds, () => {
  if (events.value.length > 0) {
    initializeSelectedEvents()
    updateCheckboxSelection()
  }
}, { deep: true })

watch(events, () => {
  if (events.value.length > 0) {
    initializeSelectedEvents()
    updateCheckboxSelection()
  }
})

// Supprimé le watcher sur selectedEvents pour éviter la boucle infinie

watch(selectedDate, () => {
  updateCheckboxSelection()
})

watch(groupedEvents, () => {
  updateCheckboxSelection()
}, { deep: true })

// Lifecycle
onMounted(() => {
  if (props.modelValue) {
    loadEvents()
  }
})
</script>

<style>
@import '@/assets/event-selector-modal.css';

/* Styles pour la nouvelle interface compacte */
.events-container {
  max-height: 600px;
  overflow-y: auto;
  padding: 12px;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  margin-bottom: 16px;
}

/* Structure de base de la carte */
.event-card {
  margin-bottom: 16px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  background: rgb(var(--v-theme-surface-container));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-height: 140px;
}

.event-card:last-child {
  margin-bottom: 0;
}

.event-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: rgb(var(--v-theme-outline));
}

.event-card--selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary-container));
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.2);
}

.event-card--selected .event-title {
  color: rgb(var(--v-theme-on-primary-container));
}

.event-card--selected .event-time,
.event-card--selected .event-location {
  color: rgb(var(--v-theme-on-primary-container));
  opacity: 0.8;
}

/* Contenu de la carte avec flexbox */
.event-card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 16px;
}

.event-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.event-header {
  margin-bottom: 8px;
}

/* Section participation - toujours en bas */
.participation-options {
  margin-top: auto;
  padding: 12px 16px 8px 16px;
  border-top: 1px solid rgb(var(--v-theme-outline-variant));
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 0 0 8px 8px;
  margin-left: -16px;
  margin-right: -16px;
  margin-bottom: -16px;
}

.participation-options .v-radio-group {
  margin-top: 0;
}

.participation-options .v-radio {
  margin-right: 16px;
  margin-bottom: 8px;
}

.participation-options .v-radio .v-label {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
}

.event-card .event-title-section {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.event-card .event-icon {
  margin-right: 1.4rem;
  flex-shrink: 0;
}

.event-card .event-title-section h5.event-title {
  font-size: 1.3rem !important;
  font-weight: 600 !important;
  margin: 0 !important;
  color: rgb(var(--v-theme-primary-darken-1)) !important;
}

.event-card .event-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-card .event-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.event-card .event-chip {
  font-size: 0.8rem;
}

.event-card .event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.event-card .event-time,
.event-card .event-location {
  font-size: 0.85rem;
  color: rgb(var(--v-theme-on-surface-variant));
  display: flex;
  align-items: center;
}

/* Amélioration de l'espacement des éléments sélectionnés */
.selected-event-item {
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.selected-event-item:hover {
  background: rgb(var(--v-theme-surface-variant));
}

/* Responsive pour la nouvelle interface */
@media (max-width: 768px) {
  .events-container {
    padding: 8px;
  }

  .event-card {
    margin-bottom: 12px;
    min-height: 120px;
  }

  .event-card-content {
    padding: 12px;
  }

  .event-header {
    margin-bottom: 8px;
  }

  .event-card .event-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .event-card .event-icon {
    margin-right: 0;
    margin-bottom: 4px;
  }

  .event-card .event-title-section h5.event-title {
    font-size: 1.1rem !important;
  }

  .event-card .event-details {
    gap: 6px;
  }

  .event-card .event-chips {
    gap: 4px;
  }

  .event-card .event-chip {
    font-size: 0.75rem;
    height: 24px;
  }

  .event-card .event-meta {
    flex-direction: column;
    gap: 4px;
  }

  .event-card .event-time,
  .event-card .event-location {
    font-size: 0.8rem;
  }

  .participation-options {
    margin-left: -12px;
    margin-right: -12px;
    margin-bottom: -12px;
    padding: 12px;
  }

  .participation-options .v-radio-group {
    flex-direction: column;
    gap: 4px;
  }

  .participation-options .v-radio {
    margin-right: 0;
    margin-bottom: 6px;
    width: 100%;
  }

  .participation-options .v-radio .v-label {
    font-size: 0.85rem;
    line-height: 1.2;
  }
}

/* Pour les très petits écrans */
@media (max-width: 480px) {
  .events-container {
    padding: 4px;
  }

  .event-card {
    margin-bottom: 8px;
    min-height: 100px;
  }

  .event-card-content {
    padding: 8px;
  }

  .event-card .event-title-section h5.event-title {
    font-size: 1rem !important;
  }

  .event-card .event-chip {
    font-size: 0.7rem;
    height: 20px;
    padding: 0 6px;
  }

  .event-card .event-time,
  .event-card .event-location {
    font-size: 0.75rem;
  }

  .participation-options {
    margin-left: -8px;
    margin-right: -8px;
    margin-bottom: -8px;
    padding: 12px 8px 8px 8px;
  }

  .participation-options .v-radio .v-label {
    font-size: 0.8rem;
  }

  .event-header {
    margin-bottom: 6px;
  }

  .event-details {
    gap: 4px;
  }
}
</style>
