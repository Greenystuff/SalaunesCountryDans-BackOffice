<template>
  <MainLayout>
    <div>
      <v-row class="mb-6">
        <v-col>
          <h1 class="text-h3 font-weight-bold mb-2">
            Gestion des Cours
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            Gérez les cours de country dance
          </p>
        </v-col>
        <v-col cols="auto">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="addCourse">
            Ajouter un cours
          </v-btn>
        </v-col>
      </v-row>

      <v-card>
        <v-card-text>
          <v-row>
            <v-col v-for="course in courses" :key="course.id" cols="12" md="6" lg="4">
              <v-card class="course-card">
                <v-card-title class="d-flex align-center">
                  <v-icon
                    :color="course.level === 'Débutant' ? 'success' : course.level === 'Novice' ? 'info' : 'warning'"
                    class="me-2">
                    mdi-music-note
                  </v-icon>
                  {{ course.name }}
                </v-card-title>

                <v-card-text>
                  <p class="text-body-2 mb-2">
                    <strong>Niveau:</strong> {{ course.level }}
                  </p>
                  <p class="text-body-2 mb-2">
                    <strong>Horaire:</strong> {{ course.schedule }}
                  </p>
                  <p class="text-body-2 mb-2">
                    <strong>Instructeur:</strong> {{ course.instructor }}
                  </p>
                  <p class="text-body-2 mb-2">
                    <strong>Places:</strong> {{ course.registered }}/{{ course.capacity }}
                  </p>
                </v-card-text>

                <v-card-actions>
                  <v-btn color="primary" variant="text" @click="editCourse(course)">
                    Modifier
                  </v-btn>
                  <v-btn color="info" variant="text" @click="viewCourse(course)">
                    Voir détails
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'

const courses = ref([
  {
    id: 1,
    name: 'Country Débutant',
    level: 'Débutant',
    schedule: 'Lundi 19h-20h30',
    instructor: 'Marie Dubois',
    registered: 12,
    capacity: 20
  },
  {
    id: 2,
    name: 'Country Intermédiaire',
    level: 'Novice',
    schedule: 'Mercredi 20h-21h30',
    instructor: 'Jean Martin',
    registered: 18,
    capacity: 20
  },
  {
    id: 3,
    name: 'Country Avancé',
    level: 'Intermédiaire',
    schedule: 'Vendredi 20h30-22h',
    instructor: 'Pierre Durand',
    registered: 15,
    capacity: 18
  }
])

const addCourse = () => {
  console.log('Ajouter un cours')
}

const editCourse = (course: any) => {
  console.log('Modifier le cours:', course)
}

const viewCourse = (course: any) => {
  console.log('Voir le cours:', course)
}
</script>

<style scoped>
.course-card {
  height: 100%;
  transition: transform 0.2s ease-in-out;
}

.course-card:hover {
  transform: translateY(-2px);
}
</style>
