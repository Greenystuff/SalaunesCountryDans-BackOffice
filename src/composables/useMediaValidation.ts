import { computed, type Ref } from 'vue'

export interface MediaValidationRules {
  title: Array<(v: string) => boolean | string>
  description: Array<(v: string) => boolean | string>
  altText: Array<(v: string) => boolean | string>
  category: Array<(v: string | null) => boolean | string>
  tags: Array<(v: string) => boolean | string>
  order: Array<(v: number) => boolean | string>
  imageFile: Array<(v: File | null) => boolean | string>
  videoFile: Array<(v: File | null) => boolean | string>
}

export function useMediaValidation(
  mediaType: Ref<'image' | 'video'>,
  isEditing: Ref<boolean>,
) {
  // File type constants
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']

  const IMAGE_MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const VIDEO_MAX_SIZE = 1024 * 1024 * 1024 // 1GB

  // Validation rules
  const titleRules = [
    (v: string) => !!v || 'Le titre est requis',
    (v: string) =>
      (v && v.length >= 3) || 'Le titre doit contenir au moins 3 caractères',
    (v: string) =>
      (v && v.length <= 200) || 'Le titre ne doit pas dépasser 200 caractères',
  ]

  const descriptionRules = [
    (v: string) =>
      !v || v.length <= 1000 || 'La description ne doit pas dépasser 1000 caractères',
  ]

  const altTextRules = [
    (v: string) =>
      !v || v.length <= 200 || "Le texte alternatif ne doit pas dépasser 200 caractères",
  ]

  const categoryRules = [
    (v: string | null) =>
      !v || v.length <= 100 || 'La catégorie ne doit pas dépasser 100 caractères',
  ]

  const tagsRules = [
    (v: string) => {
      if (!v) return true
      const tags = v.split(',').map((t) => t.trim())
      return tags.every((tag) => tag.length <= 50) || 'Chaque tag ne doit pas dépasser 50 caractères'
    },
  ]

  const orderRules = [
    (v: number) => v >= 0 || "L'ordre doit être un nombre positif",
  ]

  const imageFileRules = [
    (v: File | null) => {
      // Si on est en mode édition et qu'il n'y a pas de nouveau fichier, c'est OK
      if (isEditing.value && !v) return true
      // En mode création, le fichier est requis
      if (!isEditing.value && !v) return 'Une image est requise'
      if (!v) return true

      // Vérifier le type
      if (!ALLOWED_IMAGE_TYPES.includes(v.type)) {
        return 'Format d\'image non supporté. Formats acceptés: JPEG, PNG, WebP, GIF'
      }

      // Vérifier la taille
      if (v.size > IMAGE_MAX_SIZE) {
        return `L'image est trop volumineuse (maximum ${IMAGE_MAX_SIZE / (1024 * 1024)}MB)`
      }

      return true
    },
  ]

  const videoFileRules = [
    (v: File | null) => {
      // Si on est en mode édition et qu'il n'y a pas de nouveau fichier, c'est OK
      if (isEditing.value && !v) return true
      // En mode création, le fichier est requis
      if (!isEditing.value && !v) return 'Une vidéo est requise'
      if (!v) return true

      // Vérifier le type
      if (!ALLOWED_VIDEO_TYPES.includes(v.type)) {
        return 'Format vidéo non supporté. Formats acceptés: MP4, WebM, MOV, AVI'
      }

      // Vérifier la taille
      if (v.size > VIDEO_MAX_SIZE) {
        return `La vidéo est trop volumineuse (maximum ${VIDEO_MAX_SIZE / (1024 * 1024 * 1024)}GB)`
      }

      return true
    },
  ]

  // Computed validation rules based on media type
  const validationRules = computed<MediaValidationRules>(() => ({
    title: titleRules,
    description: descriptionRules,
    altText: altTextRules,
    category: categoryRules,
    tags: tagsRules,
    order: orderRules,
    imageFile: mediaType.value === 'image' ? imageFileRules : [],
    videoFile: mediaType.value === 'video' ? videoFileRules : [],
  }))

  // Validate file type
  const isValidFileType = (file: File, type: 'image' | 'video'): boolean => {
    if (type === 'image') {
      return ALLOWED_IMAGE_TYPES.includes(file.type)
    } else {
      return ALLOWED_VIDEO_TYPES.includes(file.type)
    }
  }

  // Validate file size
  const isValidFileSize = (file: File, type: 'image' | 'video'): boolean => {
    const maxSize = type === 'image' ? IMAGE_MAX_SIZE : VIDEO_MAX_SIZE
    return file.size <= maxSize
  }

  // Get human-readable file type list
  const getAllowedFileTypesText = (type: 'image' | 'video'): string => {
    if (type === 'image') {
      return 'JPEG, PNG, WebP, GIF'
    } else {
      return 'MP4, WebM, MOV, AVI'
    }
  }

  // Get max file size text
  const getMaxFileSizeText = (type: 'image' | 'video'): string => {
    if (type === 'image') {
      return '10 MB'
    } else {
      return '1 GB'
    }
  }

  return {
    // Rules
    validationRules,
    titleRules,
    descriptionRules,
    altTextRules,
    categoryRules,
    tagsRules,
    orderRules,
    imageFileRules,
    videoFileRules,

    // Validation methods
    isValidFileType,
    isValidFileSize,
    getAllowedFileTypesText,
    getMaxFileSizeText,

    // Constants
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    IMAGE_MAX_SIZE,
    VIDEO_MAX_SIZE,
  }
}
