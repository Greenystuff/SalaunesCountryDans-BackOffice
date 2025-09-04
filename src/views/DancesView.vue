<template>
  <div class="dances-container">
    <VCard class="main-card">

      <!-- HEADER -->
      <div class="header-title">
        <div class="header-content">
          <h1 class="main-title">Gestion des Danses</h1>
          <p class="subtitle">
            Gérez le répertoire des danses, leurs niveaux et caractéristiques.
          </p>
        </div>
        <div class="header-actions">
          <VBtn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
            Ajouter une danse
          </VBtn>
        </div>
      </div>

      <VDivider />

      <!-- BARRE D'OUTILS / FILTRES -->
      <div class="toolbar">
        <VTextField v-model="search" placeholder="Rechercher une danse..." variant="solo" density="comfortable"
          hide-details clearable prepend-inner-icon="mdi-magnify" class="toolbar-item" />
        <VSelect v-model="filters.level" :items="levelOptions" label="Niveau" variant="solo" hide-details clearable
          class="toolbar-item" />
        <VBtn class="toolbar-item" variant="tonal" @click="clearFilters">
          Réinitialiser
        </VBtn>
      </div>

      <!-- CONTENU PRINCIPAL -->
      <div class="dances-content">
        <!-- Tableau des danses -->
        <div class="table-container">
          <v-data-table :headers="headers" :items="filteredDances" :search="search"
            :sort-by="[{ key: 'dateSortable', order: 'desc' }]" class="dances-table elevation-1" density="compact"
            height="500" fixed-header>
            <!-- Colonne Nom -->
            <template #item.name="{ item }">
              <span class="font-weight-medium">{{ formatName(item.name) }}</span>
            </template>

            <!-- Colonne Niveau -->
            <template #item.level="{ item }">
              <v-chip :color="getLevelColor(item.level)" size="small" variant="flat" class="level-chip">
                {{ item.level }}
              </v-chip>
            </template>

            <!-- Colonne Date -->
            <template #item.dateSortable="{ item }">
              {{ item.dateDisplay || formatDate(item.date) }}
            </template>

            <!-- Colonne Liens -->
            <template #item.links="{ item }">
              <div class="d-flex gap-2">
                <v-btn v-if="item.youtubeLink1" :href="item.youtubeLink1" target="_blank" icon="mdi-youtube"
                  size="small" color="red" variant="text" />
                <v-btn v-if="item.youtubeLink2" :href="item.youtubeLink2" target="_blank" icon="mdi-youtube"
                  size="small" color="red" variant="text" />
                <v-btn v-if="item.pdfUrl" :href="item.pdfUrl" target="_blank" icon="mdi-file-pdf-box" size="small"
                  color="red" variant="text" />
              </div>
            </template>

            <!-- Colonne Actions -->
            <template #item.actions="{ item }">
              <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)" />
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)" />
            </template>
          </v-data-table>
        </div>
      </div>
    </VCard>

    <!-- Section des statistiques -->
    <v-row class="mt-6">
      <v-col cols="12">
        <h3 class="text-h5 font-weight-bold mb-4 stats-section-title">Statistiques des Danses</h3>
      </v-col>

      <!-- Total des danses -->
      <v-col cols="12" md="3">
        <v-card class="stats-card" elevation="2" rounded="lg">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="primary" class="mb-3 stats-icon">mdi-music-note</v-icon>
            <div class="text-h3 font-weight-bold text-primary stats-counter">{{ totalDances }}</div>
            <div class="text-body-1 text-medium-emphasis stats-label">Total des danses</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Répartition par niveau -->
      <v-col cols="12" md="3">
        <v-card class="stats-card" elevation="2" rounded="lg">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="success" class="mb-3 stats-icon">mdi-account-group</v-icon>
            <div class="text-h3 font-weight-bold text-success stats-counter">{{ levelStats.Débutant || 0 }}</div>
            <div class="text-body-1 text-medium-emphasis stats-label">Débutant</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="stats-card" elevation="2" rounded="lg">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="info" class="mb-3 stats-icon">mdi-account-check</v-icon>
            <div class="text-h3 font-weight-bold text-info stats-counter">{{ levelStats.Novice || 0 }}</div>
            <div class="text-body-1 text-medium-emphasis stats-label">Novice</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card class="stats-card" elevation="2" rounded="lg">
          <v-card-text class="text-center pa-6">
            <v-icon size="48" color="warning" class="mb-3 stats-icon">mdi-account-star</v-icon>
            <div class="text-h3 font-weight-bold text-warning stats-counter">{{ levelStats.Intermédiaire || 0 }}</div>
            <div class="text-body-1 text-medium-emphasis stats-label">Intermédiaire</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Statistiques avancées -->
      <v-col cols="12" md="6">
        <v-card class="stats-card" elevation="2" rounded="lg">
          <v-card-title class="text-h6 pa-4">
            <v-icon class="me-2">mdi-chart-pie</v-icon>
            Répartition par niveau
          </v-card-title>
          <v-card-text class="pa-4 stats-progress">
            <div class="d-flex align-center mb-3" v-for="(count, level) in levelStats" :key="level">
              <div class="d-flex align-center me-3" style="width: 150px;">
                <v-chip :color="getLevelColor(level)" size="small" variant="flat" class="me-2 level-chip">
                  {{ level }}
                </v-chip>
                <span class="text-body-2">{{ count }}</span>
              </div>
              <v-progress-linear :model-value="(count / totalDances) * 100" :color="getLevelColor(level)" height="8"
                rounded class="flex-grow-1" />
              <span class="text-body-2 ms-3">{{ Math.round((count / totalDances) * 100) }}%</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="stats-card" elevation="2" rounded="lg">
          <v-card-title class="text-h6 pa-4">
            <v-icon class="me-2">mdi-link-variant</v-icon>
            Ressources disponibles
          </v-card-title>
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="d-flex align-center">
                <v-icon color="red" class="me-2">mdi-youtube</v-icon>
                <span>Vidéos YouTube</span>
              </div>
              <v-chip color="red" size="small" variant="flat" class="level-chip">{{ videosCount }}</v-chip>
            </div>
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="d-flex align-center">
                <v-icon color="red" class="me-2">mdi-file-pdf-box</v-icon>
                <span>Documents PDF</span>
              </div>
              <v-chip color="red" size="small" variant="flat" class="level-chip">{{ pdfsCount }}</v-chip>
            </div>
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon color="primary" class="me-2">mdi-calendar</v-icon>
                <span>Ajoutées ce mois</span>
              </div>
              <v-chip color="primary" size="small" variant="flat" class="level-chip">{{ thisMonthCount }}</v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog pour ajouter/modifier une danse -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card class="dance-dialog">
        <v-card-title>
          {{ editingDance ? 'Modifier la danse' : 'Ajouter une danse' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="danceForm.name" label="Nom de la danse" variant="outlined"
                  :rules="[v => !!v || 'Le nom est requis']" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="danceForm.level" :items="levelOptions" label="Niveau" variant="outlined"
                  :rules="[v => !!v || 'Le niveau est requis']" required />
              </v-col>

              <v-col cols="12">
                <v-menu v-model="showDatePicker" :close-on-content-click="false" transition="scale-transition" offset-y>
                  <template #activator="{ props }">
                    <v-text-field v-model="formattedDanceDate" label="Date" prepend-inner-icon="mdi-calendar"
                      variant="outlined" readonly v-bind="props" :rules="[v => !!v || 'La date est requise']"
                      required />
                  </template>
                  <v-date-picker v-model="danceForm.date" :min="minDanceDate" :max="maxDanceDate"
                    @update:model-value="showDatePicker = false" />
                </v-menu>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="danceForm.youtubeLink1" label="Lien YouTube 1" variant="outlined"
                  prepend-inner-icon="mdi-youtube" :rules="[v => !v || isValidYoutubeUrl(v) || 'Lien YouTube invalide']"
                  hint="Entrez un lien YouTube (normal ou embed)" persistent-hint @blur="transformYoutubeUrl1" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="danceForm.youtubeLink2" label="Lien YouTube 2" variant="outlined"
                  prepend-inner-icon="mdi-youtube" :rules="[v => !v || isValidYoutubeUrl(v) || 'Lien YouTube invalide']"
                  hint="Entrez un lien YouTube (normal ou embed)" persistent-hint @blur="transformYoutubeUrl2" />
              </v-col>
              <v-col cols="12">
                <div class="text-subtitle-2 mb-3">PDF de la danse</div>

                <!-- Onglets pour choisir le mode -->
                <v-card variant="outlined" class="mb-4 pdf-tabs">
                  <v-tabs v-model="pdfMode" color="primary" grow @update:model-value="handlePdfModeChange">
                    <v-tab value="url" prepend-icon="mdi-link">
                      Lien URL
                    </v-tab>
                    <v-tab value="file" prepend-icon="mdi-file-upload">
                      Fichier local
                    </v-tab>
                  </v-tabs>

                  <v-window v-model="pdfMode">
                    <!-- Onglet URL -->
                    <v-window-item value="url">
                      <v-card-text class="pt-4">
                        <v-text-field v-model="danceForm.pdfLink" label="Lien PDF" variant="outlined"
                          prepend-inner-icon="mdi-file-pdf-box" placeholder="https://example.com/document.pdf"
                          hint="Entrez l'URL d'un fichier PDF" persistent-hint />
                      </v-card-text>
                    </v-window-item>

                    <!-- Onglet Fichier -->
                    <v-window-item value="file">
                      <v-card-text class="pt-4">
                        <v-file-input v-model="pdfFile" accept=".pdf" label="Sélectionner un fichier PDF"
                          variant="outlined" prepend-icon="mdi-file-upload" hint="Taille maximale : 10 MB"
                          persistent-hint @change="handlePdfValidation"
                          :rules="[v => !v || (v.size <= 10 * 1024 * 1024 && v.type === 'application/pdf') || 'PDF invalide ou trop volumineux (max 10MB)']" />
                      </v-card-text>
                    </v-window-item>
                  </v-window>
                </v-card>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="dialog = false">Annuler</v-btn>
          <v-btn color="primary" :disabled="!formValid" @click="saveDance">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card class="confirm-dialog">
        <v-card-title>Confirmer la suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer la danse "{{ danceToDelete?.name }}" ?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" @click="deleteDance">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiService } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'

interface Dance {
  _id: string
  name: string
  level: 'Débutant' | 'Novice' | 'Intermédiaire'
  date: string
  dateDisplay?: string // Date formatée en français
  dateSortable?: string // Pour le tri chronologique
  youtubeLink1?: string
  youtubeLink2?: string
  pdfLink?: string
  pdfUrl?: string // URL temporaire MinIO
}

interface DanceForm {
  name: string
  level: 'Débutant' | 'Novice' | 'Intermédiaire'
  date: string
  youtubeLink1: string
  youtubeLink2: string
  pdfLink: string
}

// Services
const api = apiService
const { showSuccess, showError, showWarning } = useNotifications()

// Données réactives
const dances = ref<Dance[]>([])
const loading = ref(false)
const search = ref('')
const filters = ref({
  level: null
})
const dialog = ref(false)
const deleteDialog = ref(false)
const formValid = ref(false)
const showDatePicker = ref(false)
const editingDance = ref<Dance | null>(null)
const danceToDelete = ref<Dance | null>(null)
const form = ref()
const pdfFile = ref<File | null>(null)
const pdfMode = ref('url') // 'url' ou 'file'

// Contrôleur d'annulation pour les requêtes
const abortController = ref<AbortController | null>(null)

// Formulaire
const danceForm = ref<DanceForm>({
  name: '',
  level: 'Débutant',
  date: new Date().toISOString().split('T')[0], // Date du jour par défaut
  youtubeLink1: '',
  youtubeLink2: '',
  pdfLink: ''
})

// Options pour les selects
const levelOptions = ['Débutant', 'Novice', 'Intermédiaire']

// Headers du tableau
const headers = [
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Niveau', key: 'level', sortable: true },
  { title: 'Date', key: 'dateSortable', sortable: true },
  { title: 'Liens', key: 'links', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Computed
const filteredDances = computed(() => {
  let filtered = dances.value

  // Filtre par niveau
  if (filters.value.level) {
    filtered = filtered.filter(dance => dance.level === filters.value.level)
  }

  return filtered
})

// Statistiques des danses
const totalDances = computed(() => dances.value.length)

const levelStats = computed(() => {
  const stats: Record<string, number> = {}
  dances.value.forEach(dance => {
    stats[dance.level] = (stats[dance.level] || 0) + 1
  })
  return stats
})

const videosCount = computed(() => {
  return dances.value.filter(dance =>
    dance.youtubeLink1 || dance.youtubeLink2
  ).length
})

const pdfsCount = computed(() => {
  return dances.value.filter(dance => dance.pdfUrl).length
})

const thisMonthCount = computed(() => {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  return dances.value.filter(dance => {
    try {
      const danceDate = new Date(dance.date)
      return danceDate.getMonth() === thisMonth && danceDate.getFullYear() === thisYear
    } catch {
      return false
    }
  }).length
})

// Computed properties pour le date picker
const formattedDanceDate = computed(() => {
  if (!danceForm.value.date) return ''
  return new Date(danceForm.value.date).toLocaleDateString('fr-FR')
})

// Date minimale pour une danse (pas de restriction)
const minDanceDate = computed(() => {
  return undefined
})

// Date maximale pour une danse (pas de restriction)
const maxDanceDate = computed(() => {
  return undefined
})

// Méthodes
const getLevelColor = (level: string) => {
  switch (level) {
    case 'Débutant': return 'success'
    case 'Novice': return 'info'
    case 'Intermédiaire': return 'warning'
    default: return 'grey'
  }
}



const formatDate = (date: string) => {
  // Si la date est au format ISO (YYYY-MM-DD), la formater en français
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }
  // Sinon, retourner la date telle quelle (déjà formatée)
  return date;
}

// Fonction pour formater les noms (premières lettres en majuscules)
const formatName = (name: string) => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Fonction pour valider et transformer les liens YouTube
const validateAndTransformYoutubeUrl = (url: string): string => {
  if (!url) return '';

  // Nettoyer l'URL
  const cleanUrl = url.trim();

  // Si c'est déjà un lien embed (avec ou sans paramètres), le retourner tel quel
  if (cleanUrl.includes('youtube.com/embed/')) {
    return cleanUrl;
  }

  // Patterns pour différents formats YouTube
  const patterns = [
    // youtube.com/watch?v=VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    // youtu.be/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
    // youtube.com/embed/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    // youtube.com/v/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]+)/
  ];

  // Essayer de matcher avec les patterns
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}?feature=oembed`;
    }
  }

  // Si aucun pattern ne matche, retourner l'URL originale
  return cleanUrl;
}

// Fonction pour valider si une URL YouTube est valide
const isValidYoutubeUrl = (url: string): boolean => {
  if (!url) return true; // URL vide est valide (optionnel)

  const cleanUrl = url.trim();

  // Vérifier si c'est déjà un lien embed (avec ou sans paramètres)
  if (cleanUrl.includes('youtube.com/embed/')) {
    return true;
  }

  // Patterns pour différents formats YouTube
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/[a-zA-Z0-9_-]+/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]+(?:\?[^?]*)?/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/[a-zA-Z0-9_-]+/
  ];

  return patterns.some(pattern => pattern.test(cleanUrl));
}

// Fonctions pour transformer les URLs YouTube lors de la perte de focus
const transformYoutubeUrl1 = () => {
  if (danceForm.value.youtubeLink1) {
    danceForm.value.youtubeLink1 = validateAndTransformYoutubeUrl(danceForm.value.youtubeLink1);
  }
}

const transformYoutubeUrl2 = () => {
  if (danceForm.value.youtubeLink2) {
    danceForm.value.youtubeLink2 = validateAndTransformYoutubeUrl(danceForm.value.youtubeLink2);
  }
}

const clearFilters = () => {
  filters.value.level = null
  search.value = ''
}

// Charger les danses depuis l'API
const loadDances = async () => {
  try {
    // Annuler la requête précédente si elle existe
    if (abortController.value) {
      abortController.value.abort()
    }

    // Créer un nouveau contrôleur d'annulation
    abortController.value = new AbortController()

    loading.value = true
    const response = await api.get<Dance[]>('/dances', {
      signal: abortController.value.signal
    })
    const dancesData = response.data || []

    // Ajouter le champ dateSortable pour le tri chronologique
    dances.value = dancesData.map(dance => ({
      ...dance,
      dateSortable: getDateForSorting(dance.date)
    }))

  } catch (error: any) {
    // Ne pas afficher l'erreur si la requête a été annulée
    if (error.name !== 'AbortError') {
      console.error('❌ Erreur lors du chargement des danses:', error)
      showError('Erreur lors du chargement des danses. Veuillez réessayer.')
    }
  } finally {
    loading.value = false
  }
}

// Fonction pour obtenir une date triable (ISO) à partir d'une date française
const getDateForSorting = (dateStr: string): string => {
  // Si c'est déjà au format YYYY-MM-DD, le retourner
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Si c'est une date française (ex: "10 juin 2025"), la parser
  const months: { [key: string]: number } = {
    'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4,
    'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
    'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
  };

  const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const [, day, monthName, year] = match;
    const month = months[monthName.toLowerCase()];
    if (month) {
      return `${year}-${month.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // Si on ne peut pas parser, retourner la date du jour
  return new Date().toISOString().split('T')[0];
}

const openDialog = (dance?: Dance) => {
  if (dance) {
    editingDance.value = dance
    danceForm.value = {
      name: dance.name,
      level: dance.level,
      date: formatDateForInput(dance.date), // Formater pour l'input date
      youtubeLink1: dance.youtubeLink1 || '',
      youtubeLink2: dance.youtubeLink2 || '',
      pdfLink: dance.pdfUrl || '' // Utiliser pdfUrl (MinIO) au lieu de pdfLink
    }
    pdfFile.value = null // Pas de nouveau fichier lors de l'édition

    // Détecter automatiquement le mode selon le contenu
    if (dance.pdfUrl && dance.pdfUrl.includes('localhost:9000')) {
      pdfMode.value = 'url' // C'est un lien MinIO
    } else if (dance.pdfLink && dance.pdfLink.includes('countrydancemartignas.fr')) {
      pdfMode.value = 'url' // C'est un lien externe
    } else {
      pdfMode.value = 'url' // Par défaut
    }
  } else {
    editingDance.value = null
    // Date du jour au format YYYY-MM-DD pour l'input date
    const today = new Date().toISOString().split('T')[0]
    danceForm.value = {
      name: '',
      level: 'Débutant',
      date: today,
      youtubeLink1: '',
      youtubeLink2: '',
      pdfLink: ''
    }
    pdfFile.value = null
    pdfMode.value = 'url' // Reset to URL mode
  }
  dialog.value = true
}

// Gérer le changement de fichier PDF
const handlePdfFileChange = (files: File | File[] | null) => {
  if (files) {
    // Vider le champ lien PDF si un fichier est sélectionné
    danceForm.value.pdfLink = ''
    // Basculer automatiquement vers le mode fichier
    pdfMode.value = 'file'
  }
}

// Gérer le changement d'onglet
const handlePdfModeChange = (mode: unknown) => {
  const modeStr = mode as string;
  if (modeStr === 'url') {
    // Vider le fichier si on passe en mode URL
    pdfFile.value = null
  } else if (modeStr === 'file') {
    // Vider le lien si on passe en mode fichier
    danceForm.value.pdfLink = ''
  }
}

// Validation du fichier PDF côté client
const handlePdfValidation = (file: File | File[] | null) => {
  if (file && file instanceof File) {
    // Vérifier le type
    if (file.type !== 'application/pdf') {
      showError('Le fichier sélectionné n\'est pas un PDF valide')
      pdfFile.value = null
      return
    }

    // Vérifier la taille (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      showError('Le fichier PDF est trop volumineux (maximum 10MB)')
      pdfFile.value = null
      return
    }
  }
}

// Fonction pour formater une date française en format YYYY-MM-DD pour l'input date
const formatDateForInput = (dateStr: string): string => {
  // Si c'est déjà au format YYYY-MM-DD, le retourner
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Si c'est une date française (ex: "10 juin 2025"), la parser
  const months: { [key: string]: number } = {
    'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4,
    'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
    'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
  };

  const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const [, day, monthName, year] = match;
    const month = months[monthName.toLowerCase()];
    if (month) {
      return `${year}-${month.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // Si on ne peut pas parser, retourner la date du jour
  return new Date().toISOString().split('T')[0];
}

const saveDance = async () => {
  try {
    let uploadedPdfFile: string | null = null;

    // Validation du fichier PDF avant upload
    if (pdfFile.value) {
      // Vérifier la taille (10MB max)
      const maxSize = 10 * 1024 * 1024
      if (pdfFile.value.size > maxSize) {
        showError('Le fichier PDF est trop volumineux (maximum 10MB)')
        return
      }

      // Vérifier le type
      if (pdfFile.value.type !== 'application/pdf') {
        showError('Le fichier sélectionné n\'est pas un PDF valide')
        return
      }

      const formData = new FormData();
      formData.append('pdf', pdfFile.value);
      formData.append('danceName', danceForm.value.name);

      try {
        const uploadResponse = await api.post<{ success: boolean, fileName: string }>('/dances/upload-pdf', formData);

        if ((uploadResponse as any).success) {
          uploadedPdfFile = (uploadResponse as any).fileName;
        }
      } catch (uploadError: any) {
        console.error('❌ Erreur lors de l\'upload du PDF:', uploadError);

        if (uploadError.response?.data?.message) {
          showError(`Erreur upload PDF: ${uploadError.response.data.message}`)
        } else {
          showError('Erreur lors de l\'upload du fichier PDF')
        }
        return;
      }
    }

    // Validation des URLs YouTube
    if (danceForm.value.youtubeLink1 && !isValidYoutubeUrl(danceForm.value.youtubeLink1)) {
      showError('Le premier lien YouTube n\'est pas valide')
      return
    }

    if (danceForm.value.youtubeLink2 && !isValidYoutubeUrl(danceForm.value.youtubeLink2)) {
      showError('Le second lien YouTube n\'est pas valide')
      return
    }

    // Préparer les données à envoyer
    const danceData: any = {
      ...danceForm.value,
      // Convertir la date du formulaire en format français pour l'affichage
      date: formatDateForDisplay(danceForm.value.date),
      // Transformer les URLs YouTube en format embed
      youtubeLink1: validateAndTransformYoutubeUrl(danceForm.value.youtubeLink1),
      youtubeLink2: validateAndTransformYoutubeUrl(danceForm.value.youtubeLink2)
    };

    // Ajouter le pdfFile si un fichier a été uploadé
    if (uploadedPdfFile) {
      danceData.pdfFile = uploadedPdfFile;
    }

    if (editingDance.value) {
      // Modifier une danse existante
      await api.put(`/dances/${editingDance.value._id}`, danceData)
      showSuccess('Danse modifiée avec succès')
    } else {
      // Ajouter une nouvelle danse
      await api.post('/dances', danceData)
      showSuccess('Danse ajoutée avec succès')
    }

    // Recharger les danses
    await loadDances()
    dialog.value = false
    editingDance.value = null
    pdfFile.value = null // Réinitialiser le fichier
    pdfMode.value = 'url' // Reset to URL mode
  } catch (error: any) {
    console.error('❌ Erreur lors de la sauvegarde:', error)

    // Gestion des erreurs spécifiques
    if (error.response?.data?.message) {
      const errorMessage = error.response.data.message

      if (errorMessage.includes('nom') || errorMessage.includes('name')) {
        showError('Le nom de la danse est requis')
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('existe')) {
        showError('Cette danse existe déjà')
      } else if (errorMessage.includes('niveau') || errorMessage.includes('level')) {
        showError('Le niveau est requis')
      } else {
        showError(`Erreur: ${errorMessage}`)
      }
    } else if (error.message) {
      showError(`Erreur lors de la sauvegarde: ${error.message}`)
    } else {
      showError('Erreur inconnue lors de la sauvegarde de la danse')
    }
  }
}

// Fonction pour formater une date YYYY-MM-DD en format français pour l'affichage
const formatDateForDisplay = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return dateStr; // Retourner la date originale si erreur
  }
}

const confirmDelete = (dance: Dance) => {
  danceToDelete.value = dance
  deleteDialog.value = true
}

const deleteDance = async () => {
  if (danceToDelete.value) {
    try {
      const danceName = danceToDelete.value.name

      await api.delete(`/dances/${danceToDelete.value._id}`)
      await loadDances() // Recharger les danses

      deleteDialog.value = false
      danceToDelete.value = null

      showSuccess(`Danse "${danceName}" supprimée avec succès`)
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression:', error)

      if (error.response?.data?.message) {
        showError(`Erreur: ${error.response.data.message}`)
      } else if (error.message) {
        showError(`Erreur lors de la suppression: ${error.message}`)
      } else {
        showError('Erreur inconnue lors de la suppression de la danse')
      }
    }
  }
}

// Charger les danses au montage
onMounted(() => {
  loadDances()
})

// Nettoyer les requêtes au démontage
onUnmounted(() => {
  // Annuler les requêtes en cours
  if (abortController.value) {
    abortController.value.abort()
  }
})
</script>

<!-- Import des styles externes -->
<style>
@import '@/assets/dances-view.css';
</style>
