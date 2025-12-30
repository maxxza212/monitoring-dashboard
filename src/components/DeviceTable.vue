<template>
    <v-card>
        <v-card-title>Daftar Sensor</v-card-title>

        <v-card-text>
            <v-row dense class="mb-4">
                <v-col cols="12" md="6">
                    <v-text-field v-model="search" density="comfortable" variant="outlined" label="Cari"
                        prepend-inner-icon="mdi-magnify" clearable hide-details/>
                </v-col>

                <v-col cols="12" md="6">
                    <v-select v-model="filterLocation" :items="locationOptions" item-title="text" item-value="value"
                        density="comfortable" variant="outlined" label="Filter Lokasi"
                        prepend-inner-icon="mdi-map-marker" clearable hide-details />
                </v-col>
            </v-row>

            <v-data-table :headers="headers" :items="filteredSensorItems" :search="search"
                items-per-page="10" class="elevation-1">
                <template #item.sensor_name="{ item }">
                    <div class="sensor-name">
                        <v-icon icon="mdi-thermometer" size="small" color="blue" class="me-1"></v-icon>
                        {{ item.sensor_name }}
                    </div>
                </template>

                <template #item.device_name="{ item }">
                    <v-chip color="secondary" size="small" variant="outlined">
                        {{ item.device_name }}
                    </v-chip>
                </template>

                <template #item.location="{ item }">
                    <div class="d-flex align-center">
                        <v-icon icon="mdi-map-marker" size="small" color="red" class="me-1" />
                        {{ item.location }}
                    </div>
                </template>

                <template #item.suhu="{ item }">
                    <span v-if="item.suhu !== undefined" class="font-weight-bold">
                        {{ item.suhu }}°C
                    </span>
                    <span v-else class="text-grey">-</span>
                </template>

                <template #item.kelembapan="{ item }">
                    <span v-if="item.kelembapan !== undefined" class="font-weight-bold">
                        {{ item.kelembapan }}%
                    </span>
                    <span v-else class="text-grey">-</span>
                </template>

                <template #item.status="{ item }">
                    <v-chip :color="getStatusColor(item.status)" size="small"
                        :prepend-icon="getStatusIcon(item.status)">
                        {{ item.status }}
                    </v-chip>
                </template>

                <template #item.action="{ item }">
                    <v-btn icon="mdi-eye" size="small" variant="text" color="info" @click="goToDeviceDetail(item)"
                        title="Lihat Detail" />

                    <v-menu>
                        <template #activator="{ props }">
                            <v-btn icon="mdi-download" size="small" variant="text" color="primary" v-bind="props"
                                title="Download Data" />
                        </template>

                        <v-list>
                            <v-list-item v-for="option in downloadOptions" :key="option.value"
                                @click="downloadData(item, option.value)">
                                <template #prepend>
                                    <v-icon>{{ option.icon }}</v-icon>
                                </template>
                                <v-list-item-title>{{ option.text }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>

                <template #loading>
                    <v-skeleton-loader type="table-row@5" />
                </template>

                <template #no-data>
                    <div class="text-center py-8">
                        <v-icon size="64" color="grey-lighten-1">
                            mdi-folder-open
                        </v-icon>
                        <p class="text-h6 text-grey mt-4">
                            Tidak ada data sensor
                        </p>
                    </div>
                </template>
            </v-data-table>
        </v-card-text>

        <v-dialog v-model="downloadDialog" max-width="400" persistent>
            <v-card>
                <v-card-text class="text-center pa-6">
                    <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
                    <div class="text-h6">Mengunduh data...</div>
                    <div class="text-caption text-grey mt-2">{{ downloadStatus }}</div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
            {{ snackbarText }}
            <template #actions>
                <v-btn variant="text" @click="snackbar = false">Tutup</v-btn>
            </template>
        </v-snackbar>
    </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDevices } from '@/composables/useDevices'
import { deviceAPI } from '@/services/api'

const router = useRouter()

const { devices, loading } = useDevices()

const search = ref('')
const filterLocation = ref(null)
const downloadDialog = ref(false)
const downloadStatus = ref('')
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const headers = [
    { title: 'Nama Sensor', key: 'sensor_name' },
    { title: 'Alat', key: 'device_name' },
    { title: 'Lokasi', key: 'location' },
    { title: 'Suhu', key: 'suhu' },
    { title: 'Kelembapan', key: 'kelembapan' },
    { title: 'Status', key: 'status' },
    { title: 'Action', key: 'action', sortable: false }
]

const sensorItems = computed(() => {
    return devices.value.flatMap(device => {
        const rows = []
        if (device.sensor1_name) {
            rows.push({
                sensor_id: device.sensor1_id,
                sensor_name: device.sensor1_name,
                device_name: device.name,
                device_id: device.id_alat,
                location: device.location,
                suhu: device.suhu1,
                kelembapan: device.kelembapan1,
                status: (device.suhu1 === undefined && device.kelembapan1 === undefined)
                    ? 'Sensor Off'
                    : device.kategori
            })
        }

        if (device.sensor2_name) {
            rows.push({
                sensor_id: device.sensor2_id,
                sensor_name: device.sensor2_name,
                device_name: device.name,
                device_id: device.id_alat,
                location: device.location,
                suhu: device.suhu2,
                kelembapan: device.kelembapan2,
                status: (device.suhu2 === undefined && device.kelembapan2 === undefined)
                    ? 'Sensor Off'
                    : device.kategori
            })
        }

        return rows
    })
})

const locationOptions = computed(() => {
    const locations = [...new Set(sensorItems.value.map(item => item.location))]

    locations.sort((a, b) => a.localeCompare(b, 'id'))

    return locations.map(loc => ({
        text: loc,
        value: loc
    }))
})

const filteredSensorItems = computed(() => {
    let items = sensorItems.value

    if (filterLocation.value) {
        items = items.filter(item => item.location === filterLocation.value)
    }

    return items
})

const goToDeviceDetail = (item) => {
    if (item && item.device_id) {
        router.push(`/device/${item.device_id}`)
    }
}

const getStatusColor = (status) => {
    if (status === 'Normal') return 'success'
    if (status === 'Sensor Off') return 'grey'
    return 'error'
}

const getStatusIcon = (status) => {
    if (status === 'Normal') return 'mdi-check-circle'
    if (status === 'Sensor Off') return 'mdi-help-circle'
    return 'mdi-alert-circle'
}

const downloadOptions = [
    { value: 1, text: '1 Jam Terakhir', icon: 'mdi-clock-outline' },
    { value: 3, text: '3 Jam Terakhir', icon: 'mdi-clock-outline' },
    { value: 6, text: '6 Jam Terakhir', icon: 'mdi-clock-outline' },
    { value: 24, text: '24 Jam Terakhir', icon: 'mdi-clock-outline' },
    { value: 'all', text: 'Semua Data', icon: 'mdi-database' }
]

const downloadData = async (item, hours) => {
    if (!item.sensor_id) {
        snackbarColor.value = 'error'
        snackbarText.value = 'Sensor ID tidak valid'
        snackbar.value = true
        return
    }

    if (item.status === 'Sensor Off') {
        snackbarColor.value = 'warning'
        snackbarText.value = 'Sensor ini belum memiliki data untuk diunduh'
        snackbar.value = true
        return
    }

    downloadDialog.value = true
    downloadStatus.value = 'Mengambil data...'

    try {
        console.log(`Downloading data for sensor ${item.sensor_id} (${item.sensor_name}), period: ${hours}`)

        downloadStatus.value = 'Mengambil semua data suhu dan kelembapan...'

        const [suhuRes, kelembapanRes] = await Promise.all([
            deviceAPI.getAllSuhu(),
            deviceAPI.getAllKelembapan()
        ])

        if (!suhuRes.data.success || !kelembapanRes.data.success) {
            throw new Error('Gagal mengambil data sensor')
        }

        const suhuData = suhuRes.data.data.data || []
        const kelembapanData = kelembapanRes.data.data.data || []

        console.log(`Total data fetched - Suhu: ${suhuData.length}, Kelembapan: ${kelembapanData.length}`)

        downloadStatus.value = 'Memfilter data...'

        const now = new Date()
        const limit = hours === 'all'
            ? new Date(0)
            : new Date(now - hours * 60 * 60 * 1000)

        const filteredSuhu = suhuData.filter(d =>
            d.id_sensor === item.sensor_id &&
            new Date(d.created_at) >= limit
        )

        const filteredKelembapan = kelembapanData.filter(d =>
            d.id_sensor === item.sensor_id &&
            new Date(d.created_at) >= limit
        )

        console.log(`Found ${filteredSuhu.length} suhu records, ${filteredKelembapan.length} kelembapan records`)

        downloadStatus.value = 'Menyusun data...'

        const rows = []
        const header = ['Timestamp', 'Sensor', 'Alat', 'Lokasi', 'Jenis', 'Nilai', 'Satuan']
        rows.push(header)
        const allData = []

        filteredSuhu.forEach(d => {
            allData.push({
                timestamp: new Date(d.created_at),
                sensor: item.sensor_name,
                alat: item.device_name,
                lokasi: item.location,
                jenis: 'Suhu',
                nilai: d.nilai_suhu,
                satuan: '°C'
            })
        })

        filteredKelembapan.forEach(d => {
            allData.push({
                timestamp: new Date(d.created_at),
                sensor: item.sensor_name,
                alat: item.device_name,
                lokasi: item.location,
                jenis: 'Kelembapan',
                nilai: d.nilai_kelembapan,
                satuan: '%'
            })
        })

        allData.sort((a, b) => a.timestamp - b.timestamp)
        allData.forEach(d => {
            rows.push([
                d.timestamp.toLocaleString('id-ID'),
                d.sensor,
                d.alat,
                d.lokasi,
                d.jenis,
                d.nilai,
                d.satuan
            ])
        })

        if (rows.length <= 1) {
            downloadDialog.value = false
            snackbarColor.value = 'warning'
            snackbarText.value = 'Tidak ada data untuk periode yang dipilih'
            snackbar.value = true
            return
        }

        downloadStatus.value = 'Menyiapkan file...'

        downloadCSV(rows, item.sensor_name, hours)

        downloadDialog.value = false
        snackbarColor.value = 'success'
        snackbarText.value = `Berhasil mengunduh ${rows.length - 1} data`
        snackbar.value = true

        console.log('Download complete!')

    } catch (error) {
        console.error('Error downloading data:', error)
        downloadDialog.value = false
        snackbarColor.value = 'error'
        snackbarText.value = error.message || 'Gagal mengunduh data'
        snackbar.value = true
    }
}

const downloadCSV = (rows, sensorName, hours) => {
    const csv = rows
        .map(r => r.map(c => `"${c}"`).join(','))
        .join('\n')

    const blob = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8;'
    })

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const period = hours === 'all' ? 'semua' : `${hours}jam`
    const filename = `${sensorName}_${period}_${timestamp}.csv`

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    console.log(`File saved: ${filename}`)
}
</script>

<style scoped>
.sensor-name {
    font-weight: 500;
}

.v-data-table :deep(.v-data-table__th) {
    font-weight: 600;
    background-color: rgb(var(--v-theme-surface));
}
</style>