<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="1200px"
    persistent
    scrollable
    :fullscreen="$vuetify.display.mobile"
  >
    <v-card class="upload-modal-card">
      <!-- Header -->
      <v-card-title class="modal-header pa-4 d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon
            :icon="mediaType === 'image' ? 'mdi-image-multiple' : 'mdi-video-box'"
            color="primary"
            size="32"
            class="mr-3"
          />
          <div>
            <h2 class="text-h5 font-weight-bold">
              {{ editingMedia ? 'Modifier' : 'Ajouter' }} un média
            </h2>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ editingMedia ? 'Modifiez les informations du média' : 'Téléversez une nouvelle image ou vidéo' }}
            </p>
          </div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="handleClose"
          :disabled="saving"
        />
      </v-card-title>

      <v-divider />

      <!-- Content -->
      <v-card-text class="pa-3 modal-content">
        <v-container fluid class="pa-2">
          <!-- Step 1: Media Type Selection (only in creation mode) -->
          <v-row v-if="!editingMedia">
            <v-col cols="12">
              <MediaTypeSelector
                v-model="mediaType"
                :disabled="saving || !!file"
              />
            </v-col>
          </v-row>

          <!-- Step 2: Upload Zone -->
          <v-row v-if="!editingMedia">
            <v-col cols="12">
              <MediaUploadZone
                v-model="file"
                v-model:preview="preview"
                :media-type="mediaType"
                :disabled="saving"
                :loading="uploadProgress.active"
                :error="uploadError"
                :max-size="mediaType === 'image' ? IMAGE_MAX_SIZE : VIDEO_MAX_SIZE"
                @file-change="handleFileChange"
                @video-metadata="handleVideoMetadata"
              />
            </v-col>
          </v-row>

          <!-- Upload Progress (for videos) -->
          <v-expand-transition>
            <v-row v-if="uploadProgress.active && mediaType === 'video'">
              <v-col cols="12">
                <v-card flat class="progress-card pa-4">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <div>
                      <p class="text-subtitle-2 font-weight-medium mb-1">
                        Upload en cours...
                      </p>
                      <p class="text-caption text-medium-emphasis mb-0">
                        {{ formatFileSize(uploadProgress.loaded) }} / {{ formatFileSize(uploadProgress.total) }}
                        • {{ uploadSpeedFormatted }}
                      </p>
                    </div>
                    <v-chip color="primary" variant="flat" size="small">
                      {{ uploadProgress.percentage }}%
                    </v-chip>
                  </div>
                  <v-progress-linear
                    :model-value="uploadProgress.percentage"
                    color="primary"
                    height="8"
                    rounded
                    striped
                    stream
                  />
                </v-card>
              </v-col>
            </v-row>
          </v-expand-transition>

          <!-- Step 3: Metadata Form -->
          <v-row class="mt-2">
            <v-col cols="12">
              <MediaMetadataForm
                ref="metadataFormRef"
                v-model="mediaForm"
                :rules="validationRules"
                :disabled="saving"
                :categories="categories"
                @update:valid="isFormValid = $event"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-divider />

      <!-- Actions -->
      <v-card-actions class="pa-4 d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-2">
          <v-chip
            v-if="file"
            color="success"
            variant="tonal"
            size="small"
            prepend-icon="mdi-check-circle"
          >
            Fichier sélectionné
          </v-chip>
          <v-chip
            v-if="isFormValid"
            color="success"
            variant="tonal"
            size="small"
            prepend-icon="mdi-check-circle"
          >
            Formulaire valide
          </v-chip>
        </div>

        <div class="d-flex gap-2">
          <v-btn
            variant="outlined"
            @click="handleClose"
            :disabled="saving || uploadProgress.active"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="isSaveDisabled"
            @click="handleSave"
          >
            <v-icon start>
              {{ editingMedia ? 'mdi-content-save' : 'mdi-upload' }}
            </v-icon>
            {{ editingMedia ? 'Enregistrer' : 'Envoyer' }}
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useMediaUpload } from '@/composables/useMediaUpload'
import { useMediaValidation } from '@/composables/useMediaValidation'
import MediaTypeSelector from './MediaTypeSelector.vue'
import MediaUploadZone from './MediaUploadZone.vue'
import MediaMetadataForm from './MediaMetadataForm.vue'
import type { MediaForm } from './MediaMetadataForm.vue'

interface Props {
  modelValue: boolean
  editingMedia?: any | null
  categories?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  editingMedia: null,
  categories: () => ['Événements', 'Cours', 'Spectacles', 'Vie du club', 'Autre'],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [data: any]
  'close': []
}>()

// State
const mediaType = ref<'image' | 'video'>('image')
const file = ref<File | null>(null)
const preview = ref<string | null>(null)
const uploadError = ref<string | null>(null)
const isFormValid = ref(false)
const metadataFormRef = ref<any>(null)

// Initial form state
const initialFormState: MediaForm = {
  title: '',
  description: '',
  altText: '',
  category: null,
  tagsString: '',
  order: 0,
  isActive: true,
}

const mediaForm = ref<MediaForm>({ ...initialFormState })

// Composables
const isEditing = computed(() => !!props.editingMedia)

const {
  uploadProgress,
  saving,
  hasFile,
  uploadSpeedFormatted,
  uploadMedia,
  resetUploadState,
  formatFileSize,
  formatDuration,
  IMAGE_MAX_SIZE,
  VIDEO_MAX_SIZE,
} = useMediaUpload(
  (message) => emit('save', { success: true, message }),
  (message) => {
    uploadError.value = message
  },
)

const { validationRules } = useMediaValidation(mediaType, isEditing)

// Computed
const isSaveDisabled = computed(() => {
  if (props.editingMedia) {
    // En mode édition, juste vérifier que le formulaire est valide
    return !isFormValid.value || saving.value
  } else {
    // En mode création, vérifier qu'il y a un fichier ET que le formulaire est valide
    return !file.value || !isFormValid.value || saving.value || uploadProgress.value.active
  }
})

// Methods
const handleFileChange = (newFile: File | null) => {
  uploadError.value = null
  file.value = newFile
}

const handleVideoMetadata = (metadata: { duration: number; size: number }) => {
  // Optionally do something with video metadata
  console.log('Video metadata:', metadata)
}

const handleSave = async () => {
  try {
    uploadError.value = null

    // Validate form
    const isValid = await metadataFormRef.value?.validate()
    if (!isValid) {
      uploadError.value = 'Veuillez remplir tous les champs requis'
      return
    }

    if (props.editingMedia) {
      // Mode édition
      const updateData = {
        ...mediaForm.value,
        tags: mediaForm.value.tagsString
          ? mediaForm.value.tagsString.split(',').map((tag) => tag.trim())
          : [],
      }
      delete (updateData as any).tagsString

      emit('save', {
        isEdit: true,
        id: props.editingMedia._id,
        data: updateData,
      })
    } else {
      // Mode création
      if (!file.value) {
        uploadError.value = 'Veuillez sélectionner un fichier'
        return
      }

      await uploadMedia(mediaType.value, mediaForm.value, file.value!)

      // Success - reset and close
      await nextTick()
      resetForm()
      emit('save', { success: true })
    }
  } catch (error: any) {
    console.error('Error saving media:', error)
    uploadError.value = error.message || 'Erreur lors de la sauvegarde'
  }
}

const handleClose = () => {
  if (saving.value || uploadProgress.value.active) {
    return
  }
  resetForm()
  emit('update:modelValue', false)
  emit('close')
}

const resetForm = () => {
  mediaForm.value = { ...initialFormState }
  file.value = null
  preview.value = null
  uploadError.value = null
  isFormValid.value = false
  mediaType.value = 'image'
  resetUploadState()
  metadataFormRef.value?.resetValidation()
}

// Watch for editing media changes
watch(
  () => props.editingMedia,
  (newValue) => {
    if (newValue) {
      mediaType.value = newValue.mediaType || 'image'
      mediaForm.value = {
        title: newValue.title || '',
        description: newValue.description || '',
        altText: newValue.altText || '',
        category: newValue.category || null,
        tagsString: newValue.tags?.join(', ') || '',
        order: newValue.order || 0,
        isActive: newValue.isActive ?? true,
      }
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

// Watch for dialog close
watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      // Dialog closed, reset after animation
      setTimeout(() => {
        if (!props.modelValue) {
          resetForm()
        }
      }, 300)
    }
  },
)
</script>

<style scoped>
.upload-modal-card {
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.05) 0%,
    rgba(var(--v-theme-surface), 1) 100%
  );
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}

.modal-content {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.progress-card {
  border: 1px solid rgb(var(--v-theme-primary));
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.02) 0%,
    rgba(var(--v-theme-surface), 1) 100%
  );
}

/* Smooth animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.upload-modal-card {
  animation: slideInUp 0.3s ease-out;
}

/* Mobile responsiveness */
@media (max-width: 960px) {
  .modal-content {
    max-height: none;
  }
}
</style>
