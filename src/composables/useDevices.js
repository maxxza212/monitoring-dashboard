// src/composables/useDevices.js
import { ref } from 'vue'
import { deviceAPI } from '@/services/api'

const devices = ref([])
const sensors = ref([])
const loading = ref(false)
const error = ref(null)

export function useDevices() {
    //  Fetch devices dengan sensor data
    const fetchDevices = async () => {
        loading.value = true
        error.value = null

        try {
            console.log('Fetching devices from API...')

            // 1. Fetch alat
            const alatResponse = await deviceAPI.getAllDevices()

            // 2. Fetch ruangan
            const ruanganResponse = await deviceAPI.getAllRuangan()

            // 3. Fetch sensors
            const sensorsResponse = await deviceAPI.getAllSensors()

            // 4. Fetch suhu
            const suhuResponse = await deviceAPI.getAllSuhu()

            // 5. Fetch kelembapan
            const kelembapanResponse = await deviceAPI.getAllKelembapan()

            if (alatResponse.data.success) {
                // Buat map ruangan
                const ruanganMap = new Map()
                if (ruanganResponse.data.success) {
                    ruanganResponse.data.data.forEach(ruangan => {
                        ruanganMap.set(ruangan.id, ruangan.nama_ruangan)
                    })
                }

                // Buat map sensors by alat_id
                const sensorsByAlat = new Map()
                if (sensorsResponse.data.success) {
                    sensorsResponse.data.data.forEach(sensor => {
                        if (!sensorsByAlat.has(sensor.id_alat)) {
                            sensorsByAlat.set(sensor.id_alat, [])
                        }
                        sensorsByAlat.get(sensor.id_alat).push(sensor)
                    })
                }

                // Ambil data suhu dan kelembapan
                const suhuData = suhuResponse.data.success ? suhuResponse.data.data.data : []
                const kelembapanData = kelembapanResponse.data.success ? kelembapanResponse.data.data.data : []

                //  Map data alat dengan sensor data
                devices.value = alatResponse.data.data.map(alat => {
                    const alatSensors = sensorsByAlat.get(alat.id) || []
                    const sensor1 = alatSensors[0]
                    const sensor2 = alatSensors[1]

                    // Ambil data suhu terbaru untuk sensor 1 dan 2
                    const suhu1Data = suhuData.find(s => s.id_sensor === sensor1?.id)
                    const suhu2Data = suhuData.find(s => s.id_sensor === sensor2?.id)

                    // Ambil data kelembapan terbaru untuk sensor 1 dan 2
                    const kelembapan1Data = kelembapanData.find(k => k.id_sensor === sensor1?.id)
                    const kelembapan2Data = kelembapanData.find(k => k.id_sensor === sensor2?.id)

                    // Cek kategori berdasarkan sensor data
                    let kategori = 'Normal'
                    if (suhu1Data && suhu2Data && kelembapan1Data && kelembapan2Data) {
                        const sensorDataCheck = {
                            suhu1: parseFloat(suhu1Data.nilai_suhu),
                            suhu2: parseFloat(suhu2Data.nilai_suhu),
                            kelembapan1: parseFloat(kelembapan1Data.nilai_kelembapan),
                            kelembapan2: parseFloat(kelembapan2Data.nilai_kelembapan),
                        }
                        kategori = checkSensorNormal(sensorDataCheck) //  Tanpa parameter type
                    }

                    return {
                        id_alat: alat.id,
                        name: alat.nama_alat,
                        location: ruanganMap.get(alat.id_ruangan) || `Ruangan ${alat.id_ruangan}`,
                        kategori: kategori,
                        //  Hapus property 'type'
                        //  Tambahkan data sensor
                        suhu1: suhu1Data?.nilai_suhu ? parseFloat(suhu1Data.nilai_suhu).toFixed(1) : undefined,
                        suhu2: suhu2Data?.nilai_suhu ? parseFloat(suhu2Data.nilai_suhu).toFixed(1) : undefined,
                        kelembapan1: kelembapan1Data?.nilai_kelembapan ? parseFloat(kelembapan1Data.nilai_kelembapan).toFixed(1) : undefined,
                        kelembapan2: kelembapan2Data?.nilai_kelembapan ? parseFloat(kelembapan2Data.nilai_kelembapan).toFixed(1) : undefined,
                    }
                })

                console.log('Devices with sensor data loaded:', devices.value)
            }

            return devices.value
        } catch (err) {
            error.value = err.response?.data?.message || err.message
            console.error('Error fetching devices:', err)

            //  Fallback: Gunakan data dari sensors
            await fetchSensorsAsFallback()
            return devices.value
        } finally {
            loading.value = false
        }
    }

    //  Fallback: Gunakan data sensor untuk membuat device list
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
                            id_alat: alatId,
                            name: `ESP32 Board ${alatId}`,
                            location: `Lokasi ${alatId}`,
                            kategori: 'Normal',
                            //  Hapus property 'type'
                            sensors: []
                        })
                    }

                    deviceMap.get(alatId).sensors.push(sensor)
                })

                devices.value = Array.from(deviceMap.values())
                console.log('Devices created from sensors:', devices.value)
            }
        } catch (err) {
            console.error('Error fetching sensors:', err)

            // Final fallback: dummy data
            devices.value = [
                { id_alat: 1, name: 'ESP32 Board 1', location: 'Ruang Server', suhu1: '3', suhu2: '25', kelembapan1: '50', kelembapan2: '50', kategori: 'Normal' },
                { id_alat: 2, name: 'ESP32 Board 2', location: 'Ruang Lab Komputer', suhu1: '2', suhu2: '25', kelembapan1: '50', kelembapan2: '50', kategori: 'Normal' },
            ]
        }
    }

    //  Get device by ID
    const getDeviceById = (id) => {
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
                    id_alat: alat.id,
                    name: alat.nama_alat,
                    location: namaRuangan,
                    kategori: 'Normal',
                    //  Hapus property 'type'
                }
            }
        } catch (err) {
            console.error('Error fetching device:', err)
            return getDeviceById(id)
        } finally {
            loading.value = false
        }
    }

    //  Update kategori device
    const updateDeviceKategori = (deviceId, sensorData) => {
        const numericId = parseInt(deviceId)
        const device = devices.value.find(d => d.id_alat === numericId)
        if (!device) return

        const kategori = checkSensorNormal(sensorData) //  Tanpa parameter type
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

// ✅ Helper: Cek sensor normal - TANPA parameter deviceType
function checkSensorNormal(sensorData) {
    //  Satu range universal untuk semua device
    const ranges = {
        suhu1: { min: 2, max: 8 },
        suhu2: { min: 1, max: 25 },
        kelembapan1: { min: 45, max: 60 },
        kelembapan2: { min: 45, max: 60 },
    }

    const checks = [
        sensorData.suhu1 >= ranges.suhu1.min && sensorData.suhu1 <= ranges.suhu1.max,
        sensorData.suhu2 >= ranges.suhu2.min && sensorData.suhu2 <= ranges.suhu2.max,
        sensorData.kelembapan1 >= ranges.kelembapan1.min && sensorData.kelembapan1 <= ranges.kelembapan1.max,
        sensorData.kelembapan2 >= ranges.kelembapan2.min && sensorData.kelembapan2 <= ranges.kelembapan2.max,
    ]

    return checks.every(check => check) ? 'Normal' : 'Tidak Normal'
}