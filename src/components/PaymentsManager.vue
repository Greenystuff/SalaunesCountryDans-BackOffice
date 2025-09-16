<template>
  <div class="payments-manager">
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="d-flex align-center">
        <h5 class="text-subtitle-1 m-0 me-2">Paiements</h5>
        <VTooltip>
          <template #activator="{ props }">
            <VIcon icon="mdi-information-outline" size="16" color="primary" v-bind="props" class="info-icon" />
          </template>
          <template #default>
            <div class="tooltip-content">
              <div class="tooltip-title">
                <VIcon icon="mdi-information" size="16" class="me-1" />
                Information
              </div>
              <div class="tooltip-message">
                Les paiements ajoutés ou modifiés seront enregistrés uniquement après avoir sauvegardé les modifications
                du membre.
              </div>
            </div>
          </template>
        </VTooltip>
      </div>
      <VBtn size="small" color="primary" prepend-icon="mdi-plus" @click="emitAddPayment">
        Ajouter un paiement
      </VBtn>
    </div>

    <!-- Liste des paiements -->
    <VTable density="compact" v-if="payments.length > 0">
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">Montant</th>
          <th scope="col">Moyen</th>
          <th scope="col">Objet</th>
          <th scope="col">Description</th>
          <th scope="col" class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="payment in payments" :key="payment._id">
          <td>{{ formatDate(payment.paymentDate) }}</td>
          <td>{{ payment.amount.toFixed(2) }} €</td>
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
            <div v-if="payment.description" class="text-caption">
              <div v-for="line in formatDescription(payment.description)" :key="line" class="mb-1">
                {{ line }}
              </div>
            </div>
            <span v-else class="text-medium-emphasis">-</span>
          </td>
          <td class="text-right">
            <VBtn icon="mdi-pencil" size="small" variant="text" @click="emitEditPayment(payment)" />
            <VBtn icon="mdi-delete" size="small" variant="text" color="error" @click="deletePayment(payment)" />
          </td>
        </tr>
      </tbody>
    </VTable>

    <div v-else class="text-center text-medium-emphasis py-4">
      Aucun paiement enregistré
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useApi } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'
import type { Payment } from '@/types'

// Props
const props = defineProps<{
  memberId: string
}>()

// Composables
const api = useApi()
const { showSuccess, showError } = useNotifications()

// État réactif
const payments = ref<Payment[]>([])
const loading = ref(false)
const saving = ref(false)


// Options
const paymentMethodOptions = [
  { title: 'Espèce', value: 'Espèce' },
  { title: 'Chèque', value: 'chèque' },
  { title: 'Virement', value: 'Virement' },
  { title: 'Carte bancaire', value: 'Carte bancaire' }
]


// Computed

const maxPaymentDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Émission d'événements vers le parent
const emit = defineEmits<{
  addPayment: []
  editPayment: [payment: Payment]
}>()


const emitAddPayment = () => {
  emit('addPayment')
}

const emitEditPayment = (payment: Payment) => {
  emit('editPayment', payment)
}

// Méthodes
const loadPayments = async () => {
  try {
    loading.value = true
    const response = await api.getData<Payment[]>(`/members/${props.memberId}/payments`)
    payments.value = response
  } catch (error) {
    console.error('Erreur lors du chargement des paiements:', error)
    showError('Erreur lors du chargement des paiements')
  } finally {
    loading.value = false
  }
}



const deletePayment = async (payment: Payment) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
    return
  }

  try {
    await api.delete(`/payments/${payment._id}`)
    showSuccess('Paiement supprimé avec succès')
    await loadPayments()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    showError('Erreur lors de la suppression du paiement')
  }
}


// Utilitaires
const formatDate = (dateString: string) => {
  if (!dateString) return '-'

  // Éviter les problèmes de fuseau horaire en utilisant les méthodes locales
  const date = new Date(dateString)

  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    return '-'
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
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
  // Couleur basée sur le contenu du texte
  if (purpose.toLowerCase().includes('cotisation')) return 'primary'
  if (purpose.toLowerCase().includes('adhésion')) return 'secondary'
  if (purpose.toLowerCase().includes('stage')) return 'info'
  if (purpose.toLowerCase().includes('compétition')) return 'warning'
  return 'default'
}

// Initialisation
onMounted(() => {
  loadPayments()
})

// Exposer la méthode de rechargement
defineExpose({
  reloadPayments: loadPayments
})
</script>

<style scoped>
.payments-manager {
  margin-top: 1rem;
}

.info-icon {
  cursor: help;
  transition: opacity 0.2s ease;
}

.info-icon:hover {
  opacity: 0.8;
}

/* Styles pour le tooltip - cohérents avec le design global */
:deep(.v-tooltip__content) {
  background: rgb(var(--v-theme-surface-variant)) !important;
  color: rgb(var(--v-theme-on-surface-variant)) !important;
  border: 1px solid rgb(var(--v-theme-outline-variant)) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  padding: 12px !important;
  max-width: 280px !important;
  font-size: 0.875rem !important;
  line-height: 1.4 !important;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tooltip-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: rgb(var(--v-theme-primary)) !important;
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.tooltip-message {
  color: rgb(var(--v-theme-on-surface-variant)) !important;
  line-height: 1.4;
}

/* Responsive - ajustements pour mobile */
@media (max-width: 768px) {
  :deep(.v-tooltip__content) {
    max-width: 250px !important;
    font-size: 0.8rem !important;
    padding: 10px !important;
  }

  .tooltip-title {
    font-size: 0.85rem;
  }
}
</style>
