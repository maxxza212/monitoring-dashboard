<template>
    <v-card class="pa-4">
        <v-card-title class="d-flex justify-space-between align-center flex-wrap">
            <span class="text-h6 font-weight-bold">
                {{ device.name }} — {{ device.location }}
            </span>
        </v-card-title>

        <v-row>
            <v-col v-for="card in sensorCards" :key="card.title" cols="12" sm="6">
                <v-card :class="card.gradientClass" class="text-center py-4 sensor-card">
                    <v-icon size="36" class="mb-2 card-icon">{{ card.icon }}</v-icon>
                    <div class="text-h6 card-text">{{ card.title }}</div>
                    <div class="text-h5 font-weight-bold card-text">{{ card.value }}</div>
                </v-card>
            </v-col>
        </v-row>

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
import { useBatasan } from '@/composables/useBatasan'

const props = defineProps({
    device: {
        type: Object,
        required: true
    }
})

const { updateDeviceKategori } = useDevices()
const { fetchSensorData, deviceSensors } = useSensorData(props.device.id_alat)
const { loadAllBatasan, getBatasanBySensorId, isSuhuNormal, isKelembapanNormal } = useBatasan()

const chartCanvas = ref(null)
const chart = shallowRef(null)
const sensorCards = ref([])
const isUsingAPI = ref(false)
const currentSensorId = ref(null)

const chartData = ref({
    labels: [],
    suhu: [],
    kelembapan: [],
})

let interval = null

const deviceKategori = computed(() => {
    const allNormal = sensorCards.value.every(card => card.status === 'Normal')
    return allNormal ? 'Normal' : 'Tidak Normal'
})

async function updateData() {
    try {
        console.log('Fetching new data from API...')
        console.log('DEBUG deviceSensors (raw):', deviceSensors)

        const apiData = await fetchSensorData()

        if (apiData) {
            console.log('Data received from API:', apiData)
            isUsingAPI.value = true

            if (deviceSensors && deviceSensors.value && deviceSensors.value.length > 0) {
                currentSensorId.value = deviceSensors.value[0].id
            } else {
                console.warn('deviceSensors undefined or empty, cannot read first sensor id')
                currentSensorId.value = null
            }
            const data = {
                suhu: parseFloat(apiData.suhu1 ?? apiData.suhu2 ?? 0).toFixed(1),
                kelembapan: parseFloat(apiData.kelembapan1 ?? apiData.kelembapan2 ?? 0).toFixed(1),
            }

            updateDataDisplay(data)
        } else {
            console.warn('No data from API')
            isUsingAPI.value = false
        }
    } catch (err) {
        console.error('Error fetching data:', err)
        isUsingAPI.value = false
    }
}

function updateDataDisplay(data) {
    const defaultBatasan = { suhu_min: 2, suhu_max: 8, kelembapan_min: 45, kelembapan_max: 60 }
    let batasan = defaultBatasan

    if (currentSensorId.value) {
        const fetched = getBatasanBySensorId(currentSensorId.value)
        batasan = fetched || defaultBatasan
    }

    const suhuVal = parseFloat(data.suhu)
    const kelembapanVal = parseFloat(data.kelembapan)

    const suhuStatus = currentSensorId.value
        ? (typeof isSuhuNormal === 'function' && isSuhuNormal(currentSensorId.value, suhuVal) ? 'Normal' : 'Tidak Normal')
        : 'Normal'

    const kelembapanStatus = currentSensorId.value
        ? (typeof isKelembapanNormal === 'function' && isKelembapanNormal(currentSensorId.value, kelembapanVal) ? 'Normal' : 'Tidak Normal')
        : 'Normal'

    sensorCards.value = [
        {
            title: 'Suhu',
            value: `${data.suhu} °C`,
            icon: 'mdi-thermometer',
            gradientClass: 'gradient-blue',
            unit: '°C',
            range: { min: batasan.suhu_min, max: batasan.suhu_max },
            status: suhuStatus
        },
        {
            title: 'Kelembapan',
            value: `${data.kelembapan}%`,
            icon: 'mdi-water-percent',
            gradientClass: 'gradient-teal',
            unit: '%',
            range: { min: batasan.kelembapan_min, max: batasan.kelembapan_max },
            status: kelembapanStatus
        },
    ]

    updateDeviceKategori(props.device.id_alat, {
        suhu1: suhuVal,
        suhu2: 0,
        kelembapan1: kelembapanVal,
        kelembapan2: 0,
    })

    const time = new Date().toLocaleTimeString()
    chartData.value.labels.push(time)
    chartData.value.suhu.push(suhuVal)
    chartData.value.kelembapan.push(kelembapanVal)

    if (chartData.value.labels.length > 10) {
        chartData.value.labels.shift()
        chartData.value.suhu.shift()
        chartData.value.kelembapan.shift()
    }

    if (chart.value) {
        const c = chart.value
        c.data.labels = chartData.value.labels.slice()
        c.data.datasets[0].data = chartData.value.suhu.slice()
        c.data.datasets[1].data = chartData.value.kelembapan.slice()
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
                    label: 'Suhu (°C)',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y'
                },
                {
                    label: 'Kelembapan (%)',
                    data: [],
                    borderColor: 'rgb(20, 184, 166)',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y1'
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
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Suhu (°C)'
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Kelembapan (%)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                x: {
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }
                }
            },
        },
    }
    chart.value = markRaw(new Chart(ctx, config))
}

async function initDashboard() {
    if (!props.device) return

    await loadAllBatasan()

    chartData.value = {
        labels: [],
        suhu: [],
        kelembapan: [],
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
    () => props.device?.id_alat,
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
.sensor-card {
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.sensor-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3) !important;
}

.card-icon {
    color: #ffffff !important;
}

.card-text {
    color: #ffffff !important;
}

.gradient-blue {
    background: linear-gradient(135deg, #00005C 0%, #00D4FF 100%) !important;
}

.gradient-teal {
    background: linear-gradient(135deg, #92FE9D 0%, #00C9FF 100%) !important;
}
</style>