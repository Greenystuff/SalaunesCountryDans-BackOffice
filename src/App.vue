<template>
  <!-- Afficher le layout approprié selon la route -->
  <LoginLayout v-if="shouldShowLogin" />
  <MainLayout v-else />
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import LoginLayout from '@/layouts/LoginLayout.vue'

const route = useRoute()
const isInitialized = ref(false)

// Logique pour déterminer quel layout afficher
const shouldShowLogin = computed(() => {
  // Pendant l'initialisation, toujours afficher le login
  if (!isInitialized.value) return true

  // Après initialisation, vérifier la route
  return route.path === '/login'
})

onMounted(() => {
  // Attendre un peu plus longtemps pour s'assurer que la route est complètement initialisée
  setTimeout(() => {
    isInitialized.value = true
  }, 100)
})
</script>
