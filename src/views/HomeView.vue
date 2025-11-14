<template>
    <v-container>
        <!-- Loading indicator -->
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

        <!-- Error alert -->
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
            <strong>Error:</strong> {{ error }}
        </v-alert>

        <!-- Device Table -->
        <DeviceTable />
    </v-container>
</template>

<script setup>
import { onMounted } from 'vue'
import DeviceTable from '@/components/DeviceTable.vue'
import { useDevices } from '@/composables/useDevices'

const { loading, error, fetchDevices } = useDevices()

// ✅ Fetch devices saat component mounted
onMounted(async () => {
    console.log('🏠 HomeView mounted, fetching devices...')
    await fetchDevices()
})
</script>