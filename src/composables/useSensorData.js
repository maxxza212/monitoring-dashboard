import { ref } from 'vue'
import { deviceAPI } from '@/services/api'

export function useSensorData(deviceId) {
    const sensorData = ref(null)
    const loading = ref(false)
    const error = ref(null)

    // Fetch sensor data dari API berdasarkan id_alat
    const fetchSensorData = async () => {
        if (!deviceId) return null

        loading.value = true
        error.value = null

        try {
            console.log(`Fetching sensor data for device ${deviceId}...`)

            // 1. Ambil daftar sensor untuk device ini
            const sensorsResponse = await deviceAPI.getAllSensors()

            if (!sensorsResponse.data.success) {
                throw new Error('Failed to fetch sensors')
            }

            // Filter sensors berdasarkan id_alat (PERUBAHAN PERTAMA)
            const deviceSensors = sensorsResponse.data.data.filter(
                sensor => sensor.id_alat == parseInt(deviceId)
            )
            // const allSensors = sensorsResponse.data.data || []
            // const numericId = Number(deviceId)

            // const deviceSensors = allSensors.filter(
            //     sensor => Number(sensor.id_alat) === numericId
            // )

            console.log('Device sensors (before sort):', deviceSensors)

            if (deviceSensors.length === 0) {
                console.warn('No sensors found for this device')
                return null
            }

            // SORT SENSORS BY ID (ascending: ID terkecil = Sensor 1)
            deviceSensors.sort((a, b) => a.id - b.id)

            console.log('Device sensors (after sort):', deviceSensors)

            // 2. Ambil data suhu dan kelembapan
            const suhuResponse = await deviceAPI.getAllSuhu()
            const kelembapanResponse = await deviceAPI.getAllKelembapan()

            if (!suhuResponse.data.success || !kelembapanResponse.data.success) {
                throw new Error('Failed to fetch sensor readings')
            }

            // (PERUBAHAN KEDUA)
            // const suhuData = suhuResponse.data.data.data || []
            // const kelembapanData = kelembapanResponse.data.data.data || []
            const suhuData = suhuResponse.data.data?.data || []
            const kelembapanData = kelembapanResponse.data.data?.data || []

            console.log('Suhu data:', suhuData)
            console.log('Kelembapan data:', kelembapanData)

            // 3. Mapping sensor yang sudah di-sort dengan data suhu dan kelembapan
            const sensor1 = deviceSensors[0] 
            const sensor2 = deviceSensors[1] 
            console.log('Sensor 1 ID:', sensor1?.id)
            console.log('Sensor 2 ID:', sensor2?.id)

            const suhu1Data = suhuData.find(s => s.id_sensor === sensor1?.id)
            const suhu2Data = suhuData.find(s => s.id_sensor === sensor2?.id)

            const kelembapan1Data = kelembapanData.find(k => k.id_sensor === sensor1?.id)
            const kelembapan2Data = kelembapanData.find(k => k.id_sensor === sensor2?.id)

            console.log('Matched sensor values:', {
                suhu1: suhu1Data?.nilai_suhu,
                suhu2: suhu2Data?.nilai_suhu,
                kelembapan1: kelembapan1Data?.nilai_kelembapan,
                kelembapan2: kelembapan2Data?.nilai_kelembapan
            })

            // PERUBAHAN KETIGA
            // sensorData.value = {
            //     suhu1: suhu1Data?.nilai_suhu || 0,
            //     suhu2: suhu2Data?.nilai_suhu || 0,
            //     kelembapan1: kelembapan1Data?.nilai_kelembapan || 0,
            //     kelembapan2: kelembapan2Data?.nilai_kelembapan || 0,
            //     timestamp: new Date(),
            // }
            sensorData.value = {
                suhu1: Number(suhu1Data?.nilai_suhu ?? 0),
                suhu2: Number(suhu2Data?.nilai_suhu ?? 0),
                kelembapan1: Number(kelembapan1Data?.nilai_kelembapan ?? 0),
                kelembapan2: Number(kelembapan2Data?.nilai_kelembapan ?? 0),
            }


            console.log('Sensor data loaded:', sensorData.value)
            return sensorData.value

        } catch (err) {
            error.value = err.response?.data?.message || err.message
            console.error('Error fetching sensor data:', err)
            return null
        } finally {
            loading.value = false
        }
    }

    const getSensorByDeviceId = async (deviceId) => {
        if (deviceId == null) return console.error('Id Sensor Tidak ditemukan')
        const data = await deviceAPI.getSensorById(deviceId)
        return data
    }

    return {
        sensorData,
        loading,
        error,
        fetchSensorData,
        getSensorByDeviceId
    }
}