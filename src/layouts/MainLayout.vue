<template>
  <v-app>
    <!-- Navigation latérale -->
    <v-navigation-drawer v-model="drawer" :rail="!isMobile && rail" @click="rail = false" location="left"
      :temporary="isMobile">
      <v-list-item nav>
        <template v-slot:prepend>
          <v-avatar size="40">
            <v-img :src="avatarSrc" :alt="userStore.fullName || 'Avatar utilisateur'" eager
              :key="userStore.isAdmin ? 'admin-avatar' : 'default-avatar'" />
          </v-avatar>
        </template>

        <v-list-item-title v-if="!rail && showUserText">
          {{ userStore.fullName || 'Utilisateur' }}
        </v-list-item-title>
        <v-list-item-subtitle v-if="!rail && showUserText">
          {{ userStore.user?.email || 'user@example.com' }}
        </v-list-item-subtitle>

        <template v-slot:append>
          <v-btn v-if="!isMobile" variant="text" icon="mdi-chevron-left" @click.stop="rail = !rail" />
          <v-btn v-else variant="text" icon="mdi-close" @click.stop="drawer = false" />
        </template>
      </v-list-item>

      <v-divider />

      <!-- Navigation normale ou bouton retour selon le type de page -->
      <v-list density="compact" nav>
        <template v-if="isUserPage">
          <v-list-item prepend-icon="mdi-arrow-left" title="Retour" @click="goBackToNavigation" />
        </template>
        <template v-else>
          <v-list-item v-for="item in menuItems" :key="item.title" :prepend-icon="item.icon" :title="item.title"
            :to="item.to" :value="item.title" />
        </template>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn block color="error" variant="outlined" :prepend-icon="rail ? undefined : 'mdi-logout'" @click="logout">
            <v-icon v-if="rail" class="mx-auto">mdi-logout</v-icon>
            <span v-if="!rail && showUserText">Déconnexion</span>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Barre d'outils supérieure -->
    <v-app-bar app elevation="1">
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <v-app-bar-title>Salaunes Country Dance - BackOffice</v-app-bar-title>

      <v-spacer />

      <!-- Statut WebSocket -->
      <WebSocketStatus />

      <!-- Bouton de changement de thème -->
      <v-btn class="ml-3" icon @click="toggleTheme">
        <v-icon>
          {{ theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
        </v-icon>
      </v-btn>

      <!-- Menu utilisateur -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar size="32">
              <v-img :src="avatarSrc" :alt="userStore.fullName || 'Avatar utilisateur'" eager
                :key="userStore.isAdmin ? 'admin-avatar' : 'default-avatar'" />
            </v-avatar>
          </v-btn>
        </template>

        <v-list class="user-menu">
          <v-list-item prepend-icon="mdi-account" title="Profil" value="profile" @click="goToProfile" />
          <v-list-item prepend-icon="mdi-cog" title="Paramètres" value="settings" @click="goToSettings" />
          <v-divider />
          <v-list-item prepend-icon="mdi-logout" title="Déconnexion" value="logout" @click="logout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Contenu principal -->
    <v-main>
      <div class="content-wrapper">
        <RouterView />
      </div>
    </v-main>

    <!-- Notifications globales -->
    <GlobalNotifications />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import GlobalNotifications from '@/components/GlobalNotifications.vue'
import WebSocketStatus from '@/components/WebSocketStatus.vue'

const theme = useTheme()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const drawer = ref(true)
const rail = ref(false)
const showUserText = ref(true) // Contrôle l'affichage du texte utilisateur

// Gestion responsive du drawer
const isMobile = ref(false)

// Fonction pour détecter la taille d'écran
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 1024
  if (isMobile.value) {
    drawer.value = false
    rail.value = false
  } else {
    drawer.value = true
    // Garder l'état rail précédent sur desktop si on revient de mobile
    if (rail.value === false && !isMobile.value) {
      rail.value = false // Garder le drawer ouvert par défaut
    }
  }
}

const menuItems = [
  {
    title: 'Tableau de bord',
    icon: 'mdi-view-dashboard',
    to: '/dashboard'
  },
  {
    title: 'Cours',
    icon: 'mdi-music-note',
    to: '/courses'
  },
  {
    title: 'Les danses',
    icon: 'mdi-dance-ballroom',
    to: '/dances'
  },
  {
    title: 'Galerie',
    icon: 'mdi-image-multiple',
    to: '/gallery'
  },
  {
    title: 'Membres',
    icon: 'mdi-account-group',
    to: '/members'
  }
]

const avatarSrc = computed(() => {
  // Priorité : avatar personnalisé > avatar par défaut selon le rôle
  return (userStore.user as any)?.avatar ||
    (userStore.isAdmin ? '/images/avatar.jpg' : 'https://randomuser.me/api/portraits/men/85.jpg')
})

// Détecter si nous sommes sur une page utilisateur
const isUserPage = computed(() => {
  return route.meta.isUserPage === true
})

// Précharger l'image personnalisée
const preloadAvatar = () => {
  if (userStore.isAdmin) {
    const img = new Image()
    img.src = '/images/avatar.jpg'
  }
}

const toggleTheme = () => {
  const newTheme = theme.global.current.value.dark ? 'light' : 'dark'
  theme.change(newTheme)
  // Sauvegarder le thème dans le localStorage
  localStorage.setItem('theme', newTheme)
}

const logout = async () => {
  await userStore.logout()
  router.push('/login')
}

const goToProfile = () => {
  router.push('/profile')
}

const goToSettings = () => {
  router.push('/settings')
}

const goBackToNavigation = () => {
  router.push('/dashboard')
}

// Gérer l'affichage du texte avec délai selon l'état du rail
watch(rail, (newRail) => {
  if (newRail) {
    // Rail activé (mode compact) -> masquer immédiatement le texte
    showUserText.value = false
  } else {
    // Rail désactivé (mode étendu) -> attendre que l'animation se termine avant d'afficher le texte
    setTimeout(() => {
      showUserText.value = true
    }, 250) // Délai pour laisser l'animation du drawer se terminer
  }
}, { immediate: true })

// Précharger l'avatar quand l'utilisateur se connecte
watch(() => userStore.isAdmin, (isAdmin) => {
  if (isAdmin) {
    preloadAvatar()
  }
}, { immediate: true })

// Précharger au montage du composant
onMounted(() => {
  if (userStore.isAdmin) {
    preloadAvatar()
  }

  // Restaurer le thème sauvegardé
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    theme.change(savedTheme)
  }

  // Vérifier la taille d'écran au montage
  checkScreenSize()

  // Écouter les changements de taille d'écran
  window.addEventListener('resize', checkScreenSize)
})
</script>

<style scoped>
/* Layout principal */
.v-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Contenu principal qui s'adapte à la hauteur */
.v-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Wrapper du contenu pour le padding interne */
.content-wrapper {
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Navigation drawer responsive */
.v-navigation-drawer {
  z-index: 1000;
}

/* App bar avec comportement responsive */
.v-app-bar {
  flex-shrink: 0;
  z-index: 1001;
}

/* Responsive design - Vuetify gère automatiquement */

.user-menu {
  border: 1px solid rgb(var(--v-theme-outline));
}
</style>
