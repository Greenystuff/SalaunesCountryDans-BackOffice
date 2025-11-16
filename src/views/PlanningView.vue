<template>
  <div class="planning-container">
    <VCard class="main-card">
      <!-- HEADER -->
      <div class="header-title">
        <div class="header-content">
          <h1 class="main-title">Planning</h1>
          <p class="subtitle">
            Gérez tous les événements du club : cours, compétitions, stages et autres événements.
          </p>
        </div>
        <div class="header-actions">
          <VBtn v-if="canCreate" color="primary" prepend-icon="mdi-plus" @click="openCreate()">
            Nouvel événement
          </VBtn>
        </div>
      </div>

      <VDivider />

      <!-- BARRE D'OUTILS / FILTRES -->
      <div class="toolbar">
        <VTextField
          v-model="filters.q"
          placeholder="Rechercher un événement, un lieu, un animateur…"
          variant="solo"
          density="comfortable"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          class="toolbar-item"
        />
        <VSelect
          v-model="filters.type"
          :items="typeOptions"
          label="Type"
          variant="solo"
          hide-details
          clearable
          class="toolbar-item"
        />
        <VSelect
          v-model="filters.level"
          :items="levelOptions"
          label="Niveau"
          variant="solo"
          hide-details
          clearable
          class="toolbar-item"
        />
        <VSelect
          v-model="filters.instructor"
          :items="instructorOptions"
          label="Animateur"
          variant="solo"
          hide-details
          clearable
          class="toolbar-item"
        />
        <VBtn class="toolbar-item" variant="tonal" @click="resetFilters"> Réinitialiser </VBtn>
      </div>

      <!-- CALENDRIER -->
      <div class="calendar-section">
        <!-- Composant Calendar de v-calendar -->
        <VCalendar
          class="custom-calendar"
          is-expanded
          :first-day-of-week="2"
          :min-weeks="5"
          :locale="'fr'"
          title-position="center"
          trim-weeks
        >
          <template #day-content="{ day }">
            <div class="vc-day-content" @click="onDayClick(day)">
              <div class="vc-day-label">{{ day.day }}</div>
              <div class="vc-day-content-wrapper">
                <!-- Affichage normal pour 1-2 événements -->
                <template v-if="coursesOnDate(day.date).length <= 2">
                  <div
                    v-for="item in coursesOnDate(day.date)"
                    :key="item._id"
                    class="vc-day-content-item"
                    :data-level="item.level"
                    :title="`${timeShort(item.start)}–${timeShort(item.end)} · ${item.title} (${item.level})`"
                    @click.stop="canEdit ? openEdit(item) : null"
                  >
                    <div class="event-time">{{ timeShort(item.start) }}</div>
                    <div class="event-title">{{ item.title }}</div>
                    <div class="event-level">{{ item.level }}</div>
                  </div>
                </template>

                <!-- Affichage en dots pour 3+ événements -->
                <template v-else>
                  <div class="vc-day-dots-wrapper">
                    <div
                      v-for="item in coursesOnDate(day.date)"
                      :key="item._id"
                      class="vc-day-dot"
                      :data-level="item.level"
                      :title="`${timeShort(item.start)}–${timeShort(item.end)} · ${item.title} (${item.level})`"
                      @click.stop="canEdit ? openEdit(item) : null"
                    />
                  </div>
                  <div class="vc-day-events-count">
                    {{ coursesOnDate(day.date).length }} événements
                  </div>
                </template>
              </div>
            </div>
          </template>
        </VCalendar>
      </div>

      <VDivider />

      <!-- LISTE DES ÉVÉNEMENTS À VENIR -->
      <div class="list-section">
        <div class="list-header">
          <h3 class="list-title">À venir</h3>
          <div class="list-actions">
            <VBtn variant="text" density="comfortable" @click="loadEvents"> Actualiser </VBtn>
          </div>
        </div>

        <VTable class="events-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Heure</th>
              <th>Événement</th>
              <th>Animateur</th>
              <th>Lieu</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in upcoming" :key="item._id" class="hover-row">
              <td>{{ dateLong(item.start) }}</td>
              <td>{{ timeShort(item.start) }}–{{ timeShort(item.end) }}</td>
              <td>
                <div class="title-cell">
                  <VChip :color="levelColor(item.level)" size="small" variant="flat" class="mr-2">
                    {{ item.level }}
                  </VChip>
                  <span class="title">{{ item.title }}</span>
                  <VChip
                    v-if="item.recurrence && item.recurrence !== 'Aucune'"
                    :color="
                      item.recurrence === 'Hebdomadaire'
                        ? 'success'
                        : item.recurrence === 'Toutes les 2 semaines'
                          ? 'info'
                          : 'warning'
                    "
                    size="x-small"
                    variant="flat"
                    class="ml-2"
                  >
                    {{ item.recurrence }}
                  </VChip>
                  <VChip
                    v-if="item.hasException"
                    color="orange"
                    size="x-small"
                    variant="flat"
                    class="ml-2"
                    title="Cette occurrence a été modifiée"
                  >
                    Modifiée
                  </VChip>
                </div>
              </td>
              <td>{{ item.instructor || '—' }}</td>
              <td>{{ item.location || '—' }}</td>
              <td class="actions">
                <div class="actions-wrapper">
                  <VBtn v-if="canEdit" icon="mdi-pencil" variant="text" @click="openEdit(item)" />
                  <VBtn
                    v-if="canDelete"
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    @click="remove(item._id)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="!upcoming.length && !loading">
              <td colspan="6" class="empty-row">Aucun événement à venir.</td>
            </tr>
            <tr v-if="loading">
              <td colspan="6" class="empty-row">Chargement...</td>
            </tr>
          </tbody>
        </VTable>

        <!-- Pagination -->
        <div class="pagination-wrapper" v-if="pagination && pagination.pages > 1">
          <VPagination v-model="currentPage" :length="pagination.pages" :total-visible="7" />
        </div>
      </div>

      <!-- STATISTIQUES -->
      <div class="stats-section">
        <VRow>
          <VCol cols="12" md="3">
            <VCard class="stat-card">
              <VCardText class="text-center">
                <div class="stat-number">{{ stats.total || 0 }}</div>
                <div class="stat-label">Total événements</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" md="3">
            <VCard class="stat-card">
              <VCardText class="text-center">
                <div class="stat-number">{{ stats.upcoming || 0 }}</div>
                <div class="stat-label">À venir</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" md="3">
            <VCard class="stat-card">
              <VCardText class="text-center">
                <div class="stat-number">
                  {{ stats.byType?.find((s) => s._id === 'Cours')?.count || 0 }}
                </div>
                <div class="stat-label">Cours</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" md="3">
            <VCard class="stat-card">
              <VCardText class="text-center">
                <div class="stat-number">
                  {{ stats.byType?.find((s) => s._id === 'Événement')?.count || 0 }}
                </div>
                <div class="stat-label">Événements</div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>
    </VCard>

    <!-- DIALOGUE CRÉATION / ÉDITION -->
    <VDialog v-model="dialog.open" max-width="720" class="event-dialog">
      <VCard>
        <div class="dialog-title">
          <span>{{ dialog.mode === 'create' ? 'Nouvel événement' : "Modifier l'événement" }}</span>
          <VBtn icon="mdi-close" variant="text" @click="dialog.open = false" />
        </div>

        <div class="dialog-content">
          <VForm ref="formRef" @submit.prevent="save">
            <div class="event-form">
              <VTextField v-model="form.title" label="Titre" required />
              <VTextarea v-model="form.description" label="Description" rows="3" />

              <VRow>
                <VCol cols="12" md="4">
                  <VSelect v-model="form.type" :items="typeOptions" label="Type" required />
                </VCol>
                <VCol cols="12" md="4">
                  <VSelect v-model="form.level" :items="levelOptions" label="Niveau" />
                </VCol>
                <VCol cols="12" md="4">
                  <VTextField v-model="form.instructor" label="Animateur" />
                </VCol>
              </VRow>

              <VRow>
                <VCol cols="12" md="6">
                  <VTextField v-model="form.location" label="Lieu" />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="form.maxParticipants"
                    type="number"
                    label="Participants max"
                  />
                </VCol>
              </VRow>

              <VRow>
                <VCol cols="12" md="6">
                  <VTextField v-model="form.price" type="number" step="0.01" label="Prix (€)" />
                </VCol>
                <VCol cols="12" md="6">
                  <VSwitch v-model="form.isPublic" label="Événement public" />
                </VCol>
              </VRow>

              <div class="periods-section">
                <div class="periods-header">
                  <h4 class="periods-title">Créneau</h4>
                </div>
                <div class="period-grid">
                  <VMenu
                    v-model="showDatePicker"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                  >
                    <template #activator="{ props }">
                      <VTextField
                        v-model="formattedDateInput"
                        label="Date"
                        prepend-inner-icon="mdi-calendar"
                        readonly
                        v-bind="props"
                      />
                    </template>
                    <VDatePicker
                      v-model="dateInput"
                      :min="minEventDate"
                      :max="maxEventDate"
                      @update:model-value="showDatePicker = false"
                    />
                  </VMenu>
                  <VTextField v-model="startTime" type="time" label="Heure début" required />
                  <VTextField v-model="endTime" type="time" label="Heure fin" required />
                  <VSelect
                    v-model="form.recurrence"
                    :items="recurrenceOptions"
                    label="Récurrence"
                  />
                </div>
              </div>
            </div>
          </VForm>
        </div>

        <div class="dialog-actions">
          <div class="left">
            <VBtn
              v-if="dialog.mode === 'edit' && canDelete"
              variant="text"
              color="error"
              @click="remove(form._id)"
            >
              Supprimer
            </VBtn>
          </div>
          <div class="action-buttons">
            <VBtn variant="text" @click="dialog.open = false">Annuler</VBtn>
            <VBtn color="primary" @click="save" :loading="saving">
              {{ dialog.mode === 'create' ? 'Créer' : 'Enregistrer' }}
            </VBtn>
          </div>
        </div>
      </VCard>
    </VDialog>

    <!-- MODALE DE GESTION DE JOURNÉE -->
    <DayManagementModal
      v-model="dayModal.open"
      :selected-date="selectedDate"
      :events="eventsForSelectedDate"
      @add-event="openCreate"
      @edit-event="openEdit"
      @delete-event="remove"
    />

    <!-- MODALE DE CHOIX D'ÉDITION (OCCURRENCE UNIQUE VS TOUTES) -->
    <VDialog v-model="editChoiceDialog.open" max-width="600">
      <VCard>
        <VCardTitle class="text-h5 pa-6">
          Modifier l'événement récurrent
        </VCardTitle>
        <VCardText class="pa-6">
          <p class="mb-4">
            Cet événement se répète. Souhaitez-vous modifier uniquement cette occurrence ou toutes
            les occurrences futures ?
          </p>
          <VAlert type="info" variant="tonal" class="mb-0">
            <strong>{{ editChoiceDialog.eventTitle }}</strong>
            <br />
            {{ dateLong(editChoiceDialog.occurrenceStart) }} à
            {{ timeShort(editChoiceDialog.occurrenceStart) }}
          </VAlert>
        </VCardText>
        <VCardActions class="pa-6 pt-0 d-flex flex-column ga-3">
          <VBtn color="primary" @click="confirmEditSingleOccurrence" block size="large">
            Cette occurrence uniquement
          </VBtn>
          <VBtn color="primary" variant="tonal" @click="confirmEditAllOccurrences" block size="large">
            Toutes les occurrences
          </VBtn>
          <VBtn variant="text" @click="editChoiceDialog.open = false" block>
            Annuler
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import DayManagementModal from '@/components/DayManagementModal.vue'
import { apiService } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'
import { useViewPermissions } from '@/composables/useViewPermissions'

/** ----------------------------
 *  Données & constantes
 *  ---------------------------- */
const typeOptions = ['Cours', 'Événement', 'Compétition', 'Stage', 'Autre']
const levelOptions = ['Débutant', 'Novice', 'Intermédiaire', 'Avancé', 'Tous niveaux']

// Permissions pour cette vue
const { canCreate, canEdit, canDelete } = useViewPermissions('events')
const recurrenceOptions = ['Aucune', 'Hebdomadaire', 'Toutes les 2 semaines', 'Mensuelle']

// Notifications
const { showSuccess, showError, showWarning } = useNotifications()

const filters = reactive({
  q: '',
  type: null,
  level: null,
  instructor: null,
})

// État de chargement et gestion des erreurs
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const abortController = ref(null)

// Données des événements depuis l'API
const events = ref([])
const stats = ref({})

// Variables de pagination
const currentPage = ref(1)
const pagination = ref(null)

/** ----------------------------
 *  Sélection / form dialog
 *  ---------------------------- */
const dialog = reactive({ open: false, mode: 'create' }) // 'create' | 'edit'
const formRef = ref(null)
const showDatePicker = ref(false)
const editingSingleOccurrence = ref(false)
const occurrenceDate = ref(null)

/** ----------------------------
 *  Modale de choix d'édition
 *  ---------------------------- */
const editChoiceDialog = reactive({
  open: false,
  eventTitle: '',
  occurrenceStart: null,
  originalEvent: null,
  item: null,
})

/** ----------------------------
 *  Modale de gestion de journée
 *  ---------------------------- */
const dayModal = reactive({ open: false })
const selectedDate = ref(new Date())

const form = reactive({
  _id: null,
  title: '',
  description: '',
  type: 'Cours',
  level: 'Tous niveaux',
  instructor: '',
  location: '',
  maxParticipants: null,
  price: null,
  isPublic: true,
  recurrence: 'Aucune',
})

const dateInput = ref(toISODate(new Date()))
const startTime = ref('18:30')
const endTime = ref('19:15')

// Computed properties pour le date picker
const formattedDateInput = computed(() => {
  if (!dateInput.value) return ''
  return new Date(dateInput.value).toLocaleDateString('fr-FR')
})

const minEventDate = computed(() => {
  const today = new Date()
  today.setDate(today.getDate() - 30) // 30 jours dans le passé
  return toISODate(today)
})

const maxEventDate = computed(() => {
  const future = new Date()
  future.setFullYear(future.getFullYear() + 1) // 1 an dans le futur
  return toISODate(future)
})

// Computed properties pour les données filtrées
const filtered = computed(() => {
  let result = events.value

  if (filters.q) {
    const query = filters.q.toLowerCase()
    result = result.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query)) ||
        (event.instructor && event.instructor.toLowerCase().includes(query)) ||
        (event.location && event.location.toLowerCase().includes(query)),
    )
  }

  if (filters.type) {
    result = result.filter((event) => event.type === filters.type)
  }

  if (filters.level) {
    result = result.filter((event) => event.level === filters.level)
  }

  if (filters.instructor) {
    result = result.filter((event) => event.instructor === filters.instructor)
  }

  return result
})

// Computed properties pour les options des selects
const instructorOptions = computed(() => {
  const instructors = [...new Set(events.value.map((event) => event.instructor).filter(Boolean))]
  return instructors.sort()
})

// Computed properties pour les événements d'une date
const eventsForSelectedDate = computed(() => {
  return coursesOnDate(selectedDate.value)
})

// Événements à venir pour le tableau
const upcoming = computed(() => {
  const now = new Date()
  const upcomingEvents = []

  // Traiter chaque événement filtré
  filtered.value.forEach((event) => {
    if (event.recurrence === 'Aucune') {
      // Événement ponctuel : l'ajouter s'il est à venir
      if (new Date(event.end) >= now) {
        upcomingEvents.push(event)
      }
    } else {
      // Événement récurrent : vérifier s'il y a au moins une occurrence à venir
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      const duration = eventEnd.getTime() - eventStart.getTime()

      // Calculer la prochaine occurrence
      let nextOccurrence = new Date(eventStart)
      const today = new Date()

      // Trouver la prochaine occurrence à partir d'aujourd'hui
      while (nextOccurrence < today) {
        switch (event.recurrence) {
          case 'Hebdomadaire':
            nextOccurrence.setDate(nextOccurrence.getDate() + 7)
            break
          case 'Toutes les 2 semaines':
            nextOccurrence.setDate(nextOccurrence.getDate() + 14)
            break
          case 'Mensuelle':
            nextOccurrence.setMonth(nextOccurrence.getMonth() + 1)
            break
        }
      }

      // Si la prochaine occurrence est dans le futur, ajouter l'événement
      if (nextOccurrence >= today) {
        // Créer une version modifiée de l'événement avec la prochaine occurrence
        const upcomingEvent = {
          ...event,
          nextOccurrence: nextOccurrence,
          // Utiliser la prochaine occurrence pour le tri et l'affichage
          start: nextOccurrence,
          end: new Date(nextOccurrence.getTime() + duration),
        }
        upcomingEvents.push(upcomingEvent)
      }
    }
  })

  // Trier par date de début et limiter à 20 éléments
  return upcomingEvents.sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, 20)
})

// État du composant
const isComponentMounted = ref(false)

/** ----------------------------
 *  Fonctions utilitaires
 *  ---------------------------- */
function toISODate(date) {
  // Utiliser les méthodes locales pour éviter les problèmes de fuseau horaire
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toLocalISOString(date) {
  // Créer une chaîne ISO en heure locale (sans le Z final pour éviter la conversion UTC)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000`
}

function parseLocalDate(dateString) {
  // Parser une date locale en évitant les problèmes de fuseau horaire
  if (typeof dateString === 'string') {
    // Si c'est au format ISO sans Z, l'interpréter comme locale
    if (dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?$/)) {
      const [datePart, timePart] = dateString.split('T')
      const [year, month, day] = datePart.split('-').map(Number)
      const [time, ms] = timePart.split('.')
      const [hours, minutes, seconds] = time.split(':').map(Number)

      // Créer une date locale
      return new Date(year, month - 1, day, hours, minutes, seconds || 0)
    }
  }
  // Fallback pour les autres formats
  return new Date(dateString)
}

function timeShort(dateString) {
  const date = parseLocalDate(dateString)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function dateLong(d) {
  const date = new Date(d)
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long' })
}

/** ----------------------------
 *  Couleurs & helpers visuels
 *  ---------------------------- */
function levelColor(level) {
  switch (level) {
    case 'Débutant':
      return 'success'
    case 'Novice':
      return 'info'
    case 'Intermédiaire':
      return 'warning'
    case 'Avancé':
      return 'error'
    case 'Tous niveaux':
      return 'primary'
    default:
      return 'primary'
  }
}

// Computed pour les événements virtuels (évite les recalculs inutiles)
const virtualEvents = computed(() => {
  const virtualEvents = []
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - 30) // 30 jours dans le passé
  const endDate = new Date(now)
  endDate.setFullYear(endDate.getFullYear() + 1) // 1 an dans le futur

  console.log('🎯 Génération des événements virtuels pour', filtered.value.length, 'événements')

  filtered.value.forEach((event) => {
    if (event.recurrence === 'Aucune') {
      // Événement ponctuel : l'ajouter tel quel
      virtualEvents.push(event)
    } else {
      // Événement récurrent : générer toutes les occurrences
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      const duration = eventEnd.getTime() - eventStart.getTime()

      let currentOccurrence = new Date(eventStart)

      // Générer les occurrences jusqu'à la date de fin
      while (currentOccurrence <= endDate) {
        // Ne générer que les occurrences dans la plage visible
        if (currentOccurrence >= startDate) {
          const occurrenceDate = new Date(currentOccurrence)

          // Chercher une exception pour cette occurrence
          const exception = event.exceptions?.find(ex => {
            const exDate = new Date(ex.occurrenceDate)
            return exDate.toDateString() === occurrenceDate.toDateString()
          })

          // Si annulée, ne pas afficher
          if (exception?.modificationType === 'cancelled') {
            // Skip cette occurrence
          } else {
            // Créer l'événement virtuel avec les modifications éventuelles
            const virtualEvent = {
              ...event,
              _id: `${event._id}_${currentOccurrence.getTime()}`,
              start: exception?.modifiedFields?.start ? new Date(exception.modifiedFields.start) : new Date(currentOccurrence),
              end: exception?.modifiedFields?.end ? new Date(exception.modifiedFields.end) : new Date(currentOccurrence.getTime() + duration),
              instructor: exception?.modifiedFields?.instructor ?? event.instructor,
              location: exception?.modifiedFields?.location ?? event.location,
              level: exception?.modifiedFields?.level ?? event.level,
              maxParticipants: exception?.modifiedFields?.maxParticipants ?? event.maxParticipants,
              price: exception?.modifiedFields?.price ?? event.price,
              isVirtualOccurrence: true,
              originalEventId: event._id,
              hasException: !!exception,
            }
            virtualEvents.push(virtualEvent)
          }
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

function coursesOnDate(date) {
  const targetDate = new Date(date)
  return virtualEvents.value.filter((event) => {
    const eventDate = new Date(event.start)
    return eventDate.toDateString() === targetDate.toDateString()
  })
}

function composeDate(dateInput, timeString) {
  if (!dateInput || !timeString) {
    throw new Error('Date ou heure manquante')
  }

  // Vérifier le format de l'heure
  if (!/^\d{2}:\d{2}$/.test(timeString)) {
    throw new Error("Format d'heure invalide. Attendu: HH:MM")
  }

  let dateOnly

  // Si c'est un objet Date (retourné par VDatePicker), extraire la date
  if (dateInput instanceof Date) {
    // Utiliser les méthodes locales pour éviter les problèmes de timezone
    const year = dateInput.getFullYear()
    const month = String(dateInput.getMonth() + 1).padStart(2, '0')
    const day = String(dateInput.getDate()).padStart(2, '0')
    dateOnly = `${year}-${month}-${day}`
  } else {
    // Convertir en string
    const dateString = String(dateInput)

    // Si dateString contient déjà une date complète (ISO string), extraire seulement la date
    if (dateString.includes('T')) {
      dateOnly = dateString.split('T')[0]
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Si c'est déjà au bon format YYYY-MM-DD
      dateOnly = dateString
    } else {
      throw new Error('Format de date invalide. Attendu: YYYY-MM-DD ou ISO string')
    }
  }

  // Créer une date en heure locale (sans le Z final)
  const date = new Date(dateOnly + 'T' + timeString + ':00')

  if (isNaN(date.getTime())) {
    throw new Error('Date invalide générée')
  }

  // S'assurer que la date est bien en heure locale
  // En créant une nouvelle date avec les composants locaux
  const localDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  )

  return localDate
}

/** ----------------------------
 *  Fonctions de chargement des données
 *  ---------------------------- */
async function loadEvents() {
  if (loading.value) return

  try {
    loading.value = true
    error.value = null

    // Annuler la requête précédente si elle existe
    if (abortController.value) {
      abortController.value.abort()
    }
    abortController.value = new AbortController()

    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: '1000', // Charger tous les événements pour le calendrier
      sortBy: 'start',
      sortOrder: 'asc',
    })

    // Ajouter les filtres
    if (filters.q) params.append('q', filters.q)
    if (filters.type) params.append('type', filters.type)
    if (filters.level) params.append('level', filters.level)
    if (filters.instructor) params.append('instructor', filters.instructor)

    const response = await apiService.get(`/events?${params}`, {
      signal: abortController.value.signal,
    })

    if (response.success) {
      events.value = response.data
      pagination.value = response.pagination
    } else {
      throw new Error(response.message || 'Erreur lors du chargement des événements')
    }
  } catch (error) {
    if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
      console.error('Erreur lors du chargement des événements:', error)
      error.value = error.message || 'Erreur lors du chargement des événements'
      showError(error.value)
    }
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const response = await apiService.get('/events/stats')
    if (response.success) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error)
  }
}

/** ----------------------------
 *  Fonctions de gestion des événements
 *  ---------------------------- */
function resetFilters() {
  filters.q = ''
  filters.type = null
  filters.level = null
  filters.instructor = null
  currentPage.value = 1
  loadEvents()
}

function openCreate(baseDate) {
  dialog.mode = 'create'
  Object.assign(form, {
    _id: null,
    title: '',
    description: '',
    type: 'Cours',
    level: 'Tous niveaux',
    instructor: '',
    location: '',
    maxParticipants: null,
    price: null,
    isPublic: true,
    recurrence: 'Aucune',
  })
  const d = baseDate || new Date()
  dateInput.value = toISODate(d)
  startTime.value = '19:00'
  endTime.value = '20:30'
  dialog.open = true
}

function openEdit(item) {
  dialog.mode = 'edit'

  // Si c'est une occurrence virtuelle d'un événement récurrent
  if (item.isVirtualOccurrence && item.originalEventId) {
    const originalEvent = filtered.value.find((e) => e._id === item.originalEventId)
    if (originalEvent && originalEvent.recurrence !== 'Aucune') {
      // Ouvrir la modale de choix
      editChoiceDialog.open = true
      editChoiceDialog.eventTitle = originalEvent.title
      editChoiceDialog.occurrenceStart = item.start
      editChoiceDialog.originalEvent = originalEvent
      editChoiceDialog.item = item
      return
    }
  }

  // Édition normale
  editingSingleOccurrence.value = false
  occurrenceDate.value = null
  const eventToEdit = item.isVirtualOccurrence
    ? filtered.value.find((e) => e._id === item.originalEventId)
    : item

  Object.assign(form, { ...eventToEdit })
  dateInput.value = toISODate(new Date(eventToEdit.start))
  startTime.value = timeShort(eventToEdit.start)
  endTime.value = timeShort(eventToEdit.end)
  dialog.open = true
}

function confirmEditSingleOccurrence() {
  const { item, originalEvent } = editChoiceDialog
  editingSingleOccurrence.value = true
  occurrenceDate.value = new Date(item.start)
  Object.assign(form, { ...originalEvent })
  dateInput.value = toISODate(new Date(item.start))
  startTime.value = timeShort(item.start)
  endTime.value = timeShort(item.end)
  editChoiceDialog.open = false
  dialog.open = true
}

function confirmEditAllOccurrences() {
  const { originalEvent } = editChoiceDialog
  editingSingleOccurrence.value = false
  occurrenceDate.value = null
  Object.assign(form, { ...originalEvent })
  dateInput.value = toISODate(new Date(originalEvent.start))
  startTime.value = timeShort(originalEvent.start)
  endTime.value = timeShort(originalEvent.end)
  editChoiceDialog.open = false
  dialog.open = true
}

function onDayClick(day) {
  // Ouvrir la modale de gestion de la journée
  selectedDate.value = new Date(day.date)
  dayModal.open = true
}

async function save() {
  try {
    // Validations côté client
    if (!form.title.trim()) {
      showError("Le titre de l'événement est requis")
      return
    }

    if (!form.type) {
      showError('Le type est requis')
      return
    }

    if (!dateInput.value) {
      showError('La date est requise')
      return
    }

    if (!startTime.value || !endTime.value) {
      showError('Les heures de début et de fin sont requises')
      return
    }

    // Debug des valeurs
    console.log('Debug save:', {
      dateInput: dateInput.value,
      startTime: startTime.value,
      endTime: endTime.value,
      dateInputType: typeof dateInput.value,
      dateInputValue: dateInput.value,
    })

    let start, end
    try {
      start = composeDate(dateInput.value, startTime.value)
      end = composeDate(dateInput.value, endTime.value)
    } catch (error) {
      showError(`Erreur de date/heure: ${error.message}`)
      return
    }

    // Validation de la cohérence des heures
    if (start >= end) {
      showError("L'heure de fin doit être postérieure à l'heure de début")
      return
    }

    // Validation de la durée (pas plus de 8 heures)
    const durationHours = (end - start) / (1000 * 60 * 60)
    if (durationHours > 8) {
      showError("La durée de l'événement ne peut pas dépasser 8 heures")
      return
    }

    saving.value = true

    // Si on édite une seule occurrence, créer une exception
    if (dialog.mode === 'edit' && editingSingleOccurrence.value && occurrenceDate.value) {
      const exceptionData = {
        occurrenceDate: occurrenceDate.value.toISOString(),
        modificationType: 'modified',
        modifiedFields: {
          instructor: form.instructor ? form.instructor.trim() : '',
          location: form.location ? form.location.trim() : '',
          start: toLocalISOString(start),
          end: toLocalISOString(end),
          level: form.level,
          maxParticipants: form.maxParticipants,
          price: form.price,
        }
      }
      await apiService.post(`/events/${form._id}/exceptions`, exceptionData)
      showSuccess('Occurrence modifiée avec succès')
    } else {
      // Comportement normal
      const eventData = {
        title: form.title.trim(),
        description: form.description ? form.description.trim() : '',
        type: form.type,
        level: form.level || undefined,
        instructor: form.instructor ? form.instructor.trim() : '',
        location: form.location ? form.location.trim() : '',
        maxParticipants: form.maxParticipants || undefined,
        price: form.price || undefined,
        isPublic: form.isPublic,
        start: toLocalISOString(start),
        end: toLocalISOString(end),
        recurrence: form.recurrence,
      }

      if (dialog.mode === 'edit' && form._id) {
        await apiService.put(`/events/${form._id}`, eventData)
        showSuccess('Événement modifié avec succès')
      } else {
        await apiService.post('/events', eventData)
        showSuccess('Événement créé avec succès')
      }
    }

    // Recharger les données seulement si le composant est toujours monté
    if (isComponentMounted.value) {
      console.log('🔄 Rechargement des données après sauvegarde...')
      await loadEvents()
      await loadStats()
      console.log('✅ Données rechargées, événements:', filtered.value.length)
      dialog.open = false
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    showError(error.response?.data?.message || 'Erreur lors de la sauvegarde')
  } finally {
    saving.value = false
  }
}

async function remove(id) {
  if (!id) return

  try {
    await apiService.delete(`/events/${id}`)
    showSuccess('Événement supprimé avec succès')

    if (isComponentMounted.value) {
      await loadEvents()
      await loadStats()
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    showError(error.response?.data?.message || 'Erreur lors de la suppression')
  }
}

/** ----------------------------
 *  Lifecycle hooks
 *  ---------------------------- */
onMounted(async () => {
  isComponentMounted.value = true
  await loadEvents()
  await loadStats()
})

onUnmounted(() => {
  isComponentMounted.value = false
  if (abortController.value) {
    abortController.value.abort()
  }
})

// Watchers pour recharger les données quand les filtres changent
watch(
  [() => filters.q, () => filters.type, () => filters.level, () => filters.instructor],
  () => {
    if (isComponentMounted.value) {
      currentPage.value = 1
      loadEvents()
    }
  },
  { debounce: 300 },
)
</script>

<style>
@import '@/assets/planning-view.css';
</style>
