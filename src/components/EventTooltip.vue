<template>
  <v-tooltip location="top" :disabled="!showTooltip">
    <template #activator="{ props }">
      <div v-bind="props" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
        <slot />
      </div>
    </template>

    <div class="event-tooltip">
      <div class="tooltip-header">
        <h4 class="text-subtitle-2 font-weight-bold mb-1">{{ event.title }}</h4>
        <v-chip :color="getLevelColor(event.level)" size="small" variant="tonal" class="mb-2">
          {{ event.level }}
        </v-chip>
      </div>

      <div v-if="event.description" class="tooltip-description mb-2">
        {{ event.description }}
      </div>

      <div class="tooltip-details">
        <div v-if="event.instructor" class="detail-item">
          <v-icon size="small" class="me-1">mdi-account</v-icon>
          <span>{{ event.instructor }}</span>
        </div>

        <div v-if="event.location" class="detail-item">
          <v-icon size="small" class="me-1">mdi-map-marker</v-icon>
          <span>{{ event.location }}</span>
        </div>

        <div v-if="event.type" class="detail-item">
          <v-icon size="small" class="me-1">mdi-calendar</v-icon>
          <span>{{ event.type }}</span>
        </div>

        <div v-if="event.capacity" class="detail-item">
          <v-icon size="small" class="me-1">mdi-account-group</v-icon>
          <span>Capacité: {{ event.capacity }}</span>
        </div>

        <div v-if="event.price" class="detail-item">
          <v-icon size="small" class="me-1">mdi-currency-eur</v-icon>
          <span>{{ event.price }}</span>
        </div>
      </div>

      <div v-if="event.periods && event.periods.length > 0" class="tooltip-periods mt-2">
        <div class="text-caption font-weight-medium mb-1">Horaires :</div>
        <div v-for="(period, index) in event.periods" :key="index" class="period-item">
          <v-icon size="small" class="me-1">mdi-clock</v-icon>
          <span>{{ formatPeriod(period) }}</span>
        </div>
      </div>

      <div v-if="event.tags && event.tags.length > 0" class="tooltip-tags mt-2">
        <div class="text-caption font-weight-medium mb-1">Tags :</div>
        <div class="tags-container">
          <v-chip v-for="tag in event.tags.slice(0, 3)" :key="tag" size="x-small" variant="outlined" class="me-1 mb-1">
            {{ tag }}
          </v-chip>
          <span v-if="event.tags.length > 3" class="text-caption">
            +{{ event.tags.length - 3 }}
          </span>
        </div>
      </div>
    </div>
  </v-tooltip>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { CourseEvent } from '@/types/events'

interface Props {
  event: CourseEvent
}

const props = defineProps<Props>()
const showTooltip = ref(false)

const getLevelColor = (level: string) => {
  switch (level) {
    case 'Débutant':
      return 'success'
    case 'Novice':
      return 'info'
    case 'Intermédiaire':
      return 'warning'
    default:
      return 'primary'
  }
}

const formatPeriod = (period: { startDate: string; startTime: string; endTime: string }) => {
  const date = new Date(period.startDate)
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
  return `${formattedDate} ${period.startTime}-${period.endTime}`
}
</script>

<style scoped>
.event-tooltip {
  max-width: 300px;
  padding: 8px;
}

.tooltip-header {
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.3);
  padding-bottom: 8px;
}

.tooltip-description {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.4;
}

.tooltip-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
}

.tooltip-periods {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.3);
  padding-top: 8px;
}

.period-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  margin-bottom: 2px;
}

.tooltip-tags {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.3);
  padding-top: 8px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>
