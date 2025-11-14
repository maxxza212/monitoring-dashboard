<template>
    <v-card>
        <v-card-title>Daftar Alat</v-card-title>
        <v-data-table :headers="headers" :items="devices" class="elevation-1" @click:row="goToDeviceDetail">
            <template #item.id_alat="{ item }">
                <v-btn variant="text" color="primary" @click.stop="goToDeviceDetail(item)">
                    {{ item.id_alat }}
                </v-btn>
            </template>

            <!-- Badge kategori Normal/Tidak Normal -->
            <template #item.kategori="{ item }">
                <v-chip :color="item.kategori === 'Normal' ? 'success' : 'error'" size="small"
                    :prepend-icon="item.kategori === 'Normal' ? 'mdi-check-circle' : 'mdi-alert-circle'">
                    {{ item.kategori }}
                </v-chip>
            </template>
        </v-data-table>
    </v-card>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useDevices } from '@/composables/useDevices'

const router = useRouter()
const { devices } = useDevices()

const headers = [
    { title: 'ID Alat', key: 'id_alat' },
    { title: 'Nama Alat', key: 'name' },
    { title: 'Lokasi', key: 'location' },
    { title: 'Kategori', key: 'kategori' },
]

const goToDeviceDetail = (device) => {
    if (device && device.id_alat) {
        // Gunakan id_alat (angka murni tanpa prefix D)
        router.push(`/device/${device.id_alat}`)
    }
}
</script>