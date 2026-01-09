<template>
    <v-card>
        <v-card-title>Daftar Sensor</v-card-title>

        <v-card-text>
            <!-- SEARCH & FILTER -->
            <v-row dense class="mb-4">
                <v-col cols="12" md="6">
                    <v-text-field v-model="search" label="Cari" prepend-inner-icon="mdi-magnify" variant="outlined"
                        density="comfortable" clearable />
                </v-col>

                <v-col cols="12" md="6">
                    <v-select v-model="filterLocation" :items="locationOptions" item-title="text" item-value="value"
                        label="Filter Lokasi" prepend-inner-icon="mdi-map-marker" variant="outlined"
                        density="comfortable" clearable />
                </v-col>
            </v-row>

            <!-- TABLE -->
            <v-data-table :headers="headers" :items="filteredSensorItems" :search="search" items-per-page="100"
                :loading="loading">
                <template #item.sensor_name="{ item }">
                    <v-icon size="small" color="blue" class="me-1">
                        mdi-thermometer
                    </v-icon>
                    {{ item.sensor_name }}
                </template>

                <template #item.device_name="{ item }">
                    <v-chip size="small" variant="outlined">
                        {{ item.device_name }}
                    </v-chip>
                </template>

                <template #item.location="{ item }">
                    <v-icon size="small" color="red" class="me-1">
                        mdi-map-marker
                    </v-icon>
                    {{ item.location }}
                </template>

                <template #item.suhu="{ item }">
                    <strong v-if="item.suhu !== undefined">
                        {{ item.suhu }}°C
                    </strong>
                    <span v-else>-</span>
                </template>

                <template #item.kelembapan="{ item }">
                    <strong v-if="item.kelembapan !== undefined">
                        {{ item.kelembapan }}%
                    </strong>
                    <span v-else>-</span>
                </template>

                <template #item.status="{ item }">
                    <v-chip size="small" :color="getStatusColor(item.status)"
                        :prepend-icon="getStatusIcon(item.status)">
                        {{ item.status }}
                    </v-chip>
                </template>

                <template #item.action="{ item }">
                    <v-btn icon="mdi-eye" variant="text" color="info" @click="goToDeviceDetail(item)" />
                    <v-menu>
                        <template #activator="{ props }">
                            <v-btn icon="mdi-download" variant="text" color="primary" v-bind="props" />
                        </template>

                        <v-list>
                            <v-list-item v-for="opt in downloadOptions" :key="opt.value"
                                @click="downloadData(item, opt.value)">
                                <template #prepend>
                                    <v-icon>{{ opt.icon }}</v-icon>
                                </template>
                                <v-list-item-title>
                                    {{ opt.text }}
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>

                <template #no-data>
                    <div class="text-center py-6">
                        <v-icon size="64">mdi-folder-open</v-icon>
                        <div>Tidak ada data</div>
                    </div>
                </template>
            </v-data-table>
        </v-card-text>

        <!-- PROGRESS -->
        <v-dialog v-model="downloadDialog" persistent max-width="360">
            <v-card class="pa-6 text-center">
                <v-progress-circular indeterminate size="64" />
                <div class="mt-4">{{ downloadStatus }}</div>
            </v-card>
        </v-dialog>

        <!-- DATE RANGE -->
        <v-dialog v-model="dateRangeDialog" max-width="420">
            <v-card>
                <v-card-title>Pilih Rentang Tanggal</v-card-title>
                <v-card-text>
                    <v-date-picker v-model="dateRange" multiple="range" color="primary" />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn text @click="dateRangeDialog = false">
                        Batal
                    </v-btn>
                    <v-btn color="primary" @click="downloadByDateRange">
                        Unduh
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- SNACKBAR -->
        <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
            {{ snackbarText }}
        </v-snackbar>
    </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDevices } from '@/composables/useDevices'
import { useBatasan } from '@/composables/useBatasan'
import { deviceAPI } from '@/services/api'
import * as XLSX from 'xlsx'

/* ================= STATE ================= */
const router = useRouter()
const search = ref('')
const filterLocation = ref(null)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const downloadDialog = ref(false)
const downloadStatus = ref('')

const dateRangeDialog = ref(false)
const dateRange = ref([])
const selectedItem = ref(null)

const { devices, loading } = useDevices()
const { isSensorNormal, loadAllBatasan } = useBatasan()

onMounted(() => {
    loadAllBatasan()
})

const headers = [
    { title: 'Nama Sensor', key: 'sensor_name' },
    { title: 'Alat', key: 'device_name' },
    { title: 'Lokasi', key: 'location' },
    { title: 'Suhu', key: 'suhu' },
    { title: 'Kelembapan', key: 'kelembapan' },
    { title: 'Status', key: 'status' },
    { title: 'Action', key: 'action', sortable: false }
]

const sensorItems = computed(() =>
    devices.value.flatMap(d => {
        const rows = []

        if (d.sensor1_id) {
            let status = 'Normal'
            if (d.suhu1 === undefined && d.kelembapan1 === undefined) {
                status = 'Sensor Off'
            } else if (!isSensorNormal(d.sensor1_id, d.suhu1, d.kelembapan1)) {
                status = 'Tidak Normal'
            }

            rows.push({
                sensor_id: d.sensor1_id,
                sensor_name: d.sensor1_name,
                device_name: d.name,
                device_id: d.id_alat,
                location: d.location,
                suhu: d.suhu1,
                kelembapan: d.kelembapan1,
                status
            })
        }

        if (d.sensor2_id) {
            let status = 'Normal'
            if (d.suhu2 === undefined && d.kelembapan2 === undefined) {
                status = 'Sensor Off'
            } else if (!isSensorNormal(d.sensor2_id, d.suhu2, d.kelembapan2)) {
                status = 'Tidak Normal'
            }

            rows.push({
                sensor_id: d.sensor2_id,
                sensor_name: d.sensor2_name,
                device_name: d.name,
                device_id: d.id_alat,
                location: d.location,
                suhu: d.suhu2,
                kelembapan: d.kelembapan2,
                status
            })
        }

        return rows
    })
)

const filteredSensorItems = computed(() =>
    filterLocation.value
        ? sensorItems.value.filter(i => i.location === filterLocation.value)
        : sensorItems.value
)

const locationOptions = computed(() =>
    [...new Set(sensorItems.value.map(i => i.location))]
        .sort()
        .map(v => ({ text: v, value: v }))
)

const downloadOptions = [
    { value: 1, text: '1 Jam Terakhir', icon: 'mdi-clock-outline' },
    { value: 3, text: '3 Jam Terakhir', icon: 'mdi-clock-outline' },
    { value: 6, text: '6 Jam Terakhir', icon: 'mdi-clock-outline' },
    { value: 24, text: '24 Jam Terakhir', icon: 'mdi-clock-outline' },
    { value: 'range', text: 'Pilih Rentang Tanggal', icon: 'mdi-calendar-range' }
]

const downloadData = (item, value) => {
    if (value === 'range') {
        selectedItem.value = item
        dateRangeDialog.value = true
        return
    }
    processDownload(item, value)
}

const downloadByDateRange = () => {
    if (!Array.isArray(dateRange.value) || dateRange.value.length !== 2) {
        snackbarColor.value = 'warning'
        snackbarText.value = 'Pilih tanggal awal & akhir'
        snackbar.value = true
        return
    }

    const [start, end] = dateRange.value

    processDownload(selectedItem.value, {
        start: new Date(`${start}T00:00:00`).getTime(),
        end: new Date(`${end}T23:59:59`).getTime()
    })

    dateRangeDialog.value = false
    dateRange.value = []
}

const processDownload = async (item, filter) => {
    downloadDialog.value = true
    downloadStatus.value = 'Mengambil data...'

    const [suhuRes, kelembapanRes] = await Promise.all([
        deviceAPI.getAllSuhu(),
        deviceAPI.getAllKelembapan()
    ])

    const suhuData = suhuRes.data.data.data || []
    const kelembapanData = kelembapanRes.data.data.data || []

    let startMs = 0
    let endMs = Date.now()

    if (typeof filter === 'number') {
        startMs = Date.now() - filter * 60 * 60 * 1000
    } else {
        startMs = filter.start
        endMs = filter.end
    }

    const validTime = d => {
        const t = new Date(d.created_at.replace(' ', 'T')).getTime()
        return t >= startMs && t <= endMs
    }

    const suhuSheet = [['Timestamp', 'Sensor', 'Alat', 'Lokasi', 'Nilai', 'Satuan']]
    const kelembapanSheet = [['Timestamp', 'Sensor', 'Alat', 'Lokasi', 'Nilai', 'Satuan']]

    suhuData
        .filter(d => d.id_sensor === item.sensor_id && validTime(d))
        .forEach(d => {
            suhuSheet.push([
                new Date(d.created_at.replace(' ', 'T')).toLocaleString('id-ID'),
                item.sensor_name,
                item.device_name,
                item.location,
                Number(d.nilai_suhu),
                '°C'
            ])
        })

    kelembapanData
        .filter(d => d.id_sensor === item.sensor_id && validTime(d))
        .forEach(d => {
            kelembapanSheet.push([
                new Date(d.created_at.replace(' ', 'T')).toLocaleString('id-ID'),
                item.sensor_name,
                item.device_name,
                item.location,
                Number(d.nilai_kelembapan),
                '%'
            ])
        })

    if (suhuSheet.length === 1 && kelembapanSheet.length === 1) {
        downloadDialog.value = false
        snackbarColor.value = 'warning'
        snackbarText.value = 'Tidak ada data'
        snackbar.value = true
        return
    }

    const wb = XLSX.utils.book_new()

    if (suhuSheet.length > 1)
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(suhuSheet), 'Suhu')

    if (kelembapanSheet.length > 1)
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.aoa_to_sheet(kelembapanSheet),
            'Kelembapan'
        )

    XLSX.writeFile(
        wb,
        `${item.sensor_name}_${new Date().toISOString().slice(0, 19)}.xlsx`
    )

    downloadDialog.value = false
}

const goToDeviceDetail = item =>
    router.push(`/device/${item.device_id}?sensor=${item.sensor_id}`)

const getStatusColor = s =>
    s === 'Normal' ? 'success' : s === 'Sensor Off' ? 'grey' : 'error'

const getStatusIcon = s =>
    s === 'Normal'
        ? 'mdi-check-circle'
        : s === 'Sensor Off'
            ? 'mdi-help-circle'
            : 'mdi-alert-circle'
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
