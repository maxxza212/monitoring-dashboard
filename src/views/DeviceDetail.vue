<!-- DeviceDetail.vue -->
<template>
    <v-container>
        <v-btn color="grey" variant="tonal" class="mb-4" prepend-icon="mdi-arrow-left" @click="goBack">
            Kembali ke Daftar Device
        </v-btn>

        <v-alert v-if="!device" type="error" class="mb-4">
            Device tidak ditemukan.
        </v-alert>

        <device-dashboard v-else :device="device" />
    </v-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DeviceDashboard from '@/components/DeviceDashboard.vue'
import { useDevices } from '@/composables/useDevices'

const route = useRoute()
const { getDeviceById } = useDevices()

const device = computed(() => getDeviceById(route.params.id))

function goBack() {
    // Manual navigation - ini PASTI work
    window.location.href = '/'
}
</script>