<template>
  <VDialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="1200px"
    persistent class="event-selector-modal">
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>Sélectionner les événements</span>
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
            <div v-if="selectedDate && eventsOnSelectedDate.length > 0" class="events-section">
              <h4 class="text-h6">
                Événements du {{ formatSelectedDate(selectedDate) }}
              </h4>
              <!-- Treeview des événements -->
              <VTreeview v-model="treeviewSelection" :items="treeviewItems" item-key="id" item-title="title"
                item-children="children" selectable return-object class="events-treeview" density="compact"
                @update:selected="(val: any) => onTreeviewSelectionChange(val)">
                <template v-if="false" #prepend="{ item }">
                  <VIcon :icon="item.icon" :color="item.color" size="small" class="me-2" />
                </template>

                <template #title="{ item }">
                  <div class="d-flex align-center flex-wrap">

                    <!-- Icône pour tous les événements -->
                    <VIcon :icon="(item as any).isSimpleEvent ? getEventTypeIcon(item.type || 'Cours') : item.icon"
                      :color="(item as any).isSimpleEvent ? getEventTypeColor(item.type || 'Cours') : item.color"
                      size="small" class="me-2" />

                    <VChip v-if="item.level" :color="getLevelColor(item.level)" size="x-small" variant="flat"
                      class="me-2">
                      {{ item.level }}
                    </VChip>
                    <span class="font-weight-medium me-2">{{ item.title }}</span>


                    <VChip v-if="item.recurrence" color="info" size="x-small" variant="outlined" class="me-2">
                      {{ item.recurrence }}
                    </VChip>

                    <span v-if="item.time" class="text-caption me-2">
                      {{ item.time }}
                    </span>

                    <span v-if="item.location" class="text-caption">
                      <VIcon icon="mdi-map-marker" size="x-small" class="me-1" />
                      {{ item.location }}
                    </span>
                  </div>
                </template>
              </VTreeview>
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

        <!-- Liste des événements sélectionnés (pleine largeur) -->
        <div v-if="selectedEvents.length > 0" class="selected-events-section">
          <h4 class="text-h6">
            <VIcon icon="mdi-check-circle" class="me-2" />
            Événements sélectionnés ({{ selectedEvents.length }})
          </h4>
          <VList density="compact">
            <VListItem v-for="event in selectedEvents" :key="getEventKey(event)" class="selected-event-item">
              <template #prepend>
                <VIcon :icon="getEventTypeIcon(event.type)" :color="getEventTypeColor(event.type)" />
              </template>

              <VListItemTitle>
                <div class="d-flex align-center flex-wrap">
                  <VChip :color="getLevelColor(event.level)" size="small" variant="flat" class="me-2">
                    {{ event.level }}
                  </VChip>
                  <span class="font-weight-medium">{{ event.title }}</span>
                  <VChip v-if="event.isAllOccurrences" color="success" size="x-small" variant="outlined" class="ml-2">
                    Toutes les occurrences
                  </VChip>
                </div>
              </VListItemTitle>

              <VListItemSubtitle>
                <div class="d-flex align-center flex-wrap">
                  <span v-if="!event.isAllOccurrences && event.start" class="me-2">
                    <VIcon icon="mdi-calendar" size="small" class="me-1" />
                    {{ formatEventDate(event) }}
                  </span>
                  <span v-if="!event.isAllOccurrences && !event.start && event.title" class="me-2">
                    <VIcon icon="mdi-calendar" size="small" class="me-1" />
                    {{ event.title }}
                  </span>
                  <span class="me-2">
                    <VIcon icon="mdi-clock-outline" size="small" class="me-1" />
                    {{ event.time || (event.start && event.end ? `${timeShort(event.start)}–${timeShort(event.end)}` :
                      '') }}
                  </span>
                  <span v-if="event.location" class="me-2">
                    <VIcon icon="mdi-map-marker" size="small" class="me-1" />
                    {{ event.location }}
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useApi } from '@/services/api'

// Props
interface Props {
  modelValue: boolean
  selectedEventIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedEventIds: () => []
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

// Événements sélectionnés
const selectedEvents = ref<any[]>([])

// Treeview
const treeviewSelection = ref<any[]>([])

// Dates min/max pour le date picker
const minDate = computed(() => {
  const date = new Date()
  // Commencer à partir d'aujourd'hui (pas de dates passées)
  return date.toISOString().split('T')[0]
})

const maxDate = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1) // 1 an dans le futur
  return date.toISOString().split('T')[0]
})

// Événements virtuels pour le calendrier (génère les occurrences récurrentes)
const virtualEvents = computed(() => {
  const virtualEvents: any[] = []
  const now = new Date()
  // Ne pas inclure les dates passées - commencer à partir d'aujourd'hui
  const startDate = new Date(now)
  startDate.setHours(0, 0, 0, 0) // Commencer au début de la journée
  const endDate = new Date(now)
  endDate.setFullYear(endDate.getFullYear() + 1) // 1 an dans le futur

  events.value.forEach(event => {
    if (event.recurrence === 'Aucune') {
      // Événement ponctuel : l'ajouter seulement s'il est dans le futur
      const eventDate = new Date(event.start)
      if (eventDate >= startDate) {
        virtualEvents.push(event)
      }
    } else {
      // Événement récurrent : générer seulement les occurrences futures
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      const duration = eventEnd.getTime() - eventStart.getTime()

      let currentOccurrence = new Date(eventStart)

      // Générer les occurrences jusqu'à la date de fin
      while (currentOccurrence <= endDate) {
        // Ne générer que les occurrences futures (aujourd'hui inclus)
        if (currentOccurrence >= startDate) {
          const virtualEvent = {
            ...event,
            _id: `${event._id}_${currentOccurrence.getTime()}`, // ID unique pour chaque occurrence
            start: new Date(currentOccurrence),
            end: new Date(currentOccurrence.getTime() + duration),
            isVirtualOccurrence: true,
            originalEventId: event._id,
            occurrenceDate: currentOccurrence.toISOString().split('T')[0]
          }
          virtualEvents.push(virtualEvent)
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

  return virtualEvents
})

// Dates autorisées (dates qui ont des événements)
const allowedDates = computed(() => {
  const dates = new Set<string>()
  virtualEvents.value.forEach(event => {
    const eventDate = new Date(event.start).toISOString().split('T')[0]
    dates.add(eventDate)
  })
  return Array.from(dates)
})

// Événements de la date sélectionnée
const eventsOnSelectedDate = computed(() => {
  if (!selectedDate.value) return []

  const targetDate = new Date(selectedDate.value)
  return virtualEvents.value.filter(event => {
    const eventDate = new Date(event.start)
    return eventDate.toDateString() === targetDate.toDateString()
  })
})

// Grouper les événements par événement original
const groupedEventsOnSelectedDate = computed(() => {
  const groups = new Map<string, any>()

  eventsOnSelectedDate.value.forEach(event => {
    const originalId = event.isVirtualOccurrence ? event.originalEventId : event._id

    if (!groups.has(originalId)) {
      const originalEvent = events.value.find(e => e._id === originalId)
      groups.set(originalId, {
        originalId,
        title: originalEvent?.title || event.title,
        type: originalEvent?.type || event.type,
        level: originalEvent?.level || event.level,
        location: originalEvent?.location || event.location,
        recurrence: originalEvent?.recurrence || 'Aucune',
        isRecurring: originalEvent?.recurrence !== 'Aucune',
        occurrences: []
      })
    }

    groups.get(originalId).occurrences.push(event)
  })

  return Array.from(groups.values())
})

// Items pour le VTreeview
const treeviewItems = computed(() => {
  const items: any[] = []

  groupedEventsOnSelectedDate.value.forEach(eventGroup => {
    if (eventGroup.isRecurring) {
      // Pour les événements récurrents, créer un groupe avec des enfants
      const baseItem: any = {
        id: eventGroup.originalId,
        title: eventGroup.title,
        icon: getEventTypeIcon(eventGroup.type),
        color: getEventTypeColor(eventGroup.type),
        level: eventGroup.level,
        location: eventGroup.location,
        recurrence: eventGroup.recurrence,
        time: eventGroup.occurrences[0] ? `${timeShort(eventGroup.occurrences[0].start)}–${timeShort(eventGroup.occurrences[0].end)}` : null,
        children: []
      }

      // Ajouter l'option "Toutes les occurrences"
      baseItem.children.push({
        id: `all_${eventGroup.originalId}`,
        title: 'Toutes les occurrences',
        icon: 'mdi-check-all',
        color: 'success',
        isAllOccurrences: true,
        originalEventId: eventGroup.originalId,
        time: eventGroup.occurrences[0] ? `${timeShort(eventGroup.occurrences[0].start)}–${timeShort(eventGroup.occurrences[0].end)}` : null,
        location: eventGroup.location,
        level: eventGroup.level,
        recurrence: eventGroup.recurrence
      })

      // Ajouter les occurrences individuelles
      eventGroup.occurrences.forEach((event: any) => {
        baseItem.children.push({
          id: getEventKey(event),
          title: formatEventDate(event),
          icon: 'mdi-calendar',
          color: 'primary',
          time: `${timeShort(event.start)}–${timeShort(event.end)}`,
          location: event.location,
          originalEventId: event.originalEventId,
          occurrenceDate: event.occurrenceDate,
          isVirtualOccurrence: event.isVirtualOccurrence
        })
      })

      items.push(baseItem)
    } else {
      // Pour les événements non récurrents, créer directement un item feuille
      eventGroup.occurrences.forEach((event: any) => {
        items.push({
          id: event._id,
          title: event.title,
          type: event.type,
          level: event.level,
          location: event.location,
          time: `${timeShort(event.start)}–${timeShort(event.end)}`,
          isSimpleEvent: true // Marquer comme événement simple
        })
      })
    }
  })

  return items
})

// Méthodes utilitaires
function timeShort(dateString: string | Date) {
  const date = new Date(dateString)
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`
}

function getEventKey(event: any) {
  if (event.isAllOccurrences) {
    return `all_${event.originalEventId}`
  }
  if (event.isVirtualOccurrence) {
    return `${event.originalEventId}_${event.occurrenceDate}`
  }
  return event._id
}

function isEventSelected(event: any) {
  const key = getEventKey(event)
  return selectedEvents.value.some(selected => getEventKey(selected) === key)
}

function isAllOccurrencesSelected(eventGroup: any) {
  return selectedEvents.value.some(event =>
    event.isAllOccurrences && event.originalEventId === eventGroup.originalId
  )
}

function toggleEventSelection(event: any) {
  const key = getEventKey(event)
  const existingIndex = selectedEvents.value.findIndex(selected => getEventKey(selected) === key)

  if (existingIndex >= 0) {
    selectedEvents.value.splice(existingIndex, 1)
  } else {
    // Si on sélectionne une occurrence individuelle, désélectionner "Toutes les occurrences"
    if (event.isVirtualOccurrence) {
      selectedEvents.value = selectedEvents.value.filter(selected =>
        !(selected.isAllOccurrences && selected.originalEventId === event.originalEventId)
      )
    }
    selectedEvents.value.push(event)
  }
}

function toggleAllOccurrences(eventGroup: any) {
  const allOccurrencesKey = `all_${eventGroup.originalId}`
  const existingIndex = selectedEvents.value.findIndex(event =>
    event.isAllOccurrences && event.originalEventId === eventGroup.originalId
  )

  if (existingIndex >= 0) {
    // Désélectionner toutes les occurrences
    selectedEvents.value.splice(existingIndex, 1)
  } else {
    // Sélectionner toutes les occurrences
    // D'abord, supprimer les occurrences individuelles de ce groupe
    selectedEvents.value = selectedEvents.value.filter(event =>
      !eventGroup.occurrences.some((occurrence: any) => getEventKey(occurrence) === getEventKey(event))
    )

    // Ajouter l'événement "toutes les occurrences"
    const allOccurrencesEvent = {
      ...eventGroup.occurrences[0],
      isAllOccurrences: true,
      originalEventId: eventGroup.originalId,
      title: eventGroup.title,
      type: eventGroup.type,
      level: eventGroup.level,
      location: eventGroup.location,
      recurrence: eventGroup.recurrence
    }
    selectedEvents.value.push(allOccurrencesEvent)
  }
}

function removeEvent(event: any) {
  const key = getEventKey(event)
  const index = selectedEvents.value.findIndex(selected => getEventKey(selected) === key)
  if (index >= 0) {
    selectedEvents.value.splice(index, 1)

    // Mettre à jour la sélection du VTreeview
    updateTreeviewSelection()
  }
}

// Fonction pour synchroniser la sélection du VTreeview avec selectedEvents
function updateTreeviewSelection() {
  const treeviewIds = selectedEvents.value.map(event => {
    if (event.isAllOccurrences) {
      return `all_${event.originalEventId}`
    } else if (event.isVirtualOccurrence) {
      return `${event.originalEventId}_${event.occurrenceDate}`
    } else {
      return event.eventId
    }
  })

  // Trouver les items correspondants dans le treeview
  const matchingItems: any[] = []
  treeviewIds.forEach(id => {
    // Chercher dans tous les items du treeview
    treeviewItems.value.forEach(item => {
      if (item.id === id) {
        matchingItems.push(item)
      } else if (item.children) {
        item.children.forEach((child: any) => {
          if (child.id === id) {
            matchingItems.push(child)
          }
        })
      }
    })
  })

  treeviewSelection.value = matchingItems
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

function onDateSelected(date: string | null) {
  selectedDate.value = date

  // Mettre à jour la sélection du treeview pour refléter les événements sélectionnés de cette date
  updateTreeviewSelectionForCurrentDate()
}

// Fonction pour mettre à jour la sélection du treeview pour la date actuelle
function updateTreeviewSelectionForCurrentDate() {
  console.log('updateTreeviewSelectionForCurrentDate - selectedDate:', selectedDate.value)
  console.log('updateTreeviewSelectionForCurrentDate - selectedEvents:', selectedEvents.value)

  if (!selectedDate.value) {
    treeviewSelection.value = []
    return
  }

  // Convertir la date sélectionnée en string pour la comparaison (en utilisant les méthodes locales pour éviter les problèmes de fuseau horaire)
  let selectedDateString: string
  if ((selectedDate.value as any) instanceof Date) {
    const year = (selectedDate.value as any).getFullYear()
    const month = String((selectedDate.value as any).getMonth() + 1).padStart(2, '0')
    const day = String((selectedDate.value as any).getDate()).padStart(2, '0')
    selectedDateString = `${year}-${month}-${day}`
  } else {
    selectedDateString = selectedDate.value || ''
  }

  console.log('selectedDateString:', selectedDateString)

  // Trouver les événements sélectionnés qui correspondent à la date actuelle
  const currentDateEvents = selectedEvents.value.filter(event => {
    if (event.isAllOccurrences) {
      // Pour "Toutes les occurrences", vérifier si cet événement a des occurrences sur la date courante
      const hasOccurrenceOnCurrentDate = eventsOnSelectedDate.value.some(occurrence =>
        occurrence.originalEventId === event.originalEventId
      )
      return hasOccurrenceOnCurrentDate
    } else if (event.isVirtualOccurrence) {
      console.log('Comparing:', event.occurrenceDate, '===', selectedDateString)
      return event.occurrenceDate === selectedDateString
    } else {
      // Pour les événements simples, vérifier si leur date correspond
      const eventDate = new Date(event.start).toISOString().split('T')[0]
      return eventDate === selectedDateString
    }
  })

  console.log('currentDateEvents:', currentDateEvents)

  // Convertir en items du treeview
  const matchingTreeviewItems: any[] = []
  currentDateEvents.forEach(event => {
    if ((event as any).isAllOccurrences) {
      // Pour "Toutes les occurrences", trouver l'item correspondant
      const treeviewItem = treeviewItems.value.find((item: any) =>
        item.children && item.children.some((child: any) => child.id === `all_${(event as any).originalEventId}`)
      )
      if (treeviewItem) {
        const childItem = treeviewItem.children.find((child: any) => child.id === `all_${(event as any).originalEventId}`)
        if (childItem) {
          matchingTreeviewItems.push(childItem)
        }
      }
    } else if ((event as any).isVirtualOccurrence) {
      // Pour les occurrences individuelles
      const treeviewItem = treeviewItems.value.find((item: any) =>
        item.children && item.children.some((child: any) => child.id === getEventKey(event))
      )
      if (treeviewItem) {
        const childItem = treeviewItem.children.find((child: any) => child.id === getEventKey(event))
        if (childItem) {
          matchingTreeviewItems.push(childItem)
        }
      }
    } else {
      // Pour les événements simples, trouver directement l'item
      const simpleItem = treeviewItems.value.find((item: any) =>
        item.id === (event as any).eventId && item.isSimpleEvent
      )
      if (simpleItem) {
        matchingTreeviewItems.push(simpleItem)
      }
    }
  })

  console.log('matchingTreeviewItems:', matchingTreeviewItems)
  treeviewSelection.value = matchingTreeviewItems
}

// Gestion des sélections du treeview
function onTreeviewSelectionChange(selectedItems: any[]) {
  console.log('onTreeviewSelectionChange - selectedItems:', selectedItems)

  // Convertir la date sélectionnée en string pour la comparaison (en utilisant les méthodes locales pour éviter les problèmes de fuseau horaire)
  let selectedDateString: string
  if ((selectedDate.value as any) instanceof Date) {
    const year = (selectedDate.value as any).getFullYear()
    const month = String((selectedDate.value as any).getMonth() + 1).padStart(2, '0')
    const day = String((selectedDate.value as any).getDate()).padStart(2, '0')
    selectedDateString = `${year}-${month}-${day}`
  } else {
    selectedDateString = selectedDate.value || ''
  }

  // Obtenir les événements actuellement sélectionnés pour la date courante
  const currentDateEvents = selectedEvents.value.filter(event => {
    if (event.isAllOccurrences) {
      return false
    } else if (event.isVirtualOccurrence) {
      return event.occurrenceDate === selectedDateString
    } else {
      // Utiliser les méthodes locales pour éviter les problèmes de fuseau horaire
      const eventDateObj = new Date(event.start)
      const year = eventDateObj.getFullYear()
      const month = String(eventDateObj.getMonth() + 1).padStart(2, '0')
      const day = String(eventDateObj.getDate()).padStart(2, '0')
      const eventDate = `${year}-${month}-${day}`
      return eventDate === selectedDateString
    }
  })

  // Convertir les items sélectionnés en événements
  let newCurrentDateEvents = selectedItems.map(item => {
    if (item.isAllOccurrences) {
      return {
        isAllOccurrences: true,
        originalEventId: item.originalEventId,
        title: item.title,
        type: 'recurring',
        level: item.level,
        recurrence: item.recurrence,
        time: item.time,
        location: item.location
      }
    } else if (item.isVirtualOccurrence) {
      // Pour les occurrences individuelles, récupérer les données de l'événement original
      const originalEvent = events.value.find(e => e._id === item.originalEventId)
      const result = {
        eventId: item.originalEventId,
        occurrenceDate: item.occurrenceDate,
        isRecurring: true,
        isVirtualOccurrence: true,
        originalEventId: item.originalEventId,
        title: item.title,
        time: item.time,
        location: item.location,
        level: originalEvent?.level,
        type: originalEvent?.type,
        start: originalEvent?.start,
        end: originalEvent?.end
      }
      console.log('Virtual occurrence result:', result)
      return result
    } else if (item.isSimpleEvent) {
      // Pour les événements simples, récupérer les données de l'événement original
      const originalEvent = events.value.find(e => e._id === item.id)
      return {
        eventId: item.id,
        isRecurring: false,
        title: item.title,
        time: item.time,
        location: item.location,
        level: originalEvent?.level,
        type: originalEvent?.type,
        start: originalEvent?.start,
        end: originalEvent?.end
      }
    } else {
      return {
        eventId: item.id,
        isRecurring: false,
        title: item.title,
        time: item.time,
        location: item.location
      }
    }
  })

  // Gérer l'exclusion mutuelle entre "Toutes les occurrences" et les occurrences individuelles
  const allOccurrencesEvents = newCurrentDateEvents.filter(event => (event as any).isAllOccurrences)
  const individualOccurrencesEvents = newCurrentDateEvents.filter(event => (event as any).isVirtualOccurrence)

  // Si "Toutes les occurrences" est sélectionné, supprimer les occurrences individuelles du même événement
  if (allOccurrencesEvents.length > 0) {
    newCurrentDateEvents = newCurrentDateEvents.filter(event => {
      if ((event as any).isVirtualOccurrence) {
        // Vérifier si cet événement a une version "Toutes les occurrences" sélectionnée
        const hasAllOccurrences = allOccurrencesEvents.some(allEvent =>
          (allEvent as any).originalEventId === (event as any).originalEventId
        )
        return !hasAllOccurrences
      }
      return true
    })
  }

  // Si des occurrences individuelles sont sélectionnées, supprimer "Toutes les occurrences" du même événement
  if (individualOccurrencesEvents.length > 0) {
    newCurrentDateEvents = newCurrentDateEvents.filter(event => {
      if ((event as any).isAllOccurrences) {
        // Vérifier si cet événement a des occurrences individuelles sélectionnées
        const hasIndividualOccurrences = individualOccurrencesEvents.some(indEvent =>
          (indEvent as any).originalEventId === (event as any).originalEventId
        )
        return !hasIndividualOccurrences
      }
      return true
    })
  }

  // Remplacer les événements de la date courante par les nouveaux
  let otherDateEvents = selectedEvents.value.filter(event => {
    if (event.isAllOccurrences) {
      return true // Garder les "toutes les occurrences"
    } else if (event.isVirtualOccurrence) {
      return event.occurrenceDate !== selectedDateString
    } else {
      const eventDate = new Date(event.start).toISOString().split('T')[0]
      return eventDate !== selectedDateString
    }
  })

  // Appliquer l'exclusion mutuelle sur toutes les dates
  // Si "Toutes les occurrences" est sélectionné pour la date courante, supprimer toutes les occurrences individuelles du même événement sur toutes les dates
  if (allOccurrencesEvents.length > 0) {
    otherDateEvents = otherDateEvents.filter(event => {
      if ((event as any).isVirtualOccurrence) {
        // Vérifier si cet événement a une version "Toutes les occurrences" sélectionnée pour la date courante
        const hasAllOccurrences = allOccurrencesEvents.some(allEvent =>
          (allEvent as any).originalEventId === (event as any).originalEventId
        )
        return !hasAllOccurrences
      }
      return true
    })
  }

  // Si des occurrences individuelles sont sélectionnées pour la date courante, supprimer "Toutes les occurrences" du même événement sur toutes les dates
  if (individualOccurrencesEvents.length > 0) {
    otherDateEvents = otherDateEvents.filter(event => {
      if ((event as any).isAllOccurrences) {
        // Vérifier si cet événement a des occurrences individuelles sélectionnées pour la date courante
        const hasIndividualOccurrences = individualOccurrencesEvents.some(indEvent =>
          (indEvent as any).originalEventId === (event as any).originalEventId
        )
        return !hasIndividualOccurrences
      }
      return true
    })
  }

  // Détecter si "Toutes les occurrences" a été désélectionné pour la date courante
  const previousCurrentDateEvents = selectedEvents.value.filter(event => {
    if (event.isAllOccurrences) {
      const hasOccurrenceOnCurrentDate = eventsOnSelectedDate.value.some(occurrence =>
        occurrence.originalEventId === event.originalEventId
      )
      return hasOccurrenceOnCurrentDate
    } else if (event.isVirtualOccurrence) {
      return event.occurrenceDate === selectedDateString
    } else {
      const eventDate = new Date(event.start).toISOString().split('T')[0]
      return eventDate === selectedDateString
    }
  })

  const previousAllOccurrencesEvents = previousCurrentDateEvents.filter(event => (event as any).isAllOccurrences)
  const currentAllOccurrencesEvents = newCurrentDateEvents.filter(event => (event as any).isAllOccurrences)

  // Si "Toutes les occurrences" a été désélectionné, le supprimer de toutes les dates
  const deselectedAllOccurrences = previousAllOccurrencesEvents.filter(prevEvent =>
    !currentAllOccurrencesEvents.some(currEvent =>
      (currEvent as any).originalEventId === (prevEvent as any).originalEventId
    )
  )

  if (deselectedAllOccurrences.length > 0) {
    // Supprimer "Toutes les occurrences" désélectionné de toutes les dates
    otherDateEvents = otherDateEvents.filter(event => {
      if ((event as any).isAllOccurrences) {
        const shouldRemove = deselectedAllOccurrences.some(deselectedEvent =>
          (deselectedEvent as any).originalEventId === (event as any).originalEventId
        )
        return !shouldRemove
      }
      return true
    })
  }

  // Reconstituer la liste complète
  selectedEvents.value = [...otherDateEvents, ...newCurrentDateEvents]

  console.log('Final selectedEvents:', selectedEvents.value)
  console.log('Exclusion mutuelle appliquée - allOccurrencesEvents:', allOccurrencesEvents.length, 'individualOccurrencesEvents:', individualOccurrencesEvents.length)
  console.log('Deselected all occurrences:', deselectedAllOccurrences.length)

  // Synchroniser la sélection du VTreeview pour refléter les changements
  updateTreeviewSelectionForCurrentDate()
}

// Chargement des événements (seulement les événements futurs)
async function loadEvents() {
  try {
    loading.value = true
    const response = await api.get('/events/upcoming?limit=1000')
    if (response.success) {
      events.value = response.data as any[]
    }
  } catch (error) {
    console.error('Erreur lors du chargement des événements:', error)
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
        eventId: event.originalEventId,
        isAllOccurrences: true,
        isRecurring: true
      }
    } else if (event.isVirtualOccurrence) {
      return {
        eventId: event.originalEventId,
        occurrenceDate: event.occurrenceDate,
        isRecurring: true
      }
    } else {
      return {
        eventId: event._id,
        isRecurring: false
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
    // Reconstruire les événements sélectionnés à partir des IDs
    props.selectedEventIds.forEach(eventEnrollment => {
      // Gérer le nouveau format d'objet
      if (typeof eventEnrollment === 'object') {
        const enrollment = eventEnrollment as any
        const event = events.value.find(e => e._id === enrollment.eventId)
        if (event) {
          if (enrollment.isAllOccurrences) {
            // "Toutes les occurrences"
            const allOccurrencesEvent = {
              ...event,
              isAllOccurrences: true,
              originalEventId: enrollment.eventId,
              title: event.title,
              type: event.type,
              level: event.level,
              location: event.location,
              recurrence: event.recurrence
            }
            selectedEvents.value.push(allOccurrencesEvent)
          } else if (enrollment.occurrenceDate) {
            // Occurrence individuelle
            const virtualEvent = {
              ...event,
              _id: `${enrollment.eventId}_${enrollment.occurrenceDate}`,
              isVirtualOccurrence: true,
              originalEventId: enrollment.eventId,
              occurrenceDate: enrollment.occurrenceDate,
              start: new Date(enrollment.occurrenceDate + 'T' + timeShort(event.start)),
              end: new Date(enrollment.occurrenceDate + 'T' + timeShort(event.end))
            }
            selectedEvents.value.push(virtualEvent)
          } else {
            // Événement simple
            selectedEvents.value.push(event)
          }
        }
      } else if (typeof eventEnrollment === 'string') {
        // Gérer l'ancien format string (compatibilité)
        if (eventEnrollment.includes('_')) {
          // Occurrence récurrente
          const [originalId, occurrenceDate] = eventEnrollment.split('_')
          const event = events.value.find(e => e._id === originalId)
          if (event) {
            const virtualEvent = {
              ...event,
              _id: eventEnrollment,
              isVirtualOccurrence: true,
              originalEventId: originalId,
              occurrenceDate: occurrenceDate,
              start: new Date(occurrenceDate + 'T' + timeShort(event.start)),
              end: new Date(occurrenceDate + 'T' + timeShort(event.end))
            }
            selectedEvents.value.push(virtualEvent)
          }
        } else {
          // Événement simple
          const event = events.value.find(e => e._id === eventEnrollment)
          if (event) {
            selectedEvents.value.push(event)
          }
        }
      }
    })
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadEvents()
  }
})

watch(() => props.selectedEventIds, () => {
  if (events.value.length > 0) {
    initializeSelectedEvents()
  }
}, { deep: true })

watch(events, () => {
  if (events.value.length > 0) {
    initializeSelectedEvents()
  }
})

// Lifecycle
onMounted(() => {
  if (props.modelValue) {
    loadEvents()
  }
})
</script>

<style>
@import '@/assets/event-selector-modal.css';

/* Laisser Vuetify gérer nativement l'affichage des chevrons et espaces */
</style>
