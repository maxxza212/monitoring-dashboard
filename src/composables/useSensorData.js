// src/composables/useSensorData.js
import { ref } from 'vue'
import { deviceAPI } from '@/services/api'

export function useSensorData(deviceId) {
    const sensorData = ref(null)
    const loading = ref(false)
    const error = ref(null)

    // ✅ Fetch sensor data dari API berdasarkan id_alat
    const fetchSensorData = async () => {
        if (!deviceId) return null

        loading.value = true
        error.value = null

        try {
            console.log(`🔄 Fetching sensor data for device ${deviceId}...`)

            // 1. Ambil daftar sensor untuk device ini
            const sensorsResponse = await deviceAPI.getAllSensors()

            if (!sensorsResponse.data.success) {
                throw new Error('Failed to fetch sensors')
            }

            // Filter sensors berdasarkan id_alat
            const deviceSensors = sensorsResponse.data.data.filter(
                sensor => sensor.id_alat === parseInt(deviceId)
            )

            console.log('📊 Device sensors:', deviceSensors)

            if (deviceSensors.length === 0) {
                console.warn('⚠️ No sensors found for this device')
                return null
            }

            // 2. Ambil data suhu dan kelembapan
            const suhuResponse = await deviceAPI.getAllSuhu()
            const kelembapanResponse = await deviceAPI.getAllKelembapan()

            if (!suhuResponse.data.success || !kelembapanResponse.data.success) {
                throw new Error('Failed to fetch sensor readings')
            }

            // ✅ Ambil dari data.data (pagination Laravel)
            const suhuData = suhuResponse.data.data.data || []
            const kelembapanData = kelembapanResponse.data.data.data || []

            console.log('🌡️ Suhu data:', suhuData)
            console.log('💧 Kelembapan data:', kelembapanData)

            // 3. Asumsi: sensor 1 = suhu1/kelembapan1, sensor 2 = suhu2/kelembapan2
            const sensor1 = deviceSensors[0]
            const sensor2 = deviceSensors[1]

            // Ambil nilai terbaru untuk masing-masing sensor (sudah diurutkan dari terbaru)
            const suhu1Data = suhuData.find(s => s.id_sensor === sensor1?.id)
            const suhu2Data = suhuData.find(s => s.id_sensor === sensor2?.id)

            const kelembapan1Data = kelembapanData.find(k => k.id_sensor === sensor1?.id)
            const kelembapan2Data = kelembapanData.find(k => k.id_sensor === sensor2?.id)

            // 4. Format data untuk frontend
            sensorData.value = {
                suhu1: suhu1Data?.nilai_suhu || 0,
                suhu2: suhu2Data?.nilai_suhu || 0,
                kelembapan1: kelembapan1Data?.nilai_kelembapan || 0,
                kelembapan2: kelembapan2Data?.nilai_kelembapan || 0,
                timestamp: new Date(),
            }

            console.log('✅ Sensor data loaded:', sensorData.value)
            return sensorData.value

        } catch (err) {
            error.value = err.response?.data?.message || err.message
            console.error('❌ Error fetching sensor data:', err)
            return null
        } finally {
            loading.value = false
        }
    }

    return {
        sensorData,
        loading,
        error,
        fetchSensorData
    }
}