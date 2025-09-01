import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CoursesView from '@/views/CoursesView.vue'
import DancesView from '@/views/DancesView.vue'
import GalleryView from '@/views/GalleryView.vue'

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
      component: DashboardView,
      meta: {
        requiresAuth: true,
        title: 'Tableau de bord',
      },
    },
    {
      path: '/courses',
      name: 'courses',
      component: CoursesView,
      meta: {
        requiresAuth: true,
        title: 'Gestion des cours',
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
        title: 'Galerie',
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
  }

  // Si l'utilisateur est connecté et essaie d'accéder à la page de login
  if (to.path === '/login' && userStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

export default router
