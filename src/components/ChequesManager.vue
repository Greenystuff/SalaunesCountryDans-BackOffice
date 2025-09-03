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
                <VListItem @click="quickStatus(item, 'recu')">Marquer reçu</VListItem>
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

    <!-- Modale CRUD réutilisable -->
    <ChequeModal v-model="showModal" :cheque="editingCheque" :editing="editing" :member-id="memberId" @save="saveCheque"
      @close="closeModal" />

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
import { ref, onMounted, watch } from 'vue'
import { useApi } from '@/services/api'
import ChequeModal from './ChequeModal.vue'

interface Cheque {
  _id?: string
  amount: number
  purpose: string
  checkNumber?: string
  bankName?: string
  ibanLast4?: string
  issuedAt?: string
  depositedAt?: string
  creditedAt?: string
  bouncedAt?: string
  status: 'emis' | 'recu' | 'remis' | 'credite' | 'rejete' | 'retourne'
  remitBatch?: string
  imageUrl?: string
  notes?: string
}

const props = defineProps<{ memberId: string }>()
const api = useApi()

const cheques = ref<Cheque[]>([])
const showModal = ref(false)
const showDelete = ref(false)
const deleting = ref(false)
const editing = ref(false)
const editingCheque = ref<Cheque | null>(null)
const currentId = ref<string | null>(null)



const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')
const statusColor = (s: Cheque['status']) => ({
  emis: 'info', recu: 'warning', remis: 'info', credite: 'success', rejete: 'error', retourne: 'error',
} as const)[s]
const statusLabel = (s: Cheque['status']) => ({
  emis: 'Émis', recu: 'Reçu', remis: 'Remis', credite: 'Crédité', rejete: 'Rejeté', retourne: 'Retourné',
} as const)[s]

const fetchCheques = async () => {
  const payload = await api.getData<Cheque[]>(`/members/${props.memberId}/checks`)
  cheques.value = payload
}

const openCreate = () => {
  editing.value = false
  editingCheque.value = null
  showModal.value = true
}

const openEdit = (item: Cheque) => {
  editing.value = true
  editingCheque.value = { ...item }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editing.value = false
  editingCheque.value = null
}

const saveCheque = async (chequeData: Cheque) => {
  try {
    if (editing.value && editingCheque.value?._id) {
      await api.putData<Cheque>(`/members/${props.memberId}/checks/${editingCheque.value._id}`, chequeData)
    } else {
      await api.postData<Cheque>(`/members/${props.memberId}/checks`, chequeData)
    }
    await fetchCheques()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du chèque:', error)
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
