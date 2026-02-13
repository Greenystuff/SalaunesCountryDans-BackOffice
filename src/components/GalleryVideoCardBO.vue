<template>
  <v-card class="gallery-video-card h-100" :elevation="0" :hover="true" :class="{ 'processing': isProcessing }">
    <!-- Overlay avec thumbnail vidéo -->
    <div class="video-overlay">
      <v-img
        :src="video.thumbnailUrl || '/placeholder-video.jpg'"
        :alt="video.altText || video.title"
        height="240"
        contain
        class="card-video"
        :class="{ 'portrait-video': isPortrait(video), 'landscape-video': !isPortrait(video) }"
      >
        <template #placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular indeterminate color="white" />
          </div>
        </template>

        <!-- Overlay dégradé en bas -->
        <div class="video-gradient-overlay"></div>

        <!-- Play icon overlay -->
        <div v-if="!isProcessing && video.processingStatus !== 'failed'" class="play-icon-overlay">
          <v-icon icon="mdi-play-circle" size="56" color="white" />
        </div>

        <!-- Badges flottants sur la vidéo -->
        <div class="floating-badges">
          <v-chip v-if="video.category" :color="getCategoryColor(video.category)" size="small" variant="flat" class="floating-chip">
            {{ video.category }}
          </v-chip>
          <v-chip
            :color="video.isActive ? 'success' : 'error'"
            size="small"
            variant="flat"
            class="floating-chip"
          >
            {{ video.isActive ? 'Active' : 'Inactive' }}
          </v-chip>
        </div>

        <!-- Badge durée -->
        <div v-if="video.duration && !isProcessing" class="duration-badge">
          <v-chip color="rgba(0, 0, 0, 0.9)" size="small" class="text-white px-3">
            <v-icon start size="small">mdi-clock-outline</v-icon>
            {{ formatDuration(video.duration) }}
          </v-chip>
        </div>

        <!-- Actions flottantes -->
        <div class="floating-actions">
          <v-btn
            v-if="canEdit"
            icon="mdi-pencil"
            size="small"
            variant="tonal"
            color="white"
            class="action-btn"
            @click="$emit('edit', video)"
          />
          <v-btn
            v-if="canDelete"
            icon="mdi-delete"
            size="small"
            variant="tonal"
            color="error"
            class="action-btn"
            @click="$emit('delete', video)"
          />
        </div>

        <!-- Overlay de transcoding -->
        <div v-if="isProcessing" class="transcoding-overlay">
          <div class="transcoding-content">
            <v-progress-circular
              :model-value="video.processingProgress || 0"
              :size="80"
              :width="8"
              color="primary"
            >
              <span class="text-h6 font-weight-bold">
                {{ video.processingProgress || 0 }}%
              </span>
            </v-progress-circular>
            <p class="text-subtitle-2 mt-4 mb-0 font-weight-medium">
              {{ getProcessingStatusLabel(video.processingStatus) }}
            </p>
          </div>
        </div>

        <!-- Overlay erreur -->
        <div v-else-if="video.processingStatus === 'failed'" class="error-overlay">
          <div class="error-content">
            <v-icon icon="mdi-alert-circle" size="48" color="error" class="mb-2" />
            <p class="text-body-2 mb-2 font-weight-medium">Échec du transcoding</p>
            <p class="text-caption text-medium-emphasis mb-3">
              {{ video.processingError || 'Erreur inconnue' }}
            </p>
            <v-btn
              v-if="canEdit"
              size="small"
              color="error"
              variant="tonal"
              prepend-icon="mdi-refresh"
              @click.stop="$emit('retry', video)"
            >
              Réessayer
            </v-btn>
          </div>
        </div>
      </v-img>
    </div>

    <!-- Contenu sous la vidéo -->
    <div class="card-content">
      <!-- Section texte (titre + description) -->
      <div class="text-section">
        <h3 class="card-title">
          {{ video.title }}
        </h3>

        <p v-if="video.description" class="card-description">
          {{ video.description.length > 200 ? video.description.substring(0, 200) + '...' : video.description }}
        </p>

        <!-- Tags avec design moderne -->
        <div v-if="video.tags && video.tags.length > 0" class="tags-container">
          <v-chip v-for="tag in video.tags.slice(0, 3)" :key="tag" size="x-small" variant="outlined" class="modern-tag">
            {{ tag }}
          </v-chip>
          <v-chip v-if="video.tags.length > 3" size="x-small" variant="outlined" class="modern-tag">
            +{{ video.tags.length - 3 }}
          </v-chip>
        </div>

        <!-- Statut et qualités vidéo -->
        <div v-if="video.variants && video.variants.length > 0" class="qualities-container">
          <span class="qualities-label">Qualités :</span>
          <div class="qualities-chips">
            <v-chip
              v-for="variant in video.variants"
              :key="variant.resolution"
              size="x-small"
              :color="variant.status === 'completed' ? 'success' : 'grey'"
              :variant="variant.status === 'completed' ? 'flat' : 'outlined'"
              class="quality-chip"
            >
              {{ variant.resolution }}
            </v-chip>
          </div>
        </div>
      </div>

      <!-- Section caractéristiques techniques (en bas) -->
      <div class="tech-section">
        <div class="tech-info">
          <div v-if="video.width && video.height" class="tech-item">
            <v-icon
              :icon="isPortrait(video) ? 'mdi-phone-portrait' : 'mdi-monitor'"
              size="14"
              :color="isPortrait(video) ? 'primary' : 'secondary'"
            />
            <span>{{ video.width }} × {{ video.height }}</span>
          </div>
          <div v-if="video.fileSize" class="tech-item">
            <v-icon icon="mdi-file" size="14" color="grey" />
            <span>{{ formatFileSize(video.fileSize) }}</span>
          </div>
          <div class="tech-item">
            <v-icon icon="mdi-video" size="14" color="grey" />
            <span>{{ getProcessingStatusLabel(video.processingStatus) }}</span>
            <v-icon
              :icon="getProcessingStatusIcon(video.processingStatus)"
              size="14"
              :color="getProcessingStatusColor(video.processingStatus)"
            />
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface VideoVariant {
  resolution: '480p' | '720p' | '1080p'
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

interface GalleryVideo {
  _id: string
  mediaType: 'video'
  title: string
  description?: string
  altText?: string
  category?: string
  tags?: string[]
  videoFile?: string
  videoUrl?: string
  thumbnailFile?: string
  thumbnailUrl?: string
  duration?: number
  width?: number
  height?: number
  fileSize?: number
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
  processingProgress?: number
  processingError?: string
  variants?: VideoVariant[]
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

interface Props {
  video: GalleryVideo
  canEdit?: boolean
  canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
  canDelete: true,
})

defineEmits<{
  edit: [video: GalleryVideo]
  delete: [video: GalleryVideo]
  retry: [video: GalleryVideo]
}>()

// Computed
const isProcessing = computed(() => {
  const status = props.video.processingStatus
  return status === 'pending' || status === 'processing'
})

// Utilities
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    Événements: 'primary',
    Cours: 'success',
    Spectacles: 'warning',
    'Vie du club': 'info',
    Autre: 'grey',
  }
  return colors[category] || 'grey'
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`
}

const getProcessingStatusLabel = (status?: string): string => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    processing: 'Traitement',
    completed: 'Terminé',
    failed: 'Échec',
    partial: 'Partiel',
  }
  return labels[status || 'pending'] || status || ''
}

const getProcessingStatusColor = (status?: string): string => {
  const colors: Record<string, string> = {
    pending: 'grey',
    processing: 'primary',
    completed: 'success',
    failed: 'error',
    partial: 'warning',
  }
  return colors[status || 'pending'] || 'grey'
}

const getProcessingStatusIcon = (status?: string): string => {
  const icons: Record<string, string> = {
    pending: 'mdi-clock-outline',
    processing: 'mdi-cog',
    completed: 'mdi-check-circle',
    failed: 'mdi-alert-circle',
    partial: 'mdi-alert',
  }
  return icons[status || 'pending'] || 'mdi-help-circle'
}

// Fonction pour détecter si une vidéo est en portrait
const isPortrait = (video: GalleryVideo): boolean => {
  if (video.width && video.height) {
    return video.height > video.width
  }
  return false
}
</script>

<style>
@import '@/assets/gallery-video-card.css';
</style>
