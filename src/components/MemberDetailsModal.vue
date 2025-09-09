<template>
  <VDialog v-model="isOpen" max-width="900px" persistent>
    <VCard v-if="member" class="member-details-card">
      <!-- Header avec avatar et nom -->
      <VCardTitle class="member-header">
        <div class="member-avatar">
          <VIcon icon="mdi-account-circle" size="64" color="white" />
        </div>
        <div class="member-info">
          <h2 class="member-name">{{ member.firstName }} {{ member.lastName }}</h2>
          <div class="member-meta">
            <VChip :color="getStatusColor(member.status || 'pré-inscrit')" size="small" class="me-2">
              {{ getStatusLabel(member.status || 'pré-inscrit') }}
            </VChip>
            <VChip :color="member.imageRights ? 'success' : 'warning'" size="small">
              <VIcon :icon="member.imageRights ? 'mdi-camera' : 'mdi-camera-off'" size="16" class="me-1" />
              {{ member.imageRights ? 'Droit à l\'image' : 'Pas de droit' }}
            </VChip>
          </div>
        </div>
        <div class="header-actions">
          <VBtn icon="mdi-close" variant="text" size="small" @click="closeModal" />
        </div>
      </VCardTitle>

      <VCardText class="pa-0">
        <!-- Onglets pour organiser les informations -->
        <VTabs v-model="activeTab" color="primary" class="member-tabs">
          <VTab value="info">
            <VIcon icon="mdi-information" class="me-2" />
            Informations
          </VTab>
          <VTab value="events">
            <VIcon icon="mdi-calendar" class="me-2" />
            Événements ({{ member.enrolledEvents?.length || 0 }})
          </VTab>
          <VTab value="payments">
            <VIcon icon="mdi-cash" class="me-2" />
            Paiements
          </VTab>
        </VTabs>

        <VWindow v-model="activeTab" class="member-content">
          <!-- Onglet Informations -->
          <VWindowItem value="info">
            <div class="tab-content">
              <VRow>
                <VCol cols="12" md="6">
                  <div class="info-section">
                    <h4 class="section-title">
                      <VIcon icon="mdi-account" class="me-2" />
                      Informations personnelles
                    </h4>
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">Email</span>
                        <span class="info-value">{{ member.email }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Date de naissance</span>
                        <span class="info-value">{{ formatDate(member.birthDate) }} ({{ member.age }} ans)</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Téléphone domicile</span>
                        <span class="info-value">{{ member.homePhone || 'Non renseigné' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Téléphone portable</span>
                        <span class="info-value">{{ member.mobilePhone || 'Non renseigné' }}</span>
                      </div>
                      <div v-if="member.intendedTrialDate" class="info-item">
                        <span class="info-label">Date d'essai prévue</span>
                        <span class="info-value">
                          <VIcon icon="mdi-calendar-star" size="16" class="me-1" color="primary" />
                          {{ formatDate(member.intendedTrialDate) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="info-section">
                    <h4 class="section-title">
                      <VIcon icon="mdi-map-marker" class="me-2" />
                      Adresse
                    </h4>
                    <div class="address-card">
                      <VIcon icon="mdi-home" class="me-2" color="primary" />
                      <div>
                        <div class="address-line">{{ member.address }}</div>
                        <div class="address-line">{{ member.postalCode }} {{ member.city }}</div>
                      </div>
                    </div>
                  </div>
                </VCol>
              </VRow>
            </div>
          </VWindowItem>

          <!-- Onglet Événements -->
          <VWindowItem value="events">
            <div class="tab-content">
              <div v-if="member.enrolledEvents?.length" class="events-container">
                <!-- Événements à venir -->
                <div v-if="getUpcomingEvents(member.enrolledEvents).length" class="events-section">
                  <h4 class="section-title">
                    <VIcon icon="mdi-calendar-clock" class="me-2" />
                    Prochains événements
                  </h4>
                  <div class="events-grid">
                    <VCard v-for="event in getUpcomingEvents(member.enrolledEvents)" :key="event._id" class="event-card"
                      variant="outlined">
                      <VCardText class="pa-3">
                        <div class="event-header">
                          <VChip :color="getEventTypeColor(event.type)" size="small" class="me-2">
                            {{ getEventTypeLabel(event.type) }}
                          </VChip>
                          <span class="event-date">{{ formatDate(event.trialDate || event.occurrenceDate || event.start)
                            }}</span>
                        </div>
                        <h5 class="event-title">{{ event.title }}</h5>
                        <div v-if="event.description" class="event-description">
                          <VIcon icon="mdi-text" size="16" class="me-1" />
                          {{ event.description }}
                        </div>
                        <div v-if="event.location" class="event-location">
                          <VIcon icon="mdi-map-marker" size="16" class="me-1" />
                          {{ event.location }}
                        </div>
                      </VCardText>
                    </VCard>
                  </div>
                </div>

                <!-- Événements passés -->
                <div v-if="getPastEvents(member.enrolledEvents).length" class="events-section">
                  <h4 class="section-title">
                    <VIcon icon="mdi-calendar-check" class="me-2" />
                    Événements passés
                  </h4>
                  <div class="events-grid">
                    <VCard v-for="event in getPastEvents(member.enrolledEvents)" :key="event._id" class="event-card"
                      variant="outlined">
                      <VCardText class="pa-3">
                        <div class="event-header">
                          <VChip :color="getEventTypeColor(event.type)" size="small" class="me-2">
                            {{ getEventTypeLabel(event.type) }}
                          </VChip>
                          <span class="event-date">{{ formatDate(event.trialDate || event.occurrenceDate || event.start)
                            }}</span>
                        </div>
                        <h5 class="event-title">{{ event.title }}</h5>
                        <div v-if="event.description" class="event-description">
                          <VIcon icon="mdi-text" size="16" class="me-1" />
                          {{ event.description }}
                        </div>
                        <div v-if="event.location" class="event-location">
                          <VIcon icon="mdi-map-marker" size="16" class="me-1" />
                          {{ event.location }}
                        </div>
                      </VCardText>
                    </VCard>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <VIcon icon="mdi-calendar-blank" size="48" color="grey" class="mb-3" />
                <p>Aucun événement inscrit</p>
              </div>
            </div>
          </VWindowItem>

          <!-- Onglet Paiements -->
          <VWindowItem value="payments">
            <div class="tab-content">
              <div v-if="payments.length > 0" class="payments-container">
                <h4 class="section-title">
                  <VIcon icon="mdi-cash" class="me-2" />
                  Historique des paiements
                </h4>

                <!-- Tableau des paiements -->
                <VTable density="compact" class="payments-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Montant</th>
                      <th scope="col">Moyen</th>
                      <th scope="col">Objet</th>
                      <th scope="col">Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="payment in payments" :key="payment._id">
                      <td>{{ formatDate(payment.paymentDate) }}</td>
                      <td class="amount-cell">{{ payment.amount.toFixed(2) }} €</td>
                      <td>
                        <VChip :color="getPaymentMethodColor(payment.paymentMethod)" size="small">
                          {{ getPaymentMethodLabel(payment.paymentMethod) }}
                        </VChip>
                      </td>
                      <td>
                        <VChip :color="getPurposeColor(payment.purpose)" size="small">
                          {{ payment.purpose }}
                        </VChip>
                      </td>
                      <td>
                        <div v-if="payment.description" class="payment-details">
                          <div v-for="line in formatDescription(payment.description)" :key="line" class="detail-line">
                            {{ line }}
                          </div>
                        </div>
                        <span v-else class="text-medium-emphasis">-</span>
                      </td>
                    </tr>
                  </tbody>
                </VTable>

                <!-- Résumé des paiements -->
                <div class="payments-summary">
                  <VRow>
                    <VCol cols="12" md="4">
                      <VCard variant="outlined" class="summary-card">
                        <VCardText class="text-center pa-3">
                          <VIcon icon="mdi-cash" size="24" color="success" class="mb-2" />
                          <div class="summary-value">{{ payments.length }}</div>
                          <div class="summary-label">Paiements</div>
                        </VCardText>
                      </VCard>
                    </VCol>
                    <VCol cols="12" md="4">
                      <VCard variant="outlined" class="summary-card">
                        <VCardText class="text-center pa-3">
                          <VIcon icon="mdi-currency-eur" size="24" color="primary" class="mb-2" />
                          <div class="summary-value">{{ totalAmount.toFixed(2) }} €</div>
                          <div class="summary-label">Total</div>
                        </VCardText>
                      </VCard>
                    </VCol>
                    <VCol cols="12" md="4">
                      <VCard variant="outlined" class="summary-card">
                        <VCardText class="text-center pa-3">
                          <VIcon icon="mdi-calendar" size="24" color="info" class="mb-2" />
                          <div class="summary-value">{{ formatDate(lastPaymentDate) }}</div>
                          <div class="summary-label">Dernier paiement</div>
                        </VCardText>
                      </VCard>
                    </VCol>
                  </VRow>
                </div>
              </div>

              <div v-else class="empty-state">
                <VIcon icon="mdi-cash-off" size="48" color="grey" class="mb-3" />
                <p>Aucun paiement enregistré</p>
              </div>
            </div>
          </VWindowItem>
        </VWindow>
      </VCardText>

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn variant="outlined" @click="closeModal">Fermer</VBtn>
        <VBtn color="primary" prepend-icon="mdi-pencil" @click="editMember">Modifier</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useApi } from '@/services/api'

// Types
interface Member {
  _id: string
  firstName: string
  lastName: string
  birthDate: string
  address: string
  postalCode: string
  city: string
  homePhone?: string
  mobilePhone?: string
  email: string
  imageRights: boolean
  enrolledEvents: any[]
  registrationDate?: string
  age?: number
  primaryPhone?: string
  status?: 'pré-inscrit' | 'inscrit' | 'actif' | 'inactif'
  intendedTrialDate?: string
}

interface Payment {
  _id: string
  amount: number
  paymentMethod: 'chèque' | 'Espèce' | 'Virement' | 'Carte bancaire'
  purpose: string
  description?: string
  paymentDate: string
}

// Props
const props = defineProps<{
  modelValue: boolean
  member: Member | null
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'edit': [member: Member]
}>()

// État local
const activeTab = ref('info')
const payments = ref<Payment[]>([])
const loading = ref(false)

// API
const api = useApi()

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const totalAmount = computed(() => {
  return payments.value.reduce((sum, payment) => sum + payment.amount, 0)
})

const lastPaymentDate = computed(() => {
  if (payments.value.length === 0) return ''
  const sortedPayments = [...payments.value].sort((a, b) =>
    new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  )
  return sortedPayments[0].paymentDate
})

// Méthodes utilitaires
const formatDate = (dateString: string) => {
  // Éviter les problèmes de fuseau horaire en utilisant les méthodes locales
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pré-inscrit': return 'warning'
    case 'inscrit': return 'info'
    case 'actif': return 'success'
    case 'inactif': return 'error'
    default: return 'default'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pré-inscrit': return 'Pré-inscrit'
    case 'inscrit': return 'Inscrit'
    case 'actif': return 'Actif'
    case 'inactif': return 'Inactif'
    default: return status
  }
}

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'cours': return 'primary'
    case 'stage': return 'info'
    case 'compétition': return 'warning'
    case 'soirée': return 'secondary'
    case 'réunion': return 'success'
    default: return 'default'
  }
}

const getEventTypeLabel = (type: string) => {
  switch (type) {
    case 'cours': return 'Cours'
    case 'stage': return 'Stage'
    case 'compétition': return 'Compétition'
    case 'soirée': return 'Soirée'
    case 'réunion': return 'Réunion'
    default: return type || 'Événement'
  }
}

const getUpcomingEvents = (enrolledEvents: any[]) => {
  const now = new Date()
  const upcomingEvents: any[] = []

  enrolledEvents.forEach(enrollment => {
    // L'événement est maintenant dans enrollment.eventId (grâce au populate)
    const event = enrollment.eventId
    if (!event) return

    if (enrollment.isAllOccurrences) {
      // Pour "toutes les occurrences", ajouter l'événement avec un titre spécial
      upcomingEvents.push({
        ...event,
        title: `${event.title} (Toutes les occurrences)`,
        isAllOccurrences: true,
        trialDate: enrollment.trialDate
      })
    } else if (enrollment.occurrenceDate) {
      // Pour une occurrence spécifique, vérifier si elle est à venir
      const occurrenceDate = new Date(enrollment.occurrenceDate)
      if (occurrenceDate > now) {
        upcomingEvents.push({
          ...event,
          title: `${event.title} - ${occurrenceDate.toLocaleDateString('fr-FR')}`,
          occurrenceDate: occurrenceDate,
          isSpecificOccurrence: true
        })
      }
    } else if (!enrollment.isRecurring) {
      // Pour un événement simple, vérifier s'il est à venir
      const eventDate = new Date(event.start)
      if (eventDate > now) {
        upcomingEvents.push({
          ...event,
          isSimpleEvent: true
        })
      }
    }
  })

  // Trier par date
  return upcomingEvents.sort((a, b) => {
    const dateA = a.occurrenceDate ? a.occurrenceDate : new Date(a.start)
    const dateB = b.occurrenceDate ? b.occurrenceDate : new Date(b.start)
    return dateA.getTime() - dateB.getTime()
  })
}

const getPastEvents = (enrolledEvents: any[]) => {
  const now = new Date()
  const pastEvents: any[] = []

  enrolledEvents.forEach(enrollment => {
    // L'événement est maintenant dans enrollment.eventId (grâce au populate)
    const event = enrollment.eventId
    if (!event) return

    if (enrollment.isAllOccurrences) {
      // Pour "toutes les occurrences", ne pas l'afficher dans les événements passés
      // car c'est un événement récurrent global
      return
    } else if (enrollment.occurrenceDate) {
      // Pour une occurrence spécifique, vérifier si elle est passée
      const occurrenceDate = new Date(enrollment.occurrenceDate)
      if (occurrenceDate <= now) {
        pastEvents.push({
          ...event,
          title: `${event.title} - ${occurrenceDate.toLocaleDateString('fr-FR')}`,
          occurrenceDate: occurrenceDate,
          isSpecificOccurrence: true
        })
      }
    } else if (!enrollment.isRecurring) {
      // Pour un événement simple, vérifier s'il est passé
      const eventDate = new Date(event.start)
      if (eventDate <= now) {
        pastEvents.push({
          ...event,
          isSimpleEvent: true
        })
      }
    }
  })

  // Trier par date (plus récent en premier)
  return pastEvents.sort((a, b) => {
    const dateA = a.occurrenceDate ? a.occurrenceDate : new Date(a.start)
    const dateB = b.occurrenceDate ? b.occurrenceDate : new Date(b.start)
    return dateB.getTime() - dateA.getTime()
  })
}

// Méthodes pour les paiements
const loadPayments = async () => {
  if (!props.member?._id) return

  try {
    loading.value = true
    const response = await api.getData<Payment[]>(`/members/${props.member._id}/payments`)
    payments.value = response
  } catch (error) {
    console.error('Erreur lors du chargement des paiements:', error)
    payments.value = []
  } finally {
    loading.value = false
  }
}

const getPaymentMethodColor = (method: string) => {
  switch (method) {
    case 'Espèce': return 'success'
    case 'chèque': return 'warning'
    case 'Virement': return 'info'
    case 'Carte bancaire': return 'primary'
    default: return 'default'
  }
}

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'Espèce': return 'Espèce'
    case 'chèque': return 'Chèque'
    case 'Virement': return 'Virement'
    case 'Carte bancaire': return 'Carte bancaire'
    default: return method
  }
}

const getPurposeColor = (purpose: string) => {
  if (purpose.toLowerCase().includes('cotisation')) return 'primary'
  if (purpose.toLowerCase().includes('adhésion')) return 'secondary'
  if (purpose.toLowerCase().includes('stage')) return 'info'
  if (purpose.toLowerCase().includes('compétition')) return 'warning'
  return 'default'
}

const formatDescription = (description: string) => {
  if (!description) return []

  // Si c'est une description de chèque formatée, la diviser en lignes
  if (description.includes('Banque:')) {
    const lines = []
    const parts = description.split(', ')

    for (const part of parts) {
      if (part.includes('Banque:')) {
        lines.push(`🏦 ${part.replace('Banque:', '').trim()}`)
      } else if (part.includes('N°:')) {
        lines.push(`📄 N° ${part.replace('N°:', '').trim()}`)
      } else if (part.includes('IBAN:')) {
        lines.push(`💳 IBAN ****${part.replace('IBAN: ****', '').trim()}`)
      } else if (part.includes('Lot:')) {
        lines.push(`📦 Lot ${part.replace('Lot:', '').trim()}`)
      }
    }

    return lines
  }

  // Sinon, retourner la description telle quelle
  return [description]
}

// Actions
const closeModal = () => {
  isOpen.value = false
}

const editMember = () => {
  if (props.member) {
    emit('edit', props.member)
    closeModal()
  }
}

// Reset tab and load payments when modal opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    activeTab.value = 'info'
    loadPayments()
  }
})
</script>

<style>
@import '@/assets/member-details-modal.css';

.payments-container {
  padding: 1rem;
}

.payments-table {
  margin-bottom: 1.5rem;
}

.amount-cell {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.payment-details {
  font-size: 0.875rem;
}

.detail-line {
  margin-bottom: 0.25rem;
}

.payments-summary {
  margin-top: 1.5rem;
}

.summary-card {
  height: 100%;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.summary-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* ===== STYLES POUR LES ÉVÉNEMENTS ===== */
.events-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.events-section {
  margin-bottom: 40px;
  padding: 24px;
  background: linear-gradient(135deg,
      rgb(var(--v-theme-surface)) 0%,
      rgba(var(--v-theme-primary), 0.03) 100%);
  border-radius: 16px;
  border: 2px solid rgba(var(--v-theme-primary), 0.12);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.event-card {
  border-radius: 16px;
  border: 2px solid rgba(var(--v-theme-primary), 0.15);
  transition: all 0.3s ease;
  background: linear-gradient(135deg,
      rgb(var(--v-theme-surface)) 0%,
      rgba(var(--v-theme-primary), 0.02) 100%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
}

.event-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg,
      rgb(var(--v-theme-primary)) 0%,
      rgba(var(--v-theme-primary), 0.5) 100%);
}

.event-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.15);
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.event-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  /* Utiliser une couleur plus contrastée pour assurer la lisibilité */
  color: rgb(var(--v-theme-on-surface)) !important;
  /* Forcer l'opacité pour éviter les héritages */
  opacity: 1 !important;
}

/* Règle spécifique pour le mode clair */
.v-theme--light .event-title {
  color: rgba(0, 0, 0, 0.87) !important;
}

/* Règle spécifique pour le mode sombre */
.v-theme--dark .event-title {
  color: rgba(255, 255, 255, 0.87) !important;
}

.event-date {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-weight: 600;
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 4px 8px;
  border-radius: 6px;
}

.event-description,
.event-location {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  display: flex;
  align-items: center;
  font-style: italic;
  font-weight: 500;
  margin-bottom: 4px;
}
</style>
