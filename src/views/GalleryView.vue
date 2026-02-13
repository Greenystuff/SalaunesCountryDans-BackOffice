<template>
  <div class="gallery-container">
    <VCard class="main-card">
      <!-- HEADER -->
      <div class="header-title">
        <div class="header-content">
          <h1 class="main-title">Galerie Médias</h1>
          <p class="subtitle">Gérez les photos et vidéos du club.</p>
        </div>
        <div class="header-actions">
          <VBtn v-if="canCreate" color="primary" prepend-icon="mdi-plus" @click="openDialog()">
            Ajouter des médias
          </VBtn>
        </div>
      </div>

      <VDivider />

      <!-- BARRE D'OUTILS / FILTRES -->
      <div class="toolbar">
        <VTextField
          v-model="search"
          placeholder="Rechercher un média..."
          variant="solo"
          density="comfortable"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          class="toolbar-item"
        />

        <!-- NOUVEAU: Filtre type média -->
        <VSelect
          v-model="filters.mediaType"
          :items="mediaTypeOptions"
          label="Type"
          variant="solo"
          hide-details
          class="toolbar-item"
        />

        <VSelect
          v-model="filters.category"
          :items="categoryOptions"
          label="Catégorie"
          variant="solo"
          hide-details
          clearable
          class="toolbar-item"
        />

        <VSelect
          v-model="filters.isActive"
          :items="[
            { title: 'Tous', value: '' },
            { title: 'Actifs', value: 'true' },
            { title: 'Inactifs', value: 'false' },
          ]"
          label="Statut"
          variant="solo"
          hide-details
          class="toolbar-item"
        />

        <VBtn class="toolbar-item" variant="tonal" @click="clearFilters"> Réinitialiser </VBtn>
      </div>

      <!-- CONTENU PRINCIPAL -->
      <div class="gallery-content">
        <!-- Grille des médias -->
        <v-row v-if="!loading && filteredMedia.length > 0">
          <v-col v-for="item in filteredMedia" :key="item._id" cols="12" sm="6" md="4" lg="3">
            <!-- Carte Image -->
            <GalleryImageCard
              v-if="item.mediaType === 'image'"
              :image="item as GalleryImage"
              :can-edit="canEdit"
              :can-delete="canDelete"
              @edit="() => openDialog(item)"
              @delete="() => deleteMedia(item)"
            />

            <!-- Carte Vidéo -->
            <GalleryVideoCardBO
              v-else-if="item.mediaType === 'video'"
              :video="item as GalleryVideo"
              :can-edit="canEdit"
              :can-delete="canDelete"
              @edit="() => openDialog(item)"
              @delete="() => deleteMedia(item)"
              @retry="retryTranscoding"
            />
          </v-col>
        </v-row>

        <!-- Message si aucun média -->
        <v-card v-else-if="!loading" class="text-center pa-8">
          <v-icon icon="mdi-multimedia" size="48" color="grey" class="mb-4" />
          <h2 class="text-h5 font-weight-bold mb-2">Aucun média trouvé</h2>
          <p class="text-body-1 text-medium-emphasis">
            Aucun média ne correspond à vos critères de recherche.
          </p>
        </v-card>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
          <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
          <p class="text-h6">Chargement des médias...</p>
        </div>
      </div>

      <!-- New MediaUploadModal -->
      <MediaUploadModal
        v-model="dialog"
        :editing-media="editingMedia"
        :categories="['Événements', 'Cours', 'Spectacles', 'Vie du club', 'Autre']"
        @save="handleModalSave"
        @close="handleModalClose"
      />
    </VCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { apiService } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'
import { useViewPermissions } from '@/composables/useViewPermissions'
import { globalWebSocket } from '@/composables/useWebSocket'
import GalleryImageCard from '@/components/GalleryImageCard.vue'
import GalleryVideoCardBO from '@/components/GalleryVideoCardBO.vue'
import MediaUploadModal from '@/components/media-upload/MediaUploadModal.vue'

// Types étendus pour supporter images ET vidéos
interface BaseMediaItem {
  _id: string
  title: string
  description?: string
  altText?: string
  category?: string
  tags?: string[]
  width?: number
  height?: number
  fileSize?: number
  mimeType?: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
  variants?: any[] // Champ commun pour rétrocompatibilité avec l'API
}

interface GalleryImage extends BaseMediaItem {
  mediaType: 'image'
  imageFile: string
  imageUrl?: string
  originalImageUrl?: string
}

interface GalleryVideo extends BaseMediaItem {
  mediaType: 'video'
  videoFile?: string
  videoUrl?: string
  thumbnailFile?: string
  thumbnailUrl?: string
  duration?: number
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
  processingProgress?: number
  processingError?: string
  variants?: any[]
}

type GalleryMediaItem = GalleryImage | GalleryVideo

// État
const { showSuccess, showError, showWarning } = useNotifications()
const { canCreate, canEdit, canDelete } = useViewPermissions('gallery')

const loading = ref(false)
const dialog = ref(false)
const editingMedia = ref<GalleryMediaItem | null>(null)

// Médias
const mediaItems = ref<GalleryMediaItem[]>([])

// Filtres
const search = ref('')
const filters = ref({
  mediaType: 'all',
  category: null,
  isActive: '',
})

// Contrôleur d'annulation
const abortController = ref<AbortController | null>(null)

// Options
const mediaTypeOptions = [
  { title: 'Tous', value: 'all' },
  { title: 'Images', value: 'image' },
  { title: 'Vidéos', value: 'video' },
]

const categoryOptions = computed(() => {
  const categories = new Set<string>()
  mediaItems.value.forEach((item) => {
    if (item.category) categories.add(item.category)
  })
  return Array.from(categories).sort()
})

// Computed
const filteredMedia = computed(() => {
  console.log('[DEBUG] === FILTRAGE START ===')
  console.log('[DEBUG] mediaItems.value length:', mediaItems.value.length, mediaItems.value)
  console.log('[DEBUG] filters:', filters.value)
  console.log('[DEBUG] search:', search.value)

  let filtered = mediaItems.value

  // Filtre par type
  if (filters.value.mediaType && filters.value.mediaType !== 'all') {
    console.log('[DEBUG] Applying mediaType filter:', filters.value.mediaType)
    filtered = filtered.filter((item) => item.mediaType === filters.value.mediaType)
    console.log('[DEBUG] After mediaType filter, length:', filtered.length)
  }

  // Filtre par catégorie
  if (filters.value.category) {
    console.log('[DEBUG] Applying category filter:', filters.value.category)
    filtered = filtered.filter((item) => item.category === filters.value.category)
    console.log('[DEBUG] After category filter, length:', filtered.length)
  }

  // Filtre par statut
  if (filters.value.isActive !== '') {
    const isActive = filters.value.isActive === 'true'
    console.log('[DEBUG] Applying isActive filter:', isActive)
    filtered = filtered.filter((item) => item.isActive === isActive)
    console.log('[DEBUG] After isActive filter, length:', filtered.length)
  }

  // Recherche textuelle
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    console.log('[DEBUG] Applying search filter:', searchLower)
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(searchLower)),
    )
    console.log('[DEBUG] After search filter, length:', filtered.length)
  }

  console.log('[DEBUG] FINAL filteredMedia length:', filtered.length, filtered)
  console.log('[DEBUG] === FILTRAGE END ===')
  return filtered
})


// Méthodes
const loadMedia = async () => {
  try {
    loading.value = true

    if (abortController.value) {
      abortController.value.abort()
    }
    abortController.value = new AbortController()

    const response = await apiService.get<{
      data: GalleryMediaItem[]
      total: number
    }>('/gallery', {
      signal: abortController.value.signal,
    })

    console.log('[DEBUG] === API LOAD START ===')
    console.log('[DEBUG] Full response:', response)

    if (response.success && response.data) {
      console.log('[DEBUG] response.data (should be array):', response.data)
      console.log('[DEBUG] Is array?', Array.isArray(response.data))
      mediaItems.value = response.data as any
      console.log('[DEBUG] mediaItems.value after assignment:', mediaItems.value)
      console.log('[DEBUG] === API LOAD END ===')
    } else {
      console.error('[DEBUG] API response.success is false or no data')
    }
  } catch (error: any) {
    if (error.name !== 'CanceledError') {
      console.error('Erreur lors du chargement:', error)
      showError('Erreur lors du chargement des médias')
    }
  } finally {
    loading.value = false
  }
}

const openDialog = (item?: GalleryMediaItem) => {
  editingMedia.value = item || null
  dialog.value = true
}

// Modal handlers
const handleModalSave = async (data: any) => {
  try {
    if (data.isEdit) {
      // Handle edit mode
      await apiService.put(`/gallery/${data.id}`, data.data)
      showSuccess('Média modifié avec succès')
      await loadMedia()
      dialog.value = false
      editingMedia.value = null
    } else if (data.success) {
      // Handle successful upload from modal
      await loadMedia()
      dialog.value = false
      editingMedia.value = null
    }
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde:', error)
    if (error.name !== 'CanceledError') {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la sauvegarde du média'
      showError(errorMessage)
    }
  }
}

const handleModalClose = () => {
  dialog.value = false
  editingMedia.value = null
}

const deleteMedia = async (item: GalleryMediaItem) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer "${item.title}" ?`)) {
    try {
      await apiService.delete(`/gallery/${item._id}`)
      await loadMedia()
      showSuccess(`"${item.title}" supprimé avec succès`)
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error)
      if (error.name !== 'CanceledError') {
        showError('Erreur lors de la suppression')
      }
    }
  }
}

const retryTranscoding = async (video: GalleryVideo) => {
  try {
    await apiService.post(`/gallery/${video._id}/retry`)
    showSuccess('Transcoding relancé')
    await loadMedia()
  } catch (error: any) {
    console.error('Erreur retry:', error)
    if (error.response?.data?.message) {
      showError(error.response.data.message)
    } else {
      showError('Erreur lors du retry')
    }
  }
}

const clearFilters = () => {
  search.value = ''
  filters.value.mediaType = 'all'
  filters.value.category = null
  filters.value.isActive = ''
}

// WebSocket handler for video processing updates
const handleVideoProcessingUpdate = async (data: any) => {
  const { entity, action, data: updateData } = data

  if (entity === 'video-processing' && action === 'update') {
    const { videoId, status, progress, variants } = updateData

    // Find and update the video in mediaItems
    const videoIndex = mediaItems.value.findIndex((item) => item._id === videoId)
    if (videoIndex !== -1) {
      const video = mediaItems.value[videoIndex] as GalleryVideo

      console.log('[DEBUG] Updating video processing:', { videoId, status, progress })

      // Update the video's processing status and progress
      video.processingStatus = status
      video.processingProgress = progress

      // If completed, reload all media to get the updated thumbnails and URLs
      if (status === 'completed') {
        console.log('[DEBUG] Video processing completed, reloading media to get thumbnails')
        await loadMedia()
      } else {
        // For progress updates, just update the progress without reloading
        mediaItems.value[videoIndex] = { ...video }
      }
    }
  }
}

// Lifecycle
onMounted(() => {
  loadMedia()

  // Subscribe to WebSocket updates for video processing
  globalWebSocket.on('dataUpdate', handleVideoProcessingUpdate)
})

onUnmounted(() => {
  if (abortController.value) {
    abortController.value.abort()
  }

  // Unsubscribe from WebSocket updates
  globalWebSocket.off('dataUpdate', handleVideoProcessingUpdate)
})
</script>

<style>
@import '@/assets/gallery-view.css';

/* Styles supplémentaires pour la grille étendue */
.toolbar {
  grid-template-columns: 1fr 0.7fr 0.7fr 0.7fr auto !important;
}

.video-preview {
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}
</style>
