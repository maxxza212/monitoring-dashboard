import { ref } from 'vue'
import { deviceAPI } from '@/services/api'

const batasanMap = ref(new Map()) 
const loading = ref(false)
const error = ref(null)

const DEFAULT_RANGES = {
    suhu_min: 1,
    suhu_max: 30,
    kelembapan_min: 1,
    kelembapan_max: 100
}

export function useBatasan() {
    const loadAllBatasan = async () => {
        loading.value = true
        error.value = null

        try {
            const response = await deviceAPI.getAllBatasan()

            if (response.data.success) {
                batasanMap.value.clear()

                const batasanList = response.data.data || []
                batasanList.forEach(batasan => {
                    batasanMap.value.set(batasan.id_sensor, {
                        id: batasan.id,
                        suhu_min: batasan.suhu_min,
                        suhu_max: batasan.suhu_max,
                        kelembapan_min: batasan.kelembapan_min,
                        kelembapan_max: batasan.kelembapan_max
                    })
                })

                console.log('Batasan loaded:', batasanMap.value)
                return true
            }

            return false

        } catch (err) {
            error.value = err.message
            return false
        } finally {
            loading.value = false
        }
    }

    const getBatasanBySensorId = (sensorId) => {
        const batasan = batasanMap.value.get(sensorId)

        if (!batasan) {
            return DEFAULT_RANGES
        }

        return batasan
    }

    const isSuhuNormal = (sensorId, suhuValue) => {
        if (suhuValue === undefined || suhuValue === null) return false

        const suhu = Number(suhuValue)
        const batasan = getBatasanBySensorId(sensorId)

        return suhu >= batasan.suhu_min && suhu <= batasan.suhu_max
    }

    const isKelembapanNormal = (sensorId, kelembapanValue) => {
        if (kelembapanValue === undefined || kelembapanValue === null) return false

        const kelembapan = Number(kelembapanValue)
        const batasan = getBatasanBySensorId(sensorId)

        return (
            kelembapan >= batasan.kelembapan_min &&
            kelembapan <= batasan.kelembapan_max
        )
    }
    const isSensorNormal = (sensorId, suhuValue, kelembapanValue) => {
        const batasan = getBatasanBySensorId(sensorId)

        let suhuOk = true
        let kelembapanOk = true

        if (suhuValue !== undefined && suhuValue !== null && suhuValue !== '') {
            const suhu = Number(suhuValue)
            suhuOk = suhu >= batasan.suhu_min && suhu <= batasan.suhu_max
        }

        if (
            kelembapanValue !== undefined &&
            kelembapanValue !== null &&
            kelembapanValue !== ''
        ) {
            const kelembapan = Number(kelembapanValue)
            kelembapanOk =
                kelembapan >= batasan.kelembapan_min &&
                kelembapan <= batasan.kelembapan_max
        }

        return suhuOk && kelembapanOk
    }


    const createBatasan = async (data) => {
        try {
            const response = await deviceAPI.createBatasan(data)

            if (response.data.success) {
                await loadAllBatasan()
                return true
            }

            return false
        } catch (err) {
            console.error('Error creating batasan:', err)
            throw err
        }
    }

    const updateBatasan = async (id, data) => {
        try {
            const response = await deviceAPI.updateBatasan(id, data)

            if (response.data.success) {
                await loadAllBatasan()
                return true
            }

            return false
        } catch (err) {
            console.error('Error updating batasan:', err)
            throw err
        }
    }

    const deleteBatasan = async (id) => {
        try {
            const response = await deviceAPI.deleteBatasan(id)

            if (response.data.success) {
                await loadAllBatasan()
                return true
            }

            return false
        } catch (err) {
            console.error('Error deleting batasan:', err)
            throw err
        }
    }

    return {
        batasanMap,
        loading,
        error,
        loadAllBatasan,
        getBatasanBySensorId,
        isSuhuNormal,
        isKelembapanNormal,
        isSensorNormal,
        createBatasan,
        updateBatasan,
        deleteBatasan
    }
}