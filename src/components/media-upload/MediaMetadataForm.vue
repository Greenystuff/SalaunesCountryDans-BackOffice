<template>
  <div class="media-metadata-form">
    <v-card flat class="metadata-card">
      <v-card-text class="pa-3">
        <h3 class="text-subtitle-1 font-weight-medium text-primary mb-3">
          Informations du média
        </h3>

        <v-form ref="formRef" v-model="isFormValid">
          <v-row>
            <!-- Column 1 -->
            <v-col cols="12" md="6">
              <!-- Title -->
              <v-text-field
                v-model="form.title"
                label="Titre"
                variant="outlined"
                :rules="rules.title"
                :disabled="disabled"
                density="comfortable"
                prepend-inner-icon="mdi-format-title"
                placeholder="Entrez un titre descriptif"
                counter="200"
                required
                class="mb-1"
              />

              <!-- Alt Text -->
              <v-text-field
                v-model="form.altText"
                label="Texte alternatif"
                variant="outlined"
                :rules="rules.altText"
                :disabled="disabled"
                density="comfortable"
                prepend-inner-icon="mdi-image-text"
                placeholder="Description pour l'accessibilité"
                counter="200"
                class="mb-1"
              />

              <!-- Order -->
              <v-text-field
                v-model.number="form.order"
                label="Ordre d'affichage"
                variant="outlined"
                :rules="rules.order"
                :disabled="disabled"
                density="comfortable"
                type="number"
                min="0"
                prepend-inner-icon="mdi-sort-numeric-ascending"
                hint="0 = affichage en premier"
                persistent-hint
              />
            </v-col>

            <!-- Column 2 -->
            <v-col cols="12" md="6">
              <!-- Description -->
              <v-textarea
                v-model="form.description"
                label="Description"
                variant="outlined"
                :rules="rules.description"
                :disabled="disabled"
                density="comfortable"
                prepend-inner-icon="mdi-text"
                placeholder="Ajoutez une description optionnelle"
                counter="1000"
                rows="2"
                class="mb-1"
              />

              <!-- Category -->
              <v-select
                v-model="form.category"
                :items="categoryItems"
                label="Catégorie"
                variant="outlined"
                :rules="rules.category"
                :disabled="disabled"
                density="comfortable"
                prepend-inner-icon="mdi-folder"
                placeholder="Sélectionnez une catégorie"
                clearable
                class="mb-1"
              />

              <!-- Tags -->
              <v-text-field
                v-model="form.tagsString"
                label="Tags"
                variant="outlined"
                :rules="rules.tags"
                :disabled="disabled"
                density="comfortable"
                prepend-inner-icon="mdi-tag-multiple"
                placeholder="tag1, tag2, tag3"
                hint="Séparez les tags par des virgules"
                persistent-hint
              />
            </v-col>
          </v-row>

          <!-- Active switch -->
          <v-row class="mt-1">
            <v-col cols="12">
              <v-divider class="mb-3" />
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-eye</v-icon>
                  <div>
                    <p class="text-subtitle-2 font-weight-medium mb-0">
                      Visibilité
                    </p>
                    <p class="text-caption text-medium-emphasis mb-0">
                      Le média sera {{ form.isActive ? 'visible' : 'masqué' }} sur le site
                    </p>
                  </div>
                </div>
                <v-switch
                  v-model="form.isActive"
                  color="success"
                  :disabled="disabled"
                  hide-details
                  inset
                >
                  <template #label>
                    <v-chip
                      :color="form.isActive ? 'success' : 'grey'"
                      variant="flat"
                      size="small"
                      class="px-3"
                    >
                      {{ form.isActive ? 'Actif' : 'Inactif' }}
                    </v-chip>
                  </template>
                </v-switch>
              </div>
            </v-col>
          </v-row>

          <!-- Tags preview -->
          <v-expand-transition>
            <v-row v-if="parsedTags.length > 0" class="mt-1">
              <v-col cols="12">
                <v-divider class="mb-2" />
                <div class="tags-preview">
                  <p class="text-caption text-medium-emphasis mb-2">
                    Aperçu des tags :
                  </p>
                  <div class="d-flex flex-wrap gap-2">
                    <v-chip
                      v-for="(tag, index) in parsedTags"
                      :key="index"
                      size="small"
                      variant="tonal"
                      color="primary"
                      closable
                      @click:close="removeTag(index)"
                    >
                      {{ tag }}
                    </v-chip>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-expand-transition>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface MediaForm {
  title: string
  description: string
  altText: string
  category: string | null
  tagsString: string
  order: number
  isActive: boolean
}

interface Props {
  modelValue: MediaForm
  rules: {
    title: Array<(v: string) => boolean | string>
    description: Array<(v: string) => boolean | string>
    altText: Array<(v: string) => boolean | string>
    category: Array<(v: string | null) => boolean | string>
    tags: Array<(v: string) => boolean | string>
    order: Array<(v: number) => boolean | string>
  }
  disabled?: boolean
  categories?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  categories: () => ['Événements', 'Cours', 'Spectacles', 'Vie du club', 'Autre'],
})

const emit = defineEmits<{
  'update:modelValue': [value: MediaForm]
  'update:valid': [valid: boolean]
}>()

// Refs
const formRef = ref<any>(null)
const isFormValid = ref(false)

// Local form state
const form = ref<MediaForm>({ ...props.modelValue })

// Computed
const categoryItems = computed(() => props.categories)

const parsedTags = computed(() => {
  return form.value.tagsString
    ? form.value.tagsString
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    : []
})

// Methods
const removeTag = (index: number) => {
  const tags = parsedTags.value
  tags.splice(index, 1)
  form.value.tagsString = tags.join(', ')
}

const validate = async (): Promise<boolean> => {
  if (!formRef.value) return false
  const { valid } = await formRef.value.validate()
  return valid
}

const reset = () => {
  formRef.value?.reset()
}

const resetValidation = () => {
  formRef.value?.resetValidation()
}

// Watch for changes and emit (only emit, don't listen to prevent infinite loop)
watch(
  form,
  (newValue) => {
    emit('update:modelValue', { ...newValue })
  },
  { deep: true },
)

watch(isFormValid, (valid) => {
  emit('update:valid', valid)
})

// Expose methods for parent
defineExpose({
  validate,
  reset,
  resetValidation,
})
</script>

<style scoped>
.media-metadata-form {
  width: 100%;
}

.metadata-card {
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.metadata-card:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
}

.tags-preview {
  padding: 12px;
  background-color: rgba(var(--v-theme-primary), 0.02);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

/* Animation classes */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.media-metadata-form {
  animation: fadeIn 0.4s ease-out;
}
</style>
