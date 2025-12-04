<template>
    <v-container>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
            <strong>Error:</strong> {{ error }}
        </v-alert>

        <div class="mb-4">
            <v-chip class="gradient-chip" variant="flat" prepend-icon="mdi-sync">
                Last update: {{ lastUpdate }}
            </v-chip>
        </div>

        <DeviceTable />
    </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import DeviceTable from '@/components/DeviceTable.vue'
import { useDevices } from '@/composables/useDevices'

const { loading, error, fetchDevices } = useDevices()
const lastUpdate = ref('--:--:--')
let refreshInterval = null

// Fungsi refresh dengan update timestamp
const refreshDevices = async () => {
    await fetchDevices()
    lastUpdate.value = new Date().toLocaleTimeString('id-ID')
}

// Setup auto-refresh
onMounted(async () => {
    console.log('HomeView mounted, starting auto-refresh...')

    // Fetch pertama kali
    await refreshDevices()

    // Auto-refresh setiap 30 detik
    refreshInterval = setInterval(refreshDevices, 30000)
})

// Cleanup saat component unmount
onBeforeUnmount(() => {
    if (refreshInterval) {
        clearInterval(refreshInterval)
        refreshInterval = null
        console.log('Auto-refresh stopped')
    }
})
</script>

<style scoped>
/* Custom gradient chip */
.gradient-chip {
    background: linear-gradient(135deg, #34e89e 0%, #0f3443 100%) !important;
    color: white !important;
    font-weight: 600;
}

/* Icon juga berwarna putih */
.gradient-chip :deep(.v-icon) {
    color: white !important;
}
</style>