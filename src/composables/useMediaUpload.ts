import { ref, computed, type Ref } from 'vue'
import { apiService } from '@/services/api'

export interface UploadProgress {
  active: boolean
  loaded: number
  total: number
  percentage: number
  speed: number
}

export interface VideoMetadata {
  duration: number
  size: number
}

export interface MediaFormData {
  title: string
  description: string
  altText: string
  category: string | null
  tagsString: string
  order: number
  isActive: boolean
}

export function useMediaUpload(
  onSuccess?: (message: string) => void,
  onError?: (message: string) => void,
) {
  // State
  const imageFile: Ref<File | null> = ref(null)
  const videoFile: Ref<File | null> = ref(null)
  const imagePreview: Ref<string | null> = ref(null)
  const videoPreview: Ref<string | null> = ref(null)
  const videoMetadata: Ref<VideoMetadata | null> = ref(null)
  const uploadProgress: Ref<UploadProgress> = ref({
    active: false,
    loaded: 0,
    total: 0,
    percentage: 0,
    speed: 0,
  })
  const saving = ref(false)

  // Constants
  const IMAGE_MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const VIDEO_MAX_SIZE = 1024 * 1024 * 1024 // 1GB

  // Computed
  const hasFile = computed(() => {
    return imageFile.value !== null || videoFile.value !== null
  })

  const uploadSpeedFormatted = computed(() => {
    if (!uploadProgress.value.speed) return '0 KB/s'
    const speedMB = uploadProgress.value.speed / (1024 * 1024)
    return speedMB >= 1 ? `${speedMB.toFixed(1)} MB/s` : `${(speedMB * 1024).toFixed(0)} KB/s`
  })

  // Helper functions
  const clearPreviews = () => {
    if (imagePreview.value) {
      URL.revokeObjectURL(imagePreview.value)
      imagePreview.value = null
    }
    if (videoPreview.value) {
      URL.revokeObjectURL(videoPreview.value)
      videoPreview.value = null
    }
  }

  const resetUploadState = () => {
    imageFile.value = null
    videoFile.value = null
    videoMetadata.value = null
    clearPreviews()
    uploadProgress.value = {
      active: false,
      loaded: 0,
      total: 0,
      percentage: 0,
      speed: 0,
    }
  }

  // Image handling
  const handleImageChange = (file: File | File[] | null) => {
    if (imagePreview.value) {
      URL.revokeObjectURL(imagePreview.value)
    }

    if (file && file instanceof File) {
      if (!file.type.startsWith('image/')) {
        imageFile.value = null
        imagePreview.value = null
        onError?.("Le fichier sélectionné n'est pas une image valide")
        return
      }

      if (file.size > IMAGE_MAX_SIZE) {
        imageFile.value = null
        imagePreview.value = null
        onError?.("L'image est trop volumineuse (maximum 10MB)")
        return
      }

      imageFile.value = file
      imagePreview.value = URL.createObjectURL(file)
    } else {
      imageFile.value = null
      imagePreview.value = null
    }
  }

  // Video handling
  const handleVideoChange = (file: File | File[] | null) => {
    if (videoPreview.value) {
      URL.revokeObjectURL(videoPreview.value)
    }

    if (file && file instanceof File) {
      if (!file.type.startsWith('video/')) {
        videoFile.value = null
        videoPreview.value = null
        onError?.("Le fichier sélectionné n'est pas une vidéo valide")
        return
      }

      if (file.size > VIDEO_MAX_SIZE) {
        videoFile.value = null
        videoPreview.value = null
        onError?.('La vidéo est trop volumineuse (maximum 1 Go)')
        return
      }

      videoFile.value = file
      videoPreview.value = URL.createObjectURL(file)

      // Extract metadata
      const videoEl = document.createElement('video')
      videoEl.src = videoPreview.value
      videoEl.onloadedmetadata = () => {
        videoMetadata.value = {
          duration: videoEl.duration,
          size: file.size,
        }
      }
    } else {
      videoFile.value = null
      videoPreview.value = null
      videoMetadata.value = null
    }
  }

  // Upload functions
  const uploadImage = async (formData: MediaFormData, file?: File): Promise<void> => {
    const fileToUpload = file || imageFile.value

    if (!fileToUpload) {
      throw new Error('Aucune image sélectionnée')
    }

    const data = new FormData()
    data.append('image', fileToUpload)
    data.append('title', formData.title)
    data.append('description', formData.description || '')
    data.append('altText', formData.altText || '')
    data.append('category', formData.category || '')
    data.append('tags', formData.tagsString || '')
    data.append('order', formData.order.toString())
    data.append('isActive', formData.isActive.toString())

    await apiService.post('/gallery/upload', data)
    onSuccess?.('Image ajoutée avec succès')
  }

  const uploadVideo = async (formData: MediaFormData, file?: File): Promise<void> => {
    const fileToUpload = file || videoFile.value

    if (!fileToUpload) {
      throw new Error('Aucune vidéo sélectionnée')
    }

    const data = new FormData()
    data.append('video', fileToUpload)
    data.append('title', formData.title)
    data.append('description', formData.description || '')
    data.append('altText', formData.altText || '')
    data.append('category', formData.category || '')
    data.append('tags', formData.tagsString || '')
    data.append('order', formData.order.toString())
    data.append('isActive', formData.isActive.toString())

    const startTime = Date.now()
    uploadProgress.value.active = true

    await apiService.post('/gallery/upload-video', data, {
      onUploadProgress: (progressEvent: any) => {
        uploadProgress.value.loaded = progressEvent.loaded
        uploadProgress.value.total = progressEvent.total
        uploadProgress.value.percentage = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        )

        const elapsed = (Date.now() - startTime) / 1000
        uploadProgress.value.speed = progressEvent.loaded / elapsed
      },
    })

    onSuccess?.('Vidéo uploadée avec succès. Le transcoding va commencer.')
  }

  const uploadMedia = async (
    mediaType: 'image' | 'video',
    formData: MediaFormData,
    file?: File,
  ) => {
    try {
      saving.value = true

      if (mediaType === 'image') {
        await uploadImage(formData, file)
      } else if (mediaType === 'video') {
        await uploadVideo(formData, file)
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'upload:', error)

      if (error.name !== 'CanceledError') {
        const errorMessage =
          error.response?.data?.message || 'Erreur lors de l\'upload du média'
        onError?.(errorMessage)
        throw error
      }
    } finally {
      saving.value = false
      uploadProgress.value.active = false
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

  return {
    // State
    imageFile,
    videoFile,
    imagePreview,
    videoPreview,
    videoMetadata,
    uploadProgress,
    saving,

    // Computed
    hasFile,
    uploadSpeedFormatted,

    // Methods
    handleImageChange,
    handleVideoChange,
    uploadMedia,
    resetUploadState,
    clearPreviews,

    // Utilities
    formatFileSize,
    formatDuration,
    IMAGE_MAX_SIZE,
    VIDEO_MAX_SIZE,
  }
}
