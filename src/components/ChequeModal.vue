<template>
  <VDialog v-model="isOpen" max-width="600px" persistent>
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>{{ editing ? 'Modifier un chèque' : 'Ajouter un chèque' }}</span>
        <VBtn icon="mdi-close" variant="text" size="small" @click="closeModal" />
      </VCardTitle>
      <VCardText>
        <VRow dense>
          <VCol cols="12" md="6">
            <VTextField v-model.number="form.amount" label="Montant (€)" type="number" min="0.01" step="0.01" required
              variant="outlined" density="compact" />
          </VCol>
          <VCol cols="12" md="6">
            <VSelect v-model="form.purpose" :items="purposeItems" label="Objet" variant="outlined" density="compact" />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField v-model="form.checkNumber" label="N° chèque" variant="outlined" density="compact" />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField v-model="form.bankName" label="Banque" variant="outlined" density="compact" />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField v-model="form.ibanLast4" label="IBAN (4 derniers)" maxlength="4" variant="outlined"
              density="compact" />
          </VCol>
          <VCol cols="12" md="6">
            <VTextField v-model="form.remitBatch" label="Remise n°" variant="outlined" density="compact" />
          </VCol>
          <VCol cols="12" md="6">
            <VMenu v-model="showDatePicker" :close-on-content-click="false" transition="scale-transition" offset-y>
              <template #activator="{ props }">
                <VTextField v-model="formattedIssuedAt" label="Date d'émission" prepend-inner-icon="mdi-calendar"
                  readonly v-bind="props" variant="outlined" density="compact" />
              </template>
              <VDatePicker v-model="form.issuedAt" :max="maxIssuedAt" @update:model-value="showDatePicker = false" />
            </VMenu>
          </VCol>
          <VCol cols="12" md="6">
            <VSelect v-model="form.status" :items="statusItems" label="Statut" variant="outlined" density="compact" />
          </VCol>
          <VCol cols="12">
            <VTextField v-model="form.imageUrl" label="URL du scan (optionnel)" variant="outlined" density="compact" />
          </VCol>
          <VCol cols="12">
            <VTextarea v-model="form.notes" label="Notes" rows="2" auto-grow variant="outlined" density="compact" />
          </VCol>
        </VRow>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn variant="text" @click="closeModal">Annuler</VBtn>
        <VBtn color="primary" @click="save" :loading="saving">
          {{ editing ? 'Modifier' : 'Ajouter' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'

// Types
interface ChequeData {
  _id?: string
  amount: number
  purpose: string
  checkNumber?: string
  bankName?: string
  ibanLast4?: string
  remitBatch?: string
  issuedAt?: string
  status: 'recu' | 'remis' | 'credite' | 'rejete' | 'retourne'
  imageUrl?: string
  notes?: string
}

// Props
const props = defineProps<{
  modelValue: boolean
  cheque?: ChequeData | null
  editing?: boolean
  memberId?: string | null
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [cheque: ChequeData]
  'close': []
}>()

// État local
const saving = ref(false)
const showDatePicker = ref(false)

// Form data
const form = reactive<ChequeData & { _id: string }>({
  _id: '',
  amount: 0,
  purpose: 'autre',
  checkNumber: '',
  bankName: '',
  ibanLast4: '',
  remitBatch: '',
  issuedAt: '',
  status: 'recu',
  imageUrl: '',
  notes: '',
})

// Options
const purposeItems = [
  { title: 'Cotisation', value: 'cotisation' },
  { title: 'Adhésion', value: 'adhesion' },
  { title: 'Autre', value: 'autre' },
]

const statusItems = [
  { title: 'Reçu', value: 'recu' },
  { title: 'Remis', value: 'remis' },
  { title: 'Crédité', value: 'credite' },
  { title: 'Rejeté', value: 'rejete' },
  { title: 'Retourné', value: 'retourne' },
]

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formattedIssuedAt = computed(() => {
  if (!form.issuedAt) return ''
  return new Date(form.issuedAt).toLocaleDateString('fr-FR')
})

const maxIssuedAt = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Méthodes
const resetForm = () => {
  Object.assign(form, {
    _id: '',
    amount: 0,
    purpose: 'autre',
    checkNumber: '',
    bankName: '',
    ibanLast4: '',
    remitBatch: '',
    issuedAt: '',
    status: 'recu',
    imageUrl: '',
    notes: '',
  })
}

const fillForm = (cheque: ChequeData) => {
  Object.assign(form, {
    _id: cheque._id || '',
    amount: cheque.amount || 0,
    purpose: cheque.purpose || 'autre',
    checkNumber: cheque.checkNumber || '',
    bankName: cheque.bankName || '',
    ibanLast4: cheque.ibanLast4 || '',
    remitBatch: cheque.remitBatch || '',
    issuedAt: cheque.issuedAt ? cheque.issuedAt.split('T')[0] : '',
    status: cheque.status,
    imageUrl: cheque.imageUrl || '',
    notes: cheque.notes || '',
  })
}

const closeModal = () => {
  emit('close')
  emit('update:modelValue', false)
  resetForm()
}

const save = async () => {
  if (!form.amount || form.amount <= 0) {
    return // Validation simple
  }

  saving.value = true

  try {
    const chequeData = { ...form }
    if (form.issuedAt) {
      chequeData.issuedAt = new Date(form.issuedAt).toISOString()
    }

    emit('save', chequeData)
    closeModal()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
  } finally {
    saving.value = false
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue && props.cheque) {
    fillForm(props.cheque)
  } else if (newValue && !props.editing) {
    resetForm()
  }
})

watch(() => props.cheque, (newCheque) => {
  if (newCheque && props.modelValue) {
    fillForm(newCheque)
  }
}, { deep: true })
</script>

<style scoped>
/* Styles spécifiques si nécessaire */
</style>
