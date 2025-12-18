<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app width="280" class="glass-drawer" :style="drawerStyle">
      <div class="drawer-header pa-4">
        <div class="d-flex align-center">
          <v-avatar size="48" class="mr-3 glass-avatar">
            <v-img src="https://rsmlamongan.com/_nuxt/Logo-RSM.DukCabBX.png"></v-img>
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold text-white">Monitor IoT</div>
            <div class="text-caption text-white" style="opacity: 0.8;">RS MUHAMMADIYAH LAMONGAN</div>
          </div>
        </div>
      </div>

      <v-divider class="border-opacity-25"></v-divider>

      <!-- Navigation Items -->
      <v-list nav class="py-2 transparent-list">
        <v-list-item prepend-icon="mdi-view-dashboard" title="Dasbor" value="dashboard" :active="$route.path === '/'"
          @click="navigateTo('/')" class="mb-1 glass-list-item">
          <template v-slot:append>
            <v-badge v-if="deviceCount > 0" :content="deviceCount" color="primary" inline></v-badge>
          </template>
        </v-list-item>

        <!-- Ruangan -->
        <v-list-item prepend-icon="mdi-home-group" title="Ruangan" value="rooms" :active="$route.path === '/ruangan'"
          @click="navigateTo('/ruangan')" class="mb-1 glass-list-item">
        </v-list-item>
        
        <!-- Alat -->
        <v-list-item prepend-icon="mdi-devices" title="Alat" value="devices" :active="$route.path === '/alat'"
          @click="navigateTo('/alat')" class="mb-1 glass-list-item">
        </v-list-item>

        <!-- Sensor -->
        <v-list-item prepend-icon="mdi-thermometer" title="Sensor" value="sensors" :active="$route.path === '/sensor'"
          @click="navigateTo('/sensor')" class="mb-1 glass-list-item">
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="custom-background">
      <div class="overlay">
        <router-view :key="route.fullPath" />
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDevices } from '@/composables/useDevices'

const router = useRouter()
const route = useRoute()
const { devices, fetchDevices } = useDevices()

const drawer = ref(true)

const deviceCount = computed(() => devices.value.length)

const drawerStyle = {
  background: 'rgba(255, 255, 255, 0.1) !important',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
}

const navigateTo = (path) => {
  router.push(path)
}
</script>

<style scoped>
.glass-drawer {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.glass-drawer :deep(.v-navigation-drawer__content) {
  background: transparent !important;
}

.drawer-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-avatar {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.transparent-list {
  background: transparent !important;
}

.glass-list-item {
  border-radius: 12px;
  margin: 4px 8px;
  transition: all 0.3s ease;
  color: white !important;
}

.glass-list-item:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(10px);
  transform: translateX(5px);
}

.glass-list-item.v-list-item--active {
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.glass-list-item :deep(.v-icon) {
  color: white !important;
  opacity: 0.9;
}

.glass-list-item:hover :deep(.v-icon) {
  opacity: 1;
}

.glass-list-item :deep(.v-list-item-title) {
  color: white !important;
  font-weight: 500;
}

.v-divider {
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.custom-background {
  background-image: url('@/assets/images/bg.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
}

.overlay {
  min-height: 100vh;
  padding: 20px;
}

.glass-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar {
  width: 6px;
}

.glass-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.glass-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.glass-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>