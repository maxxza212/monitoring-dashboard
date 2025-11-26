<!-- src/views/DeviceDetail.vue -->
<template>
    <v-container>
        <!-- Tombol kembali -->
        <router-link to="/" style="text-decoration: none;">
            <v-btn prepend-icon="mdi-arrow-left" class="mb-4" style="
                background: linear-gradient(135deg, #34e89e 0%, #0f3443 100%);
                color: white;
                font-weight: 600;
                transition: all 0.3s ease;
            ">
                Kembali ke Daftar Alat
            </v-btn>
        </router-link>

        <!-- Error: Device not found -->
        <v-alert v-if="!device && !loading" type="error" class="mb-4">
            <strong>Alat tidak ditemukan</strong><br>
            Alat dengan ID "{{ $route.params.id }}" tidak ada dalam database.<br>
            <v-btn color="white" variant="text" to="/" class="mt-2">
                Kembali ke Daftar Alat
            </v-btn>
        </v-alert>

        <!-- Dashboard -->
        <device-dashboard v-if="device" :device="device" />
    </v-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DeviceDashboard from '@/components/DeviceDashboard.vue'
import { useDevices } from '@/composables/useDevices'

const route = useRoute()
const { devices, getDeviceById, fetchDevices, loading } = useDevices()

//  Get device from devices array
const device = computed(() => {
    const id = route.params.id
    console.log('Looking for device with ID:', id)
    console.log('Available devices:', devices.value)

    const found = getDeviceById(id)

    console.log('Device found:', found)
    return found
})

onMounted(async () => {
    console.log('DeviceDetail mounted')
    console.log('Route params:', route.params)

    // Pastikan devices sudah di-load
    if (devices.value.length === 0) {
        console.log('Devices empty, fetching...')
        await fetchDevices()
    }
})
</script>