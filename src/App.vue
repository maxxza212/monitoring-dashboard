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
        <!-- Dashboard -->
        <v-list-item prepend-icon="mdi-view-dashboard" title="Dasbor" value="dashboard" :active="$route.path === '/'"
          @click="navigateTo('/')" class="mb-1 glass-list-item">
          <template v-slot:append>
            <v-badge v-if="deviceCount > 0" :content="deviceCount" color="primary" inline></v-badge>
          </template>
        </v-list-item>

        <!-- Alat (Devices) -->
        <v-list-group value="devices" class="glass-list-group">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" prepend-icon="mdi-devices" title="Alat" class="glass-list-item"></v-list-item>
          </template>

          <v-list-item prepend-icon="mdi-format-list-bulleted" title="Semua Alat" value="all-devices"
            @click="navigateTo('/')" class="pl-12 glass-list-item-sub"></v-list-item>

          <v-list-item prepend-icon="mdi-plus-circle" title="Tambah Alat" value="add-device" @click="openDialogDevice"
            class="pl-12 glass-list-item-sub"></v-list-item>
        </v-list-group>

        <!-- Ruangan (Rooms) -->
        <v-list-group value="rooms" class="glass-list-group">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" prepend-icon="mdi-home-group" title="Ruangan"
              class="glass-list-item"></v-list-item>
          </template>

          <v-list-item prepend-icon="mdi-format-list-bulleted" title="Semua Ruangan" value="all-rooms"
            @click="navigateTo('/ruangan')" class="pl-12 glass-list-item-sub"></v-list-item>

          <v-list-item prepend-icon="mdi-plus-circle" title="Tambah Ruangan" value="add-room" @click="openDialogRuangan"
            class="pl-12 glass-list-item-sub"></v-list-item>
        </v-list-group>

        <!-- Sensor -->
        <v-list-group value="sensors" class="glass-list-group">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" prepend-icon="mdi-chip" title="Sensor" class="glass-list-item"></v-list-item>
          </template>

          <v-list-item prepend-icon="mdi-format-list-bulleted" title="Semua Sensor" value="all-sensors"
            @click="navigateTo('/sensor')" class="pl-12 glass-list-item-sub"></v-list-item>

          <v-list-item prepend-icon="mdi-plus-circle" title="Tambah Sensor" value="add-sensor" @click="openDialogSensor"
            class="pl-12 glass-list-item-sub"></v-list-item>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>

    <v-main class="custom-background">
      <div class="overlay">
        <router-view :key="route.fullPath"  />
      </div>
    </v-main>

    <!-- Tambah Ruangan -->
    <v-dialog v-model="dialogRuangan" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-white" style="background: linear-gradient(135deg, #34e89e 0%, #0f3443 100%)">
          <v-icon start>mdi-home-group</v-icon>
          {{ editMode ? 'Edit Ruangan' : 'Tambah Ruangan Baru' }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-text-field v-model="formRuangan.nama_ruangan" label="Nama Ruangan" placeholder="Contoh: Ruang Server"
            prepend-inner-icon="mdi-home" variant="outlined" :rules="[v => !!v || 'Nama ruangan wajib diisi']"
            required></v-text-field>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeDialogRuangan" :disabled="loadingSubmit">
            Batal
          </v-btn>
          <v-btn color="primary" @click="submitRuangan" :loading="loadingSubmit">
            <v-icon start>mdi-content-save</v-icon>
            Simpan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tambah Alat -->
    <v-dialog v-model="dialogDevice" max-width="600" persistent>
      <v-card>
        <v-card-title class="text-white" style="background: linear-gradient(135deg, #34e89e 0%, #0f3443 100%)">
          <v-icon start>mdi-devices</v-icon>
          {{ editMode ? 'Edit Alat' : 'Tambah Alat Baru' }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-text-field v-model="formDevice.nama_alat" label="Nama Alat" placeholder="Contoh: ESP32 Board 1"
            prepend-inner-icon="mdi-chip" variant="outlined" :rules="[v => !!v || 'Nama alat wajib diisi']" required
            class="mb-3"></v-text-field>

          <v-select v-model="formDevice.id_ruangan" :items="ruanganList" item-title="nama_ruangan" item-value="id"
            label="Pilih Ruangan" prepend-inner-icon="mdi-home-group" variant="outlined"
            :rules="[v => !!v || 'Ruangan wajib dipilih']" required :loading="loadingRuangan"></v-select>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeDialogDevice" :disabled="loadingSubmit">
            Batal
          </v-btn>
          <v-btn color="primary" @click="submitDevice" :loading="loadingSubmit">
            <v-icon start>mdi-content-save</v-icon>
            Simpan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tambah Sensor -->
    <v-dialog v-model="dialogSensor" max-width="600" persistent>
      <v-card>
        <v-card-title class="text-white" style="background: linear-gradient(135deg, #34e89e 0%, #0f3443 100%)">
          <v-icon start>mdi-chip</v-icon>
          {{ editMode ? 'Edit Sensor' : 'Tambah Sensor Baru' }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-select v-model="formSensor.id_alat" :items="devicesList" item-title="nama_alat" item-value="id"
            label="Pilih Alat" prepend-inner-icon="mdi-devices" variant="outlined"
            :rules="[v => !!v || 'Alat wajib dipilih']" required :loading="loadingDevices" class="mb-3"></v-select>

          <v-text-field v-model="formSensor.nama_sensor" label="Nama Sensor" placeholder="Contoh: DHT22 Sensor 1"
            prepend-inner-icon="mdi-memory" variant="outlined" :rules="[v => !!v || 'Nama sensor wajib diisi']"
            required></v-text-field>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeDialogSensor" :disabled="loadingSubmit">
            Batal
          </v-btn>
          <v-btn color="primary" @click="submitSensor" :loading="loadingSubmit">
            <v-icon start>mdi-content-save</v-icon>
            Simpan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--   Snackbar Notifikasi -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="1000">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">Tutup</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDevices } from '@/composables/useDevices'
import { deviceAPI } from '@/services/api'

const router = useRouter()
const route = useRoute()
const { devices, fetchDevices } = useDevices()

const drawer = ref(true)

// Device count untuk badge
const deviceCount = computed(() => devices.value.length)

const drawerStyle = {
  background: 'rgba(255, 255, 255, 0.1) !important',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
}

// DIALOG STATES 
const dialogRuangan = ref(false)
const dialogDevice = ref(false)
const dialogSensor = ref(false)
const editMode = ref(false)
const loadingSubmit = ref(false)
const loadingRuangan = ref(false)
const loadingDevices = ref(false)

// FORM DATA 
const formRuangan = ref({
  nama_ruangan: ''
})

const formDevice = ref({
  nama_alat: '',
  id_ruangan: null
})

const formSensor = ref({
  id_alat: null,
  nama_sensor: ''
})

// DROPDOWN DATA 
const ruanganList = ref([])
const devicesList = ref([])

// SNACKBAR 
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Navigation
const navigateTo = (path) => {
  router.push(path)
}

// RUANGAN 
const openDialogRuangan = () => {
  editMode.value = false
  formRuangan.value = { nama_ruangan: '' }
  dialogRuangan.value = true
}

const closeDialogRuangan = () => {
  dialogRuangan.value = false
  formRuangan.value = { nama_ruangan: '' }
}

const submitRuangan = async () => {
  if (!formRuangan.value.nama_ruangan) {
    showError('Nama ruangan wajib diisi!')
    return
  }

  loadingSubmit.value = true
  try {
    const response = await deviceAPI.createRuangan(formRuangan.value)

    if (response.data.success) {
      showSuccess('Ruangan berhasil ditambahkan!')
      closeDialogRuangan()
      await loadRuanganList() // Refresh dropdown
      await fetchDevices() // Refresh device list
    } else {
      showError(response.data.message || 'Gagal menambahkan ruangan')
    }
  } catch (error) {
    console.error('Error creating ruangan:', error)
    showError(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan')
  } finally {
    loadingSubmit.value = false
  }
}

// ALAT 
const openDialogDevice = async () => {
  editMode.value = false
  formDevice.value = { nama_alat: '', id_ruangan: null }
  await loadRuanganList()
  dialogDevice.value = true
}

const closeDialogDevice = () => {
  dialogDevice.value = false
  formDevice.value = { nama_alat: '', id_ruangan: null }
}

const submitDevice = async () => {
  if (!formDevice.value.nama_alat) {
    showError('Nama alat wajib diisi!')
    return
  }
  if (!formDevice.value.id_ruangan) {
    showError('Ruangan wajib dipilih!')
    return
  }

  loadingSubmit.value = true
  try {
    const response = await deviceAPI.createDevice(formDevice.value)

    if (response.data.success) {
      showSuccess('Alat berhasil ditambahkan!')
      closeDialogDevice()
      await fetchDevices() 
      await loadDevicesList() 
    } else {
      showError(response.data.message || 'Gagal menambahkan Alat')
    }
  } catch (error) {
    console.error('Error creating device:', error)
    showError(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan')
  } finally {
    loadingSubmit.value = false
  }
}

// SENSOR 
const openDialogSensor = async () => {
  editMode.value = false
  formSensor.value = { id_alat: null, nama_sensor: '' }
  await loadDevicesList()
  dialogSensor.value = true
}

const closeDialogSensor = () => {
  dialogSensor.value = false
  formSensor.value = { id_alat: null, nama_sensor: '' }
}

const submitSensor = async () => {
  if (!formSensor.value.id_alat) {
    showError('Alat wajib dipilih!')
    return
  }
  if (!formSensor.value.nama_sensor) {
    showError('Nama sensor wajib diisi!')
    return
  }

  loadingSubmit.value = true
  try {
    const response = await deviceAPI.createSensor(formSensor.value)

    if (response.data.success) {
      showSuccess('Sensor berhasil ditambahkan!')
      closeDialogSensor()
      await fetchDevices() 
    } else {
      showError(response.data.message || 'Gagal menambahkan sensor')
    }
  } catch (error) {
    console.error('Error creating sensor:', error)
    showError(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan')
  } finally {
    loadingSubmit.value = false
  }
}

// LOAD DROPDOWN DATA 
const loadRuanganList = async () => {
  loadingRuangan.value = true
  try {
    const response = await deviceAPI.getAllRuangan()
    if (response.data.success) {
      ruanganList.value = response.data.data
    }
  } catch (error) {
    console.error('Error loading ruangan:', error)
  } finally {
    loadingRuangan.value = false
  }
}

const loadDevicesList = async () => {
  loadingDevices.value = true
  try {
    const response = await deviceAPI.getAllDevices()
    if (response.data.success) {
      devicesList.value = response.data.data
    }
  } catch (error) {
    console.error('Error loading devices:', error)
  } finally {
    loadingDevices.value = false
  }
}

// SNACKBAR HELPERS 
const showSuccess = (message) => {
  snackbarText.value = message
  snackbarColor.value = 'success'
  snackbar.value = true
}

const showError = (message) => {
  snackbarText.value = message
  snackbarColor.value = 'error'
  snackbar.value = true
}

onMounted(async () => {
  await loadRuanganList()
  await loadDevicesList()
})
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

.glass-list-item-sub {
  border-radius: 8px;
  margin: 2px 8px;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.9) !important;
}

.glass-list-item-sub:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  transform: translateX(3px);
}

.glass-list-group :deep(.v-list-group__items) {
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 8px;
  margin: 4px 0;
}

.glass-list-item :deep(.v-icon),
.glass-list-item-sub :deep(.v-icon) {
  color: white !important;
  opacity: 0.9;
}

.glass-list-item:hover :deep(.v-icon),
.glass-list-item-sub:hover :deep(.v-icon) {
  opacity: 1;
}

.glass-list-item :deep(.v-list-item-title),
.glass-list-item-sub :deep(.v-list-item-title) {
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