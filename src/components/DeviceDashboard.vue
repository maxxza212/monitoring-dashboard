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
                    <div class="text-h5 font-weight-bold card-text mb-2">
                        {{ card.value }}
                    </div>

                    <!-- CHIP BATASAN -->
                    <div class="d-flex justify-center gap-2 flex-wrap px-2">
                        <v-chip size="small" variant="elevated" :color="card.status === 'Normal' ? 'green' : 'red'"
                            class="text-white">
                            {{ card.title }}:
                            {{ card.range.min }}{{ card.unit }} –
                            {{ card.range.max }}{{ card.unit }}
                        </v-chip>
                    </div>
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
import { useRoute } from 'vue-router'
import Chart from 'chart.js/auto'
import { useDevices } from '@/composables/useDevices'
import { useSensorData } from '@/composables/useSensorData'
import { useBatasan } from '@/composables/useBatasan'

const route = useRoute() 

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
const sensor1Id = ref(null) 
const sensor2Id = ref(null) 

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
        const apiData = await fetchSensorData()

        if (apiData) {
            isUsingAPI.value = true

            const targetSensorId = route.query.sensor ? parseInt(route.query.sensor) : null

            if (deviceSensors && deviceSensors.value && deviceSensors.value.length > 0) {

                if (targetSensorId) {
                    const targetSensor = deviceSensors.value.find(s => s.id === targetSensorId)

                    if (targetSensor) {
                        sensor1Id.value = targetSensor.id
                        const otherSensor = deviceSensors.value.find(s => s.id !== targetSensorId)
                        sensor2Id.value = otherSensor?.id || null

                    } else {
                        sensor1Id.value = deviceSensors.value[0]?.id || null
                        sensor2Id.value = deviceSensors.value[1]?.id || null
                    }
                } else {
                    sensor1Id.value = deviceSensors.value[0]?.id || null
                    sensor2Id.value = deviceSensors.value[1]?.id || null
                }

            } else {
                sensor1Id.value = null
                sensor2Id.value = null
            }

            const data = {
                suhu: parseFloat(apiData.suhu1 ?? apiData.suhu2 ?? 0).toFixed(1),
                kelembapan: parseFloat(apiData.kelembapan1 ?? apiData.kelembapan2 ?? 0).toFixed(1),
            }

            await updateDataDisplay(data)
        } else {
            isUsingAPI.value = false
        }
    } catch (err) {
        isUsingAPI.value = false
    }
}

async function updateDataDisplay(data) {
    const defaultBatasan = { suhu_min: 2, suhu_max: 8, kelembapan_min: 45, kelembapan_max: 60 }

    let batasanSensor1 = defaultBatasan
    let batasanSensor2 = defaultBatasan

    if (sensor1Id.value) {
        const fetched1 = getBatasanBySensorId(sensor1Id.value)

        if (fetched1) {
            batasanSensor1 = fetched1
            console.log('Using sensor 1 specific batasan:', batasanSensor1)
        } else {
            console.warn('No batasan found for sensor 1 ID:', sensor1Id.value, '- using default')
        }
    }

    if (sensor2Id.value) {
        const fetched2 = getBatasanBySensorId(sensor2Id.value)
        console.log('Fetched batasan for Sensor 2:', fetched2)

        if (fetched2) {
            batasanSensor2 = fetched2
            console.log('Using sensor 2 specific batasan:', batasanSensor2)
        } else {
            console.warn('No batasan found for sensor 2 ID:', sensor2Id.value, '- using default')
        }
    }

    const suhuVal = parseFloat(data.suhu)
    const kelembapanVal = parseFloat(data.kelembapan)

    const suhuStatus = sensor1Id.value
        ? (typeof isSuhuNormal === 'function' && isSuhuNormal(sensor1Id.value, suhuVal) ? 'Normal' : 'Tidak Normal')
        : 'Normal'

    const kelembapanStatus = sensor2Id.value
        ? (typeof isKelembapanNormal === 'function' && isKelembapanNormal(sensor2Id.value, kelembapanVal) ? 'Normal' : 'Tidak Normal')
        : 'Normal'

    sensorCards.value = [
        {
            title: 'Suhu',
            value: `${data.suhu} °C`,
            icon: 'mdi-thermometer',
            gradientClass: 'gradient-blue',
            unit: '°C',
            range: { min: batasanSensor1.suhu_min, max: batasanSensor1.suhu_max }, // Sensor 1
            status: suhuStatus
        },
        {
            title: 'Kelembapan',
            value: `${data.kelembapan}%`,
            icon: 'mdi-water-percent',
            gradientClass: 'gradient-teal',
            unit: '%',
            range: { min: batasanSensor2.kelembapan_min, max: batasanSensor2.kelembapan_max }, // Sensor 2
            status: kelembapanStatus
        },
    ]

    console.log('Sensor cards updated:', sensorCards.value)

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

    await updateData()

    if (interval) clearInterval(interval)
    interval = setInterval(updateData, 20000)
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