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

            <!-- Action Column dengan Download Menu -->
            <template #item.action="{ item }">
                <v-menu>
                    <template v-slot:activator="{ props }">
                        <v-btn icon="mdi-download" size="small" variant="text" color="primary" v-bind="props"
                            @click.stop></v-btn>
                    </template>

                    <v-list>
                        <v-list-item v-for="option in downloadOptions" :key="option.value"
                            @click="downloadData(item, option.value)">
                            <template v-slot:prepend>
                                <v-icon>{{ option.icon }}</v-icon>
                            </template>
                            <v-list-item-title>{{ option.text }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>
        </v-data-table>

        <!-- Loading Dialog saat Download -->
        <v-dialog v-model="downloadDialog" max-width="400" persistent>
            <v-card>
                <v-card-text class="text-center pa-6">
                    <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
                    <div class="text-h6">Mengunduh data...</div>
                    <div class="text-caption text-grey">{{ downloadStatus }}</div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- Success Snackbar -->
        <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
            {{ snackbarText }}
            <template v-slot:actions>
                <v-btn variant="text" @click="snackbar = false">Tutup</v-btn>
            </template>
        </v-snackbar>
    </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDevices } from '@/composables/useDevices'
import { deviceAPI } from '@/services/api'

const router = useRouter()
const { devices } = useDevices()

const headers = [
    { title: 'Nama Alat', key: 'name' },
    { title: 'Lokasi', key: 'location' },
    { title: 'S1', key: 'suhu1' },
    { title: 'S2', key: 'suhu2' },
    { title: 'K1', key: 'kelembapan1' },
    { title: 'K2', key: 'kelembapan2' },
    { title: 'Kategori', key: 'kategori' },
    { title: 'Action', key: 'action', sortable: false },
]

// Download options
const downloadOptions = [
    { value: 1, text: 'Data 1 Jam Terakhir', icon: 'mdi-clock-outline' },
    { value: 3, text: 'Data 3 Jam Terakhir', icon: 'mdi-clock-outline' },
    { value: 6, text: 'Data 6 Jam Terakhir', icon: 'mdi-clock-outline' },
    { value: 24, text: 'Data 24 Jam Terakhir', icon: 'mdi-clock-outline' },
    { value: 'all', text: 'Semua Data', icon: 'mdi-database' },
]

// UI States
const downloadDialog = ref(false)
const downloadStatus = ref('')
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const goToDeviceDetail = (device) => {
    if (device && device.id_alat) {
        router.push(`/device/${device.id_alat}`)
    }
}

// Download data function
const downloadData = async (device, hours) => {
    try {
        downloadDialog.value = true
        downloadStatus.value = `Mengambil data ${hours === 'all' ? 'semua' : hours + ' jam'} terakhir...`

        console.log(`Downloading data for device ${device.id_alat}, period: ${hours} hours`)

        // 1. Fetch sensor data
        const sensorsResponse = await deviceAPI.getAllSensors()
        if (!sensorsResponse.data.success) {
            throw new Error('Gagal mengambil data sensor')
        }

        const deviceSensors = sensorsResponse.data.data.filter(
            sensor => sensor.id_alat === device.id_alat
        )

        if (deviceSensors.length === 0) {
            throw new Error('Tidak ada sensor untuk device ini')
        }

        // 2. Fetch suhu dan kelembapan
        downloadStatus.value = 'Mengambil data suhu dan kelembapan...'

        const [suhuResponse, kelembapanResponse] = await Promise.all([
            deviceAPI.getAllSuhu(),
            deviceAPI.getAllKelembapan()
        ])

        if (!suhuResponse.data.success || !kelembapanResponse.data.success) {
            throw new Error('Gagal mengambil data sensor')
        }

        const suhuData = suhuResponse.data.data.data || []
        const kelembapanData = kelembapanResponse.data.data.data || []

        // 3. Filter data berdasarkan waktu
        const now = new Date()
        const cutoffTime = hours === 'all' ? new Date(0) : new Date(now - hours * 60 * 60 * 1000)

        const sensorIds = deviceSensors.map(s => s.id)

        const filteredSuhu = suhuData.filter(item => {
            const itemTime = new Date(item.created_at)
            return sensorIds.includes(item.id_sensor) && itemTime >= cutoffTime
        })

        const filteredKelembapan = kelembapanData.filter(item => {
            const itemTime = new Date(item.created_at)
            return sensorIds.includes(item.id_sensor) && itemTime >= cutoffTime
        })

        // 4. Format data untuk CSV
        downloadStatus.value = 'Memproses data...'
        const csvData = formatDataToCSV(device, deviceSensors, filteredSuhu, filteredKelembapan)

        // 5. Download CSV
        downloadStatus.value = 'Menyiapkan file...'
        downloadCSV(csvData, device.name, hours)

        // Success
        downloadDialog.value = false
        snackbarColor.value = 'success'
        snackbarText.value = `Data berhasil diunduh! (${filteredSuhu.length + filteredKelembapan.length} record)`
        snackbar.value = true

    } catch (error) {
        console.error('❌ Download error:', error)
        downloadDialog.value = false
        snackbarColor.value = 'error'
        snackbarText.value = error.message || 'Gagal mengunduh data'
        snackbar.value = true
    }
}

// Format data to CSV - DIURUTKAN BERDASARKAN SENSOR ID & TIMESTAMP
const formatDataToCSV = (device, sensors, suhuData, kelembapanData) => {
    const rows = []

    // Header
    rows.push([
        'Timestamp',
        'Alat',
        'Lokasi',
        'Sensor ID',
        'Tipe Data',
        'Nilai',
        'Satuan'
    ])

    // Sensor mapping
    const sensorMap = new Map(sensors.map(s => [s.id, s]))

    // Gabungkan semua data (suhu + kelembapan) dalam satu array
    const allData = []

    // Add suhu data
    suhuData.forEach(item => {
        const sensor = sensorMap.get(item.id_sensor)
        allData.push({
            timestamp: new Date(item.created_at),
            timestampString: new Date(item.created_at).toLocaleString('id-ID'),
            alat: device.name,
            lokasi: device.location,
            sensorId: sensor?.id || item.id_sensor,
            tipeData: 'Suhu',
            nilai: item.nilai_suhu,
            satuan: '°C'
        })
    })

    // Add kelembapan data
    kelembapanData.forEach(item => {
        const sensor = sensorMap.get(item.id_sensor)
        allData.push({
            timestamp: new Date(item.created_at),
            timestampString: new Date(item.created_at).toLocaleString('id-ID'),
            alat: device.name,
            lokasi: device.location,
            sensorId: sensor?.id || item.id_sensor,
            tipeData: 'Kelembapan',
            nilai: item.nilai_kelembapan,
            satuan: '%'
        })
    })

    // Sort berdasarkan:
    // 1. Sensor ID (ascending: 1, 2, 3...)
    // 2. Timestamp (ascending: terlama → terbaru)
    allData.sort((a, b) => {
        // First: Sort by Sensor ID
        if (a.sensorId !== b.sensorId) {
            return a.sensorId - b.sensorId
        }

        // Second: Sort by Timestamp (oldest first)
        return a.timestamp - b.timestamp
    })

    // Convert sorted data ke rows
    allData.forEach(item => {
        rows.push([
            item.timestampString,
            item.alat,
            item.lokasi,
            item.sensorId,
            item.tipeData,
            item.nilai,
            item.satuan
        ])
    })

    return rows
}

// Download CSV file
const downloadCSV = (data, deviceName, hours) => {
    // Convert array to CSV string
    const csvContent = data.map(row =>
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

    // Create download link
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const period = hours === 'all' ? 'semua' : `${hours}jam`
    const filename = `${deviceName}_${period}_${timestamp}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
}
</script>