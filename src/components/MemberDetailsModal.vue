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
          <VTab value="courses">
            <VIcon icon="mdi-calendar" class="me-2" />
            Cours ({{ member.enrolledCourses?.length || 0 }})
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

          <!-- Onglet Cours -->
          <VWindowItem value="courses">
            <div class="tab-content">
              <div v-if="member.enrolledCourses?.length" class="courses-container">
                <!-- Cours à venir -->
                <div v-if="getUpcomingCourses(member.enrolledCourses).length" class="courses-section">
                  <h4 class="section-title">
                    <VIcon icon="mdi-calendar-clock" class="me-2" />
                    Prochains cours
                  </h4>
                  <div class="courses-grid">
                    <VCard v-for="course in getUpcomingCourses(member.enrolledCourses)" :key="course._id"
                      class="course-card" variant="outlined">
                      <VCardText class="pa-3">
                        <div class="course-header">
                          <VChip :color="getLevelColor(course.level)" size="small" class="me-2">
                            {{ course.level }}
                          </VChip>
                          <span class="course-date">{{ formatDate(course.start) }}</span>
                        </div>
                        <h5 class="course-title">{{ course.title }}</h5>
                        <div v-if="course.teacher" class="course-teacher">
                          <VIcon icon="mdi-account-tie" size="16" class="me-1" />
                          {{ course.teacher }}
                        </div>
                      </VCardText>
                    </VCard>
                  </div>
                </div>

                <!-- Cours passés -->
                <div v-if="getPastCourses(member.enrolledCourses).length" class="courses-section">
                  <h4 class="section-title">
                    <VIcon icon="mdi-calendar-check" class="me-2" />
                    Cours passés
                  </h4>
                  <div class="courses-grid">
                    <VCard v-for="course in getPastCourses(member.enrolledCourses)" :key="course._id"
                      class="course-card" variant="outlined">
                      <VCardText class="pa-3">
                        <div class="course-header">
                          <VChip :color="getLevelColor(course.level)" size="small" class="me-2">
                            {{ course.level }}
                          </VChip>
                          <span class="course-date">{{ formatDate(course.start) }}</span>
                        </div>
                        <h5 class="course-title">{{ course.title }}</h5>
                        <div v-if="course.teacher" class="course-teacher">
                          <VIcon icon="mdi-account-tie" size="16" class="me-1" />
                          {{ course.teacher }}
                        </div>
                      </VCardText>
                    </VCard>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <VIcon icon="mdi-calendar-blank" size="48" color="grey" class="mb-3" />
                <p>Aucun cours inscrit</p>
              </div>
            </div>
          </VWindowItem>

          <!-- Onglet Paiements -->
          <VWindowItem value="payments">
            <div class="tab-content">
              <VRow>
                <VCol cols="12" md="6">
                  <div class="info-section">
                    <h4 class="section-title">
                      <VIcon icon="mdi-credit-card" class="me-2" />
                      Méthodes de paiement
                    </h4>
                    <div class="payment-methods">
                      <div v-if="member.annualFeePaymentMethod" class="payment-method">
                        <VIcon icon="mdi-cash" color="success" class="me-2" />
                        <span class="payment-label">Cotisation:</span>
                        <VChip color="success" size="small">{{ member.annualFeePaymentMethod }}</VChip>
                      </div>
                      <div v-if="member.membershipPaymentMethod" class="payment-method">
                        <VIcon icon="mdi-cash" color="info" class="me-2" />
                        <span class="payment-label">Adhésion:</span>
                        <VChip color="info" size="small">{{ member.membershipPaymentMethod }}</VChip>
                      </div>
                      <div v-if="member.registrationDate" class="payment-method">
                        <VIcon icon="mdi-calendar" color="primary" class="me-2" />
                        <span class="payment-label">Inscrit le:</span>
                        <span class="payment-value">{{ formatDate(member.registrationDate) }}</span>
                      </div>
                    </div>
                  </div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="info-section">
                    <h4 class="section-title">
                      <VIcon icon="mdi-bank" class="me-2" />
                      Chèques déposés
                    </h4>
                    <div v-if="member.checkDeposits?.length" class="checks-list">
                      <VCard v-for="check in member.checkDeposits" :key="check.depositDate" class="check-item"
                        variant="outlined">
                        <VCardText class="pa-2">
                          <div class="check-amount">{{ check.amount }}€</div>
                          <div class="check-date">{{ formatDate(check.depositDate) }}</div>
                        </VCardText>
                      </VCard>
                    </div>
                    <div v-else class="empty-state">
                      <VIcon icon="mdi-bank-off" size="32" color="grey" class="mb-2" />
                      <p>Aucun chèque déposé</p>
                    </div>
                  </div>
                </VCol>
              </VRow>
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
import { ref, computed, watch } from 'vue'

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

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Méthodes utilitaires
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
    case 'Novice': return 'info'
    case 'Intermédiaire': return 'warning'
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

// Reset tab when modal opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    activeTab.value = 'info'
  }
})
</script>

<style>
@import '@/assets/member-details-modal.css';
</style>
