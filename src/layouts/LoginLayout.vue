<template>
  <v-app>
    <v-main class="login-main">
      <v-container fluid class="fill-height">
        <v-row align="center" justify="center">
          <v-col cols="12" sm="10" md="8" lg="6" xl="4">
            <v-card class="login-card" elevation="8">
              <v-card-title class="text-center text-h4 font-weight-bold pa-6">
                <v-icon size="48" color="primary" class="mb-4">mdi-music-note</v-icon>
                <br>
                SCD BackOffice
              </v-card-title>
              <v-card-text class="pa-6">
                <slot />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
// Layout pour les pages de connexion
</script>

<style scoped>
.login-main {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  min-height: 100vh;
}

.login-card {
  border-radius: 16px;
  backdrop-filter: blur(10px);
  background: rgba(var(--v-theme-surface), 0.95);
}
</style>
