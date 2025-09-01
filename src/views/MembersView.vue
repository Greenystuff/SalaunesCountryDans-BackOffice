<template>
  <div class="members-container">
    <VCard class="main-card">

      <!-- HEADER -->
      <div class="header-title">
        <div class="header-content">
          <h1 class="main-title">Gestion des Membres</h1>
          <p class="subtitle">
            Gérez les membres du club, leurs inscriptions et paiements.
          </p>
        </div>
        <div class="header-actions">
          <VBtn color="primary" prepend-icon="mdi-plus" @click="openCreate()">
            Nouveau membre
          </VBtn>
        </div>
      </div>

      <VDivider />

      <!-- BARRE D'OUTILS / FILTRES -->
      <div class="toolbar">
        <VTextField v-model="filters.q" placeholder="Rechercher par nom, prénom, email..." variant="solo"
          density="comfortable" hide-details clearable prepend-inner-icon="mdi-magnify" class="toolbar-item" />
        <VTextField v-model="filters.city" placeholder="Ville" variant="solo" density="comfortable" hide-details
          clearable class="toolbar-item" />
        <VSelect v-model="filters.imageRights" :items="imageRightsOptions" label="Droit à l'image" variant="solo"
          hide-details clearable class="toolbar-item" />
        <VSelect v-model="filters.status" :items="statusOptions" label="Statut" variant="solo" hide-details clearable
          class="toolbar-item" />
        <VBtn class="toolbar-item" variant="tonal" @click="resetFilters">
          Réinitialiser
        </VBtn>
      </div>

      <!-- STATISTIQUES -->
      <div class="stats-section" v-if="stats">
        <VRow>
          <VCol cols="12" sm="6" md="3">
            <VCard variant="outlined" class="stat-card">
              <VCardText class="text-center">
                <div class="stat-number">{{ stats.totalMembers }}</div>
                <div class="stat-label">Total membres</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VCard variant="outlined" class="stat-card">
              <VCardText class="text-center">
                <div class="stat-number">{{ stats.membersWithImageRights }}</div>
                <div class="stat-label">Avec droit à l'image</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VCard variant="outlined" class="stat-card">
              <VCardText class="text-center">
                <div class="stat-number">{{ stats.ageDistribution?.[0]?.count || 0 }}</div>
                <div class="stat-label">18-24 ans</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VCard variant="outlined" class="stat-card">
              <VCardText class="text-center">
                <div class="stat-number">{{ stats.membersByCity?.[0]?.count || 0 }}</div>
                <div class="stat-label">Top ville</div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <VDivider />

      <!-- LISTE DES MEMBRES -->
      <div class="list-section">
        <div class="list-header">
          <h3 class="list-title">Liste des membres</h3>
          <div class="list-actions">
            <VBtn variant="text" density="comfortable" @click="loadMembers">
              Actualiser
            </VBtn>
          </div>
        </div>

        <VTable class="members-table">
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Email</th>
              <th scope="col">Téléphone</th>
              <th scope="col">Ville</th>
              <th scope="col">Âge</th>
              <th scope="col">Statut</th>
              <th scope="col">Droit à l'image</th>
              <th scope="col">Cours inscrits</th>
              <th scope="col" class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in members" :key="member._id" class="hover-row">
              <td>
                <div class="member-name">
                  <strong>{{ member.firstName }} {{ member.lastName }}</strong>
                </div>
              </td>
              <td>{{ member.email }}</td>
              <td>{{ member.primaryPhone || '-' }}</td>
              <td>{{ member.city }}</td>
              <td>{{ member.age }} ans</td>
              <td>
                <VChip :color="getStatusColor(member.status || 'pré-inscrit')" size="small">
                  {{ getStatusLabel(member.status || 'pré-inscrit') }}
                </VChip>
              </td>
              <td>
                <VChip :color="member.imageRights ? 'success' : 'warning'" size="small">
                  {{ member.imageRights ? 'Oui' : 'Non' }}
                </VChip>
              </td>
              <td>
                <VChip v-if="member.enrolledCourses?.length" color="primary" size="small">
                  {{ member.enrolledCourses.length }} cours
                </VChip>
                <span v-else class="text-muted">Aucun</span>
              </td>
              <td class="col-actions">
                <div class="actions-container">
                  <VBtn icon="mdi-eye" variant="text" size="small" @click="openView(member)" />
                  <VBtn icon="mdi-pencil" variant="text" size="small" @click="openEdit(member)" />
                  <VBtn icon="mdi-delete" variant="text" size="small" color="error" @click="openDelete(member)" />
                </div>
              </td>
            </tr>
          </tbody>
        </VTable>

        <!-- Pagination -->
        <div class="pagination-wrapper" v-if="pagination && pagination.pages > 1">
          <VPagination v-model="currentPage" :length="pagination.pages" :total-visible="7" />
        </div>
      </div>
    </VCard>

    <!-- MODAL CRÉATION/ÉDITION -->
    <VDialog v-model="showModal" max-width="800px" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>{{ editingMember ? 'Modifier le membre' : 'Nouveau membre' }}</span>
          <VBtn icon="mdi-close" variant="text" size="small" @click="closeModal" />
        </VCardTitle>
        <VCardText class="pa-4">
          <VForm ref="form" @submit.prevent="saveMember">
            <VRow dense>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.firstName" label="Prénom *" required variant="outlined"
                  density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.lastName" label="Nom *" required variant="outlined" density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.email" label="Email *" type="email" required variant="outlined"
                  density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VMenu v-model="showBirthDatePicker" :close-on-content-click="false" transition="scale-transition"
                  offset-y>
                  <template #activator="{ props }">
                    <VTextField v-model="formattedBirthDate" label="Date de naissance *"
                      prepend-inner-icon="mdi-calendar" variant="outlined" density="compact" readonly v-bind="props"
                      required />
                  </template>
                  <VDatePicker v-model="formData.birthDate" :max="maxBirthDate"
                    @update:model-value="showBirthDatePicker = false" />
                </VMenu>
              </VCol>
              <VCol cols="12">
                <VTextField v-model="formData.address" label="Adresse *" required variant="outlined"
                  density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.postalCode" label="Code postal *" required variant="outlined"
                  density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.city" label="Ville *" required variant="outlined" density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.homePhone" label="Téléphone domicile" variant="outlined"
                  density="compact" />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField v-model="formData.mobilePhone" label="Téléphone portable" variant="outlined"
                  density="compact" />
              </VCol>
              <VCol cols="12">
                <VCheckbox v-model="formData.imageRights" label="Droit à l'image" density="compact" />
              </VCol>
              <VCol cols="12">
                <VSelect v-model="formData.enrolledCourses" :items="coursesOptions" label="Cours inscrits" multiple
                  variant="outlined" density="compact" />
              </VCol>

              <!-- Champs admin -->
              <VCol cols="12">
                <VDivider class="my-3" />
                <h4 class="text-h6 mb-3">Informations administratives</h4>
              </VCol>
              <VCol cols="12" md="6">
                <VMenu v-model="showRegistrationDatePicker" :close-on-content-click="false"
                  transition="scale-transition" offset-y>
                  <template #activator="{ props }">
                    <VTextField v-model="formattedRegistrationDate" label="Date d'inscription"
                      prepend-inner-icon="mdi-calendar" variant="outlined" density="compact" readonly v-bind="props" />
                  </template>
                  <VDatePicker v-model="formData.registrationDate" :max="maxRegistrationDate"
                    @update:model-value="showRegistrationDatePicker = false" />
                </VMenu>
              </VCol>
              <!-- Ligne 1: Paiement cotisation + Montant cotisation -->
              <VCol cols="12">
                <VRow dense>
                  <VCol cols="8" sm="7" md="6">
                    <VSelect v-model="formData.annualFeePaymentMethod" :items="paymentMethods"
                      label="Paiement cotisation" placeholder="Sélectionnez un moyen de paiement" variant="outlined"
                      density="compact" clearable />
                  </VCol>
                  <VCol cols="4" sm="5" md="6">
                    <VTextField v-model="formData.annualFeeAmount" label="Montant cotisation (€)" type="number" min="0"
                      step="0.01" variant="outlined" density="compact" placeholder="60" />
                  </VCol>
                </VRow>
              </VCol>

              <!-- Ligne 2: Paiement adhésion + Montant adhésion -->
              <VCol cols="12">
                <VRow dense>
                  <VCol cols="8" sm="7" md="6">
                    <VSelect v-model="formData.membershipPaymentMethod" :items="paymentMethods"
                      label="Paiement adhésion" placeholder="Sélectionnez un moyen de paiement" variant="outlined"
                      density="compact" clearable />
                  </VCol>
                  <VCol cols="4" sm="5" md="6">
                    <VTextField v-model="formData.membershipFeeAmount" label="Montant adhésion (€)" type="number"
                      min="0" step="0.01" variant="outlined" density="compact" placeholder="20" />
                  </VCol>
                </VRow>
              </VCol>

              <!-- Ligne 3: Statut + Alert -->
              <VCol cols="12">
                <VRow dense>
                  <VCol cols="12" md="6">
                    <VSelect v-model="formData.status" :items="statusOptions" label="Statut" variant="outlined"
                      density="compact" :disabled="isStatusAutoManaged" clearable />
                  </VCol>
                  <VCol cols="12" md="6">
                    <VAlert v-if="isStatusAutoManaged" type="info" variant="tonal" density="compact" class="mt-2">
                      Statut automatiquement géré selon les paiements
                    </VAlert>
                  </VCol>
                </VRow>
              </VCol>

              <!-- Section chèques -->
              <VCol cols="12">
                <VDivider class="my-3" />
                <!-- Nouveau membre: liste locale de chèques à créer -->
                <template v-if="!editingMember">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <h5 class="text-subtitle-1 m-0">Chèques (nouveau membre)</h5>
                    <VBtn size="small" color="primary" prepend-icon="mdi-plus" @click="addNewCheque">Ajouter</VBtn>
                  </div>
                  <VTable density="compact">
                    <thead>
                      <tr>
                        <th scope="col">Montant</th>
                        <th scope="col">Objet</th>
                        <th scope="col">Banque</th>
                        <th scope="col">N° chèque</th>
                        <th scope="col">Émission</th>
                        <th scope="col" class="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(c, idx) in newCheques" :key="idx">
                        <td style="width:120px">
                          <VTextField v-model.number="c.amount" type="number" min="0.01" step="0.01" density="compact"
                            hide-details />
                        </td>
                        <td style="width:160px">
                          <VSelect v-model="c.purpose" :items="purposeItems" density="compact" hide-details />
                        </td>
                        <td style="width:160px">
                          <VTextField v-model="c.bankName" density="compact" hide-details />
                        </td>
                        <td style="width:160px">
                          <VTextField v-model="c.checkNumber" density="compact" hide-details />
                        </td>
                        <td style="width:160px">
                          <VMenu v-model="showChequeDatePicker[idx]" :close-on-content-click="false"
                            transition="scale-transition" offset-y>
                            <template #activator="{ props }">
                              <VTextField v-model="formattedChequeDate[idx]" prepend-inner-icon="mdi-calendar"
                                density="compact" hide-details readonly v-bind="props" />
                            </template>
                            <VDatePicker v-model="c.issuedAt" :max="maxChequeDate"
                              @update:model-value="showChequeDatePicker[idx] = false" />
                          </VMenu>
                        </td>
                        <td class="text-right">
                          <VBtn icon="mdi-delete" size="small" variant="text" color="error"
                            @click="removeNewCheque(idx)" />
                        </td>
                      </tr>
                      <tr v-if="newCheques.length === 0">
                        <td colspan="6" class="text-medium-emphasis text-center">Aucun chèque à ajouter</td>
                      </tr>
                    </tbody>
                  </VTable>
                </template>
                <!-- Membre existant: gestionnaire complet -->
                <ChequesManager v-else :member-id="editingMember._id" />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="closeModal">Annuler</VBtn>
          <VBtn color="primary" @click="saveMember" :loading="saving">
            {{ editingMember ? 'Modifier' : 'Créer' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- MODAL DÉTAILS -->
    <VDialog v-model="showViewModal" max-width="600px">
      <VCard v-if="viewingMember">
        <VCardTitle>
          Détails du membre
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <strong>Nom complet:</strong><br>
              {{ viewingMember.firstName }} {{ viewingMember.lastName }}
            </VCol>
            <VCol cols="12" md="6">
              <strong>Email:</strong><br>
              {{ viewingMember.email }}
            </VCol>
            <VCol cols="12" md="6">
              <strong>Date de naissance:</strong><br>
              {{ formatDate(viewingMember.birthDate) }} ({{ viewingMember.age }} ans)
            </VCol>
            <VCol cols="12" md="6">
              <strong>Droit à l'image:</strong><br>
              <VChip :color="viewingMember.imageRights ? 'success' : 'warning'" size="small">
                {{ viewingMember.imageRights ? 'Oui' : 'Non' }}
              </VChip>
            </VCol>
            <VCol cols="12">
              <strong>Adresse:</strong><br>
              {{ viewingMember.address }}<br>
              {{ viewingMember.postalCode }} {{ viewingMember.city }}
            </VCol>
            <VCol cols="12" md="6">
              <strong>Téléphone domicile:</strong><br>
              {{ viewingMember.homePhone || 'Non renseigné' }}
            </VCol>
            <VCol cols="12" md="6">
              <strong>Téléphone portable:</strong><br>
              {{ viewingMember.mobilePhone || 'Non renseigné' }}
            </VCol>
            <VCol cols="12" v-if="viewingMember.enrolledCourses?.length">
              <strong>Cours inscrits:</strong><br>
              <VChip v-for="course in viewingMember.enrolledCourses" :key="course._id" color="primary" size="small"
                class="ma-1">
                {{ course.title }} ({{ course.level }})
              </VChip>
            </VCol>
            <VCol cols="12" v-if="viewingMember.registrationDate">
              <strong>Date d'inscription:</strong><br>
              {{ formatDate(viewingMember.registrationDate) }}
            </VCol>
            <VCol cols="12" v-if="viewingMember.annualFeePaymentMethod">
              <strong>Paiement cotisation:</strong><br>
              {{ viewingMember.annualFeePaymentMethod }}
            </VCol>
            <VCol cols="12" v-if="viewingMember.membershipPaymentMethod">
              <strong>Paiement adhésion:</strong><br>
              {{ viewingMember.membershipPaymentMethod }}
            </VCol>
            <VCol cols="12" v-if="viewingMember.checkDeposits?.length">
              <strong>Chèques déposés:</strong><br>
              <div v-for="check in viewingMember.checkDeposits" :key="check.depositDate" class="ma-1">
                {{ check.amount }}€ - {{ formatDate(check.depositDate) }}
              </div>
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showViewModal = false">Fermer</VBtn>
          <VBtn color="primary" @click="editFromView">Modifier</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- MODAL SUPPRESSION -->
    <VDialog v-model="showDeleteModal" max-width="400px">
      <VCard>
        <VCardTitle>Confirmer la suppression</VCardTitle>
        <VCardText>
          Êtes-vous sûr de vouloir supprimer le membre
          <strong>{{ deletingMember?.firstName }} {{ deletingMember?.lastName }}</strong> ?
          <br>
          Cette action est irréversible.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showDeleteModal = false">Annuler</VBtn>
          <VBtn color="error" @click="deleteMember" :loading="deleting">Supprimer</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useApi } from '@/services/api'
import ChequesManager from '@/components/ChequesManager.vue'

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
  enrolledCourses: any[]
  registrationDate?: string
  annualFeePaymentMethod?: 'chèque' | 'Espèce'
  membershipPaymentMethod?: 'chèque' | 'Espèce'
  checkDeposits?: Array<{ amount: number; depositDate: string }>
  age?: number
  primaryPhone?: string
  status?: 'pré-inscrit' | 'inscrit' | 'actif' | 'inactif'
  intendedTrialDate?: string
}

interface Course {
  _id: string
  title: string
  level: string
}

interface Stats {
  totalMembers: number
  membersWithImageRights: number
  membersByCity: Array<{ _id: string; count: number }>
  ageDistribution: Array<{ _id: string; count: number }>
}

// État réactif
const api = useApi()
const members = ref<Member[]>([])
const courses = ref<Course[]>([])
const stats = ref<Stats | null>(null)
const currentPage = ref(1)
const pagination = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
// Chèques ajoutés pour un nouveau membre avant création
type NewCheque = { amount: number; purpose: 'cotisation' | 'adhesion' | 'autre'; bankName?: string; checkNumber?: string; issuedAt?: string }
const newCheques = ref<NewCheque[]>([])

// Modals
const showModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const showBirthDatePicker = ref(false)
const showRegistrationDatePicker = ref(false)
const showChequeDatePicker = ref<boolean[]>([])
const maxChequeDate = computed(() => new Date().toISOString().split('T')[0])

// Form data
const editingMember = ref<Member | null>(null)
const viewingMember = ref<Member | null>(null)
const deletingMember = ref<Member | null>(null)

const formData = reactive({
  firstName: '',
  lastName: '',
  birthDate: '',
  address: '',
  postalCode: '',
  city: '',
  homePhone: '',
  mobilePhone: '',
  email: '',
  imageRights: false,
  enrolledCourses: [] as string[],
  registrationDate: '',
  annualFeePaymentMethod: null as 'chèque' | 'Espèce' | null,
  annualFeeAmount: 60,
  membershipPaymentMethod: null as 'chèque' | 'Espèce' | null,
  membershipFeeAmount: 20,
  status: 'pré-inscrit' as 'pré-inscrit' | 'inscrit' | 'actif' | 'inactif',
})

// Filtres
const filters = reactive({
  q: '',
  city: '',
  imageRights: null,
  status: null,
})

// Options
const imageRightsOptions = [
  { title: 'Avec droit à l\'image', value: 'true' },
  { title: 'Sans droit à l\'image', value: 'false' },
]

const statusOptions = [
  { title: 'Pré-inscrit', value: 'pré-inscrit' },
  { title: 'Inscrit', value: 'inscrit' },
  { title: 'Actif', value: 'actif' },
  { title: 'Inactif', value: 'inactif' },
]

const paymentMethods = [
  { title: 'Chèque', value: 'chèque' },
  { title: 'Espèce', value: 'Espèce' },
]

const coursesOptions = computed(() => {
  return courses.value.map(course => ({
    title: `${course.title} (${course.level})`,
    value: course._id
  }))
})

const purposeItems = [
  { title: 'Cotisation', value: 'cotisation' },
  { title: 'Adhésion', value: 'adhesion' },
  { title: 'Autre', value: 'autre' },
]

const addNewCheque = () => {
  newCheques.value.push({ amount: 0, purpose: 'autre' })
}
const removeNewCheque = (idx: number) => {
  newCheques.value.splice(idx, 1)
}

// Méthodes
const loadMembers = async () => {
  try {
    loading.value = true

    // Construire les paramètres en excluant les valeurs vides
    const params: Record<string, string> = {
      page: currentPage.value.toString(),
      limit: '20',
    }

    // Ajouter seulement les filtres non vides
    if (filters.q) params.q = filters.q
    if (filters.city) params.city = filters.city
    if (filters.imageRights !== null && filters.imageRights !== '') params.imageRights = filters.imageRights
    if (filters.status) params.status = filters.status

    const queryString = new URLSearchParams(params).toString()
    console.log('Paramètres envoyés:', params) // Debug
    console.log('URL de requête:', `/members?${queryString}`) // Debug
    const payload = await api.getData<Member[]>(`/members?${queryString}`)
    console.log('Payload reçu:', payload) // Debug
    members.value = payload
    // TODO: Gérer la pagination quand le backend l'implémentera
    pagination.value = null
  } catch (error) {
    console.error('Erreur lors du chargement des membres:', error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const payload = await api.getData<Stats>('/members/stats')
    stats.value = payload
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error)
  }
}

const loadCourses = async () => {
  try {
    const payload = await api.getData<Course[]>('/courses')
    courses.value = payload
  } catch (error) {
    console.error('Erreur lors du chargement des cours:', error)
  }
}

const resetFilters = () => {
  filters.q = ''
  filters.city = ''
  filters.imageRights = null
  filters.status = null
  currentPage.value = 1
  loadMembers()
}

const openCreate = () => {
  editingMember.value = null
  resetForm()
  showModal.value = true
}

const openEdit = (member: Member) => {
  editingMember.value = member
  fillForm(member)
  showModal.value = true
}

const openView = (member: Member) => {
  viewingMember.value = member
  showViewModal.value = true
}

const openDelete = (member: Member) => {
  deletingMember.value = member
  showDeleteModal.value = true
}

const editFromView = () => {
  if (viewingMember.value) {
    openEdit(viewingMember.value)
    showViewModal.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  editingMember.value = null
  resetForm()
}

const resetForm = () => {
  Object.assign(formData, {
    firstName: '',
    lastName: '',
    birthDate: '',
    address: '',
    postalCode: '',
    city: '',
    homePhone: '',
    mobilePhone: '',
    email: '',
    imageRights: false,
    enrolledCourses: [],
    registrationDate: '',
    annualFeePaymentMethod: null,
    annualFeeAmount: 60,
    membershipPaymentMethod: null,
    membershipFeeAmount: 20,
    status: 'pré-inscrit',
  })
}

const fillForm = (member: Member) => {
  Object.assign(formData, {
    firstName: member.firstName,
    lastName: member.lastName,
    birthDate: member.birthDate.split('T')[0],
    address: member.address,
    postalCode: member.postalCode,
    city: member.city,
    homePhone: member.homePhone || '',
    mobilePhone: member.mobilePhone || '',
    email: member.email,
    imageRights: member.imageRights,
    enrolledCourses: member.enrolledCourses.map(c => c._id),
    registrationDate: member.registrationDate?.split('T')[0] || '',
    annualFeePaymentMethod: member.annualFeePaymentMethod || null,
    membershipPaymentMethod: member.membershipPaymentMethod || null,
    status: member.status || 'pré-inscrit',
  })
}

const saveMember = async () => {
  try {
    saving.value = true

    const memberData = {
      ...formData,
      birthDate: new Date(formData.birthDate).toISOString(),
      registrationDate: formData.registrationDate ? new Date(formData.registrationDate).toISOString() : undefined,
    }

    if (editingMember.value) {
      await api.put(`/members/${editingMember.value._id}`, memberData)
    } else {
      const created = await api.postData<any>('/members', memberData)
      // Créer les chèques saisis localement si présents
      if (created?._id && newCheques.value.length > 0) {
        const memberId = created._id
        for (const c of newCheques.value) {
          try {
            const chequeData = {
              amount: c.amount,
              purpose: c.purpose,
              bankName: c.bankName,
              checkNumber: c.checkNumber,
              issuedAt: c.issuedAt ? new Date(c.issuedAt).toISOString() : undefined,
            }
            await api.postData(`/members/${memberId}/checks`, chequeData)
          } catch (chequeError) {
            console.error('Erreur création chèque:', chequeError)
          }
        }
      }
    }

    closeModal()
    loadMembers()
    loadStats()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
  } finally {
    saving.value = false
  }
}

const deleteMember = async () => {
  if (!deletingMember.value) return

  try {
    deleting.value = true
    await api.delete(`/members/${deletingMember.value._id}`)
    showDeleteModal.value = false
    deletingMember.value = null
    loadMembers()
    loadStats()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
  } finally {
    deleting.value = false
  }
}

// Computed properties pour les date pickers
const formattedBirthDate = computed(() => {
  if (!formData.birthDate) return ''
  return new Date(formData.birthDate).toLocaleDateString('fr-FR')
})

const formattedRegistrationDate = computed(() => {
  if (!formData.registrationDate) return ''
  return new Date(formData.registrationDate).toLocaleDateString('fr-FR')
})

// Date maximale pour la naissance (aujourd'hui)
const maxBirthDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Date maximale pour l'inscription (aujourd'hui)
const maxRegistrationDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Computed property pour les dates de chèques
const formattedChequeDate = computed(() => {
  return newCheques.value.map(cheque => {
    if (!cheque.issuedAt) return ''
    return new Date(cheque.issuedAt).toLocaleDateString('fr-FR')
  })
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR')
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

// Computed pour déterminer si le statut doit être géré automatiquement (booléen strict)
const isStatusAutoManaged = computed<boolean>(() => {
  return !!formData.annualFeePaymentMethod &&
    !!formData.membershipPaymentMethod &&
    Number(formData.annualFeeAmount) > 0 &&
    Number(formData.membershipFeeAmount) > 0
})

// Watcher pour mettre à jour automatiquement le statut
watch([() => formData.annualFeePaymentMethod, () => formData.annualFeeAmount,
() => formData.membershipPaymentMethod, () => formData.membershipFeeAmount],
  ([annualMethod, annualAmount, membershipMethod, membershipAmount]) => {
    if (annualMethod && annualAmount && membershipMethod && membershipAmount) {
      // Si tous les paiements sont renseignés, passer en "inscrit"
      formData.status = 'inscrit'
    } else if (!annualMethod && !annualAmount && !membershipMethod && !membershipAmount) {
      // Si aucun paiement n'est renseigné, rester en "pré-inscrit"
      formData.status = 'pré-inscrit'
    }
    // Sinon, laisser l'utilisateur choisir manuellement
  }
)

// Watchers
watch(currentPage, () => {
  loadMembers()
})

watch(filters, (newFilters) => {
  console.log('Watcher filters déclenché:', newFilters) // Debug
  currentPage.value = 1
  loadMembers()
}, { deep: true })

// Initialisation
onMounted(() => {
  loadMembers()
  loadStats()
  loadCourses()
})
</script>

<style scoped>
.members-container {
  padding: 20px;
}

.main-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
}

.header-content .main-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--v-primary-base);
}

.header-content .subtitle {
  font-size: 16px;
  color: var(--v-text-secondary);
  margin: 0;
}

.toolbar {
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-item {
  min-width: 200px;
}

.stats-section {
  padding: 16px 24px;
}

.stat-card {
  text-align: center;
  border-radius: 8px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--v-primary-base);
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: var(--v-text-secondary);
}

.list-section {
  padding: 24px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.members-table {
  border-radius: 8px;
  overflow: hidden;
}

.members-table th {
  background-color: var(--v-surface-variant);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.hover-row:hover {
  background-color: var(--v-surface-variant);
}

.member-name {
  font-weight: 500;
}

.col-actions {
  width: 120px;
  text-align: center;
  vertical-align: middle;
}

.actions-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.text-muted {
  color: var(--v-text-disabled);
}

@media (max-width: 768px) {
  .header-title {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-item {
    min-width: auto;
  }

  .list-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}
</style>
