<template>
    <v-card class="pa-4">
        <!-- Header dengan Kategori -->
        <v-card-title class="d-flex justify-space-between align-center flex-wrap">
            <span class="text-h6 font-weight-bold">
                {{ device.name }} — {{ device.location }}
            </span>
        </v-card-title>

        <!-- Card Data Sensor -->
        <v-row>
            <v-col v-for="card in sensorCards" :key="card.title" cols="12" sm="6" md="3">
                <v-card :class="card.gradientClass" class="text-center py-4 sensor-card">
                    <v-icon size="36" class="mb-2 card-icon">{{ card.icon }}</v-icon>
                    <div class="text-h6 card-text">{{ card.title }}</div>
                    <div class="text-h5 font-weight-bold card-text">{{ card.value }}</div>
                </v-card>
            </v-col>
        </v-row>

        <!-- Grafik -->
        <v-card class="mt-6 pa-4">
            <v-card-title class="text-subtitle-1 font-weight-bold mb-2">
                Grafik Realtime Sensor
            </v-card-title>
            <div style="height:300px; position:relative;">
                <canvas ref="chartCanvas"></canvas>
            </div>
        </v-card>
    </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, shallowRef, markRaw } from 'vue'
import Chart from 'chart.js/auto'
import { useDevices } from '@/composables/useDevices'
import { useSensorData } from '@/composables/useSensorData'

const props = defineProps({
    device: {
        type: Object,
        required: true
    }
})

const { updateDeviceKategori } = useDevices()
const { fetchSensorData } = useSensorData(props.device.id_alat)

const chartCanvas = ref(null)
const chart = shallowRef(null)
const sensorCards = ref([])
const isUsingAPI = ref(false)

const chartData = ref({
    labels: [],
    suhu1: [],
    suhu2: [],
    kelembapan1: [],
    kelembapan2: [],
})

let interval = null

const deviceKategori = computed(() => {
    const allNormal = sensorCards.value.every(card => card.isNormal !== false)
    return allNormal ? 'Normal' : 'Tidak Normal'
})

// ✅ Range UNIVERSAL untuk semua device
const normalRanges = {
    suhu1: { min: 25, max: 35 },
    suhu2: { min: 25, max: 35 },
    kelembapan1: { min: 20, max: 50 },
    kelembapan2: { min: 20, max: 50 },
}

function isValueNormal(value, sensorType) {
    const range = normalRanges[sensorType]
    if (!range) return true
    return value >= range.min && value <= range.max
}

async function updateData() {
    try {
        console.log('🔄 Fetching new data from API...')

        const apiData = await fetchSensorData()

        if (apiData) {
            console.log('✅ Data received from API:', apiData)
            isUsingAPI.value = true

            const data = {
                suhu1: parseFloat(apiData.suhu1).toFixed(1),
                suhu2: parseFloat(apiData.suhu2).toFixed(1),
                kelembapan1: parseFloat(apiData.kelembapan1).toFixed(1),
                kelembapan2: parseFloat(apiData.kelembapan2).toFixed(1),
            }

            updateDataDisplay(data)
        } else {
            console.warn('⚠️ No data from API')
            isUsingAPI.value = false
        }
    } catch (err) {
        console.error('❌ Error fetching data:', err)
        isUsingAPI.value = false
    }
}

function updateDataDisplay(data) {
    sensorCards.value = [
        {
            title: 'Suhu 1',
            value: `${data.suhu1} °C`,
            icon: 'mdi-thermometer',
            gradientClass: 'gradient-blue',
            isNormal: isValueNormal(parseFloat(data.suhu1), 'suhu1')
        },
        {
            title: 'Suhu 2',
            value: `${data.suhu2} °C`,
            icon: 'mdi-thermometer',
            gradientClass: 'gradient-orange',
            isNormal: isValueNormal(parseFloat(data.suhu2), 'suhu2')
        },
        {
            title: 'Kelembapan 1',
            value: `${data.kelembapan1}%`,
            icon: 'mdi-water-percent',
            gradientClass: 'gradient-purple',
            isNormal: isValueNormal(parseFloat(data.kelembapan1), 'kelembapan1')
        },
        {
            title: 'Kelembapan 2',
            value: `${data.kelembapan2}%`,
            icon: 'mdi-water-percent',
            gradientClass: 'gradient-teal',
            isNormal: isValueNormal(parseFloat(data.kelembapan2), 'kelembapan2')
        },
    ]

    updateDeviceKategori(props.device.id_alat, {
        suhu1: parseFloat(data.suhu1),
        suhu2: parseFloat(data.suhu2),
        kelembapan1: parseFloat(data.kelembapan1),
        kelembapan2: parseFloat(data.kelembapan2),
    })

    const time = new Date().toLocaleTimeString()
    chartData.value.labels.push(time)
    chartData.value.suhu1.push(parseFloat(data.suhu1))
    chartData.value.suhu2.push(parseFloat(data.suhu2))
    chartData.value.kelembapan1.push(parseFloat(data.kelembapan1))
    chartData.value.kelembapan2.push(parseFloat(data.kelembapan2))

    if (chartData.value.labels.length > 10) {
        chartData.value.labels.shift()
        chartData.value.suhu1.shift()
        chartData.value.suhu2.shift()
        chartData.value.kelembapan1.shift()
        chartData.value.kelembapan2.shift()
    }

    if (chart.value) {
        const c = chart.value
        c.data.labels = chartData.value.labels.slice()
        c.data.datasets[0].data = chartData.value.suhu1.slice()
        c.data.datasets[1].data = chartData.value.suhu2.slice()
        c.data.datasets[2].data = chartData.value.kelembapan1.slice()
        c.data.datasets[3].data = chartData.value.kelembapan2.slice()
        c.update()
    }
}

function createChart() {
    if (!chartCanvas.value) return

    if (chart.value) {
        chart.value.destroy()
        chart.value = null
    }

    const ctx = chartCanvas.value.getContext('2d')
    const config = {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Suhu 1 (°C)',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Suhu 2 (°C)',
                    data: [],
                    borderColor: 'rgb(249, 115, 22)',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Kelembapan 1 (%)',
                    data: [],
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Kelembapan 2 (%)',
                    data: [],
                    borderColor: 'rgb(20, 184, 166)',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                    tension: 0.4,
                    fill: false
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 250 },
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }
                },
                x: {
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }
                }
            },
        },
    }

    chart.value = markRaw(new Chart(ctx, config))
}

function initDashboard() {
    if (!props.device) return

    chartData.value = {
        labels: [],
        suhu1: [],
        suhu2: [],
        kelembapan1: [],
        kelembapan2: [],
    }
    sensorCards.value = []

    createChart()
    updateData()

    if (interval) clearInterval(interval)
    interval = setInterval(updateData, 30000)
}

function teardown() {
    if (interval) {
        clearInterval(interval)
        interval = null
    }
    if (chart.value) {
        chart.value.destroy()
        chart.value = null
    }
}

onMounted(async () => {
    await nextTick()
    initDashboard()
})

watch(
    () => props.device?.id_alat,  // ✅ Hapus props.device?.type
    () => {
        teardown()
        nextTick().then(() => initDashboard())
    }
)

onBeforeUnmount(() => {
    teardown()
})
</script>

<style scoped>
/* Card styling */
.sensor-card {
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.sensor-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3) !important;
}

/* Icon dan Text berwarna putih */
.card-icon {
    color: #ffffff !important;
}

.card-text {
    color: #ffffff !important;
}

/* ✅ Gradasi Modern */
.gradient-blue {
    background: linear-gradient(135deg, #00005C 0%, #00D4FF 100%) !important;
}

.gradient-orange {
    background: linear-gradient(135deg, #3A1C71 0%, #FDBB2D 100%) !important;
}

.gradient-purple {
    background: linear-gradient(135deg, #3a47d5 0%, #00d2ff 100%) !important;
}

.gradient-teal {
    background: linear-gradient(135deg, #92FE9D 0%, #00C9FF 100%) !important;
}
</style>