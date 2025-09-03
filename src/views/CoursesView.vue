<template>
  <div class="courses-container">
    <VCard class="main-card">

      <!-- HEADER -->
      <div class="header-title">
        <div class="header-content">
          <h1 class="main-title">Cours & Planning</h1>
          <p class="subtitle">
            Gérez les cours, niveaux et animateurs.
          </p>
        </div>
        <div class="header-actions">
          <VBtn color="primary" prepend-icon="mdi-plus" @click="openCreate()">
            Nouveau cours
          </VBtn>
        </div>
      </div>

      <VDivider />

      <!-- BARRE D'OUTILS / FILTRES -->
      <div class="toolbar">
        <VTextField v-model="filters.q" placeholder="Rechercher un cours, une salle, un animateur…" variant="solo"
          density="comfortable" hide-details clearable prepend-inner-icon="mdi-magnify" class="toolbar-item" />
        <VSelect v-model="filters.level" :items="levelOptions" label="Niveau" variant="solo" hide-details clearable
          class="toolbar-item" />
        <VSelect v-model="filters.teacher" :items="teacherOptions" label="Animateur" variant="solo" hide-details
          clearable class="toolbar-item" />
        <VBtn class="toolbar-item" variant="tonal" @click="resetFilters">
          Réinitialiser
        </VBtn>
      </div>

      <!-- CALENDRIER -->
      <div class="calendar-section">
        <div class="calendar-wrapper">
          <!-- Composant Calendar de v-calendar -->
          <VCalendar class="custom-calendar" is-expanded :first-day-of-week="2" :min-weeks="5" :locale="'fr'"
            title-position="center" trim-weeks>
            <template #day-content="{ day }">
              <div class="vc-day-content" @click="onDayClick(day)">
                <div class="vc-day-label">{{ day.day }}</div>
                <div class="vc-day-content-wrapper">
                  <!-- Affichage normal pour 1-2 événements -->
                  <template v-if="coursesOnDate(day.date).length <= 2">
                    <div v-for="item in coursesOnDate(day.date)" :key="item._id" class="vc-day-content-item"
                      :data-level="item.level"
                      :title="`${timeShort(item.start)}–${timeShort(item.end)} · ${item.title} (${item.level})`"
                      @click.stop="openEdit(item)">
                      <div class="event-time">{{ timeShort(item.start) }}</div>
                      <div class="event-title">{{ item.title }}</div>
                      <div class="event-level">{{ item.level }}</div>
                    </div>
                  </template>

                  <!-- Affichage en dots pour 3+ événements -->
                  <template v-else>
                    <div class="vc-day-dots-wrapper">
                      <div v-for="item in coursesOnDate(day.date)" :key="item._id" class="vc-day-dot"
                        :data-level="item.level"
                        :title="`${timeShort(item.start)}–${timeShort(item.end)} · ${item.title} (${item.level})`"
                        @click.stop="openEdit(item)" />
                    </div>
                    <div class="vc-day-events-count">
                      {{ coursesOnDate(day.date).length }} cours
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </VCalendar>
        </div>
      </div>

      <VDivider />

      <!-- LISTE DES ÉVÉNEMENTS À VENIR -->
      <div class="list-section">
        <div class="list-header">
          <h3 class="list-title">À venir</h3>
          <div class="list-actions">
            <VBtn variant="text" density="comfortable" @click="loadCourses">
              Actualiser
            </VBtn>
          </div>
        </div>

        <VTable class="events-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Heure</th>
              <th>Cours</th>
              <th>Animateur</th>
              <th>Salle</th>
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
                  <VChip v-if="item.recurrence && item.recurrence !== 'Aucune'"
                    :color="item.recurrence === 'Hebdomadaire' ? 'success' : item.recurrence === 'Toutes les 2 semaines' ? 'info' : 'warning'"
                    size="x-small" variant="flat" class="ml-2">
                    {{ item.recurrence }}
                  </VChip>
                </div>
              </td>
              <td>{{ item.teacher || '—' }}</td>
              <td>{{ item.location || '—' }}</td>
              <td class="actions">
                <div class="actions-wrapper">
                  <VBtn icon="mdi-pencil" variant="text" @click="openEdit(item)" />
                  <VBtn icon="mdi-delete" variant="text" color="error" @click="remove(item._id)" />
                </div>
              </td>
            </tr>
            <tr v-if="!upcoming.length && !loading">
              <td colspan="6" class="empty-row">Aucun créneau à venir.</td>
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
    </VCard>

    <!-- DIALOGUE CRÉATION / ÉDITION -->
    <VDialog v-model="dialog.open" max-width="720" class="event-dialog">
      <VCard>
        <div class="dialog-title">
          <span>{{ dialog.mode === 'create' ? 'Nouveau cours' : 'Modifier le cours' }}</span>
          <VBtn icon="mdi-close" variant="text" @click="dialog.open = false" />
        </div>

        <div class="dialog-content">
          <VForm ref="formRef" @submit.prevent="save">
            <div class="event-form">
              <VTextField v-model="form.title" label="Intitulé" required />
              <VTextarea v-model="form.description" label="Description" rows="3" />

              <VRow>
                <VCol cols="12" md="4">
                  <VSelect v-model="form.level" :items="levelOptions" label="Niveau" required />
                </VCol>
                <VCol cols="12" md="4">
                  <VTextField v-model="form.teacher" label="Animateur" />
                </VCol>
                <VCol cols="12" md="4">
                  <VTextField v-model="form.location" label="Salle / Lieu" />
                </VCol>
              </VRow>

              <div class="periods-section">
                <div class="periods-header">
                  <h4 class="periods-title">Créneau</h4>
                </div>
                <div class="period-grid">
                  <VMenu v-model="showDatePicker" :close-on-content-click="false" transition="scale-transition"
                    offset-y>
                    <template #activator="{ props }">
                      <VTextField v-model="formattedDateInput" label="Date" prepend-inner-icon="mdi-calendar" readonly
                        v-bind="props" />
                    </template>
                    <VDatePicker v-model="dateInput" :min="minCourseDate" :max="maxCourseDate"
                      @update:model-value="showDatePicker = false" />
                  </VMenu>
                  <VTextField v-model="startTime" type="time" label="Heure début" />
                  <VTextField v-model="endTime" type="time" label="Heure fin" />
                  <VSelect v-model="form.recurrence" :items="recurrenceOptions" label="Récurrence" />
                </div>
              </div>
            </div>
          </VForm>
        </div>

        <div class="dialog-actions">
          <div class="left">
            <VBtn v-if="dialog.mode === 'edit'" variant="text" color="error" @click="remove(form._id)">
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
    <DayManagementModal v-model="dayModal.open" :selected-date="selectedDate" :events="eventsForSelectedDate"
      @add-course="openCreate" @edit-course="openEdit" @delete-course="remove" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import DayManagementModal from '@/components/DayManagementModal.vue'
import { apiService } from '@/services/api'

/** ----------------------------
 *  Données & constantes
 *  ---------------------------- */
const levelOptions = ['Débutant', 'Novice', 'Intermédiaire']
const recurrenceOptions = ['Aucune', 'Hebdomadaire', 'Toutes les 2 semaines', 'Mensuelle']

const filters = reactive({
  q: '',
  level: null,
  teacher: null
})

// État de chargement et gestion des erreurs
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const abortController = ref(null)

// Données des cours depuis l'API
const courses = ref([])

// Variables de pagination
const currentPage = ref(1)
const pagination = ref(null)

/** ----------------------------
 *  Sélection / form dialog
 *  ---------------------------- */
const dialog = reactive({ open: false, mode: 'create' }) // 'create' | 'edit'
const formRef = ref(null)
const showDatePicker = ref(false)

/** ----------------------------
 *  Modale de gestion de journée
 *  ---------------------------- */
const dayModal = reactive({ open: false })
const selectedDate = ref(new Date())

const form = reactive({
  _id: null,
  title: '',
  description: '',
  level: 'Débutant',
  teacher: '',
  location: '',
  recurrence: 'Aucune'
})

const dateInput = ref(toISODate(new Date()))
const startTime = ref('18:30')
const endTime = ref('19h:15')

// Computed properties pour le date picker
const formattedDateInput = computed(() => {
  if (!dateInput.value) return ''
  return new Date(dateInput.value).toLocaleDateString('fr-FR')
})

// Date minimale pour un cours (pas de restriction)
const minCourseDate = computed(() => {
  return undefined
})

// Date maximale pour un cours (pas de restriction)
const maxCourseDate = computed(() => {
  return undefined
})


/** ----------------------------
 *  Utilitaires date/heure
 *  ---------------------------- */
function toISODate(d) {
  // S'assurer que d est un objet Date
  const date = d instanceof Date ? d : new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function timeShort(d) {
  const date = new Date(d)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function parseTime(s) {
  const [h, m] = s.split(':').map(Number)
  return { h, m }
}

function composeDate(dateStr, timeStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const { h, m } = parseTime(timeStr)
  d.setHours(h, m, 0, 0)
  return d
}

function sameDay(a, b) {
  const dateA = new Date(a)
  const dateB = new Date(b)
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

function dateLong(d) {
  const date = new Date(d)
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long' })
}

/** ----------------------------
 *  Filtres & projections
 *  ---------------------------- */
const teacherOptions = computed(() => {
  const set = new Set(courses.value.map(c => (c.teacher || '').trim()).filter(Boolean))
  return [...set].sort()
})

const filtered = computed(() => {
  const q = (filters.q || '').toLowerCase().trim()
  return courses.value.filter(c => {
    if (filters.level && c.level !== filters.level) return false
    if (filters.teacher && (c.teacher || '') !== filters.teacher) return false
    if (q) {
      const hay = [
        c.title, c.description, c.teacher, c.location, c.level
      ].map(v => (v || '').toLowerCase()).join(' ')
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const upcoming = computed(() => {
  const now = new Date()
  const upcomingCourses = []

  // Traiter chaque cours filtré
  filtered.value.forEach(course => {
    if (course.recurrence === 'Aucune') {
      // Cours ponctuel : l'ajouter s'il est à venir
      if (new Date(course.end) >= now) {
        upcomingCourses.push(course)
      }
    } else {
      // Cours récurrent : vérifier s'il y a au moins une occurrence à venir
      const courseStart = new Date(course.start)
      const courseEnd = new Date(course.end)
      const duration = courseEnd.getTime() - courseStart.getTime()

      // Calculer la prochaine occurrence
      let nextOccurrence = new Date(courseStart)
      const today = new Date()

      // Trouver la prochaine occurrence à partir d'aujourd'hui
      while (nextOccurrence < today) {
        switch (course.recurrence) {
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

      // Si la prochaine occurrence est dans le futur, ajouter le cours
      if (nextOccurrence >= today) {
        // Créer une version modifiée du cours avec la prochaine occurrence
        const upcomingCourse = {
          ...course,
          nextOccurrence: nextOccurrence,
          // Utiliser la prochaine occurrence pour le tri et l'affichage
          start: nextOccurrence,
          end: new Date(nextOccurrence.getTime() + duration)
        }
        upcomingCourses.push(upcomingCourse)
      }
    }
  })

  // Trier par date de début et limiter à 20 éléments
  return upcomingCourses
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 20)
})

// Événements pour la date sélectionnée dans la modale
const eventsForSelectedDate = computed(() => {
  if (!selectedDate.value) return []
  return coursesOnDate(selectedDate.value)
})

/** Calendrier : sessions du jour (affichage des pastilles) */
function coursesOnDate(date) {
  const coursesForDate = []

  filtered.value.forEach(course => {
    // Cours ponctuels
    if (course.recurrence === 'Aucune') {
      if (sameDay(course.start, date)) {
        coursesForDate.push(course)
      }
    }
    // Cours récurrents - générer les occurrences dynamiquement
    else if (course.recurrence !== 'Aucune') {
      const courseStart = new Date(course.start)
      const courseEnd = new Date(course.end)
      const duration = courseEnd.getTime() - courseStart.getTime()

      // Calculer la date de fin de récurrence (6 mois par défaut)
      const recurrenceEndDate = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 mois par défaut

      let currentDate = new Date(courseStart)

      // Générer les occurrences jusqu'à la date demandée + quelques mois
      while (currentDate <= recurrenceEndDate) {
        if (sameDay(currentDate, date)) {
          // Créer une occurrence virtuelle
          const occurrence = {
            ...course,
            _id: `${course._id}_${currentDate.getTime()}`, // ID unique pour l'occurrence
            start: new Date(currentDate),
            end: new Date(currentDate.getTime() + duration),
            isVirtualOccurrence: true, // Marquer comme occurrence virtuelle
            originalCourseId: course._id // Référence vers le cours original
          }
          coursesForDate.push(occurrence)
        }

        // Calculer la prochaine occurrence
        switch (course.recurrence) {
          case 'Hebdomadaire':
            currentDate.setDate(currentDate.getDate() + 7)
            break
          case 'Toutes les 2 semaines':
            currentDate.setDate(currentDate.getDate() + 14)
            break
          case 'Mensuelle':
            currentDate.setMonth(currentDate.getMonth() + 1)
            break
        }
      }
    }
  })

  return coursesForDate
}

/** ----------------------------
 *  API Calls
 *  ---------------------------- */
const loadCourses = async () => {
  try {
    // Annuler la requête précédente si elle existe
    if (abortController.value) {
      abortController.value.abort()
    }

    // Créer un nouveau contrôleur d'annulation
    abortController.value = new AbortController()

    loading.value = true
    error.value = null

    // Construire les paramètres de requête
    const params = {
      page: currentPage.value.toString(),
      limit: '20',
    }

    // Ajouter les filtres non vides
    if (filters.q) params.q = filters.q
    if (filters.level) params.level = filters.level
    if (filters.teacher) params.teacher = filters.teacher

    const queryString = new URLSearchParams(params).toString()
    console.log('Paramètres envoyés pour les cours:', params) // Debug
    console.log('URL de requête cours:', `/courses?${queryString}`) // Debug

    const response = await apiService.get(`/courses?${queryString}`, {
      signal: abortController.value.signal
    })

    console.log('Réponse complète reçue pour les cours:', response) // Debug

    // Vérifier que le composant est toujours monté avant de traiter la réponse
    if (isComponentMounted.value) {
      courses.value = response.data || []
      pagination.value = response.pagination || null
    }
  } catch (error) {
    // Ne pas afficher l'erreur si la requête a été annulée ou si le composant n'est plus monté
    if (error.name !== 'AbortError' && isComponentMounted.value) {
      console.error('❌ Erreur lors du chargement des cours:', error)
      error.value = error.message
    }
  } finally {
    // Ne mettre à jour loading que si le composant est toujours monté
    if (isComponentMounted.value) {
      loading.value = false
    }
  }
}

/** ----------------------------
 *  Actions UI
 *  ---------------------------- */
function resetFilters() {
  filters.q = ''
  filters.level = null
  filters.teacher = null
  currentPage.value = 1
  loadCourses()
}

function openCreate(baseDate) {
  dialog.mode = 'create'
  Object.assign(form, {
    _id: null,
    title: '',
    description: '',
    level: 'Débutant',
    teacher: '',
    location: '',
    recurrence: 'Aucune'
  })
  const d = baseDate || new Date()
  dateInput.value = toISODate(d)
  startTime.value = '19:00'
  endTime.value = '20:30'
  dialog.open = true
}

function openEdit(item) {
  dialog.mode = 'edit'

  // Si c'est une occurrence virtuelle, utiliser le cours original
  const courseToEdit = item.isVirtualOccurrence ?
    filtered.value.find(c => c._id === item.originalCourseId) :
    item

  Object.assign(form, { ...courseToEdit })
  dateInput.value = toISODate(new Date(courseToEdit.start))
  startTime.value = timeShort(courseToEdit.start)
  endTime.value = timeShort(courseToEdit.end)
  dialog.open = true
}

function onDayClick(day) {
  // Ouvrir la modale de gestion de la journée
  selectedDate.value = new Date(day.date)
  dayModal.open = true
}

async function save() {
  try {
    saving.value = true

    const start = composeDate(dateInput.value, startTime.value)
    const end = composeDate(dateInput.value, endTime.value)

    const courseData = {
      title: form.title,
      description: form.description,
      level: form.level,
      teacher: form.teacher,
      location: form.location,
      start: start.toISOString(),
      end: end.toISOString(),
      recurrence: form.recurrence
    }

    if (dialog.mode === 'edit' && form._id) {
      await apiService.put(`/courses/${form._id}`, courseData)
    } else {
      await apiService.post('/courses', courseData)
    }

    // Recharger les données seulement si le composant est toujours monté
    if (isComponentMounted.value) {
      await loadCourses()
      dialog.open = false
    }
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error)
    error.value = error.message
  } finally {
    saving.value = false
  }
}

async function remove(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
    return
  }

  try {
    // Si c'est une occurrence virtuelle, extraire l'ID du cours original
    const courseId = id.includes('_') ? id.split('_')[0] : id

    await apiService.delete(`/courses/${courseId}`)
    // Recharger les données seulement si le composant est toujours monté
    if (isComponentMounted.value) {
      await loadCourses()
      if (dialog.open && dialog.mode === 'edit' && form._id === courseId) {
        dialog.open = false
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
    error.value = error.message
  }
}

/** ----------------------------
 *  Couleurs & helpers visuels
 *  ---------------------------- */
function levelColor(level) {
  switch (level) {
    case 'Débutant': return 'success'
    case 'Novice': return 'info'
    case 'Intermédiaire': return 'warning'
    default: return 'primary'
  }
}

/** Formatage pour la table */
function timeRange(item) {
  return `${timeShort(item.start)}–${timeShort(item.end)}`
}

// État pour éviter les requêtes inutiles
const isComponentMounted = ref(false)

// Watchers pour la pagination et les filtres
watch(currentPage, () => {
  if (isComponentMounted.value) {
    loadCourses()
  }
})

watch(filters, () => {
  if (isComponentMounted.value) {
    currentPage.value = 1
    loadCourses()
  }
}, { deep: true })

// Charger les cours au montage
onMounted(() => {
  isComponentMounted.value = true
  loadCourses()
})

// Nettoyer les requêtes au démontage
onUnmounted(() => {
  isComponentMounted.value = false
  // Annuler les requêtes en cours
  if (abortController.value) {
    abortController.value.abort()
  }
})
</script>

<!-- Styles globaux pour cette vue -->
<style>
@import '@/assets/courses-view.css';
</style>
