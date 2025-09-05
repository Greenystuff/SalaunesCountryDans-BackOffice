<template>
  <v-card class="gallery-image-card h-100" :elevation="0" :hover="true">
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
          <v-chip :color="image.isActive ? 'success' : 'error'" size="small" variant="flat" class="floating-chip">
            {{ image.isActive ? 'Active' : 'Inactive' }}
          </v-chip>
        </div>

        <!-- Actions flottantes -->
        <div class="floating-actions">
          <v-btn v-if="canEdit" icon="mdi-pencil" size="small" variant="tonal" color="white" class="action-btn"
            @click="$emit('edit', image)" />
          <v-btn v-if="canDelete" icon="mdi-delete" size="small" variant="tonal" color="error" class="action-btn"
            @click="$emit('delete', image)" />
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
          {{ image.description.length > 200 ? image.description.substring(0, 200) + '...' :
            image.description }}
        </p>

        <!-- Tags avec design moderne -->
        <div v-if="image.tags && image.tags.length > 0" class="tags-container">
          <v-chip v-for="tag in image.tags.slice(0, 3)" :key="tag" size="x-small" variant="outlined" class="modern-tag">
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
</template>

<script setup lang="ts">
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

interface Props {
  image: GalleryImage
  canEdit?: boolean
  canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
  canDelete: true
})

defineEmits<{
  edit: [image: GalleryImage]
  delete: [image: GalleryImage]
}>()

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
</script>

<style>
@import '@/assets/gallery-image-card.css';
</style>
