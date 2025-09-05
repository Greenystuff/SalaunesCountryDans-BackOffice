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
          <VBtn v-if="canCreate" color="primary" prepend-icon="mdi-plus" @click="openCreate()">
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

      <!-- TABLEAU DES MEMBRES -->
      <div class="list-section">
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
                <div v-if="member.enrolledCourses?.length" class="courses-summary">
                  <VChip color="primary" size="small" class="mb-1">
                    {{ member.enrolledCourses.length }} cours
                  </VChip>
                  <div v-if="getUpcomingCourses(member.enrolledCourses).length" class="next-course">
                    <small class="text-success">
                      Prochain: {{ getUpcomingCourses(member.enrolledCourses)[0].title }}
                    </small>
                  </div>
                </div>
                <span v-else class="text-muted">Aucun</span>
              </td>
              <td class="col-actions">
                <div class="actions-container">
                  <VBtn icon="mdi-eye" variant="text" size="small" @click="openView(member)" />
                  <VBtn v-if="canEdit" icon="mdi-pencil" variant="text" size="small" @click="openEdit(member)" />
                  <VBtn v-if="canDelete" icon="mdi-delete" variant="text" size="small" color="error" @click="openDelete(member)" />
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

      <VDivider />

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
                <div class="stat-number">{{ getAgeGroupCount('18-24') }}</div>
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

      <!-- GESTION DU RÈGLEMENT INTÉRIEUR -->
      <div class="rules-section">
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <h3 class="text-h6 mb-1">Règlement Intérieur</h3>
            <p class="text-caption text-medium-emphasis mb-0">
              Gérez le document officiel du règlement intérieur du club
            </p>
          </div>
          <VBtn color="primary" prepend-icon="mdi-file-upload" @click="openRulesUploadModal" :disabled="uploadingRules">
            Uploader nouveau règlement
          </VBtn>
        </div>

        <div v-if="activeRules" class="current-rules-card">
          <VCard variant="outlined">
            <VCardText>
              <div class="d-flex align-center justify-space-between">
                <div class="flex-grow-1">
                  <div class="d-flex align-center mb-2">
                    <VIcon icon="mdi-file-pdf-box" color="error" class="mr-2" />
                    <span class="text-h6">{{ activeRules.title }}</span>
                    <VChip color="success" size="small" class="ml-2">Actuel</VChip>
                  </div>
                  <div class="text-caption text-medium-emphasis mb-2">
                    Version {{ activeRules.version }} • Uploadé le {{ formatDate(activeRules.uploadDate) }}
                    <span v-if="activeRules.uploadedBy"> par {{ activeRules.uploadedBy.firstName }} {{
                      activeRules.uploadedBy.lastName }}</span>
                  </div>
                  <div v-if="activeRules.description" class="text-body-2 mb-2">
                    {{ activeRules.description }}
                  </div>
                  <div class="text-caption">
                    Taille: {{ formatFileSize(activeRules.fileSize) }}
                  </div>
                </div>
                <div class="d-flex flex-column ga-2">
                  <VBtn icon="mdi-download" variant="outlined" size="small" @click="downloadRules(activeRules)" />
                  <VBtn icon="mdi-history" variant="outlined" size="small" @click="openRulesHistoryModal" />
                </div>
              </div>
            </VCardText>
          </VCard>
        </div>
        <VAlert v-else type="warning" variant="tonal" class="mb-4">
          Aucun règlement intérieur n'est actuellement défini pour le club.
        </VAlert>
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
                    <VSelect v-model="formData.status" :items="availableStatusOptions" label="Statut" variant="outlined"
                      density="compact" :disabled="isStatusAutoManaged" clearable />
                  </VCol>
                  <VCol cols="12" md="6">
                    <VAlert v-if="isStatusAutoManaged" type="info" variant="tonal" density="compact" class="mt-2">
                      Statut automatiquement géré selon les paiements
                    </VAlert>
                    <VAlert
                      v-else-if="strictPaymentValidation && !hasRequiredPaymentAmounts() && formData.status !== 'inscrit'"
                      type="warning" variant="tonal" density="compact" class="mt-2">
                      Pour définir le statut "inscrit", saisissez 60€ (cotisation) et 20€ (adhésion)
                    </VAlert>
                  </VCol>
                </VRow>
              </VCol>

              <!-- Section chèques -->
              <VCol cols="12">
                <VDivider class="my-3" />
                <!-- Nouveau membre: utilisation du même composant de modale -->
                <template v-if="!editingMember">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <h5 class="text-subtitle-1 m-0">Chèques (nouveau membre)</h5>
                    <VBtn size="small" color="primary" prepend-icon="mdi-plus" @click="openChequeModal">Ajouter</VBtn>
                  </div>
                  <VTable density="compact" v-if="newCheques.length > 0">
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
                        <td>{{ c.amount?.toFixed(2) || '0.00' }} €</td>
                        <td>{{ c.purpose || '-' }}</td>
                        <td>{{ c.bankName || '-' }}</td>
                        <td>{{ c.checkNumber || '-' }}</td>
                        <td>{{ c.issuedAt ? formatDate(c.issuedAt) : '-' }}</td>
                        <td class="text-right">
                          <VBtn icon="mdi-pencil" size="small" variant="text" @click="editCheque(idx)" />
                          <VBtn icon="mdi-delete" size="small" variant="text" color="error"
                            @click="removeCheque(idx)" />
                        </td>
                      </tr>
                    </tbody>
                  </VTable>
                  <div v-else class="text-center text-medium-emphasis py-4">
                    Aucun chèque ajouté
                  </div>
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
    <MemberDetailsModal v-model="showViewModal" :member="viewingMember" @edit="openEdit" />

    <!-- MODAL CHÈQUE RÉUTILISABLE -->
    <ChequeModal v-model="showChequeModal" :cheque="editingCheque" :editing="editingChequeIndex !== -1"
      @save="saveCheque" @close="closeChequeModal" />

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

    <!-- MODAL UPLOAD RÈGLEMENT INTÉRIEUR -->
    <VDialog v-model="showRulesUploadModal" max-width="600px" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>Uploader un nouveau règlement intérieur</span>
          <VBtn icon="mdi-close" variant="text" size="small" @click="closeRulesUploadModal" />
        </VCardTitle>
        <VCardText class="pa-4">
          <VForm ref="rulesForm" @submit.prevent="uploadRules">
            <VRow dense>
              <VCol cols="12">
                <VAlert type="info" variant="tonal" density="compact" class="mb-4">
                  Le nouveau règlement sera automatiquement défini comme actuel et remplacera l'ancien.
                </VAlert>
              </VCol>

              <VCol cols="12" md="6">
                <VTextField v-model="rulesFormData.version" label="Version *" required variant="outlined"
                  density="compact" placeholder="ex: 2024.1" />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField v-model="rulesFormData.title" label="Titre" variant="outlined" density="compact"
                  placeholder="Règlement Intérieur" />
              </VCol>

              <VCol cols="12">
                <VTextarea v-model="rulesFormData.description" label="Description (optionnelle)" variant="outlined"
                  density="compact" rows="3" placeholder="Description des modifications ou ajouts..." />
              </VCol>

              <VCol cols="12">
                <VFileInput v-model="rulesFormData.file" label="Fichier PDF *" variant="outlined" density="compact"
                  accept=".pdf" show-size required prepend-icon="mdi-file-pdf-box" :error-messages="rulesFileError" />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="text" @click="closeRulesUploadModal" :disabled="uploadingRules">Annuler</VBtn>
          <VBtn color="primary" @click="uploadRules" :loading="uploadingRules">
            Uploader
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- MODAL HISTORIQUE RÈGLEMENT INTÉRIEUR -->
    <VDialog v-model="showRulesHistoryModal" max-width="800px">
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>Historique des règlements intérieurs</span>
          <VBtn icon="mdi-close" variant="text" size="small" @click="showRulesHistoryModal = false" />
        </VCardTitle>
        <VCardText class="pa-4">
          <div v-if="rulesHistory.length > 0">
            <VCard v-for="rules in rulesHistory" :key="rules._id" variant="outlined" class="mb-3">
              <VCardText>
                <div class="d-flex align-center justify-space-between">
                  <div class="flex-grow-1">
                    <div class="d-flex align-center mb-2">
                      <VIcon icon="mdi-file-pdf-box" color="error" class="mr-2" />
                      <span class="font-weight-medium">{{ rules.title }}</span>
                      <VChip v-if="rules.isActive" color="success" size="small" class="ml-2">Actuel</VChip>
                      <VChip v-else color="default" size="small" class="ml-2">Archive</VChip>
                    </div>
                    <div class="text-caption text-medium-emphasis mb-1">
                      Version {{ rules.version }} • {{ formatDate(rules.uploadDate) }}
                      <span v-if="rules.uploadedBy"> par {{ rules.uploadedBy.firstName }} {{ rules.uploadedBy.lastName
                        }}</span>
                    </div>
                    <div v-if="rules.description" class="text-body-2 mb-1">
                      {{ rules.description }}
                    </div>
                    <div class="text-caption">
                      {{ formatFileSize(rules.fileSize) }}
                    </div>
                  </div>
                  <div class="d-flex flex-column ga-2">
                    <VBtn icon="mdi-download" variant="outlined" size="small" @click="downloadRules(rules)" />
                    <VBtn v-if="!rules.isActive" icon="mdi-check" variant="outlined" size="small" color="success"
                      @click="setActiveRules(rules)" title="Définir comme actuel" />
                    <VBtn v-if="!rules.isActive" icon="mdi-delete" variant="outlined" size="small" color="error"
                      @click="deleteRulesVersion(rules)" title="Supprimer cette version" />
                  </div>
                </div>
              </VCardText>
            </VCard>
          </div>
          <VAlert v-else type="info" variant="tonal">
            Aucun historique de règlement intérieur disponible.
          </VAlert>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useApi } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'
import { useViewPermissions } from '@/composables/useViewPermissions'
import ChequesManager from '@/components/ChequesManager.vue'
import MemberDetailsModal from '@/components/MemberDetailsModal.vue'
import ChequeModal from '@/components/ChequeModal.vue'

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

interface InternalRules {
  _id: string
  title: string
  version: string
  description?: string
  pdfFile: string
  fileSize: number
  uploadDate: string
  isActive: boolean
  uploadedBy?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  pdfUrl?: string
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
const { showSuccess, showError, showWarning } = useNotifications()
// Permissions pour cette vue
const { canCreate, canEdit, canDelete } = useViewPermissions('members')

const members = ref<Member[]>([])
const courses = ref<Course[]>([])
const stats = ref<Stats | null>(null)
const currentPage = ref(1)
const pagination = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

// Paramètres de sécurité
const strictPaymentValidation = ref(true)
// Chèques ajoutés pour un nouveau membre avant création
interface NewCheque {
  _id?: string
  amount: number
  purpose: string
  checkNumber?: string
  bankName?: string
  ibanLast4?: string
  remitBatch?: string
  issuedAt?: string
  status: 'emis' | 'recu' | 'remis' | 'credite' | 'rejete' | 'retourne'
  imageUrl?: string
  notes?: string
}
const newCheques = ref<NewCheque[]>([])

// Variables pour les règlements intérieurs
const activeRules = ref<InternalRules | null>(null)
const rulesHistory = ref<InternalRules[]>([])
const uploadingRules = ref(false)
const rulesFileError = ref<string>('')

// Modals
const showModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const showChequeModal = ref(false)
const showBirthDatePicker = ref(false)
const showRegistrationDatePicker = ref(false)
const editingChequeIndex = ref(-1)
const editingCheque = ref<NewCheque | null>(null)
const showRulesUploadModal = ref(false)
const showRulesHistoryModal = ref(false)

// Variables supprimées : activeTab (maintenant dans le composant MemberDetailsModal)
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

// Form data pour les règlements intérieurs
const rulesFormData = reactive({
  title: 'Règlement Intérieur',
  version: '',
  description: '',
  file: null as File[] | null
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

// Gestion des chèques avec le composant ChequeModal
const openChequeModal = () => {
  editingChequeIndex.value = -1
  editingCheque.value = null
  showChequeModal.value = true
}

const editCheque = (index: number) => {
  editingChequeIndex.value = index
  editingCheque.value = newCheques.value[index]
  showChequeModal.value = true
}

const closeChequeModal = () => {
  showChequeModal.value = false
  editingChequeIndex.value = -1
  editingCheque.value = null
}

const saveCheque = (chequeData: NewCheque) => {
  if (editingChequeIndex.value >= 0) {
    // Modification
    newCheques.value[editingChequeIndex.value] = chequeData
  } else {
    // Ajout
    newCheques.value.push(chequeData)
  }
}

const removeCheque = (idx: number) => {
  newCheques.value.splice(idx, 1)
}

// Méthodes pour les paramètres
const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('scd_user_settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      strictPaymentValidation.value = parsed.strictPaymentValidation !== undefined ? parsed.strictPaymentValidation : true
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error)
    strictPaymentValidation.value = true
  }
}

const hasRequiredPaymentAmounts = () => {
  const requiredAnnualAmount = 60
  const requiredMembershipAmount = 20

  return Number(formData.annualFeeAmount) >= requiredAnnualAmount &&
    Number(formData.membershipFeeAmount) >= requiredMembershipAmount
}

const canSetStatusToInscrit = () => {
  // Si la validation stricte est désactivée, autoriser
  if (!strictPaymentValidation.value) return true

  // Si la validation stricte est activée, vérifier les montants requis
  return hasRequiredPaymentAmounts()
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
    const response = await api.get<any>(`/members?${queryString}`)
    console.log('Réponse complète reçue:', response) // Debug
    members.value = response.data || []
    pagination.value = (response as any).pagination || null
  } catch (error: any) {
    console.error('Erreur lors du chargement des membres:', error)
    showError('Erreur lors du chargement des membres. Veuillez réessayer.')
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

// Fonction editFromView supprimée : maintenant gérée par le composant MemberDetailsModal

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
  // Réinitialiser aussi les chèques
  newCheques.value = []
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

    // Validation de sécurité pour le statut "inscrit"
    if (formData.status === 'inscrit' && !canSetStatusToInscrit()) {
      showError('Impossible de définir le statut "inscrit" : les montants de cotisation (60€) et d\'adhésion (20€) doivent être saisis. Vous pouvez désactiver cette sécurité dans les paramètres.')
      saving.value = false
      return
    }

    const memberData = {
      ...formData,
      birthDate: new Date(formData.birthDate).toISOString(),
      registrationDate: formData.registrationDate ? new Date(formData.registrationDate).toISOString() : undefined,
    }

    if (editingMember.value) {
      await api.put(`/members/${editingMember.value._id}`, memberData)
      showSuccess('Membre modifié avec succès')
    } else {
      const created = await api.postData<any>('/members', memberData)

      // Créer les chèques saisis localement si présents
      if (created?._id && newCheques.value.length > 0) {
        const memberId = created._id
        let chequeErrors = 0

        for (const c of newCheques.value) {
          try {
            const chequeData = {
              amount: c.amount,
              purpose: c.purpose,
              bankName: c.bankName,
              checkNumber: c.checkNumber,
              ibanLast4: c.ibanLast4,
              remitBatch: c.remitBatch,
              issuedAt: c.issuedAt ? new Date(c.issuedAt).toISOString() : undefined,
              status: c.status || 'emis',
              imageUrl: c.imageUrl,
              notes: c.notes,
            }
            await api.postData(`/members/${memberId}/checks`, chequeData)
          } catch (chequeError) {
            console.error('Erreur création chèque:', chequeError)
            chequeErrors++
          }
        }

        if (chequeErrors > 0) {
          showWarning(`Membre créé, mais ${chequeErrors} chèque(s) n'ont pas pu être ajoutés`)
        } else {
          showSuccess('Membre et chèques créés avec succès')
        }
      } else {
        showSuccess('Membre créé avec succès')
      }
    }

    closeModal()
    loadMembers()
    loadStats()
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde:', error)

    // Gestion des erreurs spécifiques
    if (error.response?.data?.message) {
      const errorMessage = error.response.data.message

      if (errorMessage.includes('email') && errorMessage.includes('existe')) {
        showError('Cet email est déjà utilisé par un autre membre')
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('E11000')) {
        showError('Ces informations sont déjà utilisées par un autre membre')
      } else {
        showError(`Erreur: ${errorMessage}`)
      }
    } else if (error.message) {
      showError(`Erreur lors de la sauvegarde: ${error.message}`)
    } else {
      showError('Erreur inconnue lors de la sauvegarde du membre')
    }
  } finally {
    saving.value = false
  }
}

const deleteMember = async () => {
  if (!deletingMember.value) return

  try {
    deleting.value = true
    const memberName = `${deletingMember.value.firstName} ${deletingMember.value.lastName}`

    await api.delete(`/members/${deletingMember.value._id}`)

    showDeleteModal.value = false
    deletingMember.value = null
    loadMembers()
    loadStats()

    showSuccess(`Membre "${memberName}" supprimé avec succès`)
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error)

    if (error.response?.data?.message) {
      showError(`Erreur: ${error.response.data.message}`)
    } else if (error.message) {
      showError(`Erreur lors de la suppression: ${error.message}`)
    } else {
      showError('Erreur inconnue lors de la suppression du membre')
    }
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

const getLevelColor = (level: string) => {
  switch (level) {
    case 'Débutant': return 'success'
    case 'Novice': return 'warning'
    case 'Intermédiaire': return 'error'
    default: return 'primary'
  }
}

const getUpcomingCourses = (courses: any[]) => {
  const now = new Date()
  return courses
    .filter(course => new Date(course.start) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
}

const getPastCourses = (courses: any[]) => {
  const now = new Date()
  return courses
    .filter(course => new Date(course.start) <= now)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
}

// Méthode pour récupérer le nombre de membres d'une tranche d'âge spécifique
const getAgeGroupCount = (ageGroup: string) => {
  if (!stats.value?.ageDistribution) return 0
  const group = stats.value.ageDistribution.find(item => item._id === ageGroup)
  return group?.count || 0
}

// Computed pour déterminer si le statut doit être géré automatiquement (booléen strict)
const isStatusAutoManaged = computed<boolean>(() => {
  return !!formData.annualFeePaymentMethod &&
    !!formData.membershipPaymentMethod &&
    Number(formData.annualFeeAmount) > 0 &&
    Number(formData.membershipFeeAmount) > 0
})

// Computed pour filtrer les options de statut selon la validation stricte
const availableStatusOptions = computed(() => {
  if (!strictPaymentValidation.value) {
    return statusOptions
  }

  // Si la validation stricte est activée et les montants requis ne sont pas atteints,
  // désactiver l'option "inscrit"
  return statusOptions.map(option => ({
    ...option,
    disabled: option.value === 'inscrit' && !hasRequiredPaymentAmounts()
  }))
})

// Watcher pour mettre à jour automatiquement le statut
watch([() => formData.annualFeePaymentMethod, () => formData.annualFeeAmount,
() => formData.membershipPaymentMethod, () => formData.membershipFeeAmount],
  ([annualMethod, annualAmount, membershipMethod, membershipAmount]) => {
    if (annualMethod && annualAmount && membershipMethod && membershipAmount) {
      // Si tous les paiements sont renseignés ET que la validation permet le changement, passer en "inscrit"
      if (canSetStatusToInscrit()) {
        formData.status = 'inscrit'
      }
    } else if (!annualMethod && !annualAmount && !membershipMethod && !membershipAmount) {
      // Si aucun paiement n'est renseigné, rester en "pré-inscrit"
      formData.status = 'pré-inscrit'
    }
    // Sinon, laisser l'utilisateur choisir manuellement
  }
)

// Méthodes pour les règlements intérieurs
const loadActiveRules = async () => {
  try {
    const response = await api.getData<InternalRules>('/internal-rules/active')
    activeRules.value = response
  } catch (error: any) {
    if (error.response?.status !== 404) {
      console.error('Erreur lors du chargement du règlement actif:', error)
    }
    activeRules.value = null
  }
}

const loadRulesHistory = async () => {
  try {
    const response = await api.getData<InternalRules[]>('/internal-rules')
    rulesHistory.value = response
  } catch (error: any) {
    console.error('Erreur lors du chargement de l\'historique des règlements:', error)
    rulesHistory.value = []
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const openRulesUploadModal = () => {
  // Réinitialiser le formulaire
  Object.assign(rulesFormData, {
    title: 'Règlement Intérieur',
    version: '',
    description: '',
    file: null
  })
  rulesFileError.value = ''
  showRulesUploadModal.value = true
}

const closeRulesUploadModal = () => {
  showRulesUploadModal.value = false
  Object.assign(rulesFormData, {
    title: 'Règlement Intérieur',
    version: '',
    description: '',
    file: null
  })
  rulesFileError.value = ''
}

const openRulesHistoryModal = async () => {
  showRulesHistoryModal.value = true
  await loadRulesHistory()
}

const uploadRules = async () => {
  try {
    rulesFileError.value = ''

    // Validation
    if (!rulesFormData.version) {
      showError('Veuillez saisir une version')
      return
    }

    if (!rulesFormData.file) {
      rulesFileError.value = 'Veuillez sélectionner un fichier PDF'
      return
    }

    // Gérer le cas où file est un array ou un seul fichier
    let file
    if (Array.isArray(rulesFormData.file)) {
      if (rulesFormData.file.length === 0) {
        rulesFileError.value = 'Veuillez sélectionner un fichier PDF'
        return
      }
      file = rulesFormData.file[0]
    } else {
      file = rulesFormData.file
    }

    if (!file) {
      rulesFileError.value = 'Fichier invalide'
      return
    }

    if (file.type !== 'application/pdf') {
      rulesFileError.value = 'Seuls les fichiers PDF sont acceptés'
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      rulesFileError.value = 'Le fichier ne peut pas dépasser 10MB'
      return
    }

    uploadingRules.value = true

    // Préparer les données pour l'upload
    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('version', rulesFormData.version)
    formData.append('title', rulesFormData.title)
    if (rulesFormData.description) {
      formData.append('description', rulesFormData.description)
    }

    const response = await api.postFormData<InternalRules>('/internal-rules/upload', formData)

    activeRules.value = response
    showSuccess('Règlement intérieur uploadé avec succès')
    closeRulesUploadModal()

    // Recharger l'historique si le modal est ouvert
    if (showRulesHistoryModal.value) {
      await loadRulesHistory()
    }

  } catch (error: any) {
    console.error('Erreur lors de l\'upload du règlement:', error)

    if (error.response?.data?.message) {
      showError(error.response.data.message)
    } else {
      showError('Erreur lors de l\'upload du règlement intérieur')
    }
  } finally {
    uploadingRules.value = false
  }
}

const downloadRules = async (rules: InternalRules) => {
  try {
    const response = await api.getData<{ downloadUrl: string, filename: string }>(`/internal-rules/${rules._id}/download`)

    // Ouvrir le lien de téléchargement dans un nouvel onglet
    window.open(response.downloadUrl, '_blank')
  } catch (error: any) {
    console.error('Erreur lors du téléchargement:', error)
    showError('Erreur lors du téléchargement du règlement')
  }
}

const setActiveRules = async (rules: InternalRules) => {
  try {
    await api.postData(`/internal-rules/${rules._id}/set-active`, {})

    showSuccess(`Règlement version ${rules.version} défini comme actuel`)

    // Recharger les données
    await loadActiveRules()
    await loadRulesHistory()
  } catch (error: any) {
    console.error('Erreur lors de la définition du règlement actif:', error)
    showError('Erreur lors de la mise à jour du règlement actif')
  }
}

const deleteRulesVersion = async (rules: InternalRules) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer la version ${rules.version} du règlement intérieur ? Cette action est irréversible.`)) {
    return
  }

  try {
    await api.delete(`/internal-rules/${rules._id}`)

    showSuccess(`Version ${rules.version} supprimée avec succès`)

    // Recharger l'historique
    await loadRulesHistory()
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error)

    if (error.response?.data?.message) {
      showError(error.response.data.message)
    } else {
      showError('Erreur lors de la suppression du règlement')
    }
  }
}

// Watchers
watch(currentPage, () => {
  loadMembers()
})

watch(filters, (newFilters) => {
  console.log('Watcher filters déclenché:', newFilters) // Debug
  currentPage.value = 1
  loadMembers()
}, { deep: true })

// Surveillance des changements dans le localStorage pour les paramètres
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === 'scd_user_settings') {
    loadSettings()
  }
}

// Initialisation
onMounted(() => {
  loadSettings()
  loadMembers()
  loadStats()
  loadCourses()
  loadActiveRules()

  // Écouter les changements dans le localStorage
  window.addEventListener('storage', handleStorageChange)
})

// Nettoyage lors de la destruction du composant
onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style>
@import '@/assets/members-view.css';
</style>
