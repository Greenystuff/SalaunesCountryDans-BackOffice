<template>
  <MainLayout>
    <div>
      <!-- Header -->
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold mb-2">Galerie d'images</h1>
          <p class="text-body-1 text-medium-emphasis">
            Gérez les images de votre galerie avec leurs métadonnées
          </p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">
          Ajouter une image
        </v-btn>
      </div>

      <!-- Filtres -->
      <v-row class="mb-6">
        <v-col cols="12" md="4">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Rechercher une image..."
            variant="outlined" density="compact" clearable hide-details />
        </v-col>
        <v-col cols="12" md="3">
          <v-select v-model="filters.category" :items="categoryOptions" label="Catégorie" variant="outlined"
            density="compact" clearable hide-details />
        </v-col>
        <v-col cols="12" md="3">
          <v-select v-model="filters.isActive" :items="[
            { title: 'Toutes', value: '' },
            { title: 'Actives', value: 'true' },
            { title: 'Inactives', value: 'false' }
          ]" label="Statut" variant="outlined" density="compact" hide-details />
        </v-col>
        <v-col cols="12" md="2">
          <v-btn variant="outlined" @click="clearFilters" prepend-icon="mdi-filter-remove" block>
            Effacer
          </v-btn>
        </v-col>
      </v-row>

      <!-- Grille des images -->
      <v-row v-if="!loading && filteredImages.length > 0">
        <v-col v-for="image in filteredImages" :key="image._id" cols="12" sm="6" md="4" lg="3">
          <v-card class="modern-image-card h-100" :elevation="0" :hover="true">
            <!-- Overlay avec dégradé pour l'image -->
            <div class="image-overlay">
              <v-img :src="image.imageUrl" :alt="image.altText || image.title" height="240" :cover="isPortrait(image)"
                :contain="!isPortrait(image)" class="card-image"
                :class="{ 'portrait-image': isPortrait(image), 'landscape-image': !isPortrait(image) }">
                <template #placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular indeterminate color="white" />
                  </div>
                </template>

                <!-- Overlay dégradé en bas de l'image -->
                <div class="image-gradient-overlay"></div>

                <!-- Badges flottants sur l'image -->
                <div class="floating-badges">
                  <v-chip v-if="image.category" :color="getCategoryColor(image.category)" size="small" variant="flat"
                    class="floating-chip">
                    {{ image.category }}
                  </v-chip>
                  <v-chip :color="image.isActive ? 'success' : 'error'" size="small" variant="flat"
                    class="floating-chip">
                    {{ image.isActive ? 'Active' : 'Inactive' }}
                  </v-chip>
                </div>

                <!-- Actions flottantes -->
                <div class="floating-actions">
                  <v-btn icon="mdi-pencil" size="small" variant="tonal" color="white" class="action-btn"
                    @click="openDialog(image)" />
                  <v-btn icon="mdi-delete" size="small" variant="tonal" color="error" class="action-btn"
                    @click="deleteImage(image)" />
                </div>
              </v-img>
            </div>

            <!-- Contenu sous l'image -->
            <div class="card-content">
              <!-- Section texte (titre + description) -->
              <div class="text-section">
                <h3 class="card-title">
                  {{ image.title }}
                </h3>

                <p v-if="image.description" class="card-description">
                  {{ image.description.length > 200 ? image.description.substring(0, 200) + '...' : image.description }}
                </p>

                <!-- Tags avec design moderne -->
                <div v-if="image.tags && image.tags.length > 0" class="tags-container">
                  <v-chip v-for="tag in image.tags.slice(0, 3)" :key="tag" size="x-small" variant="outlined"
                    class="modern-tag">
                    {{ tag }}
                  </v-chip>
                  <v-chip v-if="image.tags.length > 3" size="x-small" variant="outlined" class="modern-tag">
                    +{{ image.tags.length - 3 }}
                  </v-chip>
                </div>
              </div>

              <!-- Section caractéristiques techniques (en bas) -->
              <div class="tech-section">
                <div class="tech-info">
                  <div v-if="image.width && image.height" class="tech-item">
                    <v-icon :icon="isPortrait(image) ? 'mdi-phone-portrait' : 'mdi-monitor'" size="14"
                      :color="isPortrait(image) ? 'primary' : 'secondary'" />
                    <span>{{ image.width }} × {{ image.height }}</span>
                  </div>
                  <div v-if="image.fileSize" class="tech-item">
                    <v-icon icon="mdi-file" size="14" color="grey" />
                    <span>{{ formatFileSize(image.fileSize) }}</span>
                  </div>
                  <div v-if="image.mimeType" class="tech-item">
                    <v-icon icon="mdi-image" size="14" color="grey" />
                    <span>{{ image.mimeType.split('/')[1]?.toUpperCase() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </v-card>
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
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { apiService } from '@/services/api'

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
  category: '',
  isActive: ''
})

// Contrôleur d'annulation pour les requêtes
const abortController = ref<AbortController | null>(null)

// Formulaire
const imageForm = ref({
  title: '',
  description: '',
  altText: '',
  category: '',
  tagsString: '',
  order: 0,
  isActive: true
})

// État initial pour v-confirm-edit
const initialFormState = ref({
  title: '',
  description: '',
  altText: '',
  category: '',
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
  if (filters.value.isActive !== '') {
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

// Méthodes
const loadImages = async () => {
  try {
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
    if (error.name !== 'AbortError') {
      console.error('Erreur lors du chargement des images:', error)
    }
  } finally {
    loading.value = false
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
    category: '',
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
      formData.append('description', imageForm.value.description)
      formData.append('altText', imageForm.value.altText)
      formData.append('category', imageForm.value.category)
      formData.append('tags', imageForm.value.tagsString)
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
  filters.value.category = ''
  filters.value.isActive = ''
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Événements': 'primary',
    'Cours': 'success',
    'Compétitions': 'warning',
    'Portraits': 'info',
    'Lieux': 'purple',
    'Autres': 'grey'
  }
  return colors[category] || 'grey'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Fonction pour détecter si une image est en portrait
const isPortrait = (image: GalleryImage): boolean => {
  if (image.width && image.height) {
    return image.height > image.width
  }
  // Si les dimensions ne sont pas disponibles, on suppose que c'est en paysage
  // car la plupart des photos sont en paysage
  return false
}

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

<style scoped>
/* Cartes modernes */
.modern-image-card {
  border-radius: 16px !important;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgb(var(--v-theme-surface));
  border: 2px solid rgba(var(--v-theme-on-surface), 0.15);
  box-shadow: 0 2px 8px rgba(var(--v-theme-shadow-key-umbra-opacity), var(--v-theme-shadow-key-umbra-opacity), var(--v-theme-shadow-key-umbra-opacity), 0.1);
}

.modern-image-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(var(--v-theme-shadow-key-umbra-opacity), var(--v-theme-shadow-key-umbra-opacity), var(--v-theme-shadow-key-umbra-opacity), 0.3);
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
}

/* Container de l'image */
.image-overlay {
  position: relative;
  overflow: hidden;
}

.card-image {
  border-radius: 16px 16px 0 0 !important;
  transition: transform 0.3s ease;
}

.modern-image-card:hover .card-image {
  transform: scale(1.05);
}

/* Overlay dégradé sur l'image */
.image-gradient-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
  pointer-events: none;
}

/* Badges flottants */
.floating-badges {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
  z-index: 2;
}

.floating-chip {
  backdrop-filter: blur(10px);
  background: rgb(var(--v-theme-surface)) !important;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.2);
  box-shadow: 0 4px 16px rgba(var(--v-theme-shadow-key-umbra-opacity), var(--v-theme-shadow-key-umbra-opacity), var(--v-theme-shadow-key-umbra-opacity), 0.25);
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface)) !important;
}

/* Actions flottantes */
.floating-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 2;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
}

.modern-image-card:hover .floating-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  backdrop-filter: blur(10px);
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgb(var(--v-theme-outline));
  box-shadow: 0 4px 16px rgba(var(--v-theme-shadow-key-umbra-opacity), var(--v-theme-shadow-key-umbra-opacity), var(--v-theme-shadow-key-umbra-opacity), 0.25);
  color: rgb(var(--v-theme-on-surface)) !important;
}

/* Contenu de la carte */
.card-content {
  padding: 20px;
  background: rgb(var(--v-theme-surface));
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* Section texte (titre + description) */
.text-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.3;
}

.card-description {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Tags modernes */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.modern-tag {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.2) !important;
  color: rgb(var(--v-theme-primary)) !important;
  backdrop-filter: blur(5px);
}

/* Section caractéristiques techniques */
.tech-section {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  padding-top: 12px;
}

/* Informations techniques */
.tech-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tech-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Gestion de l'orientation des images */
.portrait-image {
  object-fit: cover;
}

.landscape-image {
  object-fit: contain;
}

/* Espacement du formulaire */
.form-spacing .v-field {
  margin-bottom: 16px;
}

.form-spacing .v-field:last-child {
  margin-bottom: 0;
}

/* Responsive */
@media (max-width: 600px) {
  .modern-image-card {
    border-radius: 12px !important;
  }

  .card-image {
    border-radius: 12px 16px 0 0 !important;
  }

  .floating-badges,
  .floating-actions {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
