<template>
  <div class="gallery-container">
    <VCard class="main-card">

      <!-- HEADER -->
      <div class="header-title">
        <div class="header-content">
          <h1 class="main-title">Galerie Photos</h1>
          <p class="subtitle">
            Gérez les photos et images du club.
          </p>
        </div>
        <div class="header-actions">
          <VBtn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
            Ajouter des images
          </VBtn>
        </div>
      </div>

      <VDivider />

      <!-- BARRE D'OUTILS / FILTRES -->
      <div class="toolbar">
        <VTextField v-model="search" placeholder="Rechercher une image..." variant="solo" density="comfortable"
          hide-details clearable prepend-inner-icon="mdi-magnify" class="toolbar-item" />
        <VSelect v-model="filters.category" :items="categoryOptions" label="Catégorie" variant="solo" hide-details
          clearable class="toolbar-item" />
        <VSelect v-model="filters.isActive" :items="[
          { title: 'Toutes', value: '' },
          { title: 'Actives', value: 'true' },
          { title: 'Inactives', value: 'false' }
        ]" label="Statut" variant="solo" hide-details class="toolbar-item" />
        <VBtn class="toolbar-item" variant="tonal" @click="clearFilters">
          Réinitialiser
        </VBtn>
      </div>

      <!-- CONTENU PRINCIPAL -->
      <div class="gallery-content">
        <!-- Grille des images -->
        <v-row v-if="!loading && filteredImages.length > 0">
          <v-col v-for="image in filteredImages" :key="image._id" cols="12" sm="6" md="4" lg="3">
            <GalleryImageCard :image="image" @edit="openDialog" @delete="deleteImage" />
          </v-col>
        </v-row>

        <!-- Message si aucune image -->
        <v-card v-else-if="!loading" class="text-center pa-8">
          <v-icon icon="mdi-image-off" size="48" color="grey" class="mb-4" />
          <h2 class="text-h5 font-weight-bold mb-2">Aucune image trouvée</h2>
          <p class="text-body-1 text-medium-emphasis">
            Aucune image ne correspond à vos critères de recherche.
          </p>
        </v-card>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
          <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
          <p class="text-h6">Chargement des images...</p>
        </div>
      </div>

      <!-- Dialog pour ajouter/modifier une image -->
      <v-dialog v-model="dialog" max-width="600px" persistent>
        <v-card>
          <v-card-title class="text-h5 pa-4 d-flex justify-space-between align-center">
            <span>{{ editingImage ? 'Modifier l\'image' : 'Ajouter une image' }}</span>
            <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" class="ml-auto" />
          </v-card-title>

          <v-card-text class="pa-4">
            <v-form ref="form" v-model="formValid" class="form-spacing">
              <!-- Upload d'image -->
              <v-file-input v-model="imageFile" label="Image" accept="image/*" prepend-icon="mdi-camera"
                variant="outlined" :rules="editingImage ? [] : [v => !!v || 'Une image est requise']"
                :disabled="!!editingImage" @change="handleImageChange" class="mb-4" />

              <!-- Prévisualisation -->
              <div v-if="imagePreview" class="text-center mb-6">
                <v-img :src="imagePreview" max-height="200" max-width="300" class="mx-auto rounded" contain />
              </div>

              <!-- Titre -->
              <v-text-field v-model="imageForm.title" label="Titre *" variant="outlined"
                :rules="[v => !!v || 'Le titre est requis']" required class="mb-4" />

              <!-- Description -->
              <v-textarea v-model="imageForm.description" label="Description" variant="outlined" rows="3" counter="1000"
                class="mb-4" />

              <!-- Alt Text -->
              <v-text-field v-model="imageForm.altText" label="Texte alternatif" variant="outlined" counter="200"
                hint="Description de l'image pour l'accessibilité" class="mb-4" />

              <!-- Catégorie -->
              <v-select v-model="imageForm.category" :items="categoryOptions" label="Catégorie" variant="outlined"
                clearable class="mb-4" />

              <!-- Tags -->
              <v-text-field v-model="imageForm.tagsString" label="Tags" variant="outlined"
                hint="Séparez les tags par des virgules" placeholder="événement, danse, groupe" class="mb-4" />

              <!-- Ordre -->
              <v-text-field v-model.number="imageForm.order" label="Ordre d'affichage" type="number" variant="outlined"
                min="0" class="mb-4" />
            </v-form>
          </v-card-text>

          <!-- Actions avec toggle et boutons -->
          <v-card-actions class="pa-4 d-flex justify-space-between align-center">
            <!-- Toggle à gauche -->
            <v-switch v-model="imageForm.isActive" label="Image active" color="primary" class="ma-0" hide-details />

            <!-- Boutons à droite -->
            <div class="d-flex gap-2">
              <v-btn variant="outlined" @click="resetForm" :disabled="!hasChanges">
                Réinitialiser
              </v-btn>
              <v-btn color="primary" :loading="saving" :disabled="isSaveButtonDisabled" @click="saveImage">
                {{ editingImage ? 'Modifier' : 'Créer' }}
              </v-btn>
            </div>
          </v-card-actions>


        </v-card>
      </v-dialog>

    </VCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiService } from '@/services/api'
import GalleryImageCard from '@/components/GalleryImageCard.vue'

interface GalleryImage {
  _id: string
  title: string
  description?: string
  altText?: string
  category?: string
  tags?: string[]
  imageFile: string
  imageUrl?: string
  originalImageUrl?: string
  width?: number
  height?: number
  fileSize?: number
  mimeType?: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

// État
const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const formValid = ref(false)
const editingImage = ref<GalleryImage | null>(null)
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)

// Images
const images = ref<GalleryImage[]>([])

// Filtres
const search = ref('')
const filters = ref({
  category: null,
  isActive: '' // Valeur par défaut pour "Toutes"
})

// Contrôleur d'annulation pour les requêtes
const abortController = ref<AbortController | null>(null)

// Formulaire
const imageForm = ref({
  title: '',
  description: '',
  altText: '',
  category: null as string | null,
  tagsString: '',
  order: 0,
  isActive: true
})

// État initial pour v-confirm-edit
const initialFormState = ref({
  title: '',
  description: '',
  altText: '',
  category: null as string | null,
  tagsString: '',
  order: 0,
  isActive: true
})

// Options
const categoryOptions = [
  'Événements',
  'Cours',
  'Compétitions',
  'Portraits',
  'Lieux',
  'Autres'
]



// Computed
const filteredImages = computed(() => {
  let filtered = images.value

  // Filtre par recherche
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(image =>
      image.title.toLowerCase().includes(searchLower) ||
      (image.description && image.description.toLowerCase().includes(searchLower)) ||
      (image.tags && image.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    )
  }

  // Filtre par catégorie
  if (filters.value.category) {
    filtered = filtered.filter(image => image.category === filters.value.category)
  }

  // Filtre par statut
  if (filters.value.isActive !== '' && filters.value.isActive !== null) {
    filtered = filtered.filter(image => image.isActive.toString() === filters.value.isActive)
  }

  return filtered.sort((a, b) => a.order - b.order)
})

// Validation du formulaire
const isFormValid = computed(() => {
  // En mode édition, on vérifie le titre ET qu'il y a des changements
  if (editingImage.value) {
    return !!imageForm.value.title.trim() && hasChanges.value
  }

  // En mode création, on vérifie le titre et l'image
  return !!imageForm.value.title.trim() && !!imageFile.value
})

// Détection des changements
const hasChanges = computed((): boolean => {
  if (!editingImage.value) {
    // En mode création, on considère qu'il y a des changements si le titre n'est pas vide
    return Boolean(imageForm.value.title.trim() || imageFile.value)
  }

  // En mode édition, comparer avec l'état initial
  const hasChanges = (JSON.stringify(imageForm.value) !== JSON.stringify(initialFormState.value) || !!imageFile.value)
  return Boolean(hasChanges)
})

const isSaveButtonDisabled = computed((): boolean => {
  const isValid = Boolean(formValid.value)
  const hasChangesValue = Boolean(hasChanges.value)
  const isEditing = Boolean(editingImage.value)
  return !isValid || (isEditing && !hasChangesValue)
})

// Protection contre les appels multiples
const isLoadingImages = ref(false)

// Méthodes
const loadImages = async () => {
  // Protection contre les appels multiples
  if (isLoadingImages.value) {
    return
  }

  try {
    isLoadingImages.value = true

    // Annuler la requête précédente si elle existe
    if (abortController.value) {
      abortController.value.abort()
    }

    // Créer un nouveau contrôleur d'annulation
    abortController.value = new AbortController()

    loading.value = true
    const response = await apiService.get('/gallery', {
      signal: abortController.value.signal
    })
    images.value = (response.data as GalleryImage[]) || []
  } catch (error: any) {
    // Ne pas afficher l'erreur si la requête a été annulée
    if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
      console.error('Erreur lors du chargement des images:', error)
    }
    // Les erreurs d'annulation sont normales lors du démontage/remontage du composant
  } finally {
    loading.value = false
    isLoadingImages.value = false
  }
}

const openDialog = (image?: GalleryImage) => {
  editingImage.value = image || null

  if (image) {
    // Mode édition
    const formData = {
      title: image.title,
      description: image.description || '',
      altText: image.altText || '',
      category: image.category || '',
      tagsString: image.tags ? image.tags.join(', ') : '',
      order: image.order,
      isActive: image.isActive
    }
    imageForm.value = { ...formData }
    initialFormState.value = { ...formData }
    imagePreview.value = image.imageUrl || null
  } else {
    // Mode création
    const formData = {
      title: '',
      description: '',
      altText: '',
      category: '',
      tagsString: '',
      order: images.value.length,
      isActive: true
    }
    imageForm.value = { ...formData }
    initialFormState.value = { ...formData }
    imagePreview.value = null
  }

  dialog.value = true
}

const resetForm = () => {
  // Réinitialiser le formulaire avec l'état initial
  imageForm.value = { ...initialFormState.value }

  // Réinitialiser le fichier sélectionné
  imageFile.value = null

  // Gérer l'aperçu selon le mode
  if (editingImage.value) {
    // Mode édition : restaurer l'aperçu original
    imagePreview.value = editingImage.value.imageUrl || null
  } else {
    // Mode création : supprimer l'aperçu
    if (imagePreview.value) {
      URL.revokeObjectURL(imagePreview.value)
    }
    imagePreview.value = null
  }
}

const closeDialog = () => {
  dialog.value = false
  editingImage.value = null
  imageFile.value = null

  // Nettoyer l'URL d'objet si elle existe
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
  }
  imagePreview.value = null

  imageForm.value = {
    title: '',
    description: '',
    altText: '',
    category: null,
    tagsString: '',
    order: 0,
    isActive: true
  }
}

const handleImageChange = (file: File | File[] | null) => {
  // Nettoyer l'ancienne URL si elle existe
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
  }

  if (file && file instanceof File) {
    // Vérifier que c'est bien une image
    if (file.type.startsWith('image/')) {
      imagePreview.value = URL.createObjectURL(file)
    } else {
      imagePreview.value = null
      console.warn('Le fichier sélectionné n\'est pas une image')
    }
  } else {
    imagePreview.value = null
  }
}

const saveImage = async () => {
  try {
    saving.value = true

    if (editingImage.value) {
      // Mode édition
      const updateData: any = {
        ...imageForm.value,
        tags: imageForm.value.tagsString ? imageForm.value.tagsString.split(',').map(tag => tag.trim()) : []
      }
      delete updateData.tagsString

      await apiService.put(`/gallery/${editingImage.value._id}`, updateData)
    } else {
      // Mode création
      if (!imageFile.value) {
        throw new Error('Aucune image sélectionnée')
      }

      const formData = new FormData()
      formData.append('image', imageFile.value)
      formData.append('title', imageForm.value.title)
      formData.append('description', imageForm.value.description || '')
      formData.append('altText', imageForm.value.altText || '')
      formData.append('category', imageForm.value.category || '')
      formData.append('tags', imageForm.value.tagsString || '')
      formData.append('order', imageForm.value.order.toString())
      formData.append('isActive', imageForm.value.isActive.toString())

      await apiService.post('/gallery/upload', formData)
    }

    await loadImages()
    closeDialog()
  } catch (error: any) {
    // Ne pas afficher l'erreur si la requête a été annulée
    if (error.name !== 'AbortError') {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  } finally {
    saving.value = false
  }
}

const deleteImage = async (image: GalleryImage) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'image "${image.title}" ?`)) {
    try {
      await apiService.delete(`/gallery/${image._id}`)
      await loadImages()
    } catch (error: any) {
      // Ne pas afficher l'erreur si la requête a été annulée
      if (error.name !== 'AbortError') {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }
}

const clearFilters = () => {
  search.value = ''
  filters.value.category = null
  filters.value.isActive = '' // Retour à "Toutes"
}

// Les fonctions getCategoryColor, formatFileSize et isPortrait
// sont maintenant dans le composant GalleryImageCard

// Charger les images au montage
onMounted(() => {
  loadImages()
})

// Nettoyer les URLs d'objet et annuler les requêtes au démontage
onUnmounted(() => {
  // Annuler les requêtes en cours
  if (abortController.value) {
    abortController.value.abort()
  }

  // Nettoyer les URLs d'objet
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
  }
})
</script>

<style>
@import '@/assets/gallery-view.css';
</style>
