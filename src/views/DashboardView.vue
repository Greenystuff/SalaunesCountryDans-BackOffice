<template>
  <MainLayout>
    <div>
      <!-- En-tête du dashboard -->
      <v-row class="mb-6">
        <v-col>
          <h1 class="text-h3 font-weight-bold mb-2">
            Tableau de bord
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            Bienvenue dans votre espace d'administration SCD
          </p>
        </v-col>
        <v-col cols="auto">
          <v-btn color="primary" prepend-icon="mdi-refresh" @click="refreshData" :loading="isLoading">
            Actualiser
          </v-btn>
        </v-col>
      </v-row>

      <!-- Cartes de statistiques -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="4">
          <v-card class="stat-card">
            <v-card-text>
              <div class="d-flex align-center">
                <v-avatar color="primary" size="48" class="me-4">
                  <v-icon size="24" color="white">mdi-account-group</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h4 font-weight-bold">{{ stats.totalMembers }}</div>
                  <div class="text-body-2 text-medium-emphasis">Membres inscrits</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card class="stat-card">
            <v-card-text>
              <div class="d-flex align-center">
                <v-avatar color="success" size="48" class="me-4">
                  <v-icon size="24" color="white">mdi-music-note</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h4 font-weight-bold">{{ stats.activeCourses }}</div>
                  <div class="text-body-2 text-medium-emphasis">Cours de danse</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <v-card class="stat-card">
            <v-card-text>
              <div class="d-flex align-center">
                <v-avatar color="info" size="48" class="me-4">
                  <v-icon size="24" color="white">mdi-calendar</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h4 font-weight-bold">{{ stats.upcomingEvents }}</div>
                  <div class="text-body-2 text-medium-emphasis">Événements à venir</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Actions rapides -->
      <v-row class="mt-6">
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon left>mdi-lightning-bolt</v-icon>
              Actions rapides
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-btn block color="primary" variant="outlined" prepend-icon="mdi-account-plus" @click="addMember">
                    Ajouter un membre
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-btn block color="success" variant="outlined" prepend-icon="mdi-calendar-plus" @click="addEvent">
                    Créer un événement
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-btn block color="info" variant="outlined" prepend-icon="mdi-music-note" @click="manageCourses">
                    Gérer les cours
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-btn block color="warning" variant="outlined" prepend-icon="mdi-file-document" @click="generateReport">
                    Générer un rapport
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>


  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import MainLayout from '@/layouts/MainLayout.vue'


const router = useRouter()
const userStore = useUserStore()
const isLoading = ref(false)


const stats = ref({
  totalMembers: 156,
  activeCourses: 8,
  upcomingEvents: 3
})

const refreshData = async () => {
  isLoading.value = true
  // Simulation d'un appel API
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Mise à jour des statistiques
  stats.value = {
    totalMembers: Math.floor(Math.random() * 50) + 150,
    activeCourses: Math.floor(Math.random() * 5) + 5,
    upcomingEvents: Math.floor(Math.random() * 5) + 1
  }

  isLoading.value = false
}

const addMember = () => {
  router.push('/members/new')
}

const addEvent = () => {
  router.push('/events/new')
}

const generateReport = () => {
  // TODO: Implémenter la génération de rapport
  console.log('Génération de rapport')
}

const manageCourses = () => {
  router.push('/courses')
}



onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}
</style>
