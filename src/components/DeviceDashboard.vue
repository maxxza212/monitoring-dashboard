<template>
    <v-card class="pa-4">
        <v-card-title class="text-h6 font-weight-bold">
            {{ device.name }} — {{ device.location }}
        </v-card-title>

        <!-- Card Data Sensor -->
        <v-row>
            <v-col v-for="card in sensorCards" :key="card.title" cols="12" sm="6" md="3">
                <v-card :color="card.color" dark class="text-center py-4">
                    <v-icon size="36" class="mb-2">{{ card.icon }}</v-icon>
                    <div class="text-h6">{{ card.title }}</div>
                    <div class="text-h5 font-weight-bold">{{ card.value }}</div>
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
import { ref, onMounted, onBeforeUnmount, watch, nextTick, shallowRef, markRaw } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
    device: {
        type: Object,
        required: true
    }
})

const chartCanvas = ref(null)
// gunakan shallowRef agar instance Chart tidak direaktifkan Vue
const chart = shallowRef(null)
const sensorCards = ref([])

// Boleh tetap reaktif untuk memudahkan logika, tapi JANGAN di-binding langsung ke Chart.js
const chartData = ref({
    labels: [],
    suhuKulkas: [],
    suhuRuangan: [],
    kelembapanKulkas: [],
    kelembapanRuangan: [],
})

let interval = null

function generateSensorDataByType(type) {
    switch (type) {
        case 'lab':
            return {
                suhuKulkas: (Math.random() * 2 + 3).toFixed(1),
                suhuRuangan: (Math.random() * 2 + 25).toFixed(1),
                kelembapanKulkas: (Math.random() * 10 + 50).toFixed(1),
                kelembapanRuangan: (Math.random() * 10 + 55).toFixed(1),
            }
        case 'gudang':
            return {
                suhuKulkas: (Math.random() * 3 + 8).toFixed(1),
                suhuRuangan: (Math.random() * 4 + 28).toFixed(1),
                kelembapanKulkas: (Math.random() * 10 + 60).toFixed(1),
                kelembapanRuangan: (Math.random() * 10 + 65).toFixed(1),
            }
        case 'coldroom':
            return {
                suhuKulkas: (Math.random() * 2 + 1).toFixed(1),
                suhuRuangan: (Math.random() * 3 + 20).toFixed(1),
                kelembapanKulkas: (Math.random() * 5 + 45).toFixed(1),
                kelembapanRuangan: (Math.random() * 10 + 50).toFixed(1),
            }
        default:
            return {
                suhuKulkas: (Math.random() * 5 + 5).toFixed(1),
                suhuRuangan: (Math.random() * 5 + 25).toFixed(1),
                kelembapanKulkas: (Math.random() * 10 + 55).toFixed(1),
                kelembapanRuangan: (Math.random() * 10 + 60).toFixed(1),
            }
    }
}

function updateData() {
    const data = generateSensorDataByType(props.device?.type)

    // Update cards
    sensorCards.value = [
        { title: 'Suhu Kulkas', value: `${data.suhuKulkas} °C`, icon: 'mdi-snowflake', color: 'blue' },
        { title: 'Suhu Ruangan', value: `${data.suhuRuangan} °C`, icon: 'mdi-thermometer', color: 'orange' },
        { title: 'Kelembapan Kulkas', value: `${data.kelembapanKulkas}%`, icon: 'mdi-water-percent', color: 'indigo' },
        { title: 'Kelembapan Ruangan', value: `${data.kelembapanRuangan}%`, icon: 'mdi-weather-rainy', color: 'teal' },
    ]

    // Update data lokal (reaktif) — Chart.js tidak memegang referensi langsung ke array ini
    const time = new Date().toLocaleTimeString()
    chartData.value.labels.push(time)
    chartData.value.suhuKulkas.push(parseFloat(data.suhuKulkas))
    chartData.value.suhuRuangan.push(parseFloat(data.suhuRuangan))
    chartData.value.kelembapanKulkas.push(parseFloat(data.kelembapanKulkas))
    chartData.value.kelembapanRuangan.push(parseFloat(data.kelembapanRuangan))

    // Batasi 10 point terakhir
    if (chartData.value.labels.length > 10) {
        chartData.value.labels.shift()
        chartData.value.suhuKulkas.shift()
        chartData.value.suhuRuangan.shift()
        chartData.value.kelembapanKulkas.shift()
        chartData.value.kelembapanRuangan.shift()
    }

    // Salin (clone) ke chart.data agar tidak share referensi dengan array reaktif
    if (chart.value) {
        const c = chart.value
        c.data.labels = chartData.value.labels.slice()
        c.data.datasets[0].data = chartData.value.suhuKulkas.slice()
        c.data.datasets[1].data = chartData.value.suhuRuangan.slice()
        c.data.datasets[2].data = chartData.value.kelembapanKulkas.slice()
        c.data.datasets[3].data = chartData.value.kelembapanRuangan.slice()
        c.update()
    }
}

function createChart() {
    if (!chartCanvas.value) return

    // hancurkan chart lama jika ada
    if (chart.value) {
        chart.value.destroy()
        chart.value = null
    }

    const ctx = chartCanvas.value.getContext('2d')
    const config = {
        type: 'line',
        data: {
            // PENTING: gunakan array baru (plain), jangan ambil referensi dari chartData.value.*
            labels: [],
            datasets: [
                {
                    label: 'Suhu Kulkas (°C)',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Suhu Ruangan (°C)',
                    data: [],
                    borderColor: 'rgb(249, 115, 22)',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Kelembapan Kulkas (%)',
                    data: [],
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Kelembapan Ruangan (%)',
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

    // markRaw agar instance Chart tidak diproxy oleh Vue
    chart.value = markRaw(new Chart(ctx, config))
}

function initDashboard() {
    if (!props.device) return

    // Reset data lokal
    chartData.value = {
        labels: [],
        suhuKulkas: [],
        suhuRuangan: [],
        kelembapanKulkas: [],
        kelembapanRuangan: [],
    }
    sensorCards.value = []

    createChart()
    updateData()

    if (interval) clearInterval(interval)
    interval = setInterval(updateData, 2000)
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

// Hindari deep: true yang bisa memicu reinit terus-menerus
watch(
    () => [props.device?.id, props.device?.type],
    () => {
        teardown()
        nextTick().then(() => initDashboard())
    }
)

onBeforeUnmount(() => {
    teardown()
})
</script>