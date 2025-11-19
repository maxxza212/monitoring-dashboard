<!-- src/components/DeviceTable.vue -->
<template>
    <v-card>
        <v-card-title>Daftar Alat</v-card-title>
        <v-data-table :headers="headers" :items="devices" class="elevation-1" @click:row="goToDeviceDetail">
            
            <!-- Nama Alat -->
            <template #item.name="{ item }">
                <v-btn variant="text" color="primary" class="text-left justify-start"
                    @click.stop="goToDeviceDetail(item)">
                    {{ item.name }}
                </v-btn>
            </template>

            <!-- Suhu 1 -->
            <template #item.suhu1="{ item }">
                <span v-if="item.suhu1 !== undefined">
                    {{ item.suhu1 }}°C
                </span>
                <span v-else class="text-grey">-</span>
            </template>

            <!-- Suhu 2 -->
            <template #item.suhu2="{ item }">
                <span v-if="item.suhu2 !== undefined">
                    {{ item.suhu2 }}°C
                </span>
                <span v-else class="text-grey">-</span>
            </template>

            <!-- Kelembapan 1 -->
            <template #item.kelembapan1="{ item }">
                <span v-if="item.kelembapan1 !== undefined">
                    {{ item.kelembapan1 }}%
                </span>
                <span v-else class="text-grey">-</span>
            </template>

            <!-- Kelembapan 2 -->
            <template #item.kelembapan2="{ item }">
                <span v-if="item.kelembapan2 !== undefined">
                    {{ item.kelembapan2 }}%
                </span>
                <span v-else class="text-grey">-</span>
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
const { devices } = useDevices() // HAPUS 'loading'

const headers = [
    { title: 'Nama Alat', key: 'name' },
    { title: 'Lokasi', key: 'location' },
    { title: 'S1', key: 'suhu1' },
    { title: 'S2', key: 'suhu2' },
    { title: 'K1', key: 'kelembapan1' },
    { title: 'K2', key: 'kelembapan2' },
    { title: 'Kategori', key: 'kategori' },
]

const goToDeviceDetail = (device) => {
    if (device && device.id_alat) {
        router.push(`/device/${device.id_alat}`)
    }
}
</script>