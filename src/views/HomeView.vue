<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDashboard, type DashboardStats } from '@/services/dashboardService'
import { useViewPermissions } from '@/composables/useViewPermissions'

// Services
const { getStats } = useDashboard()

// Permissions pour cette vue
const { canView: canViewDashboard } = useViewPermissions('dashboard')

// État réactif
const loading = ref(false)
const error = ref<string | null>(null)
const stats = ref<DashboardStats | null>(null)
const isFinancesCardCensored = ref(false)

// Clé pour le localStorage
const FINANCES_CENSOR_KEY = 'scd_finances_card_censored'

// Fonctions pour gérer le localStorage
const saveCensorPreference = (censored: boolean) => {
  localStorage.setItem(FINANCES_CENSOR_KEY, JSON.stringify(censored))
}

const loadCensorPreference = (): boolean => {
  try {
    const saved = localStorage.getItem(FINANCES_CENSOR_KEY)
    return saved ? JSON.parse(saved) : false
  } catch {
    return false
  }
}

// Fonction pour basculer la censure
const toggleFinancesCensor = () => {
  isFinancesCardCensored.value = !isFinancesCardCensored.value
  saveCensorPreference(isFinancesCardCensored.value)
}

// Charger les statistiques
const loadStats = async () => {
  try {
    loading.value = true
    error.value = null
    stats.value = await getStats()
  } catch (err: any) {
    console.error('Erreur lors du chargement des statistiques:', err)
    error.value = err.message || 'Erreur lors du chargement des statistiques'
  } finally {
    loading.value = false
  }
}

// Computed pour vérifier si on a assez de données pour le graphique
const hasEnoughDataForChart = computed(() => {
  return (stats.value?.evolution?.monthlyRegistrations?.length || 0) > 1
})

// Utilitaires
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatMonth = (monthString: string) => {
  const [year, month] = monthString.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

const getLevelColor = (level: string) => {
  switch (level) {
    case 'Débutant': return 'success'
    case 'Novice': return 'warning'
    case 'Intermédiaire': return 'error'
    default: return 'default'
  }
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

// Lifecycle
onMounted(() => {
  // Charger la préférence de censure depuis le localStorage
  isFinancesCardCensored.value = loadCensorPreference()

  // Charger les statistiques
  loadStats()
})
</script>

<template>
  <div class="dashboard-container">
    <!-- Header du dashboard -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="dashboard-title">Tableau de bord</h1>
        <p class="dashboard-subtitle">Vue d'ensemble de votre club de danse country</p>
      </div>
      <div class="header-actions">
        <VBtn color="primary" prepend-icon="mdi-refresh" @click="loadStats" :loading="loading">
          Actualiser
        </VBtn>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-if="error" class="error-message">
      <VAlert type="error" variant="tonal" class="mb-4">
        <template #prepend>
          <VIcon icon="mdi-alert-circle" />
        </template>
        {{ error }}
        <template #append>
          <VBtn variant="text" size="small" @click="loadStats">
            Réessayer
          </VBtn>
        </template>
      </VAlert>
    </div>

    <!-- Statistiques principales -->
    <div v-if="loading" class="stats-overview">
      <VRow>
        <VCol cols="12" sm="6" md="3" v-for="i in 4" :key="i">
          <VCard class="stat-card" elevation="2">
            <VCardText class="text-center">
              <VSkeletonLoader type="image" class="mb-3" />
              <VSkeletonLoader type="text" class="mb-2" />
              <VSkeletonLoader type="text" width="60%" />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>

    <div v-else-if="stats" class="stats-overview">
      <VRow>
        <VCol cols="12" sm="6" md="3">
          <VCard class="stat-card members-card" elevation="2">
            <VCardText class="text-center">
              <VIcon icon="mdi-account-group" size="48" color="primary" class="mb-3" />
              <h3 class="stat-number">{{ stats.overview.totalMembers }}</h3>
              <p class="stat-label">Membres</p>
              <div class="stat-detail">
                <span class="stat-change positive">+{{ stats.members.newThisMonth }}</span>
                <span class="stat-period">ce mois</span>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <VCard class="stat-card courses-card" elevation="2">
            <VCardText class="text-center">
              <VIcon icon="mdi-calendar-clock" size="48" color="success" class="mb-3" />
              <h3 class="stat-number">{{ stats.overview.totalCourses }}</h3>
              <p class="stat-label">Cours</p>
              <div class="stat-detail">
                <span class="stat-change">{{ stats.courses.upcoming }}</span>
                <span class="stat-period">à venir</span>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <VCard class="stat-card dances-card" elevation="2">
            <VCardText class="text-center">
              <VIcon icon="mdi-music" size="48" color="warning" class="mb-3" />
              <h3 class="stat-number">{{ stats.overview.totalDances }}</h3>
              <p class="stat-label">Danses</p>
              <div class="stat-detail">
                <span class="stat-change">{{ stats.dances.withVideos }}</span>
                <span class="stat-period">avec vidéos</span>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <VCard class="stat-card finances-card" elevation="2" :class="{ 'censored': isFinancesCardCensored }">
            <VBtn :icon="isFinancesCardCensored ? 'mdi-eye' : 'mdi-eye-off'" variant="text" size="small" color="grey"
              class="card-toggle-btn" @click="toggleFinancesCensor"
              :title="isFinancesCardCensored ? 'Afficher les données' : 'Masquer les données'" />
            <VCardText class="text-center">
              <VIcon icon="mdi-cash-multiple" size="48" color="info" class="mb-3" />
              <h3 class="stat-number">{{ formatCurrency(stats.finances.totalCreditedAmount) }}</h3>
              <p class="stat-label">Chèques crédités</p>
              <div class="stat-detail">
                <span class="stat-change">{{ stats.finances.credites }}</span>
                <span class="stat-period">validés</span>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>

    <!-- Contenu principal -->
    <div v-if="loading" class="dashboard-content">
      <VRow>
        <VCol cols="12" lg="8">
          <VCard class="chart-card" elevation="2">
            <VCardTitle>
              <VSkeletonLoader type="text" width="300px" />
            </VCardTitle>
            <VCardText>
              <VSkeletonLoader type="image" height="200px" />
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" lg="4">
          <VCard class="chart-card" elevation="2">
            <VCardTitle>
              <VSkeletonLoader type="text" width="200px" />
            </VCardTitle>
            <VCardText>
              <VSkeletonLoader type="list-item-three-line" />
              <VSkeletonLoader type="list-item-three-line" />
              <VSkeletonLoader type="list-item-three-line" />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>

    <div v-else-if="stats" class="dashboard-content">
      <VRow>
        <!-- Section gauche : Graphique d'évolution (seulement si assez de données) -->
        <VCol cols="12" lg="8" v-if="hasEnoughDataForChart">
          <VCard class="chart-card" elevation="2">
            <VCardTitle class="d-flex align-center">
              <VIcon icon="mdi-chart-line" class="me-2" />
              Évolution des inscriptions (6 derniers mois)
            </VCardTitle>
            <VCardText>
              <div class="evolution-chart">
                <div v-for="(item, index) in stats.evolution.monthlyRegistrations" :key="item.month"
                  class="evolution-bar">
                  <div class="evolution-label">{{ formatMonth(item.month) }}</div>
                  <div class="evolution-bar-container">
                    <div class="evolution-bar-fill" :style="{ height: `${Math.max(item.count * 10, 20)}px` }"
                      :title="`${item.count} inscriptions`"></div>
                  </div>
                  <div class="evolution-value">{{ item.count }}</div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Section droite : Répartition des membres -->
        <VCol cols="12" :lg="hasEnoughDataForChart ? 4 : 12">
          <VCard class="chart-card" elevation="2">
            <VCardTitle class="d-flex align-center">
              <VIcon icon="mdi-chart-pie" class="me-2" />
              Répartition des membres
            </VCardTitle>
            <VCardText>
              <div v-if="stats?.members?.byStatus" class="members-distribution">
                <div class="distribution-item">
                  <VIcon icon="mdi-account-clock" color="warning" size="small" />
                  <span class="distribution-label">Pré-inscrits</span>
                  <span class="distribution-value">{{ stats.members.byStatus.preInscrits }}</span>
                </div>
                <div class="distribution-item">
                  <VIcon icon="mdi-account-check" color="info" size="small" />
                  <span class="distribution-label">Inscrits</span>
                  <span class="distribution-value">{{ stats.members.byStatus.inscrits }}</span>
                </div>
                <div class="distribution-item">
                  <VIcon icon="mdi-account-star" color="success" size="small" />
                  <span class="distribution-label">Actifs</span>
                  <span class="distribution-value">{{ stats.members.byStatus.actifs }}</span>
                </div>
                <div class="distribution-item">
                  <VIcon icon="mdi-account-off" color="error" size="small" />
                  <span class="distribution-label">Inactifs</span>
                  <span class="distribution-value">{{ stats.members.byStatus.inactifs }}</span>
                </div>
              </div>
              <div v-else class="empty-state">
                <VIcon icon="mdi-chart-pie" size="48" color="grey" class="mb-3" />
                <p>Aucune donnée disponible</p>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Section des listes -->
      <VRow>
        <!-- Prochains cours -->
        <VCol cols="12" lg="6">
          <VCard class="list-card" elevation="2">
            <VCardTitle class="d-flex align-center">
              <VIcon icon="mdi-calendar" class="me-2" />
              Prochains cours
            </VCardTitle>
            <VCardText>
              <div v-if="stats.recent?.nextCourses?.length" class="course-list">
                <div v-for="course in stats.recent.nextCourses" :key="course.title" class="course-item">
                  <div class="course-info">
                    <h4 class="course-title">{{ course.title }}</h4>
                    <div class="course-details">
                      <VChip :color="getLevelColor(course.level)" size="small" class="me-2">
                        {{ course.level }}
                      </VChip>
                      <span class="course-date">{{ formatDate(course.start) }}</span>
                    </div>
                    <div v-if="course.teacher || course.location" class="course-meta">
                      <span v-if="course.teacher" class="course-teacher">{{ course.teacher }}</span>
                      <span v-if="course.location" class="course-location">{{ course.location }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <VIcon icon="mdi-calendar-blank" size="48" color="grey" class="mb-3" />
                <p>Aucun cours à venir</p>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Derniers membres inscrits -->
        <VCol cols="12" lg="6">
          <VCard class="list-card" elevation="2">
            <VCardTitle class="d-flex align-center">
              <VIcon icon="mdi-account-plus" class="me-2" />
              Derniers membres inscrits
            </VCardTitle>
            <VCardText>
              <div v-if="stats.recent?.recentMembers?.length" class="member-list">
                <div v-for="member in stats.recent.recentMembers" :key="member.name" class="member-item">
                  <div class="member-info">
                    <h4 class="member-name">{{ member.name }}</h4>
                    <div class="member-details">
                      <VChip :color="getStatusColor(member.status)" size="small" class="me-2">
                        {{ getStatusLabel(member.status) }}
                      </VChip>
                      <span class="member-date">{{ formatDate(member.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <VIcon icon="mdi-account-group" size="48" color="grey" class="mb-3" />
                <p>Aucun nouveau membre</p>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Section des statistiques détaillées -->
      <VRow>
        <!-- Top villes -->
        <VCol cols="12" md="6">
          <VCard class="list-card" elevation="2">
            <VCardTitle class="d-flex align-center">
              <VIcon icon="mdi-map-marker" class="me-2" />
              Top 5 des villes
            </VCardTitle>
            <VCardText>
              <div v-if="stats.members?.topCities?.length" class="city-list">
                <div v-for="(city, index) in stats.members.topCities" :key="city.name" class="city-item">
                  <div class="city-rank">{{ index + 1 }}</div>
                  <div class="city-info">
                    <h4 class="city-name">{{ city.name }}</h4>
                    <span class="city-count">{{ city.count }} membres</span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <VIcon icon="mdi-map-marker-off" size="48" color="grey" class="mb-3" />
                <p>Aucune donnée disponible</p>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Statistiques rapides -->
        <VCol cols="12" md="6">
          <VCard class="list-card" elevation="2">
            <VCardTitle class="d-flex align-center">
              <VIcon icon="mdi-information" class="me-2" />
              Statistiques rapides
            </VCardTitle>
            <VCardText>
              <div class="quick-stats">
                <div class="quick-stat-item">
                  <VIcon icon="mdi-camera" color="primary" />
                  <div class="quick-stat-info">
                    <span class="quick-stat-label">Droit à l'image</span>
                    <span class="quick-stat-value">{{ stats.members?.withImageRights || 0 }} membres</span>
                  </div>
                </div>
                <div class="quick-stat-item">
                  <VIcon icon="mdi-calendar-week" color="success" />
                  <div class="quick-stat-info">
                    <span class="quick-stat-label">Cours cette semaine</span>
                    <span class="quick-stat-value">{{ stats.courses?.thisWeek || 0 }} cours</span>
                  </div>
                </div>
                <div class="quick-stat-item">
                  <VIcon icon="mdi-file-pdf-box" color="warning" />
                  <div class="quick-stat-info">
                    <span class="quick-stat-label">Danses avec PDF</span>
                    <span class="quick-stat-value">{{ stats.dances?.withPdf || 0 }} danses</span>
                  </div>
                </div>
                <div class="quick-stat-item">
                  <VIcon icon="mdi-image" color="info" />
                  <div class="quick-stat-info">
                    <span class="quick-stat-label">Images actives</span>
                    <span class="quick-stat-value">{{ stats.gallery?.active || 0 }} images</span>
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>
  </div>
</template>

<style>
@import '@/assets/home-view.css';
</style>
