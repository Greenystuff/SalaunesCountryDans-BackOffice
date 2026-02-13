import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import LoginView from '@/views/LoginView.vue'
import HomeView from '@/views/HomeView.vue'
import PlanningView from '@/views/PlanningView.vue'
import DancesView from '@/views/DancesView.vue'
import GalleryView from '@/views/GalleryView.vue'
import MembersView from '@/views/MembersView.vue'
import ProfileView from '@/views/ProfileView.vue'
import SettingsView from '@/views/SettingsView.vue'
import NotificationsView from '@/views/NotificationsView.vue'
import UsersView from '@/views/UsersView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        requiresAuth: false,
        title: 'Connexion',
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: HomeView,
      meta: {
        requiresAuth: true,
        title: 'Tableau de bord',
      },
    },
    {
      path: '/planning',
      name: 'planning',
      component: PlanningView,
      meta: {
        requiresAuth: true,
        title: 'Planning',
      },
    },
    {
      path: '/dances',
      name: 'dances',
      component: DancesView,
      meta: {
        requiresAuth: true,
        title: 'Les danses',
      },
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: GalleryView,
      meta: {
        requiresAuth: true,
        title: 'Galerie Médias',
      },
    },
    {
      path: '/members',
      name: 'members',
      component: MembersView,
      meta: {
        requiresAuth: true,
        title: 'Gestion des membres',
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: {
        requiresAuth: true,
        title: 'Mon Profil',
        isUserPage: true,
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: {
        requiresAuth: true,
        title: 'Paramètres',
        isUserPage: true,
      },
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: NotificationsView,
      meta: {
        requiresAuth: true,
        title: 'Centre de notifications',
        isUserPage: true,
      },
    },
    {
      path: '/users',
      name: 'users',
      component: UsersView,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
        title: 'Gestion des utilisateurs',
        isUserPage: true,
      },
    },
  ],
})

// Navigation guard pour l'authentification et gestion des titres
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // Gestion du titre de la page
  const pageTitle = to.meta.title || 'Page'
  document.title = `SCD Manager - ${pageTitle}`

  // Si la route nécessite une authentification
  if (to.meta.requiresAuth !== false) {
    // Vérifier si l'utilisateur est authentifié
    const isAuthenticated = await userStore.checkAuth()

    if (!isAuthenticated) {
      next('/login')
      return
    }

    // Vérifier si la route nécessite des privilèges d'administrateur
    if (to.meta.requiresAdmin && !userStore.isAdmin) {
      next('/dashboard')
      return
    }
  }

  // Si l'utilisateur est connecté et essaie d'accéder à la page de login
  if (to.path === '/login' && userStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

export default router
