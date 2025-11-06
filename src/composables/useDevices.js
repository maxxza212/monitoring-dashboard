// src/composables/useDevices.js
import { ref } from 'vue'

const devices = ref([
    { id: 'D1', name: 'Device 1', location: 'Ruang Lab', status: 'Online', type: 'lab' },
    { id: 'D2', name: 'Device 2', location: 'Gudang Obat', status: 'Offline', type: 'gudang' },
    { id: 'D3', name: 'Device 3', location: 'Ruang Pendingin', status: 'Online', type: 'coldroom' },
])

export function useDevices() {
    const getDeviceById = (id) => {
        return devices.value.find(d => d.id === id)
    }

    return {
        devices,
        getDeviceById
    }
}