<template>
  <VDialog v-model="isOpen" max-width="800" class="day-modal">
    <VCard>
      <!-- En-tête de la modale -->
      <div class="modal-header">
        <div class="header-content">
          <h2 class="modal-title">{{ dateLong(selectedDate) }}</h2>
          <p class="modal-subtitle">
            {{ eventsForSelectedDate.length }} événement{{ eventsForSelectedDate.length > 1 ? 's' : '' }} programmé{{
              eventsForSelectedDate.length > 1 ? 's' : '' }}
          </p>
        </div>
        <VBtn icon="mdi-close" variant="text" @click="closeModal" class="close-btn" />
      </div>

      <VDivider />

      <!-- Contenu principal -->
      <div class="modal-body">
        <!-- En-tête avec actions -->
        <div class="body-header">
          <div class="header-info">
            <h3 class="day-title">{{ dateLong(selectedDate) }}</h3>
            <p class="day-subtitle">
              {{ eventsForSelectedDate.length }} événement{{ eventsForSelectedDate.length > 1 ? 's' : '' }} programmé{{
                eventsForSelectedDate.length > 1 ? 's' : '' }}
            </p>
          </div>
          <div class="header-actions">
            <VBtn color="primary" prepend-icon="mdi-plus" @click="addEvent">
              Ajouter un événement
            </VBtn>
          </div>
        </div>

        <!-- Liste des événements -->
        <div class="events-container">
          <div v-if="eventsForSelectedDate.length === 0" class="empty-state">
            <div class="empty-icon">
              <VIcon icon="mdi-calendar-blank" size="64" color="grey" />
            </div>
            <h4 class="empty-title">Aucun événement programmé</h4>
            <p class="empty-description">Cliquez sur "Ajouter un événement" pour commencer</p>
          </div>

          <div v-else class="events-list">
            <div v-for="item in eventsForSelectedDate" :key="item.id" class="event-card">
              <!-- Créneau horaire -->
              <div class="event-time">
                <div class="time-range">
                  {{ timeShort(item.start) }} – {{ timeShort(item.end) }}
                </div>
                <div class="duration">
                  {{ Math.round((new Date(item.end) - new Date(item.start)) / (1000 * 60)) }} min
                </div>
              </div>

              <!-- Détails de l'événement -->
              <div class="event-content">
                <div class="event-header">
                  <VChip :color="typeColor(item.type)" size="small" variant="flat" class="type-chip">
                    {{ item.type }}
                  </VChip>
                  <VChip v-if="item.level" :color="levelColor(item.level)" size="small" variant="outlined"
                    class="level-chip">
                    {{ item.level }}
                  </VChip>
                  <h4 class="event-title">{{ item.title }}</h4>
                </div>

                <div class="event-meta">
                  <div class="meta-item" v-if="item.instructor">
                    <VIcon icon="mdi-account" size="16" />
                    <span>{{ item.instructor }}</span>
                  </div>
                  <div class="meta-item" v-if="item.location">
                    <VIcon icon="mdi-map-marker" size="16" />
                    <span>{{ item.location }}</span>
                  </div>
                  <div class="meta-item" v-if="item.price">
                    <VIcon icon="mdi-currency-eur" size="16" />
                    <span>{{ item.price }}€</span>
                  </div>
                </div>

                <div class="event-description" v-if="item.description">
                  {{ item.description }}
                </div>
              </div>

              <!-- Actions -->
              <div class="event-actions">
                <VBtn icon="mdi-pencil" variant="text" size="small" @click="editEvent(item)" />
                <VBtn icon="mdi-delete" variant="text" color="error" size="small" @click="deleteEvent(item._id)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedDate: {
    type: Date,
    required: true
  },
  events: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'add-event', 'edit-event', 'delete-event'])

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const eventsForSelectedDate = computed(() => {
  // Filtrer les événements pour la date sélectionnée
  const eventsOnDate = props.events.filter(event => {
    const eventDate = new Date(event.start)
    const selectedDate = new Date(props.selectedDate)

    return (
      eventDate.getFullYear() === selectedDate.getFullYear() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getDate() === selectedDate.getDate()
    )
  })

  return eventsOnDate.sort((a, b) => new Date(a.start) - new Date(b.start))
})

// Méthodes utilitaires
function dateLong(date) {
  // S'assurer que date est un objet Date
  const dateObj = date instanceof Date ? date : parseLocalDate(date)
  return dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long' })
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

function timeShort(date) {
  // S'assurer que date est un objet Date
  const dateObj = date instanceof Date ? date : parseLocalDate(date)
  return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
}

function levelColor(level) {
  switch (level) {
    case 'Débutant': return 'success'
    case 'Novice': return 'info'
    case 'Intermédiaire': return 'warning'
    case 'Avancé': return 'error'
    case 'Tous niveaux': return 'primary'
    default: return 'primary'
  }
}

function typeColor(type) {
  switch (type) {
    case 'Cours': return 'primary'
    case 'Événement': return 'secondary'
    case 'Compétition': return 'tertiary'
    case 'Stage': return 'error'
    case 'Autre': return 'surface-variant'
    default: return 'primary'
  }
}

// Actions
function closeModal() {
  isOpen.value = false
}

function addEvent() {
  emit('add-event', props.selectedDate)
}

function editEvent(event) {
  emit('edit-event', event)
}

function deleteEvent(eventId) {
  emit('delete-event', eventId)
}
</script>

<style scoped>
/* ===== MODALE DE GESTION DE JOURNÉE ===== */
.day-modal {
  --modal-padding: 24px;
}

/* En-tête de la modale */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--modal-padding);
  background: linear-gradient(135deg,
      rgba(var(--v-theme-primary), 0.08),
      rgba(var(--v-theme-primary), 0.04));
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.08);
}

.header-content {
  flex: 1;
}

.modal-title {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.2;
}

.modal-subtitle {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.95rem;
}

.close-btn {
  flex-shrink: 0;
  margin-left: 16px;
}

/* Corps de la modale */
.modal-body {
  padding: var(--modal-padding);
}

/* En-tête du contenu */
.body-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.header-info {
  flex: 1;
}

.day-title {
  margin: 0 0 4px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.day-subtitle {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.9rem;
}

.header-actions {
  flex-shrink: 0;
}

/* Conteneur des événements */
.events-container {
  min-height: 200px;
}

/* État vide */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-title {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.empty-description {
  margin: 0;
  font-size: 0.95rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Liste des événements */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Carte d'événement */
.event-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: flex-start;
  padding: 20px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-outline), 0.08);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.event-card:hover {
  background: rgba(var(--v-theme-primary), 0.04);
  border-color: rgba(var(--v-theme-primary), 0.16);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* Créneau horaire */
.event-time {
  text-align: center;
  min-width: 90px;
}

.time-range {
  font-weight: 700;
  font-size: 0.95rem;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 6px;
}

.duration {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgba(var(--v-theme-on-surface), 0.08);
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-block;
  font-weight: 500;
}

/* Contenu de l'événement */
.event-content {
  flex: 1;
  min-width: 0;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.level-chip {
  flex-shrink: 0;
}

.event-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  flex: 1;
  min-width: 0;
  line-height: 1.3;
}

/* Métadonnées */
.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.meta-item .v-icon {
  color: rgba(var(--v-theme-on-surface), 0.5);
}

/* Description */
.event-description {
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.8);
  line-height: 1.5;
  background: rgba(var(--v-theme-on-surface), 0.04);
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid rgba(var(--v-theme-primary), 0.3);
}

/* Actions */
.event-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

/* Responsive */
@media (max-width: 768px) {
  .day-modal {
    --modal-padding: 16px;
  }

  .body-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .event-card {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .event-time {
    text-align: left;
    min-width: auto;
  }

  .event-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .event-meta {
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .modal-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .close-btn {
    align-self: flex-end;
    margin-left: 0;
  }
}
</style>
