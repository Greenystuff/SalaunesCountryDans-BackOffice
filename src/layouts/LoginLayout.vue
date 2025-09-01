<template>
  <v-app>
    <!-- Contenu principal sans navigation -->
    <v-main>
      <div class="content-wrapper">
        <RouterView />
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style scoped>
/* Layout de login */
.v-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Contenu principal sans padding */
.v-main {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* Wrapper du contenu */
.content-wrapper {
  height: 100%;
  width: 100%;
  overflow: auto;
}
</style>
