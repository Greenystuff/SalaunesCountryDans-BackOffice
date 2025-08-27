<template>
  <v-app>
    <!-- Navigation latérale -->
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent @click="rail = false">
      <v-list-item nav>
        <template v-slot:prepend>
          <v-avatar size="40">
            <v-img :src="avatarSrc" :alt="userStore.fullName || 'Avatar utilisateur'" eager
              :key="userStore.isAdmin ? 'admin-avatar' : 'default-avatar'" />
          </v-avatar>
        </template>

        <v-list-item-title v-if="!rail">
          {{ userStore.fullName || 'Utilisateur' }}
        </v-list-item-title>
        <v-list-item-subtitle v-if="!rail">
          {{ userStore.user?.email || 'user@example.com' }}
        </v-list-item-subtitle>

        <template v-slot:append>
          <v-btn variant="text" icon="mdi-chevron-left" @click.stop="rail = !rail" />
        </template>
      </v-list-item>

      <v-divider />

      <v-list density="compact" nav>
        <v-list-item v-for="item in menuItems" :key="item.title" :prepend-icon="item.icon" :title="item.title"
          :to="item.to" :value="item.title" />
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn block color="error" variant="outlined" prepend-icon="mdi-logout" @click="logout">
            Déconnexion
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Barre d'outils supérieure -->
    <v-app-bar>
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <v-app-bar-title>Salaunes Country Dance - BackOffice</v-app-bar-title>

      <v-spacer />

      <!-- Bouton de changement de thème -->
      <v-btn icon @click="toggleTheme">
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

        <v-list>
          <v-list-item prepend-icon="mdi-account" title="Profil" value="profile" />
          <v-list-item prepend-icon="mdi-cog" title="Paramètres" value="settings" />
          <v-divider />
          <v-list-item prepend-icon="mdi-logout" title="Déconnexion" value="logout" @click="logout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Contenu principal -->
    <v-main>
      <v-container fluid class="pa-6">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const theme = useTheme()
const router = useRouter()
const userStore = useUserStore()

const drawer = ref(true)
const rail = ref(false)

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
  }
]

const avatarSrc = computed(() => {
  return userStore.isAdmin ? '/images/avatar.jpg' : 'https://randomuser.me/api/portraits/men/85.jpg'
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
})
</script>
