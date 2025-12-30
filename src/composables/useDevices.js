import { ref } from 'vue'
import { deviceAPI } from '@/services/api'
import { useBatasan } from '@/composables/useBatasan'

const devices = ref([])
const sensors = ref([])
const sensorsByDevice = ref(new Map())
const loading = ref(false)
const error = ref(null)

export function useDevices() {
    const { loadAllBatasan, getBatasanBySensorId, isSuhuNormal, isKelembapanNormal } = useBatasan()

    const fetchDevices = async () => {
        loading.value = true
        error.value = null

        try {
            await loadAllBatasan()

            const alatResponse = await deviceAPI.getAllDevices()
            const ruanganResponse = await deviceAPI.getAllRuangan()
            const sensorsResponse = await deviceAPI.getAllSensors()
            const suhuResponse = await deviceAPI.getAllSuhu()
            const kelembapanResponse = await deviceAPI.getAllKelembapan()

            console.log('alat response', alatResponse.data.data)

            if (alatResponse.data.success) {
                const ruanganMap = new Map()
                if (ruanganResponse.data.success) {
                    ruanganResponse.data.data.forEach(ruangan => {
                        ruanganMap.set(ruangan.id, ruangan.nama_ruangan)
                    })
                }

                const sensorsByAlatTemp = new Map()
                if (sensorsResponse.data.success) {
                    sensors.value = sensorsResponse.data.data

                    sensorsResponse.data.data.forEach(sensor => {
                        if (!sensorsByAlatTemp.has(sensor.id_alat)) {
                            sensorsByAlatTemp.set(sensor.id_alat, [])
                        }
                        sensorsByAlatTemp.get(sensor.id_alat).push(sensor)
                    })

                    sensorsByAlatTemp.forEach((sensorList) => {
                        sensorList.sort((a, b) => a.id - b.id)
                    })

                    sensorsByDevice.value = sensorsByAlatTemp
                    console.log('Sensors map built:', sensorsByDevice.value)
                }

                const suhuData = suhuResponse.data.success ? suhuResponse.data.data.data : []
                const kelembapanData = kelembapanResponse.data.success ? kelembapanResponse.data.data.data : []

                console.log('Devices data:', devices.value)

                devices.value = alatResponse.data.data.map(alat => {
                    const alatSensors = sensorsByAlatTemp.get(alat.id) || []

                    const sensor1 = alatSensors[0]
                    const sensor2 = alatSensors[1]

                    const suhu1Data = suhuData.find(s => s.id_sensor === sensor1?.id)
                    const suhu2Data = suhuData.find(s => s.id_sensor === sensor2?.id)

                    const kelembapan1Data = kelembapanData.find(k => k.id_sensor === sensor1?.id)
                    const kelembapan2Data = kelembapanData.find(k => k.id_sensor === sensor2?.id)

                    let kategori = 'Normal'
                    if (sensor1 && sensor2 && suhu1Data && suhu2Data && kelembapan1Data && kelembapan2Data) {
                        const sensor1Normal = isSuhuNormal(sensor1.id, parseFloat(suhu1Data.nilai_suhu)) &&
                            isKelembapanNormal(sensor1.id, parseFloat(kelembapan1Data.nilai_kelembapan))

                        const sensor2Normal = isSuhuNormal(sensor2.id, parseFloat(suhu2Data.nilai_suhu)) &&
                            isKelembapanNormal(sensor2.id, parseFloat(kelembapan2Data.nilai_kelembapan))

                        kategori = (sensor1Normal && sensor2Normal) ? 'Normal' : 'Tidak Normal'
                    } else if (sensor1 && suhu1Data && kelembapan1Data) {
                        const sensor1Normal = isSuhuNormal(sensor1.id, parseFloat(suhu1Data.nilai_suhu)) &&
                            isKelembapanNormal(sensor1.id, parseFloat(kelembapan1Data.nilai_kelembapan))
                        kategori = sensor1Normal ? 'Normal' : 'Tidak Normal'
                    }

                    return {
                        id_alat: alat.id,
                        name: alat.nama_alat,
                        location: ruanganMap.get(alat.id_ruangan) || `Ruangan ${alat.id_ruangan}`,
                        kategori: kategori,
                        suhu1: suhu1Data?.nilai_suhu ? parseFloat(suhu1Data.nilai_suhu).toFixed(1) : undefined,
                        suhu2: suhu2Data?.nilai_suhu ? parseFloat(suhu2Data.nilai_suhu).toFixed(1) : undefined,
                        kelembapan1: kelembapan1Data?.nilai_kelembapan ? parseFloat(kelembapan1Data.nilai_kelembapan).toFixed(1) : undefined,
                        kelembapan2: kelembapan2Data?.nilai_kelembapan ? parseFloat(kelembapan2Data.nilai_kelembapan).toFixed(1) : undefined,
                        sensor1_id: sensor1?.id,
                        sensor1_name: sensor1?.nama_sensor,
                        sensor2_id: sensor2?.id,
                        sensor2_name: sensor2?.nama_sensor,
                    }
                })
            }

            return devices.value
        } catch (err) {
            console.log('Error fetching devices:', err)
            error.value = err.response?.data?.message || err.message
            await fetchSensorsAsFallback()
            return devices.value
        } finally {
            loading.value = false
        }
    }

    const fetchSensorsAsFallback = async () => {
        try {
            const response = await deviceAPI.getAllSensors()

            if (response.data.success) {
                sensors.value = response.data.data

                const deviceMap = new Map()

                response.data.data.forEach(sensor => {
                    const alatId = sensor.id_alat

                    if (!deviceMap.has(alatId)) {
                        deviceMap.set(alatId, {
                            id_alat: alatId,
                            name: `ESP32 Board ${alatId}`,
                            location: `Lokasi ${alatId}`,
                            kategori: 'Normal',
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
        }
    }

    const getDeviceById = (id) => {
        const numericId = parseInt(id)
        return devices.value.find(d => d.id_alat == numericId)
    }

    const fetchDeviceById = async (id) => {
        loading.value = true
        error.value = null

        try {
            const alatResponse = await deviceAPI.getDeviceById(id)

            if (alatResponse.data.success) {
                const alat = alatResponse.data.data

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
                }
            }
        } catch (err) {
            console.error('Error fetching device:', err)
            return getDeviceById(id)
        } finally {
            loading.value = false
        }
    }

    const updateDeviceKategori = async (deviceId, sensorData, sensorId = null) => {
        const numericId = parseInt(deviceId)
        const device = devices.value.find(d => d.id_alat === numericId)
        if (!device) return

        const suhuVal = sensorData.suhu2 || sensorData.suhu1 || 0
        const kelembapanVal = sensorData.kelembapan2 || sensorData.kelembapan1 || 0

        if (sensorId) {
            const suhuNormal = isSuhuNormal(sensorId, suhuVal)
            const kelembapanNormal = isKelembapanNormal(sensorId, kelembapanVal)
            device.kategori = (suhuNormal && kelembapanNormal) ? 'Normal' : 'Tidak Normal'
        } else {
            const batasan = getBatasanBySensorId(0)
            if (batasan) {
                const suhuNormal = suhuVal >= batasan.suhu_min && suhuVal <= batasan.suhu_max
                const kelembapanNormal = kelembapanVal >= batasan.kelembapan_min && kelembapanVal <= batasan.kelembapan_max

                device.kategori = (suhuNormal && kelembapanNormal) ? 'Normal' : 'Tidak Normal'
            }
        }
    }

    return {
        devices,
        sensors,
        sensorsByDevice,
        loading,
        error,
        fetchDevices,
        getDeviceById,
        fetchDeviceById,
        updateDeviceKategori
    }
}