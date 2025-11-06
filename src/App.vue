<template>
  <v-app>
    <v-main class="custom-background">
      <div class="overlay">
        <router-view />
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
// Import foto Anda
import backgroundImage from '@/assets/images/background.png'
</script>

<style scoped>
.custom-background {
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
    url('@/assets/images/background.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
}

.overlay {
  min-height: 100vh;
  padding: 20px;
}
</style>