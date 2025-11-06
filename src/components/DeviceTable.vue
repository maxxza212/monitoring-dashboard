<template>
    <v-card>
        <v-card-title>Daftar Device</v-card-title>
        <v-data-table :headers="headers" :items="devices" class="elevation-1" @click:row="goToDeviceDetail">
            <template #item.id="{ item }">
                <v-btn variant="text" color="primary" @click.stop="goToDeviceDetail(item)">
                    {{ item.id }}
                </v-btn>
            </template>

            <!-- ✅ Tambahkan badge status -->
            <template #item.status="{ item }">
                <v-chip :color="item.status === 'Online' ? 'success' : 'error'" size="small">
                    {{ item.status }}
                </v-chip>
            </template>
        </v-data-table>
    </v-card>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useDevices } from '@/composables/useDevices'

const router = useRouter()
const { devices } = useDevices() // ✅ Ambil dari composable

const headers = [
    { title: 'ID Device', key: 'id' },
    { title: 'Nama Device', key: 'name' },
    { title: 'Lokasi', key: 'location' },
    { title: 'Status', key: 'status' },
]

const goToDeviceDetail = (device) => {
    if (device && device.id) {
        router.push(`/device/${device.id}`)
    }
}
</script>