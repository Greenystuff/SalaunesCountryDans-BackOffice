<template>
  <div class="media-upload-zone">
    <v-card flat class="upload-card">
      <v-card-text class="pa-3">
        <h3 class="text-subtitle-1 font-weight-medium text-primary mb-2">
          {{ mediaType === 'image' ? 'Charger une image' : 'Charger une vidéo' }}
        </h3>

        <!-- VFileUpload with drag & drop -->
        <v-file-upload
          v-if="!preview"
          :model-value="file ? [file] : []"
          @update:model-value="handleFileChange"
          :accept="accept"
          :multiple="false"
          :disabled="disabled || loading"
          class="upload-zone"
        >
          <template #default="{ isDragging, isHovering }">
            <div
              class="upload-dropzone"
              :class="{
                'dropzone-dragging': isDragging,
                'dropzone-hovering': isHovering,
                'dropzone-disabled': disabled || loading,
                'dropzone-error': error,
              }"
            >
              <div class="dropzone-content">
                <!-- Icon -->
                <v-icon
                  :icon="
                    isDragging
                      ? 'mdi-file-download'
                      : mediaType === 'image'
                        ? 'mdi-image-plus'
                        : 'mdi-video-plus'
                  "
                  :class="{
                    'icon-pulse': isDragging,
                    'icon-error': error,
                  }"
                  size="48"
                  :color="error ? 'error' : isDragging ? 'primary' : 'grey-lighten-1'"
                />

                <!-- Text -->
                <div class="dropzone-text mt-3">
                  <p class="text-h6 mb-2 font-weight-medium">
                    {{ isDragging ? 'Déposez votre fichier ici' : 'Glissez-déposez votre fichier' }}
                  </p>
                  <p class="text-body-2 text-medium-emphasis mb-3">
                    ou cliquez pour parcourir
                  </p>
                  <v-chip variant="tonal" size="small" color="grey">
                    {{ acceptText }}
                  </v-chip>
                  <v-chip variant="tonal" size="small" color="grey" class="ml-2">
                    {{ maxSizeText }}
                  </v-chip>
                </div>

                <!-- Error message -->
                <v-expand-transition>
                  <v-alert
                    v-if="error"
                    type="error"
                    variant="tonal"
                    density="compact"
                    class="mt-4 error-alert"
                  >
                    {{ error }}
                  </v-alert>
                </v-expand-transition>

                <!-- Loading overlay -->
                <v-overlay
                  v-if="loading"
                  contained
                  persistent
                  class="align-center justify-center"
                >
                  <v-progress-circular indeterminate color="primary" size="48" />
                </v-overlay>
              </div>
            </div>
          </template>
        </v-file-upload>

        <!-- Preview -->
        <v-expand-transition>
          <div v-if="preview" class="preview-container">
            <!-- Image preview -->
            <v-card v-if="mediaType === 'image'" class="preview-card">
              <v-img
                :src="preview"
                :alt="file?.name || 'Preview'"
                aspect-ratio="16/9"
                cover
                class="preview-image"
              >
                <template #placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-progress-circular indeterminate color="grey-lighten-5" />
                  </v-row>
                </template>
              </v-img>

              <v-card-text class="pa-3">
                <div class="d-flex align-center justify-space-between">
                  <div class="flex-grow-1 text-truncate">
                    <p class="text-subtitle-2 font-weight-medium mb-1 text-truncate">
                      {{ file?.name }}
                    </p>
                    <p class="text-caption text-medium-emphasis mb-0">
                      {{ formatFileSize(file?.size) }}
                    </p>
                  </div>
                  <v-btn
                    icon="mdi-close-circle"
                    variant="text"
                    color="error"
                    size="small"
                    @click="clearFile"
                    :disabled="disabled"
                  />
                </div>
              </v-card-text>
            </v-card>

            <!-- Video preview -->
            <v-card v-else class="preview-card">
              <video
                :src="preview"
                controls
                class="preview-video"
                @loadedmetadata="handleVideoMetadata"
              >
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>

              <v-card-text class="pa-3">
                <div class="d-flex align-center justify-space-between">
                  <div class="flex-grow-1 text-truncate">
                    <p class="text-subtitle-2 font-weight-medium mb-1 text-truncate">
                      {{ file?.name }}
                    </p>
                    <div class="d-flex gap-2 flex-wrap">
                      <v-chip size="x-small" variant="tonal" color="primary">
                        {{ formatFileSize(file?.size) }}
                      </v-chip>
                      <v-chip
                        v-if="videoMetadata?.duration"
                        size="x-small"
                        variant="tonal"
                        color="primary"
                      >
                        <v-icon start size="x-small">mdi-clock-outline</v-icon>
                        {{ formatDuration(videoMetadata.duration) }}
                      </v-chip>
                    </div>
                  </div>
                  <v-btn
                    icon="mdi-close-circle"
                    variant="text"
                    color="error"
                    size="small"
                    @click="clearFile"
                    :disabled="disabled"
                  />
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-expand-transition>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: File | null
  mediaType: 'image' | 'video'
  preview: string | null
  disabled?: boolean
  loading?: boolean
  error?: string | null
  maxSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
  error: null,
  maxSize: 0,
})

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
  'update:preview': [preview: string | null]
  'file-change': [file: File | null]
  'video-metadata': [metadata: { duration: number; size: number }]
}>()

// State
const file = ref<File | null>(props.modelValue)
const videoMetadata = ref<{ duration: number; size: number } | null>(null)

// Computed
const accept = computed(() => {
  return props.mediaType === 'image'
    ? 'image/jpeg,image/jpg,image/png,image/webp,image/gif'
    : 'video/mp4,video/webm,video/quicktime,video/x-msvideo'
})

const acceptText = computed(() => {
  return props.mediaType === 'image'
    ? 'JPEG, PNG, WebP, GIF'
    : 'MP4, WebM, MOV, AVI'
})

const maxSizeText = computed(() => {
  const size = props.maxSize || (props.mediaType === 'image' ? 10 * 1024 * 1024 : 1024 * 1024 * 1024)
  const mb = size / (1024 * 1024)
  return mb >= 1024 ? `Max ${(mb / 1024).toFixed(0)} GB` : `Max ${mb.toFixed(0)} MB`
})

// Methods
const handleFileChange = (files: File[]) => {
  const newFile = files && files.length > 0 ? files[0] : null
  file.value = newFile
  emit('update:modelValue', newFile)
  emit('file-change', newFile)

  if (newFile && props.mediaType === 'image') {
    const url = URL.createObjectURL(newFile)
    emit('update:preview', url)
  } else if (newFile && props.mediaType === 'video') {
    const url = URL.createObjectURL(newFile)
    emit('update:preview', url)
  }
}

const clearFile = () => {
  if (props.preview) {
    URL.revokeObjectURL(props.preview)
  }
  file.value = null
  videoMetadata.value = null
  emit('update:modelValue', null)
  emit('update:preview', null)
  emit('file-change', null)
}

const handleVideoMetadata = (event: Event) => {
  const videoElement = event.target as HTMLVideoElement
  if (file.value) {
    const metadata = {
      duration: videoElement.duration,
      size: file.value.size,
    }
    videoMetadata.value = metadata
    emit('video-metadata', metadata)
  }
}

// Format utilities
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    file.value = newValue
  },
)
</script>

<style scoped>
.media-upload-zone {
  width: 100%;
}

.upload-card {
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.upload-card:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
}

.upload-zone {
  width: 100%;
}

.upload-dropzone {
  position: relative;
  min-height: 180px;
  border: 2px dashed rgb(var(--v-theme-outline));
  border-radius: 12px;
  background-color: rgb(var(--v-theme-surface));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
}

.upload-dropzone:hover:not(.dropzone-disabled) {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.02);
  transform: scale(1.01);
}

.dropzone-dragging {
  border-color: rgb(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
  border-width: 3px;
  transform: scale(1.02);
}

.dropzone-hovering:not(.dropzone-dragging) {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.dropzone-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dropzone-error {
  border-color: rgb(var(--v-theme-error)) !important;
  background-color: rgba(var(--v-theme-error), 0.02);
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  min-height: 180px;
}

.dropzone-text {
  text-align: center;
}

.preview-container {
  width: 100%;
  animation: scaleIn 0.3s ease-out;
}

.preview-card {
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-image {
  border-radius: 12px 12px 0 0;
}

.preview-video {
  width: 100%;
  max-height: 240px;
  background-color: #000;
  display: block;
  object-fit: contain;
}

.error-alert {
  max-width: 400px;
  border-radius: 8px;
}

/* Icon animations */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.icon-pulse {
  animation: pulse 1s ease-in-out infinite;
}

.icon-error {
  animation: shake 0.5s ease-in-out;
}
</style>
