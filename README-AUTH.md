# Authentification BackOffice - Salaunes Country Dans

## Vue d'ensemble

L'authentification du BackOffice est maintenant connectée au backend Node.js/Express avec gestion complète des JWT.

## Fonctionnalités implémentées

### 🔐 Authentification

- **Connexion** : Formulaire de login avec validation
- **Déconnexion** : Déconnexion sécurisée avec appel API
- **Vérification automatique** : Vérification du token JWT au chargement
- **Rafraîchissement de token** : Renouvellement automatique des tokens expirés
- **Changement de mot de passe** : Interface pour modifier le mot de passe

### 🛡️ Sécurité

- **Intercepteurs HTTP** : Ajout automatique du token Bearer aux requêtes
- **Gestion des erreurs 401** : Redirection automatique vers login si token invalide
- **Stockage sécurisé** : Token stocké dans localStorage
- **Validation côté client** : Règles de validation des formulaires

## Architecture

### Services API (`src/services/api.ts`)

```typescript
// Service principal pour les requêtes HTTP
export const apiService = new ApiService()

// Service spécifique pour l'authentification
export const authService = {
  login(email, password)
  logout()
  getProfile()
  refreshToken()
  changePassword(currentPassword, newPassword)
}
```

### Store Utilisateur (`src/stores/user.ts`)

```typescript
export const useUserStore = defineStore('user', () => {
  // État
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)

  // Computed
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const fullName = computed(() => `${user.value?.firstName} ${user.value?.lastName}`)

  // Actions
  const login(email, password)
  const logout()
  const checkAuth()
  const refreshToken()
  const changePassword(currentPassword, newPassword)
})
```

### Composants

- **LoginView** : Page de connexion
- **ChangePasswordDialog** : Dialog pour changer le mot de passe
- **MainLayout** : Layout principal avec gestion de l'utilisateur connecté

## Configuration

### Variables d'environnement

Créer un fichier `.env` basé sur `env.example` :

```env
# Configuration de l'API Backend
VITE_API_URL=http://localhost:3000

# Configuration de l'application
VITE_APP_TITLE=Salaunes Country Dans - BackOffice
VITE_APP_VERSION=1.0.0
```

### Dépendances

```bash
npm install axios
```

## Utilisation

### 1. Connexion

```typescript
const userStore = useUserStore()
const result = await userStore.login(email, password)

if (result.success) {
  // Redirection vers le dashboard
  router.push('/dashboard')
} else {
  // Affichage de l'erreur
  console.error(result.error)
}
```

### 2. Vérification de l'authentification

```typescript
// Dans un composant
const userStore = useUserStore()

if (userStore.isAuthenticated) {
  // Utilisateur connecté
  console.log('Bonjour', userStore.fullName)
}
```

### 3. Protection des routes

```typescript
// Dans le router
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth !== false) {
    const isAuthenticated = await userStore.checkAuth()

    if (!isAuthenticated) {
      next('/login')
      return
    }
  }

  next()
})
```

### 4. Changement de mot de passe

```vue
<template>
  <ChangePasswordDialog v-model="showDialog" />
</template>

<script setup>
const showDialog = ref(false)
</script>
```

## API Endpoints utilisés

### Backend (`/admin`)

- `POST /admin/login` - Connexion
- `POST /admin/logout` - Déconnexion
- `GET /admin/profile` - Profil utilisateur
- `POST /admin/refresh-token` - Rafraîchissement de token
- `POST /admin/change-password` - Changement de mot de passe

## Gestion des erreurs

### Erreurs courantes

- **401 Unauthorized** : Token expiré ou invalide → Redirection vers login
- **400 Bad Request** : Données de formulaire invalides → Affichage des erreurs
- **500 Internal Server Error** : Erreur serveur → Message générique

### Messages d'erreur

Les messages d'erreur sont automatiquement extraits de la réponse API et affichés à l'utilisateur.

## Sécurité

### Bonnes pratiques implémentées

- ✅ Validation côté client et serveur
- ✅ Stockage sécurisé du token
- ✅ Gestion automatique des tokens expirés
- ✅ Intercepteurs HTTP pour l'authentification
- ✅ Protection des routes sensibles
- ✅ Déconnexion sécurisée

### Recommandations

- 🔒 Utiliser HTTPS en production
- 🔒 Implémenter une liste noire de tokens côté serveur
- 🔒 Ajouter une limitation de tentatives de connexion
- 🔒 Implémenter l'authentification à deux facteurs (2FA)

## Tests

Pour tester l'authentification :

1. **Démarrer le backend** :

   ```bash
   cd Backend
   npm install
   npm run dev
   ```

2. **Démarrer le BackOffice** :

   ```bash
   cd BackOffice
   npm install
   npm run dev
   ```

3. **Tester la connexion** avec les identifiants par défaut :
   - Email : `admin@scd.fr`
   - Mot de passe : `admin123`

## Développement futur

### Fonctionnalités à ajouter

- [ ] Authentification à deux facteurs (2FA)
- [ ] Gestion des sessions multiples
- [ ] Audit des connexions
- [ ] Récupération de mot de passe
- [ ] Gestion des rôles et permissions avancées

### Améliorations techniques

- [ ] Tests unitaires pour l'authentification
- [ ] Tests d'intégration API
- [ ] Monitoring des tentatives de connexion
- [ ] Logs de sécurité détaillés
