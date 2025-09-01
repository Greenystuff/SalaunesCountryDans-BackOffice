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

      <!-- BARRE D’OUTILS / FILTRES -->
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
          <VCalendar class="custom-calendar" :first-day-of-week="1" :min-weeks="5" :locale="'fr'" :expanded="true">
            <template #day-content="{ day }">
              <div class="vc-day-content" @click="onDayClick(day)">
                <div class="vc-day-label">{{ day.day }}</div>
                <div class="vc-day-content-wrapper">
                  <!-- Affichage normal pour 1-2 événements -->
                  <template v-if="coursesOnDate(day.date).length <= 2">
                    <div v-for="item in coursesOnDate(day.date)" :key="item.id" class="vc-day-content-item"
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
                      <div v-for="item in coursesOnDate(day.date)" :key="item.id" class="vc-day-dot"
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
            <VBtn variant="text" density="comfortable" @click="addSampleWeek">
              Générer une semaine d'exemple
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
            <tr v-for="item in upcoming" :key="item.id" class="hover-row">
              <td>{{ dateLong(item.start) }}</td>
              <td>{{ timeShort(item.start) }}–{{ timeShort(item.end) }}</td>
              <td>
                <div class="title-cell">
                  <VChip :color="levelColor(item.level)" size="small" variant="flat" class="mr-2">
                    {{ item.level }}
                  </VChip>
                  <span class="title">{{ item.title }}</span>
                </div>
              </td>
              <td>{{ item.teacher || '—' }}</td>
              <td>{{ item.location || '—' }}</td>
              <td class="actions">
                <VBtn icon="mdi-pencil" variant="text" @click="openEdit(item)" />
                <VBtn icon="mdi-delete" variant="text" color="error" @click="remove(item.id)" />
              </td>
            </tr>
            <tr v-if="!upcoming.length">
              <td colspan="6" class="empty-row">Aucun créneau à venir.</td>
            </tr>
          </tbody>
        </VTable>
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
                  <VTextField v-model="dateInput" type="date" label="Date" />
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
            <VBtn v-if="dialog.mode === 'edit'" variant="text" color="error" @click="remove(form.id)">
              Supprimer
            </VBtn>
          </div>
          <div class="action-buttons">
            <VBtn variant="text" @click="dialog.open = false">Annuler</VBtn>
            <VBtn color="primary" @click="save">
              {{ dialog.mode === 'create' ? 'Créer' : 'Enregistrer' }}
            </VBtn>
          </div>
        </div>
      </VCard>
    </VDialog>

    <!-- MODALE DE GESTION DE JOURNÉE -->
    <DayManagementModal v-model="dayModal.open" :selected-date="selectedDate" :events="filtered"
      @add-course="openCreate" @edit-course="openEdit" @delete-course="remove" />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import DayManagementModal from '@/components/DayManagementModal.vue'

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

/** Jeu d’essai minimal — remplace ensuite par tes données côté API */
const courses = ref([
  // Quelques sessions d’exemple sur le mois courant
  sample('Initiation Line Dance', 'Débutant', 'Sophie', 'Salle A', 19, 0, 1),
  sample('Two-Step Cool', 'Intermédiaire', 'Marc', 'Salle B', 20, 0, 2),
  sample('Honky-Tonk Basics', 'Novice', 'Sophie', 'Grande salle', 18, 30, 3),
  sample('Chorée “Country Roads”', 'Débutant', 'Léa', 'Salle A', 19, 0, 6),
  sample('Technique & posture', 'Intermédiaire', 'Marc', 'Studio', 20, 30, 8)
])

function sample(title, level, teacher, location, h, m, dayOffset) {
  const base = new Date()
  const d = new Date(base.getFullYear(), base.getMonth(), 1 + dayOffset, h, m, 0, 0)
  const e = new Date(d); e.setMinutes(e.getMinutes() + 90)
  return {
    id: uid(),
    title, level, teacher, location,
    description: '',
    start: d,
    end: e,
    recurrence: 'Aucune'
  }
}

/** ----------------------------
 *  Sélection / form dialog
 *  ---------------------------- */
const dialog = reactive({ open: false, mode: 'create' }) // 'create' | 'edit'
const formRef = ref(null)

/** ----------------------------
 *  Modale de gestion de journée
 *  ---------------------------- */
const dayModal = reactive({ open: false })
const selectedDate = ref(new Date())

const form = reactive({
  id: null,
  title: '',
  description: '',
  level: 'Débutant',
  teacher: '',
  location: '',
  recurrence: 'Aucune'
})

const dateInput = ref(toISODate(new Date()))
const startTime = ref('19:00')
const endTime = ref('20:30')

/** ----------------------------
 *  Utilitaires date/heure
 *  ---------------------------- */
function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function timeShort(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function dateLong(d) {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long' })
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
  return [...filtered.value]
    .filter(c => c.end >= now)
    .sort((a, b) => a.start - b.start)
    .slice(0, 20)
})

/** Calendrier : sessions du jour (affichage des pastilles) */
function coursesOnDate(date) {
  return filtered.value.filter(c => sameDay(c.start, date))
}



/** ----------------------------
 *  Actions UI
 *  ---------------------------- */
function resetFilters() {
  filters.q = ''
  filters.level = null
  filters.teacher = null
}

function openCreate(baseDate) {
  dialog.mode = 'create'
  Object.assign(form, {
    id: null,
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
  Object.assign(form, { ...item })
  dateInput.value = toISODate(item.start)
  startTime.value = timeShort(item.start)
  endTime.value = timeShort(item.end)
  dialog.open = true
}

function onDayClick(day) {
  // Ouvrir la modale de gestion de la journée
  selectedDate.value = day.date
  dayModal.open = true
}

function save() {
  const start = composeDate(dateInput.value, startTime.value)
  const end = composeDate(dateInput.value, endTime.value)

  if (dialog.mode === 'edit' && form.id) {
    const idx = courses.value.findIndex(c => c.id === form.id)
    if (idx !== -1) {
      courses.value[idx] = {
        ...courses.value[idx],
        ...form,
        start,
        end
      }
    }
  } else {
    // Création (avec récurrence optionnelle légère)
    const base = {
      id: uid(),
      title: form.title,
      description: form.description,
      level: form.level,
      teacher: form.teacher,
      location: form.location
    }

    const toAdd = []
    const repeatCount = form.recurrence === 'Aucune' ? 1
      : form.recurrence === 'Hebdomadaire' ? 8
        : form.recurrence === 'Toutes les 2 semaines' ? 6
          : /* Mensuelle */ 6

    for (let i = 0; i < repeatCount; i++) {
      const s = new Date(start)
      const e = new Date(end)
      if (form.recurrence === 'Hebdomadaire') {
        s.setDate(s.getDate() + i * 7)
        e.setDate(e.getDate() + i * 7)
      } else if (form.recurrence === 'Toutes les 2 semaines') {
        s.setDate(s.getDate() + i * 14)
        e.setDate(e.getDate() + i * 14)
      } else if (form.recurrence === 'Mensuelle') {
        s.setMonth(s.getMonth() + i)
        e.setMonth(e.getMonth() + i)
      }
      toAdd.push({ ...base, id: uid(), start: s, end: e, recurrence: form.recurrence })
    }
    courses.value.push(...toAdd)
  }

  dialog.open = false
}

function remove(id) {
  courses.value = courses.value.filter(c => c.id !== id)
  if (dialog.open && dialog.mode === 'edit' && form.id === id) {
    dialog.open = false
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

/** ID simple */
function uid() {
  return Math.random().toString(36).slice(2, 10)
}

/** Petite démo : ajoute une semaine type */
function addSampleWeek() {
  const base = new Date()
  const monday = new Date(base)
  const day = monday.getDay() || 7
  monday.setDate(monday.getDate() - (day - 1)) // Lundi de cette semaine

  const mk = (dow, h, m, title, level, teacher, location) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + (dow - 1))
    d.setHours(h, m, 0, 0)
    const e = new Date(d); e.setMinutes(e.getMinutes() + 90)
    courses.value.push({
      id: uid(), title, level, teacher, location,
      description: '',
      start: d, end: e, recurrence: 'Aucune', capacity: null, price: null
    })
  }

  mk(1, 19, 0, 'Line Dance — Bases', 'Débutant', 'Sophie', 'Salle A')
  mk(3, 20, 0, 'Two-Step — Atelier', 'Intermédiaire', 'Marc', 'Salle B')
  mk(5, 19, 30, 'Chorée — Soirée', 'Novice', 'Léa', 'Grande salle')
}
</script>

<!-- Styles globaux pour cette vue -->
<style>
@import '@/assets/courses-view.css';
</style>
