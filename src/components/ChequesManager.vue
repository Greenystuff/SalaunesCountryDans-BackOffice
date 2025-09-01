<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-2">
      <h5 class="text-subtitle-1 m-0">Chèques</h5>
      <VBtn size="small" color="primary" prepend-icon="mdi-plus" @click="openCreate">Ajouter</VBtn>
    </div>

    <VTable density="compact">
      <thead>
        <tr>
          <th scope="col">Date émission</th>
          <th scope="col">Montant</th>
          <th scope="col">Banque</th>
          <th scope="col">Statut</th>
          <th scope="col">Remise</th>
          <th scope="col" class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in cheques" :key="item._id">
          <td>{{ item.issuedAt ? formatDate(item.issuedAt) : '-' }}</td>
          <td>{{ item.amount.toFixed(2) }} €</td>
          <td>{{ item.bankName || '-' }}</td>
          <td>
            <VChip size="small" :color="statusColor(item.status)">{{ statusLabel(item.status) }}</VChip>
          </td>
          <td>{{ item.remitBatch || '-' }}</td>
          <td class="text-right">
            <VMenu>
              <template #activator="{ props }">
                <VBtn v-bind="props" icon="mdi-dots-vertical" size="small" variant="text" />
              </template>
              <VList density="compact">
                <VListItem @click="openEdit(item)">Modifier</VListItem>
                <VListItem @click="quickStatus(item, 'remis')">Marquer remis</VListItem>
                <VListItem @click="quickStatus(item, 'credite')">Marquer crédité</VListItem>
                <VListItem @click="quickStatus(item, 'rejete')">Marquer rejeté</VListItem>
                <VDivider />
                <VListItem class="text-error" @click="confirmDelete(item)">Supprimer</VListItem>
              </VList>
            </VMenu>
          </td>
        </tr>
        <tr v-if="cheques.length === 0">
          <td colspan="6" class="text-medium-emphasis text-center">Aucun chèque</td>
        </tr>
      </tbody>
    </VTable>

    <!-- Modale CRUD -->
    <VDialog v-model="showModal" max-width="600px">
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>{{ editing ? 'Modifier un chèque' : 'Ajouter un chèque' }}</span>
          <VBtn icon="mdi-close" variant="text" size="small" @click="close" />
        </VCardTitle>
        <VCardText>
          <VRow dense>
            <VCol cols="12" md="6">
              <VTextField v-model.number="form.amount" label="Montant (€)" type="number" min="0.01" step="0.01"
                required />
            </VCol>
            <VCol cols="12" md="6">
              <VSelect v-model="form.purpose" :items="purposeItems" label="Objet" />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="form.checkNumber" label="N° chèque" />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="form.bankName" label="Banque" />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="form.ibanLast4" label="IBAN (4 derniers)" maxlength="4" />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="form.remitBatch" label="Remise n°" />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="form.issuedAt" label="Date d'émission" type="date" />
            </VCol>
            <VCol cols="12" md="6">
              <VSelect v-model="form.status" :items="statusItems" label="Statut" />
            </VCol>
            <VCol cols="12">
              <VTextField v-model="form.imageUrl" label="URL du scan (optionnel)" />
            </VCol>
            <VCol cols="12">
              <VTextarea v-model="form.notes" label="Notes" rows="2" auto-grow />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="close">Annuler</VBtn>
          <VBtn color="primary" :loading="saving" @click="save">{{ editing ? 'Enregistrer' : 'Ajouter' }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Confirm delete -->
    <VDialog v-model="showDelete" max-width="420">
      <VCard>
        <VCardTitle>Supprimer le chèque</VCardTitle>
        <VCardText>Cette action est irréversible. Confirmer la suppression ?</VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showDelete = false">Annuler</VBtn>
          <VBtn color="error" :loading="deleting" @click="doDelete">Supprimer</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useApi } from '@/services/api'

interface Cheque {
  _id?: string
  amount: number
  purpose: 'cotisation' | 'adhesion' | 'autre'
  checkNumber?: string
  bankName?: string
  ibanLast4?: string
  issuedAt?: string
  depositedAt?: string
  creditedAt?: string
  bouncedAt?: string
  status: 'recu' | 'remis' | 'credite' | 'rejete' | 'retourne'
  remitBatch?: string
  imageUrl?: string
  notes?: string
}

const props = defineProps<{ memberId: string }>()
const api = useApi()

const cheques = ref<Cheque[]>([])
const showModal = ref(false)
const showDelete = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editing = ref(false)
const currentId = ref<string | null>(null)

const form = reactive<Cheque>({
  amount: 0,
  purpose: 'autre',
  status: 'recu',
})

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

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')
const statusColor = (s: Cheque['status']) => ({
  recu: 'warning', remis: 'info', credite: 'success', rejete: 'error', retourne: 'error',
} as const)[s]
const statusLabel = (s: Cheque['status']) => ({
  recu: 'Reçu', remis: 'Remis', credite: 'Crédité', rejete: 'Rejeté', retourne: 'Retourné',
} as const)[s]

const fetchCheques = async () => {
  const payload = await api.getData<Cheque[]>(`/members/${props.memberId}/checks`)
  cheques.value = payload
}

const openCreate = () => {
  editing.value = false
  currentId.value = null
  Object.assign(form, { amount: 0, purpose: 'autre', status: 'recu', checkNumber: '', bankName: '', ibanLast4: '', issuedAt: '', remitBatch: '', imageUrl: '', notes: '' })
  showModal.value = true
}
const openEdit = (item: Cheque) => {
  editing.value = true
  currentId.value = item._id || null
  Object.assign(form, { ...item, issuedAt: item.issuedAt ? item.issuedAt.substring(0, 10) : '' })
  showModal.value = true
}
const close = () => { showModal.value = false }

const save = async () => {
  try {
    saving.value = true
    if (editing.value && currentId.value) {
      await api.putData<Cheque>(`/members/${props.memberId}/checks/${currentId.value}`, form)
    } else {
      await api.postData<Cheque>(`/members/${props.memberId}/checks`, form)
    }
    showModal.value = false
    fetchCheques()
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item: Cheque) => {
  currentId.value = item._id || null
  showDelete.value = true
}
const doDelete = async () => {
  if (!currentId.value) return
  try {
    deleting.value = true
    await api.deleteData<void>(`/members/${props.memberId}/checks/${currentId.value}`)
    showDelete.value = false
    fetchCheques()
  } finally {
    deleting.value = false
  }
}

const quickStatus = async (item: Cheque, status: Cheque['status']) => {
  await api.patch?.(`/members/${props.memberId}/checks/${item._id}/status`, { status })
  // fallback si patch non dispo dans api service
  if (!api.patch) {
    await api.postData<Cheque>(`/members/${props.memberId}/checks/${item._id}/status`, { status })
  }
  fetchCheques()
}

onMounted(fetchCheques)
watch(() => props.memberId, fetchCheques)
</script>

<style scoped>
.text-right {
  text-align: right;
}
</style>
