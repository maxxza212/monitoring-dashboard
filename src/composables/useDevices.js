import { ref } from 'vue'
import { deviceAPI } from '@/services/api'

const devices = ref([])
const sensors = ref([])
const loading = ref(false)
const error = ref(null)

export function useDevices() {
    // ✅ Fetch devices (alat) dari API
    const fetchDevices = async () => {
        loading.value = true
        error.value = null

        try {
            console.log('🔄 Fetching devices from API...')

            // Fetch alat
            const alatResponse = await deviceAPI.getAllDevices()

            // Fetch ruangan untuk ambil nama lokasi
            const ruanganResponse = await deviceAPI.getAllRuangan()

            if (alatResponse.data.success) {
                // Buat map ruangan untuk lookup cepat
                const ruanganMap = new Map()
                if (ruanganResponse.data.success) {
                    ruanganResponse.data.data.forEach(ruangan => {
                        ruanganMap.set(ruangan.id, ruangan.nama_ruangan)
                    })
                }

                // ✅ Map data dari API ke format yang dibutuhkan frontend
                devices.value = alatResponse.data.data.map(alat => ({
                    id_alat: alat.id, // ✅ Angka murni (1, 2, 3) tanpa prefix
                    name: alat.nama_alat,
                    location: ruanganMap.get(alat.id_ruangan) || `Ruangan ${alat.id_ruangan}`,
                    kategori: 'Normal',
                    type: alat.id === 1 ? 'lab' : alat.id === 2 ? 'gudang' : 'coldroom',
                }))

                console.log('✅ Devices loaded:', devices.value)
            }

            return devices.value
        } catch (err) {
            error.value = err.response?.data?.message || err.message
            console.error('❌ Error fetching devices:', err)

            // ⚠️ Fallback: Gunakan data dari sensors
            await fetchSensorsAsFallback()
            return devices.value
        } finally {
            loading.value = false
        }
    }

    // ✅ Fallback: Gunakan data sensor untuk membuat device list
    const fetchSensorsAsFallback = async () => {
        try {
            const response = await deviceAPI.getAllSensors()

            if (response.data.success) {
                sensors.value = response.data.data

                // Group sensors by id_alat
                const deviceMap = new Map()

                response.data.data.forEach(sensor => {
                    const alatId = sensor.id_alat

                    if (!deviceMap.has(alatId)) {
                        deviceMap.set(alatId, {
                            id_alat: alatId, // ✅ Angka murni
                            name: `ESP32 Board ${alatId}`,
                            location: `Lokasi ${alatId}`,
                            kategori: 'Normal',
                            type: alatId === 1 ? 'lab' : alatId === 2 ? 'gudang' : 'coldroom',
                            sensors: []
                        })
                    }

                    deviceMap.get(alatId).sensors.push(sensor)
                })

                devices.value = Array.from(deviceMap.values())
                console.log('✅ Devices created from sensors:', devices.value)
            }
        } catch (err) {
            console.error('❌ Error fetching sensors:', err)

            // Final fallback: dummy data
            devices.value = [
                { id_alat: 1, name: 'ESP32 Board 1', location: 'Ruang Server', kategori: 'Normal', type: 'lab' },
                { id_alat: 2, name: 'ESP32 Board 2', location: 'Ruang Lab Komputer', kategori: 'Normal', type: 'gudang' },
            ]
        }
    }

    // ✅ Get device by ID - sekarang pakai id_alat
    const getDeviceById = (id) => {
        // Convert ke number untuk matching
        const numericId = parseInt(id)
        return devices.value.find(d => d.id_alat === numericId)
    }

    // Fetch device detail dari API
    const fetchDeviceById = async (id) => {
        loading.value = true
        error.value = null

        try {
            const alatResponse = await deviceAPI.getDeviceById(id)

            if (alatResponse.data.success) {
                const alat = alatResponse.data.data

                // Ambil nama ruangan jika ada
                let namaRuangan = `Ruangan ${alat.id_ruangan}`
                try {
                    const ruanganResponse = await deviceAPI.getRuanganById(alat.id_ruangan)
                    if (ruanganResponse.data.success) {
                        namaRuangan = ruanganResponse.data.data.nama_ruangan
                    }
                } catch (err) {
                    console.warn('Could not fetch ruangan name')
                }

                return {
                    id_alat: alat.id, // ✅ Angka murni
                    name: alat.nama_alat,
                    location: namaRuangan,
                    kategori: 'Normal',
                    type: alat.id === 1 ? 'lab' : alat.id === 2 ? 'gudang' : 'coldroom',
                }
            }
        } catch (err) {
            console.error('❌ Error fetching device:', err)
            return getDeviceById(id)
        } finally {
            loading.value = false
        }
    }

    // ✅ Update kategori device
    const updateDeviceKategori = (deviceId, sensorData) => {
        const numericId = parseInt(deviceId)
        const device = devices.value.find(d => d.id_alat === numericId)
        if (!device) return

        const kategori = checkSensorNormal(sensorData, device.type)
        device.kategori = kategori
    }

    return {
        devices,
        sensors,
        loading,
        error,
        fetchDevices,
        getDeviceById,
        fetchDeviceById,
        updateDeviceKategori
    }
}

// Helper: Cek sensor normal
function checkSensorNormal(sensorData, deviceType) {
    const normalRanges = {
        lab: {
            suhu1: { min: 2, max: 8 },
            suhu2: { min: 20, max: 30 },
            kelembapan1: { min: 40, max: 70 },
            kelembapan2: { min: 40, max: 70 },
        },
        gudang: {
            suhu1: { min: 5, max: 15 },
            suhu2: { min: 25, max: 35 },
            kelembapan1: { min: 50, max: 80 },
            kelembapan2: { min: 50, max: 80 },
        },
        coldroom: {
            suhu1: { min: -2, max: 5 },
            suhu2: { min: 18, max: 25 },
            kelembapan1: { min: 40, max: 60 },
            kelembapan2: { min: 40, max: 70 },
        },
    }

    const ranges = normalRanges[deviceType] || normalRanges.lab

    const checks = [
        sensorData.suhu1 >= ranges.suhu1.min && sensorData.suhu1 <= ranges.suhu1.max,
        sensorData.suhu2 >= ranges.suhu2.min && sensorData.suhu2 <= ranges.suhu2.max,
        sensorData.kelembapan1 >= ranges.kelembapan1.min && sensorData.kelembapan1 <= ranges.kelembapan1.max,
        sensorData.kelembapan2 >= ranges.kelembapan2.min && sensorData.kelembapan2 <= ranges.kelembapan2.max,
    ]

    return checks.every(check => check) ? 'Normal' : 'Tidak Normal'
}