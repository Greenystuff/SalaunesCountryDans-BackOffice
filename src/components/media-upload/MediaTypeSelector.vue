<template>
  <div class="media-type-selector">
    <div class="tabs-container">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="[
          'custom-tab',
          { 'custom-tab-active': modelValue === tab.value },
          { 'custom-tab-disabled': disabled }
        ]"
        :disabled="disabled"
        @click="!disabled && $emit('update:modelValue', tab.value)"
      >
        <v-icon :icon="tab.icon" size="20" class="tab-icon" />
        <div class="tab-text">
          <span class="tab-title">{{ tab.title }}</span>
          <span class="tab-subtitle">{{ tab.subtitle }}</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Props {
  modelValue: 'image' | 'video'
  disabled?: boolean
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: 'image' | 'video']
}>()

const tabs = [
  {
    value: 'image' as const,
    icon: 'mdi-image-multiple',
    title: 'Image',
    subtitle: 'JPEG, PNG, WebP, GIF'
  },
  {
    value: 'video' as const,
    icon: 'mdi-video-box',
    title: 'Vidéo',
    subtitle: 'MP4, WebM, MOV, AVI'
  }
]
</script>

<style scoped>
.media-type-selector {
  width: 100%;
  animation: fadeIn 0.3s ease-out;
}

.tabs-container {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid rgb(var(--v-theme-outline));
  padding-bottom: 0;
  margin-bottom: 16px;
}

.custom-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  bottom: -2px;
  min-height: 64px;
}

.custom-tab:hover:not(.custom-tab-disabled) {
  background: rgba(var(--v-theme-primary), 0.05);
}

.custom-tab-active {
  border-bottom-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}

.custom-tab-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-icon {
  color: rgb(var(--v-theme-on-surface));
  flex-shrink: 0;
}

.custom-tab-active .tab-icon {
  color: rgb(var(--v-theme-primary));
}

.tab-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.tab-title {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  color: rgb(var(--v-theme-on-surface));
}

.custom-tab-active .tab-title {
  color: rgb(var(--v-theme-primary));
}

.tab-subtitle {
  font-size: 0.7rem;
  line-height: 1;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
