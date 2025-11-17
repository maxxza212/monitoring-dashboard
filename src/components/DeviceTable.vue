<template>
    <v-card>
        <v-card-title>Daftar Alat</v-card-title>
        <v-data-table :headers="headers" :items="devices" :loading="loading" class="elevation-1"
            @click:row="goToDeviceDetail">
            <!-- Nama Alat (clickable) -->
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
const { devices, loading } = useDevices()

const headers = [
    { title: 'Nama Alat', key: 'name', width: '200px' },
    { title: 'Lokasi', key: 'location', width: '180px' },
    { title: 'S1', key: 'suhu1', align: 'center', width: '80px' },
    { title: 'S2', key: 'suhu2', align: 'center', width: '80px' },
    { title: 'K1', key: 'kelembapan1', align: 'center', width: '80px' },
    { title: 'K2', key: 'kelembapan2', align: 'center', width: '80px' },
    { title: 'Kategori', key: 'kategori', align: 'center', width: '120px' },
]

const goToDeviceDetail = (device) => {
    if (device && device.id_alat) {
        router.push(`/device/${device.id_alat}`)
    }
}
</script>